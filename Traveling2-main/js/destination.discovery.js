import { BUDGETS, CLIMATES, DESTINATION_PROFILES, DISCOVERY_MONTHS, INTERESTS } from './destination.profiles.js';
import { isVisaFreeForBrazil } from './country.exploration.js';

export function profileExclusion(profile, country) {
  if (!country || country.dataLevel !== 'curated' || country.borderStatus !== 'open') return 'catálogo não curado/aberto';
  if (country.entryRequirements?.status === 'needs-review') return 'entrada requer revisão';
  if (!country.bestTime || country.flightUnavailable || !/^[A-Z]{3}$/.test(profile.airport)) return 'temporada ou aeroporto insuficiente';
  if (!country.landmarks?.some(item => item.status === 'verified' && item.media?.verified)) return 'sem mídia verificada';
  if (!Array.isArray(profile.monthlyClimate) || profile.monthlyClimate.length !== 12 || profile.monthlyClimate.some(value => !['calor', 'ameno', 'frio'].includes(value))) return 'clima incompleto';
  if (!Array.isArray(profile.seasonSuitability) || profile.seasonSuitability.length !== 12 || profile.seasonSuitability.some(value => ![0, 1, 2, 3].includes(value)) || !profile.seasonSuitability.some(Boolean)) return 'sazonalidade incompleta';
  if (!profile.region || !profile.note || !profile.seasonBasis || !profile.reviewedOn) return 'perfil incompleto';
  if (![profile.airfareBRL, profile.localWeekBRL].every(range => range?.length === 2 && range.every(Number.isFinite) && range[0] > 0 && range[1] >= range[0])) return 'custo incompleto';
  if (profile.estimatedTripRangeBRL?.min !== profile.airfareBRL[0] + profile.localWeekBRL[0]
    || profile.estimatedTripRangeBRL?.max !== profile.airfareBRL[1] + profile.localWeekBRL[1]) return 'custo inconsistente';
  if (!Object.keys(profile.interests || {}).length || Object.entries(profile.interests).some(([key, value]) => !INTERESTS[key] || ![1, 2, 3].includes(value))) return 'interesses incompletos';
  if (!Array.isArray(profile.peakMonths) || profile.peakMonths.some(month => !Number.isInteger(month) || month < 1 || month > 12)) return 'picos de custo inválidos';
  if (!/^[A-Z]{2}$/.test(profile.airportCountry)) return 'país do gateway ausente';
  if (profile.interestMonths && Object.entries(profile.interestMonths).some(([interest, months]) => !profile.interests[interest] || !Array.isArray(months) || !months.length || months.some(month => !Number.isInteger(month) || month < 1 || month > 12))) return 'janela do interesse inválida';
  return null;
}

