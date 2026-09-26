import { BUDGETS, CLIMATES, DESTINATION_PROFILES, DISCOVERY_MONTHS, INTERESTS } from './destination.profiles.js';
import { isVisaFreeForBrazil } from './country.exploration.js';

export function profileExclusion(profile, country) {
  if (!country || country.dataLevel !== 'curated' || country.borderStatus !== 'open') return 'catálogo não curado/aberto';
  if (!country.bestTime || country.flightUnavailable || !/^[A-Z]{3}$/.test(profile.airport)) return 'temporada ou aeroporto insuficiente';
  if (!country.landmarks?.some(item => item.status === 'verified' && item.media?.verified)) return 'sem mídia verificada';
  if (profile.monthlyClimate.length !== 12 || profile.monthlyClimate.some(value => !['calor', 'ameno', 'frio'].includes(value))) return 'clima incompleto';
  if (profile.seasonSuitability.length !== 12 || profile.seasonSuitability.some(value => ![0, 1, 2].includes(value))) return 'sazonalidade incompleta';
  if (!profile.region || !profile.note || !profile.seasonBasis || !profile.reviewedOn) return 'perfil incompleto';
  if (![profile.airfareBRL, profile.localWeekBRL].every(range => range?.length === 2 && range.every(Number.isFinite) && range[0] > 0 && range[1] >= range[0])) return 'custo incompleto';
  if (profile.estimatedTripRangeBRL?.min !== profile.airfareBRL[0] + profile.localWeekBRL[0]
    || profile.estimatedTripRangeBRL?.max !== profile.airfareBRL[1] + profile.localWeekBRL[1]) return 'custo inconsistente';
  if (!Object.keys(profile.interests || {}).length || Object.entries(profile.interests).some(([key, value]) => !INTERESTS[key] || ![2, 3].includes(value))) return 'interesses incompletos';
  if (!Array.isArray(profile.peakMonths) || profile.peakMonths.some(month => !Number.isInteger(month) || month < 1 || month > 12)) return 'picos de custo inválidos';
  return null;
}

export function discoveryCoverage(countries, profiles = DESTINATION_PROFILES) {
  const eligible = profiles.filter(profile => !profileExclusion(profile, countries[profile.countryKey]));
  const keys = new Set(eligible.map(profile => profile.countryKey));
  return { profiles: eligible, countryKeys: [...keys], excluded: Object.keys(countries).filter(key => !keys.has(key)) };
}

export function tripRange(profile, month) {
  // A broad peak buffer, not a live exchange-rate or airfare forecast. Round UP
  // to R$500 so neither a fluctuating quote nor false precision implies a promise.
  const multiplier = profile.peakMonths.includes(month + 1) ? 1.15 : 1;
  const round = value => Math.ceil(value * multiplier / 500) * 500;
  return { min: round(profile.estimatedTripRangeBRL.min), max: round(profile.estimatedTripRangeBRL.max) };
}

const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
export const formatTripRange = range => `${money(range.min)}–${money(range.max)}`;

export function rankDestinations(countries, preferences, profiles = DESTINATION_PROFILES) {
  const { interests, climate, month, budget, visaFree } = preferences;
  const band = BUDGETS.find(item => item.id === budget);
  if (!Array.isArray(interests) || interests.length < 1 || interests.length > 2 || new Set(interests).size !== interests.length
    || interests.some(item => !INTERESTS[item]) || !CLIMATES[climate] || !band || !Number.isInteger(month) || month < 0 || month > 11) return [];

  const matches = discoveryCoverage(countries, profiles).profiles.flatMap(profile => {
    const country = countries[profile.countryKey];
    const season = profile.seasonSuitability[month];
    const actualClimate = profile.monthlyClimate[month];
    const range = tripRange(profile, month);
    // Both interests need a real regional experience, not incidental tagging.
    if (!season || (climate !== 'any' && climate !== actualClimate) || range.min > band.ceiling
      || interests.some(interest => (profile.interests[interest] || 0) < 2)) return [];
    const visaPreferred = Boolean(visaFree && isVisaFreeForBrazil(country));
    const fullBudget = Number.isFinite(band.ceiling) && range.max <= band.ceiling;
    const factors = {
      interests: interests.reduce((sum, interest, index) => sum + profile.interests[interest] * (index ? 5 : 6), 0),
      season: season === 2 ? 12 : 0,
      budget: fullBudget ? 8 : Number.isFinite(band.ceiling) ? 2 : 0,
      visa: visaPreferred ? 16 : 0
    };
    const reasons = [
      `Destaques deste roteiro: ${interests.map(interest => INTERESTS[interest].replace(/^\S+\s/, '').toLowerCase()).join(' + ')}.`,
      `Clima normalmente ${{ calor: 'quente', ameno: 'ameno', frio: 'frio' }[actualClimate]} em ${DISCOVERY_MONTHS[month]}, na região de ${profile.region}.`,
      season === 2 ? 'Mês favorável para este perfil turístico.' : 'Mês de transição ou com ressalvas: confira os cuidados abaixo.',
      Number.isFinite(band.ceiling)
        ? fullBudget ? 'A faixa editorial cabe no teto escolhido; preços reais podem variar.' : 'O início da faixa não ultrapassa seu teto, mas o total pode excedê-lo; cote antes de decidir.'
        : 'Orçamento sem teto definido; confira a faixa de planejamento.'
    ];
    if (visaPreferred) reasons.push('Isenção de visto no catálogo recebeu prioridade; confira condições e documentos no guia.');
    if (country.visaPolicyBR?.eligibility === 'domestic') reasons.push('Viagem doméstica; não há visto para brasileiros.');
    return [{ profile, countryKey: profile.countryKey, country, range, factors, reasons, score: Object.values(factors).reduce((sum, value) => sum + value, 0) }];
  });
  // Stable country order breaks ties; one best regional profile per country.
  // No random choice, no repeat of the same country disguised as another region.
  matches.sort((a, b) => b.score - a.score || a.countryKey.localeCompare(b.countryKey, 'en') || a.profile.id.localeCompare(b.profile.id, 'en'));
  const seen = new Set();
  return matches.filter(match => { if (seen.has(match.countryKey)) return false; seen.add(match.countryKey); return true; });
}

export function nextDiscoveryIndex(matches, currentIndex) {
  return matches.length > 1 ? (currentIndex + 1) % matches.length : 0;
}
