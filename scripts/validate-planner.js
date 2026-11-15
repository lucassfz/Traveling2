// Auditoria offline do modelo e do armazenamento do Planner v0.
import assert from 'node:assert/strict';
import { COUNTRIES } from '../js/countries.dataset.js';
import {
  BUDGET_CATEGORIES, LINE_STATUSES, MAX_LINES, MAX_TRAVELERS, TRIP_SCHEMA_VERSION,
  addLine, createTrip, duplicateTrip, isEstimateLine, isoDate, normalizeChecklist, normalizeLine, normalizeStore, normalizeTrip, removeLine,
  setChecklistItems, tripDays, tripMonth, tripStatus, tripTotals, updateLine, updateTrip
} from '../js/planner/trip.model.js';
import { createTripStore } from '../js/planner/trip.store.js';
import {
  AWARD_PROGRAMS, awardComparison, compareCashAndMiles, flightLine, flightSuggestion, localCostSuggestion, localLine, repriceLines
} from '../js/planner/planner.estimates.js';
import { convertToBRL, currencyChoices, rateFor, rateTable } from '../js/planner/currency.js';

let counter = 0;
const idFactory = prefix => `${prefix}_test${String(++counter).padStart(4, '0')}`;
const now = new Date(2026, 10, 13);

// Criação e normalização.
const trip = createTrip({ countryKey: 'Japan', travelers: 2, budgetBRL: 30000, startDate: '2027-04-02', endDate: '2027-04-14', now, idFactory });
assert.equal(trip.countryKey, 'Japan');
assert.equal(trip.origin, 'GRU');
assert.equal(trip.cabin, 'economy');
assert.equal(trip.createdAt, '2026-11-13');
assert.deepEqual(trip.lines, []);
assert.equal(tripDays(trip), 13, 'conta o dia de ida e o de volta');
assert.equal(tripMonth(trip), 3);
assert.equal(createTrip({ countryKey: 'Japan', idFactory }).startDate, null);
assert.equal(tripDays({ startDate: '2027-04-02', endDate: null }), null);

assert.equal(isoDate('2027-02-29'), null, '2027 não é bissexto');
assert.equal(isoDate('2028-02-29'), '2028-02-29');
assert.equal(isoDate('29/02/2028'), null);
const swapped = normalizeTrip({ countryKey: 'Japan', startDate: '2027-05-10', endDate: '2027-05-01' }, { idFactory });
assert.deepEqual([swapped.startDate, swapped.endDate], ['2027-05-01', '2027-05-10'], 'datas invertidas são trocadas');
assert.equal(normalizeTrip({ countryKey: 'Japan', travelers: 40 }, { idFactory }).travelers, MAX_TRAVELERS);
assert.equal(normalizeTrip({ countryKey: 'Japan', travelers: 0 }, { idFactory }).travelers, 1);
assert.equal(normalizeTrip({ countryKey: 'Japan', origin: 'gig' }, { idFactory }).origin, 'GIG');
assert.equal(normalizeTrip({ countryKey: 'Japan', origin: '<x>' }, { idFactory }).origin, 'GRU');
assert.equal(normalizeTrip({ countryKey: 'Japan', budgetBRL: -5 }, { idFactory }).budgetBRL, null);
assert.equal(normalizeTrip({ countryKey: 'Atlantis' }, { countries: COUNTRIES, idFactory }), null, 'destino inexistente');
assert.equal(normalizeTrip(null), null);
assert.equal(normalizeTrip({}), null);

// Linhas de orçamento.
let edited = addLine(trip, { category: 'flights', amountBRL: 18600, status: 'estimate', note: 'GRU ⇄ NRT', source: { kind: 'traveling-estimate', model: 'pricing.engine', fx: 'PTAX 2026-11-13' } }, { now });
edited = addLine(edited, { category: 'lodging', amountBRL: '7200.5', status: 'quote', note: '  Hotel   em Shinjuku ' }, { now });
edited = addLine(edited, { category: 'insurance', amountBRL: 450, status: 'paid' }, { now });
edited = addLine(edited, { category: 'flights', amountBRL: 'abc' }, { now });
assert.equal(edited.lines.length, 3, 'valor inválido não entra');
assert.equal(edited.lines[1].amountBRL, 7200.5);
assert.equal(edited.lines[1].note, 'Hotel em Shinjuku');
assert.equal(edited.lines[0].source.model, 'pricing.engine');
assert.equal(normalizeTrip({ countryKey: 'Japan', lines: [{ amountBRL: 10, category: 'spaceship', status: 'maybe' }] }, { idFactory }).lines[0].category, 'other');
assert.equal(normalizeTrip({ countryKey: 'Japan', lines: [{ amountBRL: 10, status: 'maybe' }] }, { idFactory }).lines[0].status, 'estimate');
assert.equal(trip.lines.length, 0, 'funções não alteram o original');

