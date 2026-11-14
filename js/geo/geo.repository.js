// Divisões geográficas abaixo do país (estados, províncias) e lugares (cidades).
// Um arquivo por país em data/geo/<ISO2>.json, carregado só quando a pessoa
// entra no país. Formato (schema 1):
//
// {
//   "schema": 1,
//   "country": "BR",
//   "sources": [{ "id", "name", "url", "license", "retrievedAt": "AAAA-MM-DD", "covers": ["divisions" | "places"] }],
//   "divisions": [{ "id": "BR-BA", "code": "BA", "name": "Bahia", "type": "state" | "district" | "province" | "region",
//                   "region": "Nordeste", "ibge"?: 29, "capital": { "name": "Salvador", "ibge"?: 2927408 } }],
//   "places": [{ "id": "BR-BA-porto-seguro", "name": "Porto Seguro", "division": "BR-BA", "kind": "city",
//                "lat": -16.4, "lng": -39.1, "population"?: 0, "ids"?: { "ibge"?, "geonames"?, "wikidata"? } }]
// }
//
// Só fatos verificáveis: nomes, códigos oficiais, capital, região e
// coordenadas. Texto editorial (o que fazer, quando ir) fica fora deste arquivo.

export const GEO_SCHEMA_VERSION = 1;
export const DIVISION_TYPES = Object.freeze(['state', 'district', 'province', 'region']);
export const PLACE_KINDS = Object.freeze(['city', 'town']);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const cache = new Map();

const isText = value => typeof value === 'string' && value.trim() === value && value.length > 0;

// Lista de problemas (vazia = válido). Usada pelo carregador e pelo validador.
export function validateGeoData(data, expectedCountry = data?.country) {
  const errors = [];
  const fail = message => errors.push(message);
  if (!data || typeof data !== 'object') return ['arquivo vazio ou inválido'];
  if (data.schema !== GEO_SCHEMA_VERSION) fail(`schema ${data.schema} (esperado ${GEO_SCHEMA_VERSION})`);
  if (!/^[A-Z]{2}$/.test(data.country ?? '')) fail(`country inválido: ${data.country}`);
  if (expectedCountry && data.country !== expectedCountry) fail(`country ${data.country} no arquivo de ${expectedCountry}`);

  const sources = Array.isArray(data.sources) ? data.sources : [];
  if (!sources.length) fail('sem fontes');
  const covered = new Set();
  for (const source of sources) {
    if (!isText(source?.id) || !isText(source?.name)) fail('fonte sem id ou nome');
    if (!/^https:\/\//.test(source?.url ?? '')) fail(`fonte ${source?.id}: url precisa ser https`);
    if (!isText(source?.license)) fail(`fonte ${source?.id}: sem licença`);
    if (!DATE_RE.test(source?.retrievedAt ?? '')) fail(`fonte ${source?.id}: retrievedAt AAAA-MM-DD`);
    for (const part of source?.covers ?? []) covered.add(part);
  }

  const divisions = Array.isArray(data.divisions) ? data.divisions : null;
  if (!divisions) fail('divisions precisa ser lista');
  const divisionIds = new Set();
  for (const division of divisions ?? []) {
    const label = division?.id ?? '?';
    if (!isText(division?.code) || division.id !== `${data.country}-${division.code}`) fail(`${label}: id deve ser ${data.country}-<code>`);
    if (divisionIds.has(division?.id)) fail(`${label}: id repetido`);
    divisionIds.add(division?.id);
    if (!isText(division?.name)) fail(`${label}: sem nome`);
    if (!DIVISION_TYPES.includes(division?.type)) fail(`${label}: type inválido (${division?.type})`);
    if (division?.region !== undefined && !isText(division.region)) fail(`${label}: region inválida`);
    if (!isText(division?.capital?.name)) fail(`${label}: sem capital`);
  }
  if (divisions?.length && !covered.has('divisions')) fail('nenhuma fonte cobre divisions');

  const places = Array.isArray(data.places) ? data.places : null;
  if (!places) fail('places precisa ser lista');
  const placeIds = new Set();
  for (const place of places ?? []) {
    const label = place?.id ?? '?';
    if (!isText(place?.id) || !place.id.startsWith(`${place?.division}-`)) fail(`${label}: id deve começar pela divisão`);
    if (placeIds.has(place?.id)) fail(`${label}: id repetido`);
    placeIds.add(place?.id);
    if (!isText(place?.name)) fail(`${label}: sem nome`);
    if (!divisionIds.has(place?.division)) fail(`${label}: divisão ${place?.division} não existe`);
    if (!PLACE_KINDS.includes(place?.kind)) fail(`${label}: kind inválido (${place?.kind})`);
    if (!(Number.isFinite(place?.lat) && Math.abs(place.lat) <= 90)) fail(`${label}: lat inválida`);
    if (!(Number.isFinite(place?.lng) && Math.abs(place.lng) <= 180)) fail(`${label}: lng inválida`);
    if (place?.population !== undefined && !(Number.isInteger(place.population) && place.population >= 0)) fail(`${label}: population inválida`);
  }
  if (places?.length && !covered.has('places')) fail('nenhuma fonte cobre places');
  return errors;
}

// Índices prontos para a interface.
export function indexGeoData(data) {
  const divisions = new Map(data.divisions.map(division => [division.id, division]));
  const placesByDivision = new Map(data.divisions.map(division => [division.id, []]));
  for (const place of data.places) placesByDivision.get(place.division).push(place);
  for (const list of placesByDivision.values()) list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return {
    country: data.country,
    sources: data.sources,
    divisions: [...data.divisions].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    division: id => divisions.get(id) ?? null,
    places: id => placesByDivision.get(id) ?? [],
    place: id => data.places.find(place => place.id === id) ?? null
  };
}

export function geoDataUrl(countryCode) {
  return new URL(`../../data/geo/${countryCode}.json`, import.meta.url);
}

// Países sem arquivo devolvem null (a interface segue só com o país).
export function loadGeo(countryCode) {
  const code = String(countryCode ?? '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return Promise.resolve(null);
  if (!cache.has(code)) {
    const promise = readGeoFile(geoDataUrl(code)).then(data => {
      if (!data) return null;
      const errors = validateGeoData(data, code);
      if (errors.length) throw new Error(`data/geo/${code}.json: ${errors[0]}`);
      return indexGeoData(data);
    }).catch(error => {
      cache.delete(code);
      throw error;
    });
    cache.set(code, promise);
  }
  return cache.get(code);
}

// Navegador: requisição à mesma origem. Node (validadores): leitura direta.
async function readGeoFile(url) {
  if (url.protocol === 'file:') {
    const { readFile } = await import('node:fs/promises');
    try {
      return JSON.parse(await readFile(url, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Falha ao carregar divisões de ${url.pathname} (${response.status}).`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}
