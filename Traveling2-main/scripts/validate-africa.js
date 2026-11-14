import { COUNTRIES } from '../js/countries.dataset.js';
import { AFRICA_COMPLETE_ENRICHMENT } from '../js/africa.complete.dataset.js';
import { checklistGroups } from '../js/checklist.engine.js';
import { flagFromAlpha2 } from '../js/country.exploration.js';

// Relação independente da camada editorial: IDs e ISO dos países AF do catálogo.
const ISO = {
  Algeria: 'DZ', Angola: 'AO', Benin: 'BJ', Botswana: 'BW', 'Burkina Faso': 'BF', Burundi: 'BI',
  'Cape Verde': 'CV', Cameroon: 'CM', 'Central African Rep.': 'CF', Chad: 'TD', Comoros: 'KM',
  Congo: 'CG', 'D.R. Congo': 'CD', 'Ivory Coast': 'CI', Djibouti: 'DJ', Egypt: 'EG',
  'Eq. Guinea': 'GQ', Eritrea: 'ER', Swaziland: 'SZ', Ethiopia: 'ET', Gabon: 'GA',
  Gambia: 'GM', Ghana: 'GH', Guinea: 'GN', 'Guinea-Bissau': 'GW', Kenya: 'KE',
  Lesotho: 'LS', Liberia: 'LR', Libya: 'LY', Madagascar: 'MG', Malawi: 'MW', Mali: 'ML',
  Mauritania: 'MR', Mauritius: 'MU', Morocco: 'MA', Mozambique: 'MZ', Namibia: 'NA',
  Niger: 'NE', Nigeria: 'NG', Rwanda: 'RW', 'São Tomé & Príncipe': 'ST', Senegal: 'SN',
  Seychelles: 'SC', 'Sierra Leone': 'SL', Somalia: 'SO', 'South Africa': 'ZA',
  'S. Sudan': 'SS', Sudan: 'SD', Tanzania: 'TZ', Togo: 'TG', Tunisia: 'TN',
  Uganda: 'UG', Zambia: 'ZM', Zimbabwe: 'ZW'
};
const EXPECTED_CURRENCY = {
  Mauritania: 'MRU', 'São Tomé & Príncipe': 'STN', 'Sierra Leone': 'SLE',
  Zambia: 'ZMW', Zimbabwe: 'ZWG'
};
const EXPECTED_HEALTH = {
  'Cape Verde': ['chega do Brasil', '1 ano'],
  Gambia: ['chega do Brasil', '9 meses'],
  Malawi: ['chega do Brasil', '1 ano'],
  Uganda: ['todos os viajantes', '1 ano'],
  Sudan: ['não aponta exigência geral', 'ao sul do Saara']
};
const FALLBACK = /a melhor época depende|especialidade local para conhecer|explore pratos regionais|respeite costumes locais|confirme o padrão elétrico local|principal aeroporto|informações podem variar|regras de entrada podem mudar|panorama histórico ainda em curadoria/i;
const text = value => typeof value === 'string' && value.trim().length > 0;
const https = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const noFallback = value => !FALLBACK.test(JSON.stringify(value));

const african = Object.entries(COUNTRIES).filter(([, country]) => country.continent === 'AF');
const counts = { Overview: 0, Entry: 0, Culture: 0, Flights: 0, Checklist: 0, 'Flag/ISO': 0 };
const errors = [];
const review = [];
const seenISO = new Set();
const rows = [];