const totals = tripTotals(edited);
assert.equal(totals.total, 26250.5);
assert.equal(totals.perPerson, 13125.25);
assert.deepEqual(totals.byStatus, { estimate: 18600, quote: 7200.5, paid: 450 });
assert.equal(totals.byCategory.flights, 18600);
assert.equal(totals.remaining, 3749.5);
assert.equal(totals.overBudget, false);
assert.equal(totals.paidShare, 0.02);
assert.deepEqual(Object.keys(totals.byCategory), BUDGET_CATEGORIES.map(category => category.id));
assert.deepEqual(Object.keys(totals.byStatus), Object.keys(LINE_STATUSES));
const over = updateTrip(edited, { budgetBRL: 20000 }, { now });
assert.equal(tripTotals(over).overBudget, true);
assert.equal(tripTotals(over).remaining, -6250.5);
assert.equal(tripTotals(updateTrip(edited, { budgetBRL: null })).remaining, null);
assert.equal(tripTotals(createTrip({ countryKey: 'Japan', idFactory })).paidShare, 0);

const lodgingId = edited.lines[1].id;
const paidLodging = updateLine(edited, lodgingId, { status: 'paid', id: 'l_hacked' }, { now });
assert.equal(paidLodging.lines[1].id, lodgingId, 'id da linha não muda');
assert.equal(tripTotals(paidLodging).byStatus.paid, 7650.5);
assert.equal(removeLine(paidLodging, lodgingId).lines.length, 2);
let full = trip;
for (let index = 0; index < MAX_LINES + 5; index += 1) full = addLine(full, { amountBRL: 1 });
assert.equal(full.lines.length, MAX_LINES);

// Conjunto salvo: dados corrompidos, duplicados e versão.
assert.deepEqual(normalizeStore('lixo'), { version: TRIP_SCHEMA_VERSION, activeTripId: null, trips: [] });
const store = normalizeStore({ activeTripId: 't_none', trips: [edited, edited, { countryKey: 'Atlantis' }, null] }, { countries: COUNTRIES });
assert.equal(store.trips.length, 1, 'duplicados e destinos inválidos saem');
assert.equal(store.activeTripId, edited.id, 'ativo inexistente cai na primeira viagem');
assert.deepEqual(normalizeStore(JSON.parse(JSON.stringify(store)), { countries: COUNTRIES }), store, 'ida e volta por JSON');

// Armazenamento com leitura/escrita injetadas.
const memory = new Map();
const tripStore = createTripStore({
  countries: COUNTRIES,
  read: (key, fallback) => memory.has(key) ? JSON.parse(memory.get(key)) : fallback,
  write: (key, value) => { memory.set(key, JSON.stringify(value)); return true; }
});
let notified = 0;
tripStore.subscribe(() => { notified += 1; });
tripStore.save(edited);
const second = tripStore.save(createTrip({ countryKey: 'Portugal', idFactory }));
assert.equal(tripStore.trips.length, 2);
assert.equal(tripStore.activeTripId, second.id);
assert.equal(tripStore.findByCountry('Japan').id, edited.id);
tripStore.setActive(edited.id);
assert.equal(tripStore.active().id, edited.id);
tripStore.remove(edited.id);
assert.equal(tripStore.activeTripId, second.id, 'remover a ativa escolhe outra');
assert.equal(notified, 4);
assert.equal(JSON.parse(memory.get('traveling.trips')).trips.length, 1);
assert.equal(tripStore.persistent, true);
const blocked = createTripStore({ read: () => null, write: () => false });
blocked.save(createTrip({ countryKey: 'Japan', idFactory }));
assert.equal(blocked.persistent, false, 'armazenamento bloqueado é sinalizado');
assert.equal(blocked.trips.length, 1, 'mas a viagem continua na sessão');

// Dinheiro × milhas guardado na viagem: campo apagado some, não vira zero.
const withMiles = updateTrip(trip, { miles: { fareBRL: 9300, points: 70000, taxesBRL: 450, myCostPer1000BRL: null } });
assert.deepEqual(withMiles.miles, { fareBRL: 9300, points: 70000, taxesBRL: 450 });
assert.equal(updateTrip(trip, { miles: { fareBRL: '' } }).miles, undefined);

// Sugestões e comparação (planner.estimates.js).
assert.deepEqual(flightSuggestion({ cash: { brl: { low: 4630, high: 8160 } } }, { travelers: 2 }), { amountBRL: 25580, perLegLow: 4630, perLegHigh: 8160, basis: { brlLow: 4630, brlHigh: 8160 } }, 'média × 2 trechos × 2 pessoas');
assert.equal(flightSuggestion({ cash: { brl: null, usd: { low: 1, high: 2 } } }), null, 'sem câmbio, sem sugestão em reais');
assert.equal(flightSuggestion(null), null);
assert.equal(flightSuggestion({ cash: { usd: { low: 800, high: 1400 }, brl: { low: 1, high: 1 } } }, { travelers: 2, brlPerUsd: 5.5 }).amountBRL, 24200, 'converte do dólar uma vez: 1.100 × 5,5 × 2 trechos × 2');

