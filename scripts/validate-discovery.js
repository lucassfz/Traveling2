import assert from 'node:assert/strict';
import { COUNTRIES } from '../js/countries.dataset.js';
import { BUDGETS, DESTINATION_PROFILES, INTERESTS } from '../js/destination.profiles.js';
import { discoveryCoverage, nextDiscoveryIndex, profileExclusion, rankDestinations, tripRange } from '../js/destination.discovery.js';
import { isVisaFreeForBrazil } from '../js/country.exploration.js';
import { AirportRepository } from '../js/airports.repository.js';

const coverage = discoveryCoverage(COUNTRIES);
assert.equal(coverage.profiles.length, 27);
assert.equal(coverage.countryKeys.length, 26);
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
  ['F', { interests: ['praia'], climate: 'frio', month: 0, budget: '5000' }]
];
for (const [name, preferences] of cases) {
  const results = rank(preferences);
  assert.equal(Boolean(results.length), name !== 'F', name);
  if (name === 'A') assert.deepEqual(results.map(item => item.countryKey), ['Brazil']);
  if (name.startsWith('C')) assert(results.every(item => ['Argentina', 'Chile', 'New Zealand'].includes(item.countryKey)));
  if (name === 'D') assert(results.some(item => item.countryKey === 'Mauritius'));
  console.log(`${name}: ${results.map(item => item.profile.id).join(', ') || 'sem combinação forte'}`);
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
    assert(interests.every(interest => item.profile.interests[interest] >= 2));
    assert.equal(item.factors.visa > 0, isVisaFreeForBrazil(item.country));
    assert.equal(item.range.min % 500, 0);
    assert.equal(item.range.max % 500, 0);
    if (index) assert(results[index - 1].score >= item.score);
    if (results.length > 1) assert.notEqual(results[nextDiscoveryIndex(results, index)].countryKey, item.countryKey);
  });
  assert.deepEqual(rank(preferences).map(item => item.profile.id), results.map(item => item.profile.id));
  combinations += 1;
}
assert(rank({ climate: 'calor', month: 1, budget: '18000' }).some(item => item.countryKey === 'Maldives'));
assert(!rank({ climate: 'calor', month: 1, budget: '5000' }).some(item => item.countryKey === 'Maldives'));
assert(!rank({ climate: 'calor', month: 10 }).some(item => item.countryKey === 'Maldives'), 'Monsoon is not marketed as dry beach season');
assert(!rank({ interests: ['cultura'], climate: 'frio' }).some(item => item.countryKey === 'Morocco'));
assert(!rank({ interests: ['natureza'], climate: 'frio', month: 6 }).some(item => item.countryKey === 'Australia'));
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
assert(tripRange(sample, 0).min > tripRange(sample, 9).min);

if (process.argv.includes('--airports')) {
  const airports = new AirportRepository();
  for (const profile of DESTINATION_PROFILES) {
    const airport = await airports.resolve(profile.airport);
    assert(airport, `${profile.id}: airport resolves`);
    assert.equal(airport.country, COUNTRIES[profile.countryKey].alpha2, `${profile.id}: airport country`);
    assert(Number.isFinite(airport.lat) && Number.isFinite(airport.lng));
  }
  console.log('27 gateways resolvidos no país correto.');
}
console.log(`${combinations} combinações verificadas; 27 perfis / 26 países; ${coverage.excluded.length} países fora da cobertura editorial.`);
if (process.argv.includes('--coverage')) console.log('Excluídos:', coverage.excluded.map(key => COUNTRIES[key].namePt).join(', '));
