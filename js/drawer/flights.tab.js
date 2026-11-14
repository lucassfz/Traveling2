import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { resolveUsdRate } from '../fx.service.js';
import { buildFlightRoute, estimatedTravelMinutes } from '../flight.route.js';
import {
  estimateFlightPricing,
  formatDistance,
  formatMiles,
  formatMoney
} from '../pricing.engine.js';

// Aba Voos do painel do país: aeroportos de origem e destino, estimativa de
// tarifa e milhas, prévia da rota no globo e atalhos para o hub de Milhas.
// Extraída de app.js sem mudança de comportamento; o estado continua sendo o
// objeto `state` do app, recebido por parâmetro.

// Estimativa de um trecho com o câmbio informado ({ rate } de fx.service.js).
// Usada pela aba Voos e, depois, pelo planejador.
export function estimateRoute({ origin, destination, cabin = 'economy', month = new Date().getMonth(), fx = null }) {
  return estimateFlightPricing({ origin, destination, cabin, month, brlPerUsd: fx?.rate ?? null });
}

// Câmbio usado na estimativa, sempre explícito — inclusive quando falta.
export function exchangeRateLabel(fx) {
  if (!fx) return provenanceLabel('unverified', { label: 'Câmbio indisponível', detail: 'valores mostrados em dólar' });
  return provenanceLabel(fx.kind, {
    label: fx.label,
    date: fx.date,
    detail: `US$ 1 = R$ ${fx.rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} (venda)`,
    source: fx.source
  });
}

/**
 * @param {object} ctx
 * @param {object} ctx.elements          Referências de DOM do app.
 * @param {object} ctx.state             Estado compartilhado do app (lido e escrito).
 * @param {object} ctx.airportRepository Instância de AirportRepository.
 * @param {object} ctx.countries         COUNTRIES.
 * @param {(open: boolean) => void} ctx.setMilesOpen
 * @param {() => Promise<object>} ctx.ensureMilesEngine Carrega o hub de Milhas sob demanda.
 */
