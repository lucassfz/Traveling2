import { resolveUsdRate } from '../fx.service.js';
import { buildFlightRoute, estimatedTravelMinutes } from '../flight.route.js';
import { estimateFlightPricing } from '../pricing.engine.js';

// Voos e rotas do app: aeroporto de destino do país aberto, prévia da rota no
// globo ("Ver rota no globo" e Descobrir) e atalhos para o hub de Milhas.
// A estimativa de passagem e milhas fica na etapa Voo do Planner (que usa
// estimateRoute daqui); o painel do país não tem mais a calculadora de rota.

// Estimativa de um trecho com o câmbio informado ({ rate } de fx.service.js).
// Usada pela etapa Voo do Planner.
export function estimateRoute({ origin, destination, cabin = 'economy', month = new Date().getMonth(), fx = null }) {
  return estimateFlightPricing({ origin, destination, cabin, month, brlPerUsd: fx?.rate ?? null });
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

  // Aeroporto de destino do país aberto, usado por "Ver rota no globo" e pelo hub de Milhas.
  async function primeDestinationAirport(countryKey) {
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
      updateFlightPreviewAvailability();
    } catch {
      if (state.countryKey === countryKey) elements.countryExploreStatus.textContent = 'Rota ainda não disponível para este destino.';
      updateFlightPreviewAvailability();
    }
  }

  function updateFlightPreviewAvailability() {
    // "Ver rota no globo" sempre parte de GRU. Quando o destino também é GRU
    // (o Brasil, país de origem), não há rota a mostrar: explica e orienta.
    const exploreSameAirport = (state.destinationAirport?.iata || state.destinationAirport?.icao) === 'GRU';
    elements.countryExploreButton.disabled = !state.map?.ready || !state.countryKey || !state.destinationAirport || state.routePreviewActive || exploreSameAirport;
    if (exploreSameAirport && state.countryKey) {
      elements.countryExploreStatus.textContent = 'A rota de demonstração parte de São Paulo (GRU), que já fica aqui. Para voos nacionais, planeje uma viagem e escolha outra origem.';
    }
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
    if (restoreFocus) (state.routeReturnFocus || elements.countryExploreButton).focus({ preventScroll: true });
    state.routeReturnFocus = null;
  }

  async function openFlightPreview({ countryKey = state.countryKey, airportCode, originCode, returnFocus, isCurrent = () => state.countryKey === countryKey } = {}) {
    if (!state.map?.ready || !countryKey || state.routePreviewActive) return false;
    const selectedKey = countryKey;
    const requestId = ++state.routeRequestId;
    try {
      const [origin, destination] = await Promise.all([
        airportRepository.resolve(originCode || 'GRU'),
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
      if (guideAirport) elements.flightPreviewAirports.textContent = `Ver salas VIP · ${guideAirport.iata}`;
      state.routeReturnFocus = returnFocus || elements.countryExploreButton;
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
      return false;
    } finally {
      updateFlightPreviewAvailability();
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
    updateFlightPreviewAvailability,
    closeFlightPreview,
    openFlightPreview,
    exploreDestination,
    openMilesForRoute,
    fetchExchangeRate,
  };
}
