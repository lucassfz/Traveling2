// Cidades de um país (data/admin/<ISO2>.json), sem depender do globo 3D:
// usadas pelo Planner (escolha da cidade) e pela Descoberta. O mesmo `id`
// ("BR-12") identifica a cidade no globo, no Planner e no cartão da cidade.

const cache = new Map();

const normalize = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function loadCities(alpha2) {
  const code = String(alpha2 ?? '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return Promise.resolve([]);
  if (!cache.has(code)) {
    const promise = fetch(new URL(`../../data/admin/${code}.json`, import.meta.url))
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then(data => {
        const zones = data.zones ?? [];
        const regions = data.regions ?? [];
        return data.cities.map(([name, lat, lng, population, rank, zone = -1, region = -1, urban = 0], index) => ({
          id: `${code}-${index}`, index, name, lat, lng, population, rank, kind: 'city', country: code,
          timeZone: zones[zone] ?? null, region: regions[region] ?? null, hasOutline: urban === 1,
          search: normalize(name)
        }));
      })
      .catch(error => {
        cache.delete(code);
        throw error;
      });
    cache.set(code, promise);
  }
  return cache.get(code);
}

/** Maiores cidades (capital primeiro). */
export function topCities(cities, limit = 8) {
  return [...cities].sort((a, b) => Number(b.rank === 0) - Number(a.rank === 0) || b.population - a.population).slice(0, limit);
}

/** Busca sem acentos: começo do nome primeiro, depois "contém"; empate pela população. */
export function searchCities(cities, query, limit = 8) {
  const term = normalize(query);
  if (term.length < 2) return [];
  return cities
    .map(city => ({ city, score: city.search.startsWith(term) ? 2 : city.search.includes(term) ? 1 : 0 }))
    .filter(item => item.score)
    .sort((a, b) => b.score - a.score || b.city.population - a.city.population)
    .slice(0, limit)
    .map(item => item.city);
}

export function findCity(cities, id) {
  return cities.find(city => city.id === id) ?? null;
}
