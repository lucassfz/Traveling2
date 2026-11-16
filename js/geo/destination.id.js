// Identidade geográfica única do app (Fase 4.1). Um destino é sempre um destes ids,
// nunca o nome exibido nem a posição num arquivo:
//
//   country:<chave do catálogo>   country:Japan
//   region:<ISO 3166-2>           region:BR-BA         (5ª coluna das divisões em data/admin)
//   region:<ISO2>~<slug do nome>  region:IE~dublin     (divisão sem código ISO único)
//   city:<ISO2>-gn<geonameid>     city:BR-gn3452640    (coluna 8 das cidades em data/admin)
//   place:<Wikidata>              place:Q39231
//
// Ids antigos de cidade ("BR-174", a posição na lista) ainda aparecem em salvos,
// viagens, backups e links compartilhados de antes da Fase 4.1. Eles são
// traduzidos por data/legacy-cities.json (scripts/build-legacy-cities.js): a
// tabela diz para onde foi cada posição que mudou; as demais não mudaram.

export const CITY_ID_RE = /^[A-Z]{2}-(?:gn\d{1,10}|\d{1,6})$/;
const LEGACY_CITY_ID_RE = /^([A-Z]{2})-(\d{1,6})$/;
const STABLE_CITY_ID_RE = /^([A-Z]{2})-gn(\d{1,10})$/;
export const REGION_CODE_RE = /^[A-Z]{2}(?:-[A-Z0-9]{1,3}|~[a-z0-9-]{1,60})$/;
export const DESTINATION_ID_RE = /^(country:[^\s:][^:]{0,59}|region:[A-Z]{2}(?:-[A-Z0-9]{1,3}|~[a-z0-9-]{1,60})|city:[A-Z]{2}-[A-Za-z0-9-]{1,60}|place:Q\d{1,12})$/;

export const slugify = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

/** Id da cidade: pelo geonameid quando existe; a posição só como último recurso. */
export function cityIdOf(country, geonameId, index) {
  return Number.isInteger(geonameId) && geonameId > 0 ? `${country}-gn${geonameId}` : `${country}-${index}`;
}

export const isLegacyCityId = id => LEGACY_CITY_ID_RE.test(id ?? '');

export function parseCityId(id) {
  let match = STABLE_CITY_ID_RE.exec(id ?? '');
  if (match) return { country: match[1], geonameId: Number(match[2]) };
  match = LEGACY_CITY_ID_RE.exec(id ?? '');
  return match ? { country: match[1], index: Number(match[2]) } : null;
}

/** Código estável da região: ISO 3166-2 quando o país tem um código único para ela. */
export function regionCodeOf(country, division) {
  if (/^[A-Z]{2}-[A-Z0-9]{1,3}$/.test(division?.code ?? '') && division.code.startsWith(`${country}-`)) return division.code;
  const slug = slugify(division?.name);
  return slug ? `${country}~${slug}` : null;
}

/**
 * Códigos das divisões de um arquivo data/admin ([nome, lat, lng, tipo, iso]).
 * Nome repetido sem código ISO (ex.: duas "Zona Neutra") ganha o ponto do
 * rótulo no slug, para cada uma ter um id próprio.
 */
export function divisionCodes(country, rows) {
  const slugs = rows.map(([name, , , , iso]) => (iso ? null : slugify(name)));
  const count = new Map();
  for (const slug of slugs) if (slug) count.set(slug, (count.get(slug) ?? 0) + 1);
  const coord = value => `${value < 0 ? 'm' : 'p'}${Math.abs(Math.round(value * 10))}`;
  return rows.map(([name, lat, lng, , iso], index) => {
    const code = regionCodeOf(country, { code: iso, name });
    return count.get(slugs[index]) > 1 ? `${code}-${coord(lat)}-${coord(lng)}` : code;
  });
}

export const destinationId = Object.freeze({
  country: key => `country:${key}`,
  region: code => `region:${code}`,
  city: id => `city:${id}`,
  place: wikidataId => `place:${wikidataId}`
});

export function parseDestinationId(id) {
  if (!DESTINATION_ID_RE.test(id ?? '')) return null;
  const at = id.indexOf(':');
  return { type: id.slice(0, at), key: id.slice(at + 1) };
}

// ---------- Ids antigos ----------

let legacyPromise = null;
/** data/legacy-cities.json, carregado uma vez (null se não carregar). */
export function loadLegacyCities(fetcher = url => fetch(url).then(response => (response.ok ? response.json() : null))) {
  legacyPromise ??= Promise.resolve()
    .then(() => fetcher(new URL('../../data/legacy-cities.json', import.meta.url)))
    .catch(() => null)
    .then(data => {
      if (!data) legacyPromise = null;
      return data;
    });
  return legacyPromise;
}

/**
 * geonameid da cidade que ocupava a posição `index` antes da Fase 4.1.
 * undefined: não dá para saber (tabela ausente); null: a cidade saiu do arquivo.
 */
export function legacyGeonameId(legacy, cities, country, index) {
  if (!legacy || !Array.isArray(cities)) return undefined;
  const moved = legacy.countries?.[country];
  if (moved && Object.prototype.hasOwnProperty.call(moved, index)) return moved[index];
  return cities.find(city => city.index === index)?.geonameId ?? null;
}

/**
 * Cidade atual para uma referência guardada ({ id, name, lat, lng, geonameId }).
 * Ordem: geonameid (no id novo ou no campo) → tabela de ids antigos (confirmada
 * pelo nome quando a referência tem nome) → nome + coordenadas (resolveCity).
 * Devolve null quando nada confere: quem chama decide manter o registro como está.
 */
export function upgradeCityRef(ref, { cities, legacy, resolveCity }) {
  if (!ref || !Array.isArray(cities)) return null;
  const parsed = parseCityId(ref.id);
  const geonameId = parsed?.geonameId ?? (Number.isInteger(ref.geonameId) && ref.geonameId > 0 ? ref.geonameId : null);
  if (geonameId) {
    const city = cities.find(item => item.geonameId === geonameId);
    if (city) return city;
  }
  if (parsed && parsed.index !== undefined) {
    const mapped = legacyGeonameId(legacy, cities, parsed.country, parsed.index);
    const city = mapped ? cities.find(item => item.geonameId === mapped) : null;
    // Confirma pelo nome original do arquivo (a referência pode trazer o nome exibido).
    if (city && (!ref.name || sameName(city, ref.name))) return city;
  }
  return resolveCity ? resolveCity(cities, { name: ref.name, lat: ref.lat, lng: ref.lng, geonameId }) : null;
}

const plain = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function sameName(city, name) {
  const target = plain(name);
  return plain(city.name) === target || (city.search ?? '').includes(target);
}
