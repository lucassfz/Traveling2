// "Quanto vai custar", no resumo da viagem. Junta o que o Traveling sabe:
// a estimativa da passagem (rota, mês e cabine), os gastos no destino a partir
// dos perfis revisados da Descoberta, as cotações que a pessoa anexou nas
// etapas Voo e Estilo e os gastos que ela anotou. Cotação anexada substitui a
// estimativa da mesma categoria. Cada número diz de onde vem.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { DESTINATION_PROFILES } from '../destination.profiles.js';
import { localCostBreakdown, flightSuggestion } from './planner.estimates.js';
import { tripDays, tripNights, BUDGET_CATEGORIES } from './trip.model.js';
import { rateFor } from './currency.js';
import { formatBRL } from './money.js';
import { cheapestFlight, pricePeriod } from '../api/prices.client.js';

const roundTo = (value, step) => Math.round(value / step) * step;
const CATEGORY_LABELS = Object.fromEntries(BUDGET_CATEGORIES.map(category => [category.id, category.label]));

/** Partes do custo no destino (faixa baixa, média e alta) para a viagem, ou null sem perfil revisado. */
export function localCostRange(profiles, trip) {
  const usable = (profiles ?? []).filter(profile => profile?.countryKey === trip.countryKey
    && Array.isArray(profile.localWeekBRL) && profile.localWeekBRL.length === 2
    && profile.localWeekBRL.every(value => Number.isFinite(value) && value > 0));
  if (!usable.length) return null;
  // Viagem criada a partir de uma região da Descoberta: usa só aquele perfil.
  const chosen = usable.filter(profile => profile.id === trip.profileId);
  if (chosen.length) usable.splice(0, usable.length, ...chosen);
  const days = tripDays(trip) ?? 7;
  const nights = tripDays(trip) === null ? 7 : tripNights(trip);
  const options = { days, nights, travelers: trip.travelers, lodging: trip.lodging };
  const weekLow = Math.min(...usable.map(profile => profile.localWeekBRL[0]));
  const weekHigh = Math.max(...usable.map(profile => profile.localWeekBRL[1]));
  const reviewed = usable.map(profile => profile.reviewedOn).filter(Boolean).sort();
  return {
    low: localCostBreakdown(weekLow, options),
    high: localCostBreakdown(weekHigh, options),
    days,
    nights,
    assumedStay: tripDays(trip) === null,
    reviewedOn: reviewed[0] ?? null
  };
}

function quoteState(line, now) {
  const expiresAt = line.source.expiresAt ? Date.parse(line.source.expiresAt) : NaN;
  return {
    id: line.id,
    note: line.note || line.source.summary || '',
    amountBRL: line.amountBRL,
    fetchedAt: line.source.fetchedAt,
    dataSource: line.source.dataSource,
    expired: Number.isFinite(expiresAt) && expiresAt <= now.getTime()
  };
}

/**
 * Custo da viagem por partes, sem efeitos colaterais.
 * @param {object} input
 * @param {object} input.trip
 * @param {{ low: number, high: number } | null} input.flight Passagem ida e volta por pessoa, em reais.
 * @param {ReturnType<typeof localCostRange>} input.local
 * @param {Date} [input.now]
 * @returns {{ rows: object[], low: number, high: number, perPersonLow: number, perPersonHigh: number, incomplete: string[], budget: object | null }}
 */
