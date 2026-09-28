import { COUNTRIES } from '../js/countries.dataset.js';
import { AMERICAS_SEASONAL_ENRICHMENT } from '../js/americas.seasonal.dataset.js';
import { checklistGroups, hasSeasonalChecklist } from '../js/checklist.engine.js';
import { CARIBBEAN_AUDIT_ENRICHMENT } from '../js/caribbean.audit.dataset.js';
import { AirportRepository } from '../js/airports.repository.js';

const countries = Object.entries(COUNTRIES).filter(([, country]) => ['NA', 'SA'].includes(country.continent));
const errors = [];
for (const [key, country] of countries) {
  const seasons = country.travelProfile?.seasonalTips;
  if (!AMERICAS_SEASONAL_ENRICHMENT[key] || !hasSeasonalChecklist(country)) {
    errors.push(`${key}: camada mensal ausente`);
    continue;
  }
  const january = checklistGroups(key, country, 0);
  const july = checklistGroups(key, country, 6);
  const seasonalLabels = month => (seasons.filter(season => season.months.includes(month)).flatMap(season => season.items.map(item => item.label)));
  for (let month = 1; month <= 12; month++) {
    const tips = seasonalLabels(month);
    if (tips.length < 2 || tips.some(label => !label || label.length < 25)) errors.push(`${key}: mês ${month} sem recomendações específicas`);
    const groups = checklistGroups(key, country, month - 1);
    if (!groups.some(group => group.group === 'Bagagem e clima')) errors.push(`${key}: grupo climático ausente no mês ${month}`);
  }
  if (JSON.stringify(seasonalLabels(1)) === JSON.stringify(seasonalLabels(7))) errors.push(`${key}: janeiro e julho idênticos`);
  const januaryKeys = new Set(january.flatMap(group => group.items.map(item => item.key)));
  const julyKeys = new Set(july.flatMap(group => group.items.map(item => item.key)));
  if (januaryKeys.size === julyKeys.size && [...januaryKeys].every(item => julyKeys.has(item))) errors.push(`${key}: checklist não muda com o mês`);
}
for (const key of Object.keys(AMERICAS_SEASONAL_ENRICHMENT)) {
  if (!countries.some(([countryKey]) => countryKey === key)) errors.push(`${key}: entrada fora do catálogo das Américas`);
}
const airports = new AirportRepository();
for (const key of Object.keys(CARIBBEAN_AUDIT_ENRICHMENT)) {
  const country = COUNTRIES[key];
  if (!country) { errors.push(`${key}: complemento fora do catálogo`); continue; }
  if (/A melhor época depende/.test(country.bestTime) || new Set(country.months).size < 2) errors.push(`${key}: época genérica`);
  if (country.foods?.length < 2 || country.etiquette?.length < 2) errors.push(`${key}: cultura genérica`);
  if (country.checklist?.length < 3) errors.push(`${key}: checklist incompleto`);
  if (/Confirme o padrão elétrico local/.test(country.voltage) || !/^https:\/\//.test(CARIBBEAN_AUDIT_ENRICHMENT[key].voltageSource)) errors.push(`${key}: voltagem sem dado/fonte`);
  const airport = await airports.resolve(country.airport);
  if (!airport || airport.country !== country.alpha2) errors.push(`${key}: aeroporto não resolve no país`);
  if (country.visaPolicyBR?.eligibility !== 'unknown' || country.entryRequirements) errors.push(`${key}: entrada sem fonte oficial foi classificada indevidamente`);
}
console.log(`Américas: ${countries.length} destinos, 12 meses por destino; erros: ${errors.length}`);
for (const error of errors) console.error(`ERRO ${error}`);
if (errors.length) process.exitCode = 1;
