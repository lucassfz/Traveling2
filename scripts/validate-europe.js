import { COUNTRIES } from '../js/countries.dataset.js';
import { EUROPE_COMPLETE_ENRICHMENT } from '../js/europe.complete.dataset.js';
import { GEOGRAPHIC_COMPLETION_ENRICHMENT } from '../js/geographic-completion.dataset.js';
import { checklistGroups } from '../js/checklist.engine.js';

const european = Object.entries(COUNTRIES).filter(([, country]) => country.continent === 'EU');
const errors = [];
const review = [];
const counts = { Overview: 0, Entry: 0, Culture: 0, Flights: 0, Checklist: 0 };
const isText = value => typeof value === 'string' && value.trim().length > 0;
const isHttps = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const forbidden = /a melhor época depende|especialidade local para conhecer|explore pratos regionais|respeite costumes locais|confirme o padrão elétrico local|principal aeroporto|informações podem variar|panorama histórico ainda em curadoria/i;
const hasFallback = value => forbidden.test(JSON.stringify(value));
const seenIso = new Set();

for (const [key, country] of european) {
  const entry = country.entryRequirements;
  const profile = country.travelProfile;
  const overview = isText(country.namePt) && isText(country.capital) && /^[A-Z]{3}$/.test(country.currencyCode || '')
    && isText(country.currency) && isText(country.symbol) && isText(country.lang) && isText(country.timezoneLabel)
    && /^\d{3}V · tipo/.test(country.voltage || '') && /^[A-Z]{2}$/.test(country.alpha2 || '')
    && isText(country.bestTime) && Array.isArray(country.months) && country.months.length === 12
    && country.months.every(score => [0, 1, 2].includes(score)) && new Set(country.months).size > 1
    && !hasFallback([country.bestTime, country.voltage]);
  const entryComplete = entry && ['verified', 'needs-review'].includes(entry.status) && entry.verifiedAt === '2026-09'
    && isHttps(entry.officialSource) && ['visaPolicyBR', 'maxStay', 'passportValidity', 'documents', 'health'].every(field => isText(entry[field]))
    && isText(entry.ees?.status) && isText(entry.etias?.status)
    && country.visaPolicyBR?.source === entry.officialSource && !hasFallback(entry);
  const culture = (country.foods?.length >= 2 && country.foods.length <= 4)
    && country.foods.every(food => isText(food.name) && isText(food.desc) && food.desc.length > 20)
    && country.etiquette?.length >= 3 && country.etiquette.every(item => isText(item.t))
    && country.etiquette.some(item => item.e === '💶') && country.etiquette.some(item => item.e === '🗣️')
    && !hasFallback([country.foods, country.etiquette]);
  const flights = isText(country.flightNote) && (
    country.flightUnavailable === true && !country.airport && country.majorAirports?.length === 0
    || /^[A-Z]{3}$/.test(country.airport || '') && country.majorAirports?.includes(country.airport)
      && country.majorAirports.every(code => /^[A-Z]{3}$/.test(code))
  ) && !hasFallback(country.flightNote);
  const checklist = country.checklist?.length > 0 && profile?.moneyTips?.length > 0 && profile?.transportTips?.length > 0
    && profile?.packingTips?.length > 0 && profile?.seasonalTips?.length >= 2
    && ['moneyTips', 'transportTips', 'packingTips'].every(field => profile[field].every(item => isText(item.label)))
    && [0, 6, 11].every(month => checklistGroups(key, country, month).flatMap(group => group.items).length >= 6)
    && !hasFallback([country.checklist, profile]);
  const status = { Overview: overview, Entry: entryComplete, Culture: culture, Flights: flights, Checklist: checklist };
  for (const [section, complete] of Object.entries(status)) {
    if (complete) counts[section] += 1;
    else errors.push(`${key}: ${section} incompleto`);
  }
  if (!(EUROPE_COMPLETE_ENRICHMENT[key] || GEOGRAPHIC_COMPLETION_ENRICHMENT[key]) || country.dataLevel !== 'curated') errors.push(`${key}: enriquecimento europeu não resolvido`);
  if (seenIso.has(country.alpha2)) errors.push(`${key}: ISO ${country.alpha2} duplicado`);
  seenIso.add(country.alpha2);
  if (entry?.status === 'needs-review') review.push(`${key}: entrada/viabilidade requer revisão operacional`);
  console.log(`${country.namePt.padEnd(22)} ${Object.values(status).map(ok => ok ? '✓' : '✗').join('  ')}`);
}

for (const key of Object.keys(EUROPE_COMPLETE_ENRICHMENT)) {
  if (!european.some(([catalogKey]) => catalogKey === key)) errors.push(`${key}: registro europeu sem país EU no catálogo`);
}
console.log('Colunas: Overview  Entry  Culture  Flights  Checklist');
console.log(`Países: ${european.length}; ${Object.entries(counts).map(([section, count]) => `${section} ${count}/${european.length}`).join('; ')}; needs-review: ${review.length}; erros: ${errors.length}`);
for (const item of review) console.log(`REVISÃO ${item}`);
for (const item of errors) console.error(`ERRO ${item}`);
if (errors.length) process.exitCode = 1;