// Gastos no destino: referência = 1 pessoa, 7 dias/7 noites, quarto simples.
const week = [{ localWeekBRL: [7000, 7000] }];
const localFor = (days, nights, travelers, lodging = 'simple') => localCostSuggestion(week, { days, nights, travelers, lodging }).amountBRL;
assert.equal(localFor(7, 7, 1), 7000, 'reproduz a referência');
assert.equal(localCostSuggestion(week).amountBRL, 7000, 'sem datas: 7 dias e 7 noites');
assert.equal(localFor(14, 13, 2), 21250, '2 pessoas dividem o quarto: 450 × 13 noites + 550 × 14 dias × 2');
assert.equal(localFor(14, 13, 3), 34800, '3 pessoas: 2 quartos');
assert.equal(localFor(7, 6, 1, 'hostel'), 4930, 'albergue: cama a 40% do quarto');
assert.ok(localFor(14, 13, 2, 'hostel') < localFor(14, 13, 2) && localFor(14, 13, 2) < localFor(14, 13, 2, 'comfort') && localFor(14, 13, 2, 'comfort') < localFor(14, 13, 2, 'superior'), 'categorias em ordem de preço');
assert.equal(localFor(305, 304, 2), 270270, 'estadia longa: após 28 dias, valores mensais');
assert.ok(localFor(305, 304, 2) < 7000 * (305 / 7) * 2 * 0.65, 'longa estadia não é a semana × 43,6 × 2');
const japan = localCostSuggestion([
  { localWeekBRL: [3000, 5000], region: 'Tóquio', reviewedOn: '2026-09-26' },
  { localWeekBRL: [2500, 6000], region: 'Quioto', reviewedOn: '2026-09-20' },
  { localWeekBRL: [0, 5000] }
], { days: 14, nights: 13, travelers: 2 });
assert.deepEqual([japan.weekLow, japan.weekHigh, japan.basis.weekMid, japan.regions, japan.reviewedOn], [2500, 6000, 4125, ['Tóquio', 'Quioto'], '2026-09-20'], 'média dos pontos médios; faixa do menor ao maior');
assert.ok(japan.low < japan.amountBRL && japan.amountBRL < japan.high);
assert.equal(localCostSuggestion([], { days: 7 }), null, 'sem perfil revisado, sem sugestão');
assert.equal(normalizeTrip({ countryKey: 'Japan', lodging: 'palacio' }, { idFactory }).lodging, 'simple');

// Portugal, 2 viajantes, 305 dias: o valor antigo (R$ 501.070) multiplicava a
// semana individual, com hospedagem, por 43,6 semanas e por 2 pessoas.
{
  const { DESTINATION_PROFILES } = await import('../js/destination.profiles.js');
  const { formatBRL } = await import('../js/planner/money.js');
  const portugal = DESTINATION_PROFILES.filter(profile => profile.countryKey === 'Portugal');
  let pt = createTrip({ countryKey: 'Portugal', travelers: 2, startDate: '2027-01-01', endDate: '2027-11-01', idFactory });
  assert.equal(tripDays(pt), 305);
  const suggestion = localCostSuggestion(portugal, { trip: pt });
  assert.ok(suggestion.amountBRL < 250_000 && suggestion.amountBRL > 150_000, `Portugal 305 dias × 2: ${suggestion.amountBRL}`);
  assert.ok(suggestion.amountBRL / 305 / 2 < 450, 'menos de R$ 450 por pessoa/dia em estadia longa');
  // Linha antiga, sem base: recalculada a partir da faixa gravada na descrição.
  pt = addLine(pt, { category: 'local', amountBRL: 501070, status: 'estimate', note: 'Hospedagem simples · 305 dias', source: { kind: 'traveling-estimate', model: 'discovery.localWeekBRL', detail: `faixa de ${formatBRL(4500)}–${formatBRL(7000)} por pessoa por semana (Lisboa e Sintra), revisada em 26/09/2026` } });
  const migrated = repriceLines(pt, {});
  assert.equal(migrated[0].amountBRL, suggestion.amountBRL, 'linha salva com o cálculo antigo é corrigida');
  assert.ok(migrated[0].source.basis.weekMid === 5750);
  assert.equal(repriceLines({ ...pt, lines: migrated }, {}), null, 'recalcular de novo não muda nada');
}