export function createFlightsTab({ elements, state, airportRepository, countries: COUNTRIES, setMilesOpen, ensureMilesEngine }) {
  // Os botões de guia de aeroporto dependem dos dados do hub de Milhas.
  const loadMiles = () => ensureMilesEngine().catch(() => null);

  const destinationAirportCache = new Map();

  async function resolveDestinationAirport(countryKey) {
    if (destinationAirportCache.has(countryKey)) return destinationAirportCache.get(countryKey);
    const country = COUNTRIES[countryKey];
    if (country.flightUnavailable) return null;
    let airport = null;
    if (country.airport && country.airport !== '—') airport = await airportRepository.resolve(country.airport);
    if (!airport && !country.airport && country.latlng) airport = await airportRepository.findNearest(country.latlng[0], country.latlng[1]);
    destinationAirportCache.set(countryKey, airport);
    return airport;
  }

  async function primeDestinationAirport(countryKey) {
    const country = COUNTRIES[countryKey];
    elements.routeDestinationCode.textContent = country.flightUnavailable ? '—' : country.airport && country.airport !== '—' ? country.airport : '…';
    elements.routeDestinationCity.textContent = country.airportCity || country.capital || country.namePt;
    elements.routeDestinationNote.textContent = country.flightNote || (country.majorAirports?.length > 1 ? `Outros aeroportos no país: ${country.majorAirports.filter(code => code !== country.airport).join(', ')}.` : '');
    state.destinationAirport = null;
    state.milesEngine?.setRouteContext(null, null);
    updateFlightPreviewAvailability();
    try {
      const airport = await resolveDestinationAirport(countryKey);
      if (state.countryKey !== countryKey) return;
      if (!airport) {
        elements.countryExploreStatus.textContent = 'Rota ainda não disponível para este destino.';
        return;
      }
      state.destinationAirport = airport;
      elements.countryExploreStatus.textContent = '';
      state.milesEngine?.setRouteContext(state.originAirport, airport);
      elements.routeDestinationCode.textContent = airport.iata || airport.icao || '—';
      elements.routeDestinationCity.textContent = country.airportCity || airport.city || airport.name;
      updateFlightPreviewAvailability();
    } catch {
      if (state.countryKey === countryKey) {
        elements.routeDestinationCode.textContent = country.airport || '—';
        elements.countryExploreStatus.textContent = 'Rota ainda não disponível para este destino.';
      }
      updateFlightPreviewAvailability();
    }
  }

  async function primeOriginAirport() {
    const code = elements.originInput.value.trim().toUpperCase();
    const requestId = ++state.originRequestId;
    state.originAirport = null;
    state.milesEngine?.setRouteContext(null, null);
    elements.routeOriginCode.textContent = code || '—';
    elements.routeOriginCity.textContent = code ? 'Conferindo aeroporto…' : 'Informe uma origem';
    elements.routeResult.innerHTML = '';
    elements.routeAirportActions.hidden = true;
    updateFlightPreviewAvailability();
    if (!code || code.length < 3) return;
    const airport = await airportRepository.resolve(code);
    if (requestId !== state.originRequestId || elements.originInput.value.trim().toUpperCase() !== code) return;
    state.originAirport = airport;
    elements.routeOriginCode.textContent = airport?.iata || airport?.icao || code;
    elements.routeOriginCity.textContent = airport?.city || (airport ? airport.name : 'Código não encontrado');
    state.milesEngine?.setRouteContext(airport, state.destinationAirport);
    updateFlightPreviewAvailability();
  }

  function updateFlightPreviewAvailability() {
    const sameAirport = state.originAirport && state.destinationAirport &&
      (state.originAirport.iata || state.originAirport.icao) === (state.destinationAirport.iata || state.destinationAirport.icao);
    const ready = Boolean(state.map?.ready && state.originAirport && state.destinationAirport && state.countryKey && !state.routePreviewActive && !sameAirport);
    elements.flightPreviewButton.disabled = !ready;
    const exploreSameAirport = (state.destinationAirport?.iata || state.destinationAirport?.icao) === 'GRU';
    elements.countryExploreButton.disabled = !state.map?.ready || !state.countryKey || !state.destinationAirport || state.routePreviewActive || exploreSameAirport;
    if (exploreSameAirport && state.countryKey) elements.countryExploreStatus.textContent = 'Rota ainda não disponível para este destino.';
    elements.flightPreviewStatus.textContent = !state.map?.ready
      ? 'Aguarde o carregamento do globo 3D.'
      : !state.originAirport ? 'Escolha um aeroporto de origem válido.'
      : !state.destinationAirport ? 'Aeroporto de destino indisponível para esta visualização.'
        : sameAirport ? 'Origem e destino precisam ser aeroportos diferentes.'
          : `Parte de ${state.originAirport.city || state.originAirport.name} (${state.originAirport.iata || state.originAirport.icao}).`;
  }

  function closeFlightPreview(restoreCamera = true, restoreFocus = false) {
    state.routeRequestId += 1;
    clearTimeout(state.exploreReturnTimer);
    state.exploreReturnTimer = null;
    state.exploreRouteCountryKey = null;
    if (!state.routePreviewActive) return;
    state.routePreviewActive = false;
    state.map?.stopRoutePreview(restoreCamera);
    document.body.classList.remove('route-mode');
    elements.flightPreviewPanel.hidden = true;
    elements.flightPreviewPanel.inert = true;
    for (const [element, wasInert] of state.routeObscured || []) element.inert = wasInert;
    state.routeObscured = null;
    updateFlightPreviewAvailability();
    if (restoreFocus) (state.routeReturnFocus || elements.flightPreviewButton).focus({ preventScroll: true });
    state.routeReturnFocus = null;
  }

  async function openFlightPreview({ countryKey = state.countryKey, airportCode, originCode, returnFocus, isCurrent = () => state.countryKey === countryKey } = {}) {
    if (!state.map?.ready || !countryKey || state.routePreviewActive) return false;
    const selectedKey = countryKey;
    const requestId = ++state.routeRequestId;
    elements.flightPreviewButton.disabled = true;
    elements.flightPreviewStatus.textContent = 'Preparando rota no globo…';
    let failureMessage = null;
    try {
      const [origin, destination] = await Promise.all([
        airportRepository.resolve(originCode || (airportCode ? 'GRU' : elements.originInput.value.trim())),
        airportCode ? airportRepository.resolve(airportCode) : resolveDestinationAirport(selectedKey)
      ]);
      if (requestId !== state.routeRequestId || !isCurrent()) return false;
      if (!origin || !destination) throw new Error('Aeroporto indisponível. Verifique sua conexão e tente novamente.');
      const miles = await loadMiles();
      if (requestId !== state.routeRequestId || !isCurrent()) return false;
      const route = buildFlightRoute(origin, destination);
      if (!state.map.startRoutePreview(route)) throw new Error('O globo 3D está indisponível.');
      const minutes = estimatedTravelMinutes(route.distanceKm);
      const hours = Math.floor(minutes / 60);
      const remaining = minutes % 60;
      const destinationCity = (airportCode ? destination.city : COUNTRIES[selectedKey].airportCity) || destination.city || COUNTRIES[selectedKey].capital || COUNTRIES[selectedKey].namePt;
      elements.flightPreviewTitle.textContent = `${origin.city || origin.name} → ${destinationCity}`;
      elements.flightPreviewCodes.textContent = `${origin.iata || origin.icao} → ${destination.iata || destination.icao || selectedKey}`;
      elements.flightPreviewDetails.textContent = `${Math.round(route.distanceKm).toLocaleString('pt-BR')} km · Tempo de viagem estimado: cerca de ${hours} h${remaining ? ` ${remaining} min` : ''}`;
      state.routePreviewActive = true;
      state.milesEngine?.setRouteContext(origin, destination);
      const guideAirport = [origin, destination].find(airport => miles?.hasAirportGuide(airport.iata));
      elements.flightPreviewAirports.hidden = !guideAirport;
      elements.flightPreviewAirports.dataset.airportCode = guideAirport?.iata || '';
      if (guideAirport) elements.flightPreviewAirports.textContent = `Ver guia do aeroporto · ${guideAirport.iata}`;
      state.routeReturnFocus = returnFocus || elements.flightPreviewButton;
      state.routeObscured = [...document.querySelectorAll('.country-panel, .discovery-panel, .miles-hub, .app-header, .dock')]
        .map(element => [element, element.inert]);
      for (const [element] of state.routeObscured) element.inert = true;
      document.body.classList.add('route-mode');
      elements.flightPreviewPanel.hidden = false;
      elements.flightPreviewPanel.inert = false;
      elements.flightPreviewClose.focus({ preventScroll: true });
      return true;
    } catch (error) {
      if (airportCode) throw error;
      failureMessage = error.message || 'Não foi possível visualizar esta rota.';
      return false;
    } finally {
      updateFlightPreviewAvailability();
      if (failureMessage) elements.flightPreviewStatus.textContent = failureMessage;
    }
  }

  async function exploreDestination() {
    const countryKey = state.countryKey;
    if (!countryKey || elements.countryExploreButton.disabled) return;
    if (elements.milesHub.classList.contains('miles-hub--open')) setMilesOpen(false);
    state.exploreRouteCountryKey = countryKey;
    elements.countryExploreStatus.textContent = '';
    elements.countryExploreButton.disabled = true;
    try {
      const opened = await openFlightPreview({ countryKey, originCode: 'GRU', returnFocus: elements.countryExploreButton });
      if (!opened && state.exploreRouteCountryKey === countryKey) {
        state.exploreRouteCountryKey = null;
        elements.countryExploreStatus.textContent = 'Rota ainda não disponível para este destino.';
      }
    } catch {
      if (state.exploreRouteCountryKey === countryKey) {
        state.exploreRouteCountryKey = null;
        elements.countryExploreStatus.textContent = 'Rota ainda não disponível para este destino.';
      }
    } finally {
      updateFlightPreviewAvailability();
    }
  }

  function updateAirportSuggestions(query = '') {
    const matches = query.trim() ? airportRepository.search(query, 12) : airportRepository.coreAirports.slice(0, 12);
    elements.airportSuggestions.innerHTML = matches.map(airport => {
      const code = airport.iata || airport.icao;
      const label = `${code} — ${airport.city}, ${airport.country}`;
      return `<option value="${escapeHtml(code)}">${escapeHtml(label)}</option>`;
    }).join('');
  }

  async function calculateRoute() {
    if (!state.countryKey) return;
    const originCode = elements.originInput.value.trim().toUpperCase();
    if (!originCode) {
      elements.routeResult.innerHTML = '<div class="route-error">Digite um código IATA ou ICAO de origem.</div>';
      return;
    }

    elements.routeButton.disabled = true;
    elements.routeButton.textContent = 'Calculando…';
    elements.routeResult.innerHTML = '';

    try {
      const origin = await airportRepository.resolve(originCode);
      if (!origin) throw new Error('Aeroporto não encontrado. Verifique o código IATA/ICAO ou sua conexão para carregar a base global.');
      const destination = state.destinationAirport || await resolveDestinationAirport(state.countryKey);
      if (!destination) throw new Error('Não foi possível determinar um aeroporto de destino para este país.');
      if ((origin.iata || origin.icao) === (destination.iata || destination.icao)) throw new Error('Origem e destino precisam ser aeroportos diferentes.');

      state.destinationAirport = destination;
      state.originAirport = origin;
      state.milesEngine?.setRouteContext(origin, destination);
      elements.routeOriginCode.textContent = origin.iata || origin.icao;
      elements.routeOriginCity.textContent = origin.city || origin.name;
      elements.routeDestinationCode.textContent = destination.iata || destination.icao;
      elements.routeDestinationCity.textContent = destination.city || destination.name;

      const estimate = estimateFlightPricing({
        origin,
        destination,
        cabin: elements.cabinSelect.value,
        month: Number(elements.monthSelect.value),
        brlPerUsd: state.brlPerUsd?.rate ?? null
      });

      elements.routeResult.innerHTML = `
        <div class="route-result__summary">
          <article class="route-result__card">
            <div class="route-result__label">Distância aproximada</div>
            <div class="route-result__value">${escapeHtml(formatDistance(estimate.distanceKm))}</div>
          </article>
          <article class="route-result__card">
            <div class="route-result__label">Passagem · faixa estimada por trecho</div>
            <div class="route-result__value">${estimate.cash.brl
              ? `${escapeHtml(formatMoney(estimate.cash.brl.low))}–${escapeHtml(formatMoney(estimate.cash.brl.high))}`
              : `${escapeHtml(formatMoney(estimate.cash.usd.low, 'USD'))}–${escapeHtml(formatMoney(estimate.cash.usd.high, 'USD'))}`}</div>
          </article>
          <article class="route-result__card">
            <div class="route-result__label">Cabine</div>
            <div class="route-result__value route-result__value--accent">${escapeHtml(estimate.cabin)}</div>
          </article>
        </div>
        <div class="route-result__programs">
          ${Object.entries(estimate.awards).map(([program, range]) => `
            <article class="route-result__card">
              <div class="route-result__label">${escapeHtml(program)} · milhas estimadas por trecho</div>
              <div class="route-result__value">${escapeHtml(formatMiles(range.low))}–${escapeHtml(formatMiles(range.high))}</div>
            </article>
          `).join('')}
        </div>
        ${provenanceLabel('estimate', {
          detail: 'modelo por distância, mês e cabine',
          className: 'route-result__provenance'
        })}
        ${exchangeRateLabel(state.brlPerUsd)}
        <p class="route-result__disclaimer">${escapeHtml(estimate.disclaimer)}</p>
      `;
      const miles = await loadMiles();
    const guideActions = [origin, destination].map((airport, index) => miles?.hasAirportGuide(airport.iata)
        ? `<button type="button" data-route-airport="${escapeHtml(airport.iata)}">Guia ${index ? 'do destino' : 'da origem'} · ${escapeHtml(airport.iata)}</button>` : '').join('');
      elements.routeAirportActions.hidden = false;
      elements.routeAirportActions.innerHTML = `${guideActions}<button type="button" data-route-redemption="true">Comparar com preço real</button>`;
      updateFlightPreviewAvailability();
    } catch (error) {
      elements.routeResult.innerHTML = `<div class="route-error">${escapeHtml(error.message)}</div>`;
    } finally {
      elements.routeButton.disabled = false;
      elements.routeButton.textContent = 'Calcular rota';
    }
  }

  function openMilesForRoute(airportCode = null) {
    if (state.routePreviewActive) closeFlightPreview(true);
    setMilesOpen(true);
    if (airportCode) state.milesEngine?.showAirport(airportCode);
    else state.milesEngine?.selectTab('overview');
  }

  // PTAX do Banco Central; se a API falhar, o boletim de fechamento versionado.
  async function fetchExchangeRate() {
    state.brlPerUsd = await resolveUsdRate();
  }

  return {
    resolveDestinationAirport,
    primeDestinationAirport,
    primeOriginAirport,
    updateFlightPreviewAvailability,
    closeFlightPreview,
    openFlightPreview,
    exploreDestination,
    updateAirportSuggestions,
    calculateRoute,
    openMilesForRoute,
    fetchExchangeRate,
  };
}
