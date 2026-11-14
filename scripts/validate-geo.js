// Auditoria offline das divisões geográficas (js/geo/geo.repository.js e data/geo/*.json).
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { COUNTRIES } from '../js/countries.dataset.js';
import { indexGeoData, loadGeo, validateGeoData } from '../js/geo/geo.repository.js';

// Casos sintéticos: o validador precisa recusar dados quebrados.
const base = () => ({
  schema: 1,
  country: 'XX',
  sources: [{ id: 'src', name: 'Fonte', url: 'https://example.org', license: 'CC0', retrievedAt: '2026-11-14', covers: ['divisions', 'places'] }],
  divisions: [{ id: 'XX-AA', code: 'AA', name: 'Alfa', type: 'state', capital: { name: 'Cidade A' } }],
  places: [{ id: 'XX-AA-cidade-a', name: 'Cidade A', division: 'XX-AA', kind: 'city', lat: -10, lng: -40 }]
});
assert.deepEqual(validateGeoData(base()), []);
const broken = (change, pattern) => {
  const data = base();
  change(data);
  const errors = validateGeoData(data);
  assert.ok(errors.some(error => pattern.test(error)), `esperava ${pattern}, veio ${JSON.stringify(errors)}`);
};
broken(data => { data.schema = 2; }, /schema/);
broken(data => { data.sources = []; }, /sem fontes/);
broken(data => { data.sources[0].url = 'http://example.org'; }, /https/);
broken(data => { data.sources[0].retrievedAt = '14/11/2026'; }, /retrievedAt/);
broken(data => { data.sources[0].covers = ['divisions']; }, /cobre places/);
broken(data => { data.divisions[0].id = 'XX-BB'; }, /id deve ser/);
broken(data => { data.divisions.push({ ...data.divisions[0] }); }, /repetido/);
broken(data => { data.divisions[0].type = 'county'; }, /type inválido/);
broken(data => { delete data.divisions[0].capital; }, /sem capital/);
broken(data => { data.places[0].division = 'XX-ZZ'; }, /não existe/);
broken(data => { data.places[0].lat = 95; }, /lat inválida/);
broken(data => { data.places[0].lng = Number.NaN; }, /lng inválida/);
broken(data => { data.places[0].kind = 'beach'; }, /kind inválido/);
broken(data => { data.places[0].population = -1; }, /population/);
broken(data => { data.places[0].ids = { ibge: -3 }; }, /ids inválidos/);
assert.equal(validateGeoData(base(), 'YY').some(error => /arquivo de YY/.test(error)), true);

const indexed = indexGeoData(base());
assert.equal(indexed.division('XX-AA').name, 'Alfa');
assert.equal(indexed.places('XX-AA')[0].name, 'Cidade A');
assert.equal(indexed.division('XX-ZZ'), null);
assert.deepEqual(indexed.places('XX-ZZ'), []);
assert.equal(indexed.capitalPlace('XX-AA').id, 'XX-AA-cidade-a');
assert.equal(indexed.capitalPlace('XX-ZZ'), null);

// Arquivos versionados.
const catalogCodes = new Set(Object.values(COUNTRIES).map(country => country.alpha2).filter(Boolean));
assert.ok(catalogCodes.has('BR'), 'catálogo sem alpha2');
const files = (await readdir(new URL('../data/geo/', import.meta.url))).filter(name => name.endsWith('.json'));
assert.ok(files.length > 0, 'nenhum arquivo em data/geo');
let divisionCount = 0;
let placeCount = 0;
for (const file of files) {
  const code = file.replace(/\.json$/, '');
  assert.ok(catalogCodes.has(code),`data/geo/${file}: país ${code} não existe no catálogo`);
  const geo = await loadGeo(code);
  divisionCount += geo.divisions.length;
  placeCount += geo.divisions.reduce((sum, division) => sum + geo.places(division.id).length, 0);
}
assert.equal(await loadGeo('ZZ'), null, 'país sem arquivo devolve null');
assert.equal(await loadGeo('bad'), null);

// Brasil: 26 estados + Distrito Federal, códigos do IBGE.
const br = await loadGeo('BR');
assert.equal(br.divisions.length, 27);
assert.equal(br.divisions.filter(division => division.type === 'state').length, 26);
assert.equal(br.division('BR-DF').type, 'district');
assert.deepEqual([...new Set(br.divisions.map(division => division.region))].sort(), ['Centro-Oeste', 'Nordeste', 'Norte', 'Sudeste', 'Sul']);
const ibgeCodes = new Set();
for (const division of br.divisions) {
  assert.ok(Number.isInteger(division.ibge) && division.ibge >= 11 && division.ibge <= 53, `${division.id}: código IBGE`);
  assert.ok(!ibgeCodes.has(division.ibge), `${division.id}: código IBGE repetido`);
  ibgeCodes.add(division.ibge);
  assert.ok(String(division.capital.ibge).startsWith(String(division.ibge)), `${division.id}: capital fora do estado`);
}
assert.deepEqual(br.division('BR-BA'), { id: 'BR-BA', code: 'BA', ibge: 29, name: 'Bahia', type: 'state', region: 'Nordeste', capital: { name: 'Salvador', ibge: 2927408 } });
assert.equal(br.division('BR-DF').capital.name, 'Brasília');
assert.equal(br.division('BR-SP').capital.name, 'São Paulo');

// Cidades: código IBGE dentro do estado, GeoNames único, ponto dentro do Brasil,
// e toda capital presente como lugar com o mesmo nome e código.
const placeIbge = new Set();
const placeGeonames = new Set();
for (const division of br.divisions) {
  for (const place of br.places(division.id)) {
    assert.ok(Number.isInteger(place.ids?.ibge) && String(place.ids.ibge).startsWith(String(division.ibge)), `${place.id}: código IBGE fora de ${division.code}`);
    assert.ok(Number.isInteger(place.ids?.geonames) && place.ids.geonames > 0, `${place.id}: sem GeoNames`);
    assert.ok(!placeIbge.has(place.ids.ibge) && !placeGeonames.has(place.ids.geonames), `${place.id}: código repetido`);
    placeIbge.add(place.ids.ibge);
    placeGeonames.add(place.ids.geonames);
    assert.ok(place.lat > -34 && place.lat < 6 && place.lng > -74 && place.lng < -34, `${place.id}: fora do Brasil`);
  }
  const capital = br.capitalPlace(division.id);
  assert.ok(capital, `${division.id}: capital ${division.capital.name} sem lugar`);
  assert.equal(capital.name, division.capital.name, `${division.id}: nome da capital`);
}
const portoSeguro = br.place('BR-BA-porto-seguro');
assert.equal(portoSeguro?.ids.ibge, 2925303);
assert.ok(Math.abs(portoSeguro.lat - -16.45) < 0.05 && Math.abs(portoSeguro.lng - -39.06) < 0.05, 'Porto Seguro: coordenadas');
const saoPaulo = br.place('BR-SP-sao-paulo');
assert.ok(Math.abs(saoPaulo.lat - -23.55) < 0.05 && Math.abs(saoPaulo.lng - -46.63) < 0.05, 'São Paulo: coordenadas do centro');
assert.ok(br.places('BR-BA').length >= 40, 'Bahia: cidades acima de 50 mil habitantes');

console.log(`Geografia: ${files.length} país(es), ${divisionCount} divisões, ${placeCount} lugares.`);