// Recalcular: viajantes, datas e hospedagem mudam as estimativas; valores do usuário não.
{
  let base = createTrip({ countryKey: 'Portugal', travelers: 2, startDate: '2027-05-01', endDate: '2027-05-14', idFactory });
  base = addLine(base, localLine(localCostSuggestion(week, { trip: base }).basis, base));
  base = addLine(base, flightLine({ usdLow: 800, usdHigh: 1400, route: 'GRU ⇄ LIS', cabin: 'economy' }, base, { rate: 5.5, date: '2026-11-13', label: 'PTAX' }));
  base = addLine(base, { category: 'lodging', amountBRL: 3000, status: 'quote', note: 'Hotel' });
  assert.deepEqual(base.lines.map(line => line.amountBRL), [21250, 24200, 3000]);
  const usd = { USD: { rate: 5.5, date: '2026-11-13', kind: 'live', label: 'PTAX' } };
  assert.equal(repriceLines(base, usd), null, 'sem mudança, nada a salvar');
  const three = updateTrip(base, { travelers: 3 });
  assert.deepEqual(repriceLines(three, usd).map(line => line.amountBRL), [34800, 36300, 3000], 'viajantes: quartos e passagens; cotação do usuário intacta');
  assert.match(repriceLines(three, usd)[0].note, /3 pessoas/);
  assert.equal(repriceLines(updateTrip(base, { lodging: 'comfort' }), usd)[0].amountBRL > 21250, true, 'hospedagem melhor custa mais');
  assert.equal(repriceLines(updateTrip(base, { endDate: '2027-05-07' }), usd)[0].amountBRL, 10400, '7 dias/6 noites, 2 pessoas');
  assert.equal(repriceLines(base, { USD: { rate: 6, date: '2026-11-14', kind: 'live' } })[1].amountBRL, 26400, 'câmbio novo recalcula a partir do dólar');
  assert.equal(repriceLines(base, {})?.[1]?.amountBRL ?? 24200, 24200, 'sem cotação do dólar, a passagem fica como está');
  assert.equal(isEstimateLine(base.lines[0]), true);
  assert.equal(isEstimateLine(base.lines[2]), false);
}

// Câmbio: tabela, conversão única e gastos em moeda estrangeira.
{
  const table = rateTable({
    snapshot: { date: '2026-11-13', rates: { EUR: { sell: 6.2 }, USD: { sell: 5.3 }, JPY: { sell: 0.0354 } }, sourceUrl: 'https://www.bcb.gov.br/' },
    live: { USD: { rate: 5.4, date: '2026-11-14', label: 'Cotação PTAX (BCB)' }, EUR: { rate: 6, date: '2026-11-01' }, XXX: { rate: -1, date: '2026-11-14' } }
  });
  assert.equal(table.USD.rate, 5.4, 'PTAX do dia vale mais que o boletim');
  assert.equal(table.EUR.rate, 6.2, 'cotação ao vivo mais antiga que o boletim é ignorada');
  assert.equal(table.XXX, undefined);
  assert.equal(rateFor('BRL', table).rate, 1);
  assert.deepEqual(convertToBRL(100, 'EUR', table), { amountBRL: 620, rate: 6.2, date: '2026-11-13' });
  assert.equal(convertToBRL(100, 'ABC', table), null);
  assert.equal(convertToBRL(12000, 'JPY', table).amountBRL, 424.8);
  assert.deepEqual(currencyChoices('EUR', table), ['BRL', 'EUR', 'USD']);
  assert.deepEqual(currencyChoices('JPY', table), ['BRL', 'JPY', 'USD', 'EUR']);

  let euro = addLine(createTrip({ countryKey: 'Portugal', idFactory }), { category: 'lodging', currency: 'eur', amount: 100, amountBRL: 0, status: 'quote' });
  assert.deepEqual([euro.lines[0].currency, euro.lines[0].amount], ['EUR', 100]);
  euro = { ...euro, lines: repriceLines(euro, table) };
  assert.equal(euro.lines[0].amountBRL, 620);
  assert.deepEqual(euro.lines[0].fx, { rate: 6.2, date: '2026-11-13' });
  assert.equal(repriceLines(euro, table), null, 'sem conversão dupla: o resultado não é convertido de novo');
  const later = rateTable({ snapshot: { date: '2026-11-20', rates: { EUR: { sell: 6.5 } } } });
  assert.equal(repriceLines(euro, later)[0].amountBRL, 650, 'nova cotação parte dos € 100, não dos R$ 620');
  assert.deepEqual(normalizeStore(JSON.parse(JSON.stringify({ trips: [euro] }))).trips[0].lines[0], euro.lines[0], 'moeda sobrevive ao armazenamento');
  const inReais = updateLine(euro, euro.lines[0].id, { currency: 'BRL', amountBRL: 100 });
  assert.deepEqual([inReais.lines[0].currency, inReais.lines[0].amount, inReais.lines[0].fx, inReais.lines[0].amountBRL], [undefined, undefined, undefined, 100]);
  assert.equal(normalizeLine({ amountBRL: 50, currency: 'BRL', amount: 9 }).currency, undefined, 'real não é moeda estrangeira');
  assert.equal(tripTotals(euro).total, 620, 'totais somam só reais');
}