for (const [key, country] of african) {
  const entry = country.entryRequirements;
  const profile = country.travelProfile;
  const monthGroups = [0, 6, 11].map(month => checklistGroups(key, country, month));
  const groupNames = new Set(monthGroups.flatMap(groups => groups.map(group => group.group)));
  const status = {
    Overview: text(country.namePt) && text(country.capital) && text(country.currency)
      && /^[A-Z]{3}$/.test(country.currencyCode || '') && text(country.symbol)
      && text(country.lang) && text(country.timezoneLabel)
      && /^\d{3}V · tipos? [A-Z](?:\/[A-Z])*$/.test(country.voltage || '')
      && text(country.bestTime) && country.bestTime.length > 55
      && Array.isArray(country.months) && country.months.length === 12
      && country.months.every(value => [0, 1, 2].includes(value))
      && new Set(country.months).size > 1
      && noFallback([country.bestTime, country.voltage]),
    Entry: entry && ['verified', 'needs-review'].includes(entry.status) && entry.verifiedAt === '2026-09'
      && https(entry.officialSource) && https(country.healthSource)
      && ['visaPolicyBR', 'maxStay', 'passportValidity', 'documents', 'health'].every(field => text(entry[field]))
      && country.visaPolicyBR?.source === entry.officialSource
      && noFallback(entry),
    Culture: country.foods?.length >= 2 && country.foods.length <= 4
      && country.foods.every(food => text(food.name) && text(food.desc) && food.desc.length > 25)
      && country.etiquette?.length >= 4 && country.etiquette.every(item => text(item.t) && item.t.length > 35)
      && ['🤝', '💶', '🗣️', 'ℹ️'].every(icon => country.etiquette.some(item => item.e === icon))
      && noFallback([country.foods, country.etiquette]),
    Flights: /^[A-Z]{3}$/.test(country.airport || '') && text(country.airportCity)
      && country.majorAirports?.includes(country.airport)
      && country.majorAirports.every(code => /^[A-Z]{3}$/.test(code))
      && text(country.flightNote) && country.flightNote.length > 55 && noFallback(country.flightNote),
    Checklist: country.checklist?.length > 0 && profile?.moneyTips?.length > 0
      && profile?.connectivityTips?.length > 0 && profile?.transportTips?.length >= 2
      && profile?.packingTips?.length > 0 && profile?.seasonalTips?.length >= 2
      && profile.seasonalTips.every(season => season.months?.length > 0 && season.months.every(month => month >= 1 && month <= 12))
      && ['Documentos', 'Dinheiro', 'Conectividade', 'Transporte', 'Bagagem e clima'].every(group => groupNames.has(group))
      && monthGroups.every(groups => groups.flatMap(group => group.items).length >= 8)
      && noFallback([country.checklist, profile]),
    'Flag/ISO': country.alpha2 === ISO[key] && !seenISO.has(country.alpha2)
      && country.flag === flagFromAlpha2(country.alpha2)
  };
  if (country.alpha2) seenISO.add(country.alpha2);
  if (EXPECTED_CURRENCY[key] && country.currencyCode !== EXPECTED_CURRENCY[key]) errors.push(`${key}: moeda histórica/incorreta`);
  for (const phrase of EXPECTED_HEALTH[key] || []) {
    if (!entry?.health?.includes(phrase)) errors.push(`${key}: exigência sanitária não contém "${phrase}"`);
  }
  if (!AFRICA_COMPLETE_ENRICHMENT[key] || country.dataLevel !== 'curated') errors.push(`${key}: camada AF não resolvida`);
  if (entry?.status === 'needs-review') review.push(key);
  for (const [section, valid] of Object.entries(status)) {
    if (valid) counts[section] += 1;
    else errors.push(`${key}: ${section} incompleto`);
  }
  rows.push(`${country.namePt.padEnd(25)} ${Object.values(status).map(valid => valid ? '✓' : '✗').join('  ')}`);
}

for (const key of Object.keys(ISO)) if (!african.some(([catalogKey]) => catalogKey === key)) errors.push(`${key}: ISO previsto sem país AF`);
for (const key of Object.keys(AFRICA_COMPLETE_ENRICHMENT)) if (!ISO[key]) errors.push(`${key}: camada AF fora do conjunto de soberanos`);
console.log('País                       Overview Entry Culture Flights Checklist Flag/ISO');
rows.forEach(row => console.log(row));
console.log(`AF: ${african.length}; ${Object.entries(counts).map(([section, count]) => `${section} ${count}/${african.length}`).join('; ')}`);
console.log(`needs-review: ${review.length}${review.length ? ` (${review.join(', ')})` : ''}`);
console.log(`erros: ${errors.length}`);
errors.forEach(error => console.error(`ERRO ${error}`));
if (errors.length) process.exitCode = 1;
