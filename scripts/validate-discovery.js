import assert from 'node:assert/strict';
import { COUNTRIES } from '../js/countries.dataset.js';
import { BUDGETS, DESTINATION_PROFILES, INTERESTS } from '../js/destination.profiles.js';
import { discoveryCoverage, interestStrength, nextDiscoveryIndex, noMatchAdvice, profileExclusion, rankDestinations, tripRange } from '../js/destination.discovery.js';
import { isVisaFreeForBrazil } from '../js/country.exploration.js';
import { AirportRepository } from '../js/airports.repository.js';

const coverage = discoveryCoverage(COUNTRIES);
assert.equal(coverage.profiles.length, 133);
assert.equal(coverage.countryKeys.length, 114);
assert.equal(new Set(DESTINATION_PROFILES.map(profile => profile.id)).size, DESTINATION_PROFILES.length);
for (const profile of DESTINATION_PROFILES) assert.equal(profileExclusion(profile, COUNTRIES[profile.countryKey]), null, profile.id);
const rank = patch => rankDestinations(COUNTRIES, { interests: ['praia'], climate: 'any', month: 0, budget: 'any', visaFree: false, ...patch });
const cases = [
  ['A', { interests: ['praia'], climate: 'calor', month: 0, budget: '5000' }],
  ['B', { interests: ['cultura', 'gastronomia'], climate: 'ameno', month: 9, budget: '12000' }],
  ['C-jun', { interests: ['natureza', 'aventura'], climate: 'frio', month: 5 }],
  ['C-jul', { interests: ['natureza', 'aventura'], climate: 'frio', month: 6 }],
  ['D', { interests: ['praia'], climate: 'calor', month: 10, budget: '18000' }],
  ['E', { interests: ['cidade', 'cultura'], climate: 'frio', month: 0, visaFree: true }],
  ['F', { interests: ['praia'], climate: 'frio', month: 0, budget: '5000' }],
  ['G-nature-winter', { interests: ['natureza'], climate: 'frio', month: 0 }],
  ['H-mild-value', { interests: ['cultura'], climate: 'ameno', month: 4, budget: '8000' }],
  ['I-cold-adventure', { interests: ['aventura'], climate: 'frio', month: 6, budget: '12000' }],
  ['J-nature-food', { interests: ['natureza', 'gastronomia'], climate: 'any', month: 8, budget: '8000' }]
];
for (const [name, preferences] of cases) {
  const results = rank(preferences);
  assert.equal(Boolean(results.length), name !== 'F', name);
  if (name !== 'F') assert(results.length >= 2, `${name}: at least two coherent countries`);
  if (name === 'A') assert(results.every(item => ['Brazil', 'Uruguay'].includes(item.countryKey)));
  if (name.startsWith('C')) assert(results.every(item => ['Argentina', 'Chile', 'New Zealand'].includes(item.countryKey)));
  if (name === 'D') assert(results.some(item => item.countryKey === 'Mauritius'));
  console.log(`${name}: ${results.length} opções; ${results.slice(0, 5).map(item => `${item.profile.id} (${item.tier})`).join(', ') || 'sem combinação coerente'}`);
}