// Milhas: comparação automática por programa.
{
  const estimate = { distanceKm: 8000, cash: { usd: { low: 800, high: 1400 } }, awards: { 'LATAM Pass': { low: 30000, high: 50000 }, Smiles: { low: 32000, high: 54000 }, Azul: { low: 31000, high: 52000 } } };
  const auto = awardComparison({ estimate, travelers: 1, brlPerUsd: 5 });
  assert.equal(auto.cashBRL, 11000, 'US$ 1.100 × 5 × 2 trechos');
  assert.equal(auto.cashSource, 'estimate');
  assert.deepEqual(auto.options.map(option => [option.name, option.miles, option.feesBRL, option.effectiveBRL]), [
    ['Azul Fidelidade', 83000, 850, 2180],
    ['Smiles', 86000, 850, 2400],
    ['LATAM Pass', 80000, 850, 3090]
  ], 'milhas × milheiro de referência + taxas, do menor custo efetivo ao maior');
  assert.equal(auto.best.name, 'Azul Fidelidade');
  assert.equal(auto.best.savingBRL, 8820);
  assert.equal(auto.recommendation, 'miles');
  assert.equal(awardComparison({ estimate, travelers: 2, brlPerUsd: 5 }).options[0].miles, 166000, '2 pessoas: dobro de milhas');
  const own = awardComparison({ estimate, travelers: 1, brlPerUsd: 5, myCostPer1000BRL: 200 });
  assert.equal(own.recommendation, 'cash', 'milheiro caro: dinheiro rende mais');
  assert.equal(own.best.name, 'LATAM Pass', 'com o mesmo milheiro, vence quem pede menos milhas');
  assert.ok(own.best.savingBRL < 0);
  const quoted = awardComparison({ estimate, travelers: 1, brlPerUsd: 5, cashBRL: 5000 });
  assert.deepEqual([quoted.cashBRL, quoted.cashSource], [5000, 'quote'], 'usa o preço que o usuário cotou');
  assert.equal(awardComparison({ estimate, travelers: 1, brlPerUsd: null }), null, 'sem câmbio, sem comparação');
  assert.ok(awardComparison({ estimate, travelers: 1, brlPerUsd: 5, domestic: true }).best.feesBRL < auto.best.feesBRL, 'taxas domésticas menores');
  assert.deepEqual(AWARD_PROGRAMS.map(program => program.name), ['LATAM Pass', 'Smiles', 'Azul Fidelidade']);
}
assert.equal(compareCashAndMiles({ fareBRL: 3000 }), null);
const cashVsMiles = compareCashAndMiles({ fareBRL: 3000, points: 40000, taxesBRL: 200, myCostPer1000BRL: 50 });
assert.equal(cashVsMiles.perThousand, 70);
assert.equal(cashVsMiles.better, 'points', 'R$ 70 por mil > milheiro de R$ 50');
assert.equal(compareCashAndMiles({ fareBRL: 3000, points: 40000, taxesBRL: 200, myCostPer1000BRL: 90 }).better, 'cash');
assert.equal(compareCashAndMiles({ fareBRL: 3000, points: 40000, taxesBRL: 200 }).better, null);
assert.ok(compareCashAndMiles({ fareBRL: 300, points: 40000, taxesBRL: 500 }).error, 'taxas acima do preço');

console.log('Planner: modelo, totais, normalização, armazenamento, sugestões e milhas verificados.');

// Passo a passo: etapa salva e progresso.
{
  const { PLANNER_STEPS, tripProgress } = await import('../js/planner/trip.model.js');
  assert.equal(PLANNER_STEPS.length, 6);
  const fresh = createTrip({ countryKey: 'Japan', idFactory });
  assert.equal(fresh.step, 1);
  assert.equal(fresh.entryReviewed, false);
  assert.equal(normalizeTrip({ countryKey: 'Japan', step: 99 }, { idFactory }).step, 6);
  assert.equal(normalizeTrip({ countryKey: 'Japan', step: 'x' }, { idFactory }).step, 1);
  assert.equal(normalizeTrip({ countryKey: 'Japan', entryReviewed: 'yes' }, { idFactory }).entryReviewed, false);
  let progress = tripProgress(fresh);
  assert.deepEqual(progress.done, [true, false, false, false, false, false]);
  assert.equal(progress.next, 2);
  assert.equal(progress.completed, 1);
  let planned = updateTrip(fresh, { startDate: '2027-04-02', endDate: '2027-04-10', budgetBRL: 20000, entryReviewed: true, step: 4 });
  planned = addLine(planned, { category: 'flights', amountBRL: 9000 });
  progress = tripProgress(planned);
  assert.deepEqual(progress.done, [true, true, true, true, true, true]);
  assert.equal(progress.next, null);
  assert.equal(planned.step, 4);
  assert.equal(tripProgress(updateTrip(planned, { budgetBRL: null })).done[3], false, 'sem orçamento nem outros gastos');
  console.log('Planner: passo a passo (etapas, progresso e etapa salva) verificado.');
}

