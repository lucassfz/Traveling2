import { COUNTRIES } from '../js/countries.dataset.js';
import { AMERICAS_SEASONAL_ENRICHMENT } from '../js/americas.seasonal.dataset.js';
import { checklistGroups, hasSeasonalChecklist } from '../js/checklist.engine.js';

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
console.log(`Américas: ${countries.length} destinos, 12 meses por destino; erros: ${errors.length}`);
for (const error of errors) console.error(`ERRO ${error}`);
if (errors.length) process.exitCode = 1;
