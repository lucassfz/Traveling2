// Etapa "Voo" do Planner: só informação, sem campos para digitar. Mostra a
// estimativa da passagem (ida e volta) e, quando a pessoa pensa em usar
// milhas, quantas milhas cada programa brasileiro pediria nessa rota.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { estimateRoute } from '../drawer/flights.tab.js';
import { formatMiles } from '../pricing.engine.js';
import { tripMonth } from './trip.model.js';
import { awardComparison, flightSuggestion } from './planner.estimates.js';
import { rateFor } from './currency.js';
import { formatBRL } from './money.js';

export const CABINS = Object.freeze({ economy: 'Econômica', premium: 'Premium Economy', business: 'Executiva' });

/**
 * Rota estimada da viagem (origem → aeroporto da cidade ou do país), uma por vez
 * e reaproveitada por quem precisar: a etapa Voo e o custo no resumo.
 * @param {object} deps { airportRepository, resolveDestinationAirport, resolveCityAirport, usdRate }
 * @returns {{ key: (trip) => string, get: (trip) => object|null, load: (trip) => Promise<object> }}
 */
export function createRouteEstimator({ airportRepository, resolveDestinationAirport, resolveCityAirport = async () => null, usdRate = () => null }) {
  let route = null;
  let pending = null;
  const key = trip => [trip.id, trip.origin, trip.countryKey, trip.city?.id ?? '', trip.cabin, tripMonth(trip) ?? new Date().getMonth()].join('|');

  async function compute(trip, routeKey) {
    const [origin, destination] = await Promise.all([
      airportRepository.resolve(trip.origin),
      // Com cidade escolhida: aeroporto que atende a cidade; senão o do país.
      (trip.city ? resolveCityAirport(trip.city.lat, trip.city.lng) : Promise.resolve(null))
        .then(airport => airport ?? resolveDestinationAirport(trip.countryKey))
    ]);
    if (!origin) return { key: routeKey, status: 'error', message: `Aeroporto de origem ${trip.origin} não encontrado. Confira o código na etapa Datas.` };
    if (!destination) return { key: routeKey, status: 'error', message: 'Ainda não há estimativa de voo para este destino.' };
    if ((origin.iata || origin.icao) === (destination.iata || destination.icao)) return { key: routeKey, status: 'error', message: 'Origem e destino são o mesmo aeroporto.' };
    const month = tripMonth(trip) ?? new Date().getMonth();
    return { key: routeKey, status: 'ready', origin, destination, estimate: estimateRoute({ origin, destination, cabin: trip.cabin, month, fx: usdRate() }) };
  }

  return {
    key,
    get: trip => (route?.key === key(trip) ? route : null),
    load(trip) {
      const routeKey = key(trip);
      if (route?.key === routeKey && route.status !== 'error' && route.status !== 'loading') return Promise.resolve(route);
      if (pending?.key === routeKey) return pending.promise;
      route = { key: routeKey, status: 'loading' };
      const promise = compute(trip, routeKey)
        .catch(() => ({ key: routeKey, status: 'error', message: 'Não foi possível calcular agora.' }))
        .then(result => {
          if (route?.key === routeKey) route = result;
          if (pending?.key === routeKey) pending = null;
          return result;
        });
      pending = { key: routeKey, promise };
      return promise;
    }
  };
}

/**
 * @param {object} deps
 * @param {object} [deps.routes]            createRouteEstimator compartilhado (opcional).
 * @param {object} deps.airportRepository
 * @param {(countryKey: string) => Promise<object|null>} deps.resolveDestinationAirport
 * @param {(lat: number, lng: number) => Promise<object|null>} [deps.resolveCityAirport] Aeroporto de chegada de uma cidade.
 * @param {() => object|null} deps.getFx     Câmbio do dólar ({ rate, date, kind, label, source }).
 * @param {() => object} [deps.getRates]     Tabela de currency.rateTable().
 * @param {(origin: object, destination: object, trip: object) => void} [deps.onPreviewRoute] Mostra a rota no globo.
 * @returns {object[]} Seções do passo a passo: { id, step, render, bind, refresh }.
 */