export function tripCostSummary({ trip, flight = null, seen = null, local = null, now = new Date() }) {
  const travelers = Math.max(1, trip.travelers || 1);
  const offers = category => trip.lines.filter(line => line.source?.kind === 'provider-offer' && line.category === category);
  const rows = [];
  const incomplete = [];

  const quoted = (id, label, step, lines) => {
    const quotes = lines.map(line => quoteState(line, now));
    const total = Math.round(quotes.reduce((sum, quote) => sum + quote.amountBRL, 0) * 100) / 100;
    rows.push({ id, label, step, kind: 'quote', low: total, high: total, quotes });
  };

  const flightOffers = offers('flights');
  if (flightOffers.length) quoted('flights', 'Passagens', 3, flightOffers);
  else if (seen && seen.amount > 0) {
    // Preço visto recentemente (Travelpayouts) para a rota e o período: mais
    // perto da realidade que a estimativa por distância.
    const total = Math.round(seen.amount * travelers);
    rows.push({ id: 'flights', label: 'Passagens', step: 3, kind: 'seen', low: total, high: total, foundOn: seen.foundOn ?? null });
  } else if (flight && flight.high > 0) {
    rows.push({ id: 'flights', label: 'Passagens', step: 3, kind: 'estimate', low: roundTo(flight.low * travelers, 10), high: roundTo(flight.high * travelers, 10) });
  } else incomplete.push('Passagens');

  const lodgingOffers = offers('lodging');
  if (lodgingOffers.length) quoted('lodging', 'Hospedagem', 4, lodgingOffers);
  else if (local) rows.push({ id: 'lodging', label: 'Hospedagem', step: 4, kind: 'estimate', low: roundTo(local.low.lodging, 10), high: roundTo(local.high.lodging, 10) });
  else incomplete.push('Hospedagem');

  if (local) {
    const daily = parts => parts.food + parts.transport + parts.activities;
    rows.push({ id: 'daily', label: 'Comida, transporte e passeios', step: 4, kind: 'estimate', low: roundTo(daily(local.low), 10), high: roundTo(daily(local.high), 10) });
  } else incomplete.push('Gastos no destino');

  // Gastos anotados pela pessoa (inclui os de versões anteriores do Planner).
  const own = trip.lines.filter(line => !line.source || line.source.kind === 'user');
  if (own.length) {
    const total = Math.round(own.reduce((sum, line) => sum + line.amountBRL, 0) * 100) / 100;
    const categories = [...new Set(own.map(line => CATEGORY_LABELS[line.category] ?? 'Outros'))];
    rows.push({ id: 'own', label: 'Seus gastos anotados', kind: 'user', low: total, high: total, detail: categories.join(', ') });
  }

  const low = Math.round(rows.reduce((sum, row) => sum + row.low, 0));
  const high = Math.round(rows.reduce((sum, row) => sum + row.high, 0));
  const budgetBRL = Number.isFinite(trip.budgetBRL) && trip.budgetBRL > 0 ? trip.budgetBRL : null;
  const budget = budgetBRL === null || !rows.length ? null : {
    amountBRL: budgetBRL,
    status: high <= budgetBRL ? 'within' : low > budgetBRL ? 'over' : 'tight'
  };
  return {
    rows,
    low,
    high,
    perPersonLow: Math.round(low / travelers),
    perPersonHigh: Math.round(high / travelers),
    incomplete,
    budget
  };
}

const range = (low, high) => (Math.abs(high - low) < 1 ? formatBRL(low) : `${formatBRL(low)} – ${formatBRL(high)}`);
const shortDate = iso => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1);
const QUOTE_KIND ={ live: 'cached', cached: 'cached', test: 'test' };

/** Linhas de texto para "Copiar resumo". */
export function costSummaryText(summary) {
  if (!summary.rows.length) return [];
  return [
    `Custo estimado: ${range(summary.low, summary.high)}${summary.perPersonHigh !== summary.high ? ` (${range(summary.perPersonLow, summary.perPersonHigh)} por pessoa)` : ''}`,
    ...summary.rows.map(row => `- ${row.label}: ${range(row.low, row.high)}${row.kind === 'quote' ? ' (cotação, pode ter mudado)' : row.kind === 'seen' ? ' (preço visto recentemente, pode ter mudado)' : row.kind === 'estimate' ? ' (estimativa)' : ''}`)
  ];
}

function rowHtml(row) {
  let label;
  if (row.kind === 'quote') {
    const expired = row.quotes.some(quote => quote.expired);
    const first = row.quotes[0];
    label = expired
      ? provenanceLabel('unverified', { tag: 'span', label: 'Preço expirado', detail: 'busque de novo para confirmar' })
      : provenanceLabel(QUOTE_KIND[first.dataSource] ?? 'cached', { tag: 'span', detail: `cotação de ${shortDate(first.fetchedAt)} · pode ter mudado` });
  } else if (row.kind === 'seen') {
    label = provenanceLabel('cached', { tag: 'span', detail: `${row.foundOn ? `visto em ${row.foundOn.split('-').reverse().slice(0, 2).join('/')}` : 'visto recentemente'} · ida e volta · pode ter mudado` });
  } else if (row.kind === 'estimate') {
    label = provenanceLabel('estimate', { tag: 'span', detail: 'não é cotação' });
  } else {
    label = provenanceLabel('calculated', { tag: 'span', detail: row.detail });
  }
  const notes = row.kind === 'quote' ? row.quotes.map(quote => quote.note).filter(Boolean) : [];
  const stale = row.kind === 'quote' && row.quotes.some(quote => quote.expired);
  return `
    <li class="trip-cost__row">
      <div class="trip-cost__head">
        <span>${escapeHtml(row.label)}</span>
        <strong>${escapeHtml(range(row.low, row.high))}</strong>
      </div>
      ${notes.length ? `<small class="trip-cost__note">${notes.map(escapeHtml).join(' · ')}</small>` : ''}
      <div class="trip-cost__foot">
        ${label}
        ${stale && row.step ? `<button class="planner-text-action" type="button" data-planner-step="${row.step}">Atualizar preço</button>` : ''}
      </div>
    </li>`;
}

const BUDGET_TEXT = {
  within: amount => `Cabe no orçamento de ${amount}.`,
  tight: amount => `Pode passar do orçamento de ${amount}, dependendo das escolhas.`,
  over: amount => `Passa do orçamento de ${amount}.`
};