// Escolhas por toque: mês, duração, grupo, pagamento, estilo e interesses.
{
  const { TRIP_DURATIONS, tripProgress } = await import('../js/planner/trip.model.js');
  const base = createTrip({ countryKey: 'Japan', idFactory });
  assert.equal(base.month, null);
  assert.deepEqual(base.interests, []);
  const chosen = updateTrip(base, { month: 4, duration: 10, group: 'couple', payWith: 'miles', style: 'balanced', interests: ['food', 'food', 'spaceship', 'culture'] });
  assert.equal(tripMonth(chosen), 4, 'mês escolhido vale sem datas');
  assert.equal(tripDays(chosen), 10, 'duração escolhida vale sem datas');
  assert.deepEqual(chosen.interests, ['food', 'culture'], 'interesses sem repetição nem valores desconhecidos');
  assert.deepEqual(tripProgress(chosen).done.slice(0, 4), [true, true, true, true]);
  const invalid = updateTrip(base, { month: 12, duration: 4, group: 'x', payWith: 'x', style: 'x', transport: 'x' });
  assert.deepEqual([invalid.month, invalid.duration, invalid.group, invalid.payWith, invalid.style, invalid.transport], [null, null, null, null, null, null]);
  const exact = updateTrip(chosen, { startDate: '2027-09-01', endDate: '2027-09-05' });
  assert.equal(tripMonth(exact), 8, 'datas exatas têm prioridade sobre o mês');
  assert.equal(tripDays(exact), 5, 'datas exatas têm prioridade sobre a duração');
  assert.ok(TRIP_DURATIONS.every(item => Number.isInteger(item.days) && item.label));
  // Cidade do destino: só formato válido e do mesmo país.
  const { normalizeCity } = await import('../js/planner/trip.model.js');
  assert.equal(normalizeCity({ id: 'BR-1', name: 'São Paulo', lat: -23.5471, lng: -46.6361, region: 'São Paulo' }).lat, -23.547);
  assert.equal(normalizeCity({ id: 'x', name: 'A', lat: 0, lng: 0 }), null);
  assert.equal(normalizeCity({ id: 'BR-1', name: 'A', lat: 120, lng: 0 }), null);
  const withCity = normalizeTrip({ countryKey: 'Japan', city: { id: 'JP-3', name: 'Kyoto', lat: 35.02, lng: 135.75 } }, { countries: COUNTRIES, idFactory });
  assert.equal(withCity.city.name, 'Kyoto');
  assert.equal(normalizeTrip({ countryKey: 'Japan', city: { id: 'BR-3', name: 'Recife', lat: -8, lng: -35 } }, { countries: COUNTRIES, idFactory }).city, null, 'cidade de outro país é descartada');
  assert.equal(createTrip({ countryKey: 'Japan', city: { id: 'JP-3', name: 'Kyoto', lat: 35.02, lng: 135.75 }, idFactory }).city.id, 'JP-3');
  console.log('Planner: escolhas por toque verificadas.');
}

