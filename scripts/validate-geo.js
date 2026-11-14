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
assert.equal(validateGeoData(base(), 'YY').some(error => /arquivo de YY/.test(error)), true);

const indexed = indexGeoData(base());
assert.equal(indexed.division('XX-AA').name, 'Alfa');
assert.equal(indexed.places('XX-AA')[0].name, 'Cidade A');
assert.equal(indexed.division('XX-ZZ'), null);
assert.deepEqual(indexed.places('XX-ZZ'), []);

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

console.log(`Geografia: ${files.length} país(es), ${divisionCount} divisões, ${placeCount} lugares.`);