export function createFlightSections({ routes = null, airportRepository, resolveDestinationAirport, resolveCityAirport = async () => null, getFx, getRates = () => ({}), onPreviewRoute = null }) {
  const usdRate = () => rateFor('USD', getRates()) ?? (getFx()?.rate > 0 ? getFx() : null);
  const estimator = routes ?? createRouteEstimator({ airportRepository, resolveDestinationAirport, resolveCityAirport, usdRate });
  const codes = value => `${value.origin.iata || value.origin.icao} ⇄ ${value.destination.iata || value.destination.icao}`;

  function infoHtml(trip) {
    const route = estimator.get(trip);
    if (!route || route.status === 'loading') return '<p class="planner-hint">Calculando a estimativa…</p>';
    if (route.status === 'error') return `<p class="planner-hint">${escapeHtml(route.message)}</p>`;
    const usd = usdRate();
    const suggestion = flightSuggestion(route.estimate, { travelers: 1, brlPerUsd: usd?.rate ?? null });
    if (!suggestion) return '<p class="planner-hint">Câmbio indisponível agora. Tente de novo em instantes.</p>';
    const domestic = Boolean(route.origin.country) && route.origin.country === route.destination.country;
    const comparison = trip.payWith === 'cash' ? null
      : awardComparison({ estimate: route.estimate, travelers: 1, brlPerUsd: usd?.rate ?? null, domestic, cabin: trip.cabin });
    const miles = comparison ? `
      <ul class="planner-miles-list">
        ${comparison.options.map(option => `<li>
          <strong>${escapeHtml(option.name)}</strong>
          <span>${escapeHtml(formatMiles(option.miles))} + ${formatBRL(option.feesBRL)} de taxas, por pessoa</span>
          ${option.savingBRL > 0 ? '<em class="planner-miles-list__good">vale a pena</em>' : '<em>sai mais caro que dinheiro</em>'}
        </li>`).join('')}
      </ul>` : '';
    return `
      <div class="planner-fare">
        <span class="planner-fare__label">Passagem ida e volta, por pessoa</span>
        <strong class="planner-fare__value">${formatBRL(suggestion.perLegLow * 2)} – ${formatBRL(suggestion.perLegHigh * 2)}</strong>
        <small>${escapeHtml(codes(route))} · ${escapeHtml(CABINS[trip.cabin])}${trip.city ? ` · aeroporto que atende ${escapeHtml(trip.city.name)}` : ''}</small>
      </div>
      ${miles}
      ${provenanceLabel('estimate', { detail: 'por distância, mês e cabine; não é cotação. Confira preço e disponibilidade na companhia ou no programa' })}
      ${onPreviewRoute ? '<button class="secondary-button planner-route-preview" type="button" data-planner-preview-route>Ver rota no globo</button>' : ''}`;
  }

  function fill(root, trip) {
    const slot = root.querySelector('#planner-flight-info');
    if (slot) slot.innerHTML = infoHtml(trip);
  }

  function update(root, trip, ui) {
    const key = estimator.key(trip);
    fill(root, trip);
    const known = estimator.get(trip);
    if (known && known.status !== 'loading') return;
    estimator.load(trip).then(() => {
      const current = ui.trip;
      if (current && estimator.key(current) === key && root.isConnected) fill(root, current);
    });
  }

  return [{
    id: 'flight',
    step: 3,
    render: trip => `
      <div class="planner-card">
        <h4 class="planner-block-title">Quanto custa, em média</h4>
        <div id="planner-flight-info" aria-live="polite">${infoHtml(trip)}</div>
      </div>`,
    bind: (root, trip, ui) => {
      root.querySelector('#planner-flight-info')?.addEventListener('click', event => {
        const route = estimator.get(ui.trip);
        if (!event.target.closest('[data-planner-preview-route]') || route?.status !== 'ready') return;
        onPreviewRoute?.(route.origin, route.destination, ui.trip);
      });
      update(root, trip, ui);
    },
    refresh: (root, trip, ui) => update(root, trip, ui)
  }];
}
