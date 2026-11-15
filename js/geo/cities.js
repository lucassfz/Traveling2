// Cidades de um país (data/admin/<ISO2>.json), sem depender do globo 3D:
// usadas pelo Planner (escolha da cidade) e pela Descoberta. O mesmo `id`
// ("BR-12") identifica a cidade no globo, no Planner e no cartão da cidade.

import { displayCityName } from './city.names.js';

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
        // id = posição no arquivo, que muda quando o arquivo é regenerado (a
        // ordem segue a população). geonameId (coluna 8, quando existe) é a
        // identidade estável; ver resolveCity.
        return data.cities.map(([name, lat, lng, population, rank, zone = -1, region = -1, urban = 0, geonameId = null], index) => ({
          id: `${code}-${index}`, index, name: displayCityName(code, rank, name), lat, lng, population, rank, kind: 'city', country: code,
          geonameId: Number.isInteger(geonameId) && geonameId > 0 ? geonameId : null,
          timeZone: zones[zone] ?? null, region: regions[region] ?? null, hasOutline: urban === 1,
          search: normalize(`${displayCityName(code, rank, name)} ${name}`)
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

// Distância em km entre dois pontos (haversine).
export function distanceKm(a, b) {
  const rad = value => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Raio de tolerância para reconhecer a mesma cidade pelas coordenadas: as fontes
// usadas (data/admin e data/geo) diferem em até 0,1 km; homônimos no mesmo
// estado ficam, quase sempre, a dezenas de km um do outro.
export const SAME_CITY_KM = 3;

const sameName = (a, b) => normalize(a) === normalize(b);

/**
 * Reencontra uma cidade guardada (destino salvo, viagem) na lista atual, sem
 * confiar só na posição do arquivo:
 *   1. geonameId, quando a lista e a referência o têm;
 *   2. o id antigo, se ainda for a mesma cidade (mesmo nome, até 3 km);
 *   3. a cidade de mesmo nome mais próxima das coordenadas guardadas, até 3 km.
 * Sem coordenadas guardadas, só aceita o id antigo com o mesmo nome e mais nada
 * (evita abrir um homônimo). Devolve null quando não há correspondência segura.
 */
export function resolveCity(cities, ref) {
  if (!Array.isArray(cities) || !ref?.name) return null;
  if (Number.isInteger(ref.geonameId)) {
    const byGeonames = cities.find(city => city.geonameId === ref.geonameId);
    if (byGeonames) return byGeonames;
  }
  const hasPoint = Number.isFinite(ref.lat) && Number.isFinite(ref.lng);
  const close = city => hasPoint && distanceKm(city, ref) <= SAME_CITY_KM;
  const byId = ref.id ? cities.find(city => city.id === ref.id) : null;
  if (byId && sameName(byId.name, ref.name) && (!hasPoint || close(byId))) return byId;
  if (!hasPoint) return null;
  return cities
    .filter(city => sameName(city.name, ref.name) && close(city))
    .sort((a, b) => distanceKm(a, ref) - distanceKm(b, ref))[0] ?? null;
}