/** Markup do bloco. */
export function costHtml(summary, { loading = false, local = null } = {}) {
  if (!summary.rows.length) {
    return loading ? '<p class="planner-hint">Calculando…</p>'
      : '<p class="planner-hint">Ainda não há estimativa de custo para este destino. Complete as etapas Voo e Estilo.</p>';
  }
  const assumptions = [
    local?.assumedStay ? 'sem datas, considera 7 dias' : null,
    local?.reviewedOn ? `gastos no destino revisados em ${new Date(`${local.reviewedOn}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}` : null,
    'estimativas sem compras, seguro e documentos'
  ].filter(Boolean);
  return `
    <div class="trip-cost__total">
      <span>Total</span>
      <strong>${escapeHtml(range(summary.low, summary.high))}</strong>
      ${summary.perPersonHigh !== summary.high ? `<small>${escapeHtml(range(summary.perPersonLow, summary.perPersonHigh))} por pessoa</small>` : ''}
    </div>
    ${summary.budget ? `<p class="trip-cost__budget trip-cost__budget--${summary.budget.status}">${escapeHtml(BUDGET_TEXT[summary.budget.status](formatBRL(summary.budget.amountBRL)))}</p>` : ''}
    <ul class="trip-cost__rows">${summary.rows.map(rowHtml).join('')}</ul>
    ${summary.incomplete.length ? `<p class="planner-hint">${loading ? 'Calculando' : 'Sem estimativa'}: ${escapeHtml(summary.incomplete.join(', ').toLowerCase())}.</p>` : ''}
    <p class="planner-hint">${escapeHtml(capitalize(assumptions.join(' · ')))}.</p>`;
}

/**
 * Seção do resumo (última etapa).
 * @param {object} deps
 * @param {object} deps.routes  createRouteEstimator compartilhado com a etapa Voo.
 * @param {() => object} deps.getRates
 * @param {object[]} [deps.profiles]
 */
export function createCostSection({ routes, getRates, getFx = () => null, profiles = DESTINATION_PROFILES }) {
  const usdRate = () => rateFor('USD', getRates()) ?? (getFx()?.rate > 0 ? getFx() : null);

  function flightRange(trip) {
    const route = routes.get(trip);
    if (route?.status !== 'ready') return null;
    const suggestion = flightSuggestion(route.estimate, { travelers: 1, brlPerUsd: usdRate()?.rate ?? null });
    return suggestion ? { low: suggestion.perLegLow * 2, high: suggestion.perLegHigh * 2 } : null;
  }

  // Preço de passagem visto recentemente, por rota e período (cache do cliente).
  const seenPrices = new Map();
  const seenKey = (trip, route) => {
    const period = pricePeriod(trip);
    return route?.status === 'ready' && period ? [trip.origin, route.destination.iata, period.departure, period.return ?? ''].join('|') : null;
  };

  function loadSeen(root, trip, ui) {
    const route = routes.get(trip);
    const key = seenKey(trip, route);
    if (!key || seenPrices.has(key)) return;
    const period = pricePeriod(trip);
    seenPrices.set(key, null);
    cheapestFlight({ origin: trip.origin, destination: route.destination.iata, departure: period.departure, return: period.return }).then(offer => {
      if (!offer) return;
      seenPrices.set(key, { amount: Number(offer.price.amount), foundOn: offer.foundOn });
      const current = ui.trip;
      if (current && root.isConnected && seenKey(current, routes.get(current)) === key) fill(root, current);
    }).catch(() => {});
  }

  function summaryFor(trip) {
    const local = localCostRange(profiles, trip);
    const seen = seenPrices.get(seenKey(trip, routes.get(trip))) ?? null;
    return { local, summary: tripCostSummary({ trip, flight: flightRange(trip), seen, local }) };
  }

  function fill(root, trip) {
    const slot = root.querySelector('#planner-trip-cost');
    if (!slot) return;
    const { local, summary } = summaryFor(trip);
    const route = routes.get(trip);
    slot.innerHTML = costHtml(summary, { local, loading: !route || route.status === 'loading' });
  }

  function update(root, trip, ui) {
    fill(root, trip);
    const known = routes.get(trip);
    if (known && known.status !== 'loading') {
      loadSeen(root, trip, ui);
      return;
    }
    const key = routes.key(trip);
    routes.load(trip).then(() => {
      const current = ui.trip;
      if (current && routes.key(current) === key && root.isConnected) {
        fill(root, current);
        loadSeen(root, current, ui);
      }
    });
  }

  return {
    id: 'trip-cost',
    step: 6,
    render: () => `
      <div class="planner-card trip-cost">
        <h4 class="planner-block-title">Quanto vai custar</h4>
        <div id="planner-trip-cost" aria-live="polite"></div>
      </div>`,
    bind: (root, trip, ui) => update(root, trip, ui),
    refresh: (root, trip, ui) => update(root, trip, ui),
    summaryText: trip => costSummaryText(summaryFor(trip).summary)
  };
}
