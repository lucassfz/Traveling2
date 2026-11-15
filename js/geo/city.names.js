// Nome em português das capitais. Os arquivos de cidades (GeoNames) vêm em
// inglês ("Lisbon"); o catálogo de países já tem a capital em português
// ("Lisboa"). Só a capital (rank 0) muda; as demais cidades seguem o GeoNames.
import { COUNTRIES } from '../countries.dataset.js';

const CAPITAL_BY_ALPHA2 = new Map(Object.values(COUNTRIES).map(country => [country.alpha2, country.capital]));
// O ponto do GeoNames é outra cidade que não a capital do catálogo
// (Sri Lanka: o ponto é Colombo; a capital administrativa é Kotte).
const KEEP_GEONAMES = new Set(['LK']);

/** "Pretória (executiva); Cidade do Cabo…" → "Pretória". */
export function cleanCapitalName(value) {
  return String(value ?? '').split(/\s*[(;]/)[0].trim();
}

/** Nome para mostrar: capital em português quando houver, senão o original. */
export function displayCityName(alpha2, rank, name) {
  if (rank !== 0 || KEEP_GEONAMES.has(alpha2)) return name;
  return cleanCapitalName(CAPITAL_BY_ALPHA2.get(alpha2)) || name;
}