// ---------- Fase 1: checklist por viagem, duplicar, excluir e desfazer ----------
{
  // Checklist guardado na viagem: só chaves do próprio destino e só "true".
  assert.deepEqual(normalizeChecklist({ 'Japan:0:1': true, 'Italy:0:1': true, 'Japan:x': 'sim' }, 'Japan'), { 'Japan:0:1': true });
  assert.deepEqual(createTrip({ countryKey: 'Japan', idFactory }).checklist, {});

  // Duas viagens ao mesmo país têm checklists independentes.
  const a = createTrip({ countryKey: 'Japan', idFactory });
  const b = createTrip({ countryKey: 'Japan', idFactory });
  const aDone = setChecklistItems(a, ['Japan:0:0', 'Japan:0:1'], true);
  assert.deepEqual(aDone.checklist, { 'Japan:0:0': true, 'Japan:0:1': true });
  assert.deepEqual(b.checklist, {}, 'marcar na viagem A não marca na B');
  assert.deepEqual(setChecklistItems(aDone, ['Japan:0:0'], false).checklist, { 'Japan:0:1': true });

  // Migração da versão 1: cada viagem herda o progresso antigo do país dela;
  // dados da versão 2 não são tocados.
  const legacy = { 'Japan:0:0': true, 'Japan:0:1': false, 'Italy:1:0': true };
  const migrated = normalizeStore({ version: 1, trips: [a, createTrip({ countryKey: 'Italy', idFactory })] }, { countries: COUNTRIES, legacyChecklist: legacy });
  assert.equal(migrated.version, TRIP_SCHEMA_VERSION);
  assert.deepEqual(migrated.trips[0].checklist, { 'Japan:0:0': true });
  assert.deepEqual(migrated.trips[1].checklist, { 'Italy:1:0': true });
  const current = normalizeStore({ version: 2, trips: [b] }, { countries: COUNTRIES, legacyChecklist: legacy });
  assert.deepEqual(current.trips[0].checklist, {}, 'versão 2 não herda de novo');

  // Store: migração grava o formato novo uma vez, sem apagar a chave antiga.
  const memory = new Map([
    ['traveling.trips', JSON.stringify({ version: 1, activeTripId: a.id, trips: [a] })],
    ['traveling.checklist', JSON.stringify(legacy)]
  ]);
  const io = {
    countries: COUNTRIES,
    read: (key, fallback) => memory.has(key) ? JSON.parse(memory.get(key)) : fallback,
    write: (key, value) => { memory.set(key, JSON.stringify(value)); return true; }
  };
  const store = createTripStore(io);
  assert.deepEqual(store.trips[0].checklist, { 'Japan:0:0': true });
  assert.equal(JSON.parse(memory.get('traveling.trips')).version, TRIP_SCHEMA_VERSION, 'formato novo gravado');
  assert.ok(memory.has('traveling.checklist'), 'chave antiga preservada');
  const backup = JSON.parse(memory.get('traveling.trips.backup-v1'));
  assert.equal(backup.data.version, 1, 'backup guarda o conjunto antigo intacto');
  assert.equal(backup.data.trips[0].id, a.id);
  // Abrir de novo: já está na versão 2, não migra nem mexe no backup.
  const backupBefore = memory.get('traveling.trips.backup-v1');
  createTripStore(io);
  assert.equal(memory.get('traveling.trips.backup-v1'), backupBefore, 'migração roda uma vez só');
  // Backup bloqueado: nada é gravado, o conjunto antigo continua no armazenamento.
  const locked = new Map([['traveling.trips', JSON.stringify({ version: 1, trips: [a] })]]);
  const lockedStore = createTripStore({
    countries: COUNTRIES,
    read: (key, fallback) => locked.has(key) ? JSON.parse(locked.get(key)) : fallback,
    write: key => key !== 'traveling.trips.backup-v1' && (locked.set(key, 'x'), true)
  });
  assert.equal(JSON.parse(locked.get('traveling.trips')).version, 1, 'sem backup, o formato antigo não é sobrescrito');
  assert.equal(lockedStore.trips.length, 1, 'mas as viagens abrem normalmente na sessão');

  // Duplicar: id novo, logo depois da original, checklist e conferência zerados.
  store.save(updateTrip(store.trips[0], { entryReviewed: true }));
  const copy = store.duplicate(a.id);
  assert.notEqual(copy.id, a.id);
  assert.equal(store.trips.length, 2);
  assert.equal(store.trips[1].id, copy.id);
  assert.deepEqual(copy.checklist, {});
  assert.equal(copy.entryReviewed, false);
  assert.equal(copy.countryKey, 'Japan');
  assert.equal(duplicateTrip(a, { idFactory }).id.startsWith('t_'), true);

  // Excluir remove exatamente uma viagem; desfazer devolve na mesma posição.
  const third = store.save(createTrip({ countryKey: 'Portugal', idFactory }));
  const removed = store.remove(copy.id);
  assert.equal(removed.trip.id, copy.id);
  assert.equal(removed.index, 1);
  assert.deepEqual(store.trips.map(item => item.id), [a.id, third.id], 'as outras viagens continuam');
  assert.deepEqual(store.get(a.id).checklist, { 'Japan:0:0': true }, 'checklist da outra viagem intacto');
  assert.equal(store.remove('t_naoexiste'), null);
  store.restore(removed);
  assert.deepEqual(store.trips.map(item => item.id), [a.id, copy.id, third.id]);
  assert.equal(store.restore(removed), null, 'não duplica ao desfazer duas vezes');

  // Situação pela data, só com ida e volta exatas.
  const dated = createTrip({ countryKey: 'Japan', startDate: '2026-11-10', endDate: '2026-11-20', idFactory });
  assert.equal(tripStatus(dated, new Date(2026, 10, 1)), 'planned');
  assert.equal(tripStatus(dated, new Date(2026, 10, 15)), 'ongoing');
  assert.equal(tripStatus(dated, new Date(2026, 10, 25)), 'completed');
  assert.equal(tripStatus(createTrip({ countryKey: 'Japan', idFactory })), 'planned');
  console.log('Planner: checklist por viagem, migração, duplicar, excluir e desfazer verificados.');
}

// Oferta de fornecedor anexada à viagem (fase 3.3): só resumo e referência, validados.
{
  let id = 0;
  const idFactory = prefix => `${prefix}_offer${String(++id).padStart(4, '0')}`;
  const base = createTrip({ countryKey: 'Portugal', travelers: 2, idFactory });
  const source = { kind: 'provider-offer', provider: 'duffel', offerId: 'off_123', dataSource: 'live', fetchedAt: '2026-11-15T12:00:00Z', expiresAt: '2026-11-15T12:30:00Z', summary: 'TAP · GRU→LIS', url: 'https://example.com/reserva' };
  const withOffer = addLine(base, { category: 'flights', status: 'quote', amountBRL: 8420.5, note: 'TAP', source }, { idFactory });
  assert.deepEqual(withOffer.lines[0].source, source);
  assert.equal(tripTotals(withOffer).byCategory.flights, 8420.5, 'entra no orçamento');
  const clean = raw => addLine(base, { category: 'flights', amountBRL: 1, source: { ...source, ...raw } }, { idFactory }).lines[0].source;
  assert.equal(clean({ url: 'http://example.com' }).url, undefined, 'só https');
  assert.equal(clean({ url: 'javascript:alert(1)' }).url, undefined);
  assert.equal(clean({ dataSource: 'magic' }), undefined, 'origem desconhecida descarta a referência');
  assert.equal(clean({ fetchedAt: 'ontem' }), undefined);
  assert.equal(clean({ provider: 'Duffel Inc' }), undefined);
  assert.equal(clean({ expiresAt: 'logo' }).expiresAt, undefined);
  console.log('Planner: ofertas de fornecedor anexadas à viagem verificadas.');
}