export function discoveryCoverage(countries, profiles = DESTINATION_PROFILES) {
  const eligible = profiles.filter(profile => !profileExclusion(profile, countries[profile.countryKey]));
  const keys = new Set(eligible.map(profile => profile.countryKey));
  const excluded = Object.keys(countries).filter(key => !keys.has(key));
  const exclusions = excluded.map(key => ({ key, reason:
    countries[key].dataLevel !== 'curated' ? 'dados de país insuficientes'
      : countries[key].borderStatus !== 'open' || countries[key].entryRequirements?.status === 'needs-review' ? 'entrada/viabilidade requer revisão no catálogo'
        : profiles.some(profile => profile.countryKey === key) ? 'perfil incompleto ou sem mídia/gateway confiável'
          : 'sem recorte regional de clima/custo suficientemente revisado'
  }));
  return { profiles: eligible, countryKeys: [...keys], excluded, exclusions };
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

export function interestStrength(profile, interest, month) {
  if (profile.interestMonths?.[interest] && !profile.interestMonths[interest].includes(month + 1)) return 0;
  return profile.interests[interest] || 0;
}

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
    const strengths = interests.map(interest => interestStrength(profile, interest, month));
    // Primary must be meaningful; a REAL but weaker secondary experience is fine
    // with an excellent primary (3+1). Never invent a missing interest (0).
    if (!season || (climate !== 'any' && climate !== actualClimate) || range.min > band.ceiling
      || strengths[0] < 2 || strengths.some(strength => strength < 1)
      || (strengths.length === 2 && strengths[0] + strengths[1] < 4)) return [];
    const visaPreferred = Boolean(visaFree && isVisaFreeForBrazil(country));
    const fullBudget = Number.isFinite(band.ceiling) && range.max <= band.ceiling;
    const narrowBudget = Number.isFinite(band.ceiling) && range.min > band.ceiling * 0.9;
    const tier = season >= 2 && strengths.every(strength => strength >= 2) && !narrowBudget ? 'strong' : 'good';
    const factors = {
      interests: strengths.reduce((sum, strength, index) => sum + strength * (index ? 5 : 8), 0),
      season: [0, 0, 7, 14][season],
      budget: fullBudget ? 8 : Number.isFinite(band.ceiling) ? 2 : 0,
      visa: visaPreferred ? 16 : 0
    };
    const reasons = [
      `Neste roteiro: ${interests.map((interest, index) => `${INTERESTS[interest].replace(/^\S+\s/, '').toLowerCase()}${strengths[index] === 1 ? ' como complemento' : ' em destaque'}`).join(' + ')}.`,
      `Clima normalmente ${{ calor: 'quente', ameno: 'ameno', frio: 'frio' }[actualClimate]} em ${DISCOVERY_MONTHS[month]}, na região de ${profile.region}.`,
      ['Época desfavorável.', 'Época aceitável, com ressalvas e plano alternativo.', 'Boa época para este perfil turístico.', 'Uma das melhores épocas para este perfil turístico.'][season],
      Number.isFinite(band.ceiling)
        ? fullBudget ? 'A faixa editorial cabe no teto escolhido; preços reais podem variar.' : 'O início da faixa não ultrapassa seu teto, mas o total pode excedê-lo; cote antes de decidir.'
        : 'Orçamento sem teto definido; confira a faixa de planejamento.'
    ];
    if (visaPreferred) reasons.push('Isenção de visto no catálogo recebeu prioridade; confira condições e documentos no guia.');
    if (country.visaPolicyBR?.eligibility === 'domestic') reasons.push('Viagem doméstica; não há visto para brasileiros.');
    const caveats = [];
    if (season === 1) caveats.push('a época pede mais flexibilidade');
    if (strengths.some(strength => strength === 1)) caveats.push('o segundo interesse aparece como complemento');
    if (narrowBudget) caveats.push('o orçamento fica próximo do mínimo estimado');
    return [{ profile, countryKey: profile.countryKey, country, range, factors, reasons, tier,
      matchSummary: tier === 'strong' ? 'Uma combinação forte para sua viagem.' : `Uma boa opção, com ressalvas: ${caveats.join('; ')}.`,
      score: Object.values(factors).reduce((sum, value) => sum + value, 0) }];
  });
  // Stable country order breaks ties; one best regional profile per country.
  // No random choice, no repeat of the same country disguised as another region.
  matches.sort((a, b) => Number(b.tier === 'strong') - Number(a.tier === 'strong') || b.score - a.score || a.countryKey.localeCompare(b.countryKey, 'en') || a.profile.id.localeCompare(b.profile.id, 'en'));
  const seen = new Set();
  return matches.filter(match => { if (seen.has(match.countryKey)) return false; seen.add(match.countryKey); return true; });
}

export function noMatchAdvice(countries, preferences, profiles = DESTINATION_PROFILES) {
  // Diagnose by relaxing ONE preference at a time, only when that actually
  // produces coherent results. Never silently use the relaxed list as matches.
  if (preferences.budget !== 'any' && rankDestinations(countries, { ...preferences, budget: 'any' }, profiles).length) {
    return 'O orçamento escolhido está abaixo dos roteiros que combinam com esse clima, mês e interesses. Tente aumentar o teto de gastos.';
  }
  if (preferences.climate !== 'any' && rankDestinations(countries, { ...preferences, climate: 'any' }, profiles).length) {
    return 'O clima escolhido não combina com os roteiros disponíveis nesse mês e orçamento. Tente “Tanto faz” no clima.';
  }
  const months = DISCOVERY_MONTHS.filter((_, month) => month !== preferences.month && rankDestinations(countries, { ...preferences, month }, profiles).length);
  if (months.length) return `Essa época limita a combinação. Com os mesmos filtros, vale tentar ${months.slice(0, 2).join(' ou ')}.`;
  if (preferences.interests.length === 2 && rankDestinations(countries, { ...preferences, interests: preferences.interests.slice(0, 1) }, profiles).length) {
    return 'O segundo interesse limita os roteiros com esse clima e orçamento. Tente buscar apenas pelo seu interesse principal.';
  }
  return 'Não há um roteiro revisado que reúna esses interesses, clima e orçamento. Tente “Tanto faz” no clima ou reveja o interesse principal; não ampliamos os resultados sem dados confiáveis.';
}

export function nextDiscoveryIndex(matches, currentIndex) {
  return matches.length > 1 ? (currentIndex + 1) % matches.length : 0;
}
