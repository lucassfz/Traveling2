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
 * @param {object} deps
 * @param {object} deps.airportRepository
 * @param {(countryKey: string) => Promise<object|null>} deps.resolveDestinationAirport
 * @param {() => object|null} deps.getFx     Câmbio do dólar ({ rate, date, kind, label, source }).
 * @param {() => object} [deps.getRates]     Tabela de currency.rateTable().
 * @returns {object[]} Seções do passo a passo: { id, step, render, bind, refresh }.
 */
export function createFlightSections({ airportRepository, resolveDestinationAirport, getFx, getRates = () => ({}) }) {
  let route = null;

  const usdRate = () => rateFor('USD', getRates()) ?? (getFx()?.rate > 0 ? getFx() : null);
  const routeKey = trip => [trip.id, trip.origin, trip.countryKey, trip.cabin, tripMonth(trip) ?? new Date().getMonth()].join('|');
  const codes = value => `${value.origin.iata || value.origin.icao} ⇄ ${value.destination.iata || value.destination.icao}`;

  async function loadRoute(trip) {
    const key = routeKey(trip);
    if (route?.key === key && route.status !== 'error') return route;
    route = { key, status: 'loading' };
    const [origin, destination] = await Promise.all([
      airportRepository.resolve(trip.origin),
      resolveDestinationAirport(trip.countryKey)
    ]);
    if (route.key !== key) return route;
    if (!origin || !destination) route = { key, status: 'error', message: 'Ainda não há estimativa de voo para este destino.' };
    else if ((origin.iata || origin.icao) === (destination.iata || destination.icao)) route = { key, status: 'error', message: 'Origem e destino são o mesmo aeroporto.' };
    else {
      const month = tripMonth(trip) ?? new Date().getMonth();
      route = { key, status: 'ready', origin, destination, estimate: estimateRoute({ origin, destination, cabin: trip.cabin, month, fx: usdRate() }) };
    }
    return route;
  }

  function infoHtml(trip) {
    if (!route || route.key !== routeKey(trip) || route.status === 'loading') return '<p class="planner-hint">Calculando a estimativa…</p>';
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
        <small>${escapeHtml(codes(route))} · ${escapeHtml(CABINS[trip.cabin])}</small>
      </div>
      ${miles}
      ${provenanceLabel('estimate', { detail: 'por distância, mês e cabine; não é cotação. Confira preço e disponibilidade na companhia ou no programa' })}`;
  }

  function fill(root, trip) {
    const slot = root.querySelector('#planner-flight-info');
    if (slot) slot.innerHTML = infoHtml(trip);
  }

  function update(root, trip, ui) {
    const key = routeKey(trip);
    fill(root, trip);
    if (route?.key === key && route.status !== 'loading') return;
    loadRoute(trip)
      .catch(() => { route = { key, status: 'error', message: 'Não foi possível calcular agora.' }; })
      .finally(() => {
        const current = ui.trip;
        if (current && routeKey(current) === key && root.isConnected) fill(root, current);
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
    bind: (root, trip, ui) => update(root, trip, ui),
    refresh: (root, trip, ui) => update(root, trip, ui)
  }];
}