// Quanto vai custar (resumo): estimativas, cotações anexadas, gastos anotados e orçamento.
{
  const { tripCostSummary, localCostRange, costSummaryText, costHtml } = await import('../js/planner/cost.section.js');
  const { DESTINATION_PROFILES } = await import('../js/destination.profiles.js');
  let id = 0;
  const idFactory = prefix => `${prefix}_cost${String(++id).padStart(4, '0')}`;
  const at = new Date('2026-11-15T12:10:00Z');
  const base = createTrip({ countryKey: 'Portugal', travelers: 2, startDate: '2027-04-03', endDate: '2027-04-10', budgetBRL: 20000, idFactory });

  const local = localCostRange(DESTINATION_PROFILES, base);
  assert.ok(local, 'Portugal tem perfil revisado');
  assert.equal(local.days, 8);
  assert.equal(local.nights, 7);
  assert.equal(local.assumedStay, false);
  assert.ok(local.low.total < local.high.total);
  assert.equal(localCostRange(DESTINATION_PROFILES, { ...base, countryKey: 'Nowhere' }), null);
  const undated = localCostRange(DESTINATION_PROFILES, { ...base, startDate: null, endDate: null });
  assert.equal(undated.assumedStay, true);
  assert.equal(undated.days, 7);
  const region = DESTINATION_PROFILES.find(profile => profile.countryKey === 'Portugal');
  const narrowed = localCostRange(DESTINATION_PROFILES, { ...base, profileId: region.id });
  assert.ok(narrowed.low.total >= local.low.total && narrowed.high.total <= local.high.total, 'região escolhida restringe a faixa');

  const flight = { low: 4000, high: 6000 };
  const estimate = tripCostSummary({ trip: base, flight, local, now: at });
  assert.deepEqual(estimate.rows.map(row => [row.id, row.kind]), [['flights', 'estimate'], ['lodging', 'estimate'], ['daily', 'estimate']]);
  assert.equal(estimate.rows[0].low, 8000, 'passagem × viajantes');
  assert.equal(estimate.rows[0].high, 12000);
  assert.equal(estimate.low, estimate.rows.reduce((sum, row) => sum + row.low, 0));
  assert.equal(estimate.perPersonHigh, Math.round(estimate.high / 2));
  assert.deepEqual(estimate.incomplete, []);
  assert.ok(['within', 'tight', 'over'].includes(estimate.budget.status));

  // Cotação anexada substitui a estimativa da categoria; vencida aparece como tal.
  const source = { kind: 'provider-offer', provider: 'mock', offerId: 'o1', dataSource: 'test', fetchedAt: '2026-11-15T12:00:00Z', expiresAt: '2026-11-15T12:05:00Z' };
  let quoted = addLine(base, { category: 'flights', status: 'quote', amountBRL: 9000.5, note: 'Voo de teste', source }, { idFactory });
  quoted = addLine(quoted, { category: 'lodging', status: 'quote', amountBRL: 1500, note: 'Hotel', source: { ...source, offerId: 'h1', expiresAt: undefined } }, { idFactory });
  quoted = addLine(quoted, { category: 'insurance', status: 'paid', amountBRL: 300, note: 'Seguro', source: { kind: 'user' } }, { idFactory });
  quoted = addLine(quoted, { category: 'flights', status: 'estimate', amountBRL: 99999, note: 'antiga', source: { kind: 'traveling-estimate', model: 'pricing.engine' } }, { idFactory });
  const withQuotes = tripCostSummary({ trip: quoted, flight, local, now: at });
  const byId = Object.fromEntries(withQuotes.rows.map(row => [row.id, row]));
  assert.equal(byId.flights.kind, 'quote');
  assert.equal(byId.flights.low, 9000.5);
  assert.equal(byId.flights.quotes[0].expired, true);
  assert.equal(byId.lodging.quotes[0].expired, false, 'sem prazo não vence');
  assert.equal(byId.own.low, 300);
  assert.equal(byId.own.detail, 'Seguro e documentos');
  assert.ok(withQuotes.high < 99999, 'estimativas antigas guardadas não entram (o cálculo é refeito)');
  const html = costHtml(withQuotes, { local });
  assert.ok(html.includes('Preço expirado') && html.includes('data-planner-step="3"'), 'cotação vencida oferece atualizar');
  assert.ok(html.includes('Dados de teste'));
  assert.ok(costSummaryText(withQuotes)[0].startsWith('Custo estimado: '));

  // Sem nada para estimar: avisa o que falta, sem inventar valor.
  const empty = tripCostSummary({ trip: { ...base, countryKey: 'Nowhere' }, flight: null, local: null, now: at });
  assert.deepEqual(empty.rows, []);
  assert.deepEqual(empty.incomplete, ['Passagens', 'Hospedagem', 'Gastos no destino']);
  assert.equal(empty.budget, null);
  assert.deepEqual(costSummaryText(empty), []);
  assert.ok(costHtml(empty).includes('Ainda não há estimativa'));
  const over = tripCostSummary({ trip: { ...base, budgetBRL: 100 }, flight, local, now: at });
  assert.equal(over.budget.status, 'over');
  console.log('Planner: custo da viagem no resumo (estimativas, cotações, gastos anotados, orçamento) verificado.');
}
