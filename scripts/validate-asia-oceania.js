import { COUNTRY_CATALOG, COUNTRIES } from '../js/countries.dataset.js';
import { ASIA_OCEANIA_COMPLETE_ENRICHMENT } from '../js/asia-oceania.complete.dataset.js';
import { GEOGRAPHIC_COMPLETION_ENRICHMENT } from '../js/geographic-completion.dataset.js';
import { checklistGroups } from '../js/checklist.engine.js';
import { flagFromAlpha2 } from '../js/country.exploration.js';

const targets = Object.entries(COUNTRY_CATALOG).filter(([, meta]) => ['AS', 'OC'].includes(meta.cont));
const errors = [];
const counts = { Overview: 0, Entry: 0, Culture: 0, Flights: 0, Checklist: 0, Flag: 0 };
const review = [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const isHttps = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const isIata = value => /^[A-Z]{3}$/.test(value || '');
const fallback = /a melhor época depende|explore pratos regionais|respeite costumes locais|confirme o padrão elétrico local|principal aeroporto|informações podem variar|regras de entrada podem mudar|consulte o idioma local|culinária de /i;

for (const [key, meta] of targets) {
  const country = COUNTRIES[key];
  const overlay = ASIA_OCEANIA_COMPLETE_ENRICHMENT[key] || GEOGRAPHIC_COMPLETION_ENRICHMENT[key];
  if (!country || !overlay || country.dataLevel !== 'curated') errors.push(`${key}: camada regional não resolvida`);
  if (!country) continue;
  const entry = country.entryRequirements;
  const groupsByMonth = [0, 6, 11].map(month => checklistGroups(key, country, month));
  const groups = new Set(groupsByMonth.flatMap(month => month.map(section => section.group)));
  const checks = {
    Overview: hasText(country.capital) && /^[A-Z]{3}$/.test(country.currencyCode || '') && hasText(country.currency)
      && hasText(country.lang) && hasText(country.timezoneLabel)
      && /^\d{3}V · tipos? [A-Z](?:\/[A-Z])*$/.test(country.voltage || '')
      && hasText(country.bestTime) && country.bestTime.length > 50
      && country.months?.length === 12 && country.months.every(value => [0, 1, 2].includes(value))
      && new Set(country.months).size > 1,
    Entry: entry && ['verified', 'needs-review'].includes(entry.status)
      && entry.verifiedAt === '2026-09' && isHttps(entry.officialSource) && isHttps(country.healthSource)
      && ['free', 'arrival', 'evisa', 'eta', 'visa', 'unknown'].includes(entry.modality)
      && ['visaPolicyBR', 'maxStay', 'passportValidity', 'documents', 'health'].every(field => hasText(entry[field]))
      && country.visaPolicyBR?.source === entry.officialSource,
    Culture: country.foods?.length === 3 && country.foods.every(food => hasText(food.name) && hasText(food.desc) && food.desc.length > 10)
      && country.etiquette?.length === 4 && country.etiquette.every(item => hasText(item.t) && item.t.length > 25)
      && ['🤝', '💶', '🗣️', 'ℹ️'].every(icon => country.etiquette.some(item => item.e === icon)),
    Flights: isIata(country.airport) && hasText(country.airportCity)
      && country.majorAirports?.includes(country.airport) && country.majorAirports.every(isIata)
      && hasText(country.flightNote) && country.flightNote.length > 60,
    Checklist: country.checklist?.length > 0 && country.travelProfile?.moneyTips?.length > 0
      && country.travelProfile.healthTips?.length > 0 && country.travelProfile.connectivityTips?.length > 0
      && country.travelProfile.transportTips?.length >= 2 && country.travelProfile.packingTips?.length > 0
      && country.travelProfile.seasonalTips?.length === 2
      && ['Documentos', 'Dinheiro', 'Saúde', 'Conectividade', 'Transporte', 'Bagagem e clima'].every(name => groups.has(name))
      && groupsByMonth.every(month => month.flatMap(group => group.items).length >= 9),
    Flag: country.alpha2 === meta.alpha2 && country.flag === flagFromAlpha2(meta.alpha2)
  };
  if (fallback.test(JSON.stringify([country.bestTime, country.voltage, country.foods, country.etiquette, country.flightNote, country.checklist, country.travelProfile]))) {
    errors.push(`${key}: texto-base remanescente`);
  }
  for (const [section, valid] of Object.entries(checks)) {
    if (valid) counts[section]++;
    else errors.push(`${key}: ${section} incompleto`);
  }
  if (entry?.status === 'needs-review') review.push(key);
}
for (const key of Object.keys(ASIA_OCEANIA_COMPLETE_ENRICHMENT)) {
  if (!targets.some(([expected]) => expected === key)) errors.push(`${key}: camada fora de Ásia/Oceania`);
}
const entryRegression = {
  Japan: ['free', '90 dias'], Mongolia: ['free', '90 dias'], 'South Korea': ['eta', 'K-ETA'],
  Australia: ['visa', 'Visitor 600'], 'New Zealand': ['eta', 'NZeTA'], Indonesia: ['arrival', 'B1']
};
for (const [key, [modality, phrase]] of Object.entries(entryRegression)) {
  const entry = COUNTRIES[key]?.entryRequirements;
  if (entry?.modality !== modality || !entry.visaPolicyBR?.includes(phrase)) errors.push(`${key}: regra especial de entrada regrediu`);
}
for (const key of ['Papua New Guinea', 'Samoa', 'United Arab Emirates']) {
  if (!COUNTRIES[key]?.entryRequirements?.health?.includes('CIVP')) errors.push(`${key}: aviso de febre amarela ausente`);
}
if (COUNTRIES.Vietnam?.entryRequirements?.health?.includes('CIVP')) errors.push('Vietnam: aviso de febre amarela sem respaldo no anexo da OMS');
console.log(`AS/OC: ${targets.length} (${targets.filter(([, meta]) => meta.cont === 'AS').length} AS, ${targets.filter(([, meta]) => meta.cont === 'OC').length} OC); ${Object.entries(counts).map(([section, value]) => `${section} ${value}/${targets.length}`).join('; ')}`);
console.log(`Entrada needs-review (${review.length}): ${review.join(', ') || 'nenhum'}`);
for (const error of errors) console.error(`ERRO ${error}`);
if (errors.length) process.exitCode = 1;
