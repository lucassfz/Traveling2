import { COUNTRIES } from '../js/countries.dataset.js';
import { EUROPE_DATA } from '../js/europe.dataset.js';
import { CARD_OFFERS, LOUNGE_TYPES, AIRLINE_UPGRADE_EXAMPLES, AIRPORT_GUIDES } from '../js/miles.data.js';

const errors = [];
const official = value => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};
const date = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '');
const check = (label, record) => {
  if (!record || record.status !== 'verified' || !official(record.officialSource) || !date(record.verifiedAt)) {
    errors.push(`${label}: fonte, data ou status inválido`);
  }
};

for (const card of CARD_OFFERS) {
  check(`Cartão ${card.id}`, card);
  for (const field of ['name', 'issuer', 'network', 'earning', 'loungeAccess', 'idealFor']) {
    if (!card[field]) errors.push(`Cartão ${card.id}: ${field} ausente`);
  }
}
for (const lounge of LOUNGE_TYPES) check(`Rede ${lounge.id}`, lounge);
for (const upgrade of AIRLINE_UPGRADE_EXAMPLES) check(`Upgrade ${upgrade.airline}/${upgrade.method}`, upgrade);
for (const airport of AIRPORT_GUIDES) {
  check(`Aeroporto ${airport.iata}`, airport);
  if (!airport.terminals?.length || !airport.lounges?.length) errors.push(`Aeroporto ${airport.iata}: terminais ou salas ausentes`);
  for (const lounge of airport.lounges ?? []) check(`Sala ${airport.iata}/${lounge.name}`, lounge);
}
for (const [key, data] of Object.entries(EUROPE_DATA)) {
  const country = COUNTRIES[key];
  if (!country || country.alpha2 === undefined || !country.capital || !country.currencyCode || !country.lang || !country.bestTime || !country.history) {
    errors.push(`Europa ${key}: dados básicos incompletos`);
  }
  check(`Entrada ${key}`, data.entryRequirements);
  if (!data.entryRequirements.ees?.status || !data.entryRequirements.etias?.status) errors.push(`Europa ${key}: EES/ETIAS ausente`);
}

const landmarks = Object.values(COUNTRIES).flatMap(country => country.landmarks ?? []);
const needsReview = landmarks.filter(landmark => landmark.status === 'needs-review').length;
const uncertainCards = CARD_OFFERS.filter(card => card.uncertainFields?.length).length;
console.log(`Cartões: ${CARD_OFFERS.length}; redes VIP: ${LOUNGE_TYPES.length}; aeroportos: ${AIRPORT_GUIDES.length}; salas: ${AIRPORT_GUIDES.reduce((n, airport) => n + airport.lounges.length, 0)}; upgrades: ${AIRLINE_UPGRADE_EXAMPLES.length}; países europeus: ${Object.keys(EUROPE_DATA).length}; marcos: ${landmarks.length}; marcos needs-review: ${needsReview}; cartões com campos a confirmar: ${uncertainCards}; erros: ${errors.length}`);
for (const error of errors) console.error(`ERRO ${error}`);
if (errors.length) process.exitCode = 1;
