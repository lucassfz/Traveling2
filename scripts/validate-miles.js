import assert from 'node:assert/strict';
import { AIRPORT_GUIDES, CARD_OFFERS, UPGRADE_METHODS } from '../js/miles.data.js';
import { AirportRepository } from '../js/airports.repository.js';
import { annualFeeAmount, cardMatches, evaluateRedemption, filterLoungesByTerminal, findVerifiedLounges, loungeNetworks, parseBrazilianNumber, rankAirportMatches, verifiedRecord } from '../js/miles.tools.js';

const result = evaluateRedemption({ cashFare: 'R$ 4.200,00', points: '80.000', fees: 'R$ 350,00' });
assert.equal(result.replaced, 3850);
assert.equal(result.perThousand, 48.125);
assert.equal(parseBrazilianNumber('4.200,50'), 4200.5);
assert.equal(parseBrazilianNumber('80.000', { whole: true }), 80000);
for (const input of [
  { cashFare: '', points: '80000', fees: '' },
  { cashFare: '0', points: '80000', fees: '' },
  { cashFare: '4200', points: '0', fees: '' },
  { cashFare: '4200', points: '80000', fees: '4300' },
  { cashFare: '999999999', points: '80000', fees: '' },
  { cashFare: '4.200', points: '80,000', fees: '' }
]) assert.ok(evaluateRedemption(input).error, JSON.stringify(input));
assert.equal(evaluateRedemption({ cashFare: '4200', points: '80000', fees: '' }).taxes, 0);
assert.equal(evaluateRedemption({ cashFare: '4200', points: '80000', fees: '4200' }).perThousand, 0);

assert.equal(CARD_OFFERS.length, 8);
for (const card of CARD_OFFERS) { assert.ok(verifiedRecord(card), card.id); assert.ok(annualFeeAmount(card) !== null, card.id); }
const profiles = [
  { trips: 'start', lounge: 'none', abroad: 'rare', fee: 'avoid', values: ['points'] },
  { trips: '6+', lounge: 'important', abroad: 'sometimes', fee: 'conditional', values: ['lounges'] },
  { trips: '6+', lounge: 'useful', abroad: 'often', fee: 'any', values: ['international', 'points'] },
  { trips: '1-2', lounge: 'none', abroad: 'rare', fee: 'avoid', values: ['simple', 'airports'] }
];
for (const preferences of profiles) {
  const { matches } = cardMatches(CARD_OFFERS, preferences);
  assert.ok(matches.length >= 2);
  assert.equal(matches.some(match => match.card.id === 'itau-private-visa'), false);
  for (const match of matches) {
    assert.ok(match.reasons.every(reason => [match.card.earning, match.card.loyaltyProgram, match.card.loungeAccess, match.card.travelBenefits, match.card.annualFee].some(fact => fact && reason.includes(fact))), match.card.id);
  }
}
assert.equal(cardMatches(CARD_OFFERS, { trips: 'start', lounge: 'none', abroad: 'rare', fee: 'any', values: ['simple'] }).matches[0].score, 0);

assert.deepEqual(loungeNetworks(AIRPORT_GUIDES), ['DragonPass', 'LoungeKey', 'Priority Pass', 'Visa Airport Companion']);
for (const code of ['GRU', 'GIG', 'BSB', 'FCO', 'JFK', 'MIA']) assert.ok(findVerifiedLounges(AIRPORT_GUIDES, code).length, code);
assert.equal(findVerifiedLounges(AIRPORT_GUIDES, 'LAX').length, 0);
assert.equal(findVerifiedLounges(AIRPORT_GUIDES, 'FCO', 'Priority Pass').length, 0);
assert.equal(findVerifiedLounges(AIRPORT_GUIDES, 'FCO', 'DragonPass').length, 1);
assert.equal(filterLoungesByTerminal(findVerifiedLounges(AIRPORT_GUIDES, 'GRU'), 'T3').length, 2);
assert.equal(filterLoungesByTerminal(findVerifiedLounges(AIRPORT_GUIDES, 'GRU'), 'T2').length, 0);
const rankedAirports = rankAirportMatches([
  { iata: 'XXX', name: 'GRU Regional', city: 'Outra cidade' },
  { iata: 'GRU', name: 'São Paulo/Guarulhos', city: 'São Paulo' },
  { iata: 'VIE', name: 'Vienna International', city: 'Vienna' },
  { iata: 'ABC', name: 'Vienna Regional', city: 'Outra cidade' }
], 'GRU');
assert.equal(rankedAirports[0].iata, 'GRU');
assert.equal(rankAirportMatches([
  { iata: 'ABC', name: 'Vienna Regional', city: 'Outra cidade' },
  { iata: 'VIE', name: 'Vienna International', city: 'Vienna' }
], 'Vienna')[0].iata, 'VIE');
assert.equal(rankAirportMatches([{ iata: 'LIS', name: 'Lisbon', city: 'Lisboa' }], 'Lisboa')[0].iata, 'LIS');
assert.equal(rankAirportMatches([{ iata: 'BOE', icao: 'FCOB', name: 'Boundji', city: 'Boundji' }], 'FCO').length, 0);
const airports = new AirportRepository();
for (const code of ['GRU', 'GIG', 'BSB', 'FCO', 'JFK', 'LIS', 'LAX', 'VIE']) {
  if (code === 'VIE') continue; // VIE is resolved from the on-demand global repository.
  assert.equal((await airports.resolve(code)).iata, code);
}
for (const method of ['advance', 'checkin', 'miles', 'status']) assert.ok(UPGRADE_METHODS.some(item => item.id === method));
console.log('Miles: resgate, 4 perfis de cartão, 8 fontes, 6 aeroportos com sala, filtros, 4 upgrades e repositório OK.');
