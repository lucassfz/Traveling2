// Auditoria offline do modelo e do armazenamento do Planner v0.
import assert from 'node:assert/strict';
import { COUNTRIES } from '../js/countries.dataset.js';
import {
  BUDGET_CATEGORIES, LINE_STATUSES, MAX_LINES, MAX_TRAVELERS, TRIP_SCHEMA_VERSION,
  addLine, createTrip, isoDate, normalizeStore, normalizeTrip, removeLine, tripDays, tripMonth, tripTotals, updateLine, updateTrip
} from '../js/planner/trip.model.js';
import { createTripStore } from '../js/planner/trip.store.js';
import { compareCashAndMiles, flightSuggestion, localCostSuggestion } from '../js/planner/planner.estimates.js';

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
assert.deepEqual(flightSuggestion({ cash: { brl: { low: 4630, high: 8160 } } }, { travelers: 2 }), { amountBRL: 25580, perLegLow: 4630, perLegHigh: 8160 }, 'média × 2 trechos × 2 pessoas');
assert.equal(flightSuggestion({ cash: { brl: null, usd: { low: 1, high: 2 } } }), null, 'sem câmbio, sem sugestão em reais');
assert.equal(flightSuggestion(null), null);
const local = localCostSuggestion([
  { localWeekBRL: [3000, 5000], region: 'Tóquio', reviewedOn: '2026-09-26' },
  { localWeekBRL: [2500, 6000], region: 'Quioto', reviewedOn: '2026-09-20' },
  { localWeekBRL: [0, 5000] }
], { days: 14, travelers: 2 });
assert.deepEqual(local, { amountBRL: 17000, low: 2500, high: 6000, days: 14, regions: ['Tóquio', 'Quioto'], reviewedOn: '2026-09-20' }, 'faixa entre perfis × 14/7 × 2');
assert.equal(localCostSuggestion([], { days: 7 }), null, 'sem perfil revisado, sem sugestão');
assert.equal(localCostSuggestion([{ localWeekBRL: [1000, 1000] }]).days, 7, 'sem datas considera 7 dias');
assert.equal(compareCashAndMiles({ fareBRL: 3000 }), null);
const cashVsMiles = compareCashAndMiles({ fareBRL: 3000, points: 40000, taxesBRL: 200, myCostPer1000BRL: 50 });
assert.equal(cashVsMiles.perThousand, 70);
assert.equal(cashVsMiles.better, 'points', 'R$ 70 por mil > milheiro de R$ 50');
assert.equal(compareCashAndMiles({ fareBRL: 3000, points: 40000, taxesBRL: 200, myCostPer1000BRL: 90 }).better, 'cash');
assert.equal(compareCashAndMiles({ fareBRL: 3000, points: 40000, taxesBRL: 200 }).better, null);
assert.ok(compareCashAndMiles({ fareBRL: 300, points: 40000, taxesBRL: 500 }).error, 'taxas acima do preço');

console.log('Planner: modelo, totais, normalização, armazenamento, sugestões e milhas verificados.');
