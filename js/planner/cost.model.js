// "Quanto vai custar", no resumo da viagem. Junta o que o Traveling sabe:
// a estimativa da passagem (rota, mês e cabine), os gastos no destino a partir
// dos perfis revisados da Descoberta, as cotações que a pessoa anexou nas
// etapas Voo e Estilo e os gastos que ela anotou. Cotação anexada substitui a
// estimativa da mesma categoria. Cada número diz de onde vem. Só cálculo: a tela
// é src/planner/sections/TripCost.jsx.
import { localCostBreakdown } from './planner.estimates.js';
import { tripDays, tripNights, BUDGET_CATEGORIES } from './trip.model.js';
import { formatBRL } from './money.js';

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

export const costRange = (low, high) => (Math.abs(high - low) < 1 ? formatBRL(low) : `${formatBRL(low)} – ${formatBRL(high)}`);
const shortDate = iso => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const capitalize = value => value.charAt(0).toUpperCase() + value.slice(1);
const QUOTE_KIND = { live: 'cached', cached: 'cached', test: 'test' };

/** Linhas de texto para "Copiar resumo". */
export function costSummaryText(summary) {
  if (!summary.rows.length) return [];
  return [
    `Custo estimado: ${costRange(summary.low, summary.high)}${summary.perPersonHigh !== summary.high ? ` (${costRange(summary.perPersonLow, summary.perPersonHigh)} por pessoa)` : ''}`,
    ...summary.rows.map(row => `- ${row.label}: ${costRange(row.low, row.high)}${row.kind === 'quote' ? ' (cotação, pode ter mudado)' : row.kind === 'seen' ? ' (preço visto recentemente, pode ter mudado)' : row.kind === 'estimate' ? ' (estimativa)' : ''}`)
  ];
}

/** Etiqueta de procedência de uma linha: { kind, options } para <Provenance>. */
export function costRowProvenance(row) {
  if (row.kind === 'quote') {
    if (row.quotes.some(quote => quote.expired)) {
      return { kind: 'unverified', options: { label: 'Preço expirado', detail: 'busque de novo para confirmar' } };
    }
    const [first] = row.quotes;
    return { kind: QUOTE_KIND[first.dataSource] ?? 'cached', options: { detail: `cotação de ${shortDate(first.fetchedAt)} · pode ter mudado` } };
  }
  if (row.kind === 'seen') {
    return { kind: 'cached', options: { detail: `${row.foundOn ? `visto em ${row.foundOn.split('-').reverse().slice(0, 2).join('/')}` : 'visto recentemente'} · ida e volta · pode ter mudado` } };
  }
  if (row.kind === 'estimate') return { kind: 'estimate', options: { detail: 'não é cotação' } };
  return { kind: 'calculated', options: { detail: row.detail } };
}

/** Etapa do Planner onde uma cotação vencida pode ser refeita, ou null. */
export function costRowRefreshStep(row) {
  return row.kind === 'quote' && row.step && row.quotes.some(quote => quote.expired) ? row.step : null;
}

/** Texto quando não há linha nenhuma para somar. */
export const COST_EMPTY = 'Ainda não há estimativa de custo para este destino. Complete as etapas Voo e Estilo.';

/** Frase com o que foi considerado na conta. */
export function costAssumptions(local) {
  return `${capitalize([
    local?.assumedStay ? 'sem datas, considera 7 dias' : null,
    local?.reviewedOn ? `gastos no destino revisados em ${new Date(`${local.reviewedOn}T12:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}` : null,
    'estimativas sem compras, seguro e documentos'
  ].filter(Boolean).join(' · '))}.`;
}

export const BUDGET_TEXT = {
  within: amount => `Cabe no orçamento de ${amount}.`,
  tight: amount => `Pode passar do orçamento de ${amount}, dependendo das escolhas.`,
  over: amount => `Passa do orçamento de ${amount}.`
};
