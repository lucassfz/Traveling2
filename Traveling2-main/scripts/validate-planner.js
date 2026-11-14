// Auditoria offline do modelo e do armazenamento do Planner v0.
import assert from 'node:assert/strict';
import { COUNTRIES } from '../js/countries.dataset.js';
import {
  BUDGET_CATEGORIES, LINE_STATUSES, MAX_LINES, MAX_TRAVELERS, TRIP_SCHEMA_VERSION,
  addLine, createTrip, isEstimateLine, isoDate, normalizeLine, normalizeStore, normalizeTrip, removeLine, tripDays, tripMonth, tripTotals, updateLine, updateTrip
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
  console.log('Planner: escolhas por toque verificadas.');
}
