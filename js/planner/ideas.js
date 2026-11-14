import { DESTINATION_PROFILES } from '../destination.profiles.js';
import { tripRange } from '../destination.discovery.js';

// Ideias do Planner (países da antiga lista "Quero ir"): para cada país usa o perfil de menor custo
// mínimo, sem margem de pico (mês não definido). Países sem perfil revisado
// ficam sem estimativa e fora do total — nada é inventado.
export function ideaEstimates(countryKeys, profiles = DESTINATION_PROFILES) {
  const items = countryKeys.map(countryKey => {
    const options = profiles.filter(profile => profile.countryKey === countryKey);
    if (!options.length) return { countryKey, region: null, range: null };
    const best = options.reduce((a, b) => (b.estimatedTripRangeBRL.min < a.estimatedTripRangeBRL.min ? b : a));
    return { countryKey, region: best.region, range: tripRange(best, -1) };
  });
  const priced = items.filter(item => item.range);
  const total = priced.length
    ? priced.reduce((sum, item) => ({ min: sum.min + item.range.min, max: sum.max + item.range.max }), { min: 0, max: 0 })
    : null;
  return { items, total, unpriced: items.length - priced.length };
}