// Exhaustive hard-constraint invariants, every month / climate / budget / ordered pair.
const interestSets = Object.keys(INTERESTS).flatMap(first => [[first], ...Object.keys(INTERESTS).filter(second => first !== second).map(second => [first, second])]);
let combinations = 0;
for (let month = 0; month < 12; month += 1) for (const climate of ['any', 'calor', 'ameno', 'frio']) for (const band of BUDGETS) for (const interests of interestSets) {
  const preferences = { interests, climate, month, budget: band.id, visaFree: true };
  const results = rank(preferences);
  assert.equal(new Set(results.map(item => item.countryKey)).size, results.length);
  results.forEach((item, index) => {
    assert(climate === 'any' || item.profile.monthlyClimate[month] === climate);
    assert(item.profile.seasonSuitability[month] > 0);
    assert(item.range.min <= band.ceiling);
    const strengths = interests.map(interest => interestStrength(item.profile, interest, month));
    assert(strengths[0] >= 2 && strengths.every(value => value >= 1));
    if (strengths.length === 2) assert(strengths[0] + strengths[1] >= 4);
    assert.equal(item.factors.visa > 0, isVisaFreeForBrazil(item.country));
    assert.equal(item.range.min % 500, 0);
    assert.equal(item.range.max % 500, 0);
    if (item.tier === 'strong') {
      assert(item.profile.seasonSuitability[month] >= 2);
      assert(strengths.every(value => value >= 2));
    }
    if (index) {
      const previous = results[index - 1];
      assert(!(previous.tier === 'good' && item.tier === 'strong'));
      if (previous.tier === item.tier) assert(previous.score >= item.score);
    }
    if (results.length > 1) assert.notEqual(results[nextDiscoveryIndex(results, index)].countryKey, item.countryKey);
  });
  assert.deepEqual(rank(preferences).map(item => item.profile.id), results.map(item => item.profile.id));
  combinations += 1;
}
assert(rank({ climate: 'calor', month: 1, budget: '18000' }).some(item => item.countryKey === 'Maldives'));
assert(!rank({ climate: 'calor', month: 1, budget: '5000' }).some(item => item.countryKey === 'Maldives'));
const monsoon = rank({ climate: 'calor', month: 10 }).find(item => item.countryKey === 'Maldives');
assert.equal(monsoon.tier, 'good', 'Monsoon is acceptable with caveats, NEVER an ideal/strong match');
assert(monsoon.reasons.some(reason => reason.includes('aceitável')));
assert(!rank({ interests: ['cultura'], climate: 'frio' }).some(item => item.countryKey === 'Morocco'));
assert(!rank({ interests: ['natureza'], climate: 'frio', month: 6 }).some(item => item.countryKey === 'Australia'), 'Sydney and Cairns are not cold winter profiles');
const visaPreferences = { interests: ['cidade', 'cultura'], climate: 'frio', month: 0 };
const withoutVisa = rank(visaPreferences);
const withVisa = rank({ ...visaPreferences, visaFree: true });
for (const item of withVisa) assert.equal(item.score - withoutVisa.find(other => other.countryKey === item.countryKey).score, isVisaFreeForBrazil(item.country) ? 16 : 0);
for (const category of ['unknown', 'evisa', 'visa-on-arrival', 'authorization', 'domestic']) assert.equal(isVisaFreeForBrazil({ visaPolicyBR: { eligibility: category } }), false);
assert.equal(rank({ interests: [] }).length, 0);
assert.equal(rank({ interests: ['praia', 'praia'] }).length, 0);
assert.equal(rank({ month: 12 }).length, 0);
assert.equal(rank({ climate: 'invalid' }).length, 0);
assert.equal(rank({ budget: 'invalid' }).length, 0);
const sample = DESTINATION_PROFILES[0];
assert(profileExclusion({ ...sample, monthlyClimate: ['frio'] }, COUNTRIES[sample.countryKey]));
assert(profileExclusion({ ...sample, airfareBRL: [1, NaN] }, COUNTRIES[sample.countryKey]));
assert(profileExclusion(sample, { ...COUNTRIES[sample.countryKey], borderStatus: 'closed' }));
assert(profileExclusion(sample, { ...COUNTRIES[sample.countryKey], landmarks: [] }));
assert(profileExclusion(sample, { ...COUNTRIES[sample.countryKey], entryRequirements: { status: 'needs-review' } }));
assert(tripRange(sample, 0).min > tripRange(sample, 9).min);

if (process.argv.includes('--airports')) {
  const airports = new AirportRepository();
  for (const profile of DESTINATION_PROFILES) {
    const airport = await airports.resolve(profile.airport);
    assert(airport, `${profile.id}: airport resolves`);
  assert.equal(airport.country, profile.airportCountry, `${profile.id}: airport country / documented cross-border gateway`);
    assert(Number.isFinite(airport.lat) && Number.isFinite(airport.lng));
  }
  console.log(`${DESTINATION_PROFILES.length} gateways resolvidos no país correto ou acesso fronteiriço documentado.`);
}
const narrow = rank({ interests: ['cultura', 'natureza'], climate: 'ameno', month: 9, budget: '12000' });
assert(narrow.some(item => item.tier === 'good' && item.profile.interests.natureza === 1));
assert(narrow.some(item => item.tier === 'strong'));
assert(noMatchAdvice(COUNTRIES, { interests: ['natureza'], climate: 'frio', month: 0, budget: '5000' }).includes('orçamento'));
assert(noMatchAdvice(COUNTRIES, { interests: ['praia'], climate: 'frio', month: 0, budget: '5000' }).includes('clima'));
// Exact overlap boundary and weaker-but-real second interest.
const controlled = { ...sample, estimatedTripRangeBRL: { min: 7000, max: 10000 }, airfareBRL: [3000, 4000], localWeekBRL: [4000, 6000], peakMonths: [], interests: { cultura: 3, natureza: 1 }, seasonSuitability: Array(12).fill(2) };
const controlledPreferences = { interests: ['cultura', 'natureza'], climate: 'any', month: 0, budget: '12000' };
assert.equal(rankDestinations(COUNTRIES, controlledPreferences, [controlled])[0].tier, 'good');
assert.equal(rankDestinations(COUNTRIES, { ...controlledPreferences, budget: '5000' }, [controlled]).length, 0);
assert.equal(rankDestinations(COUNTRIES, { ...controlledPreferences, budget: '8000' }, [controlled]).length, 1);
assert.equal(rankDestinations(COUNTRIES, controlledPreferences, [{ ...controlled, interests: { cultura: 3 } }]).length, 0);
console.log(`${combinations} combinações verificadas; ${coverage.profiles.length} perfis / ${coverage.countryKeys.length} países; ${coverage.excluded.length} países fora da cobertura editorial.`);
if (process.argv.includes('--coverage')) console.log('Excluídos:', coverage.excluded.map(key => COUNTRIES[key].namePt).join(', '));
