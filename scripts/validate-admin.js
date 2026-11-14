// Auditoria offline de data/admin (estados e cidades que aparecem ao aproximar
// o globo). Confere o índice, o formato de cada país e os limites de tamanho.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const dir = new URL('../data/admin/', import.meta.url);
const index = JSON.parse(await readFile(new URL('index.json', dir), 'utf8'));
const files = (await readdir(dir)).filter(file => file.endsWith('.json') && file !== 'index.json');

assert.equal(index.schema, 1);
assert.ok(index.sources.every(source => /^https:\/\//.test(source.url) && source.license), 'fontes com URL https e licença');
assert.deepEqual(Object.keys(index.countries).sort(), files.map(file => file.replace('.json', '')).sort(), 'índice e arquivos batem');

const lat = value => Number.isFinite(value) && Math.abs(value) <= 90;
const lng = value => Number.isFinite(value) && Math.abs(value) <= 180;
let divisions = 0;
let cities = 0;
let largest = 0;
for (const file of files) {
  const code = file.replace('.json', '');
  const text = await readFile(new URL(file, dir), 'utf8');
  largest = Math.max(largest, text.length);
  const data = JSON.parse(text);
  assert.equal(data.country, code, `${file}: country`);
  const [west, south, east, north] = index.countries[code];
  assert.ok(lng(west) && lng(east) && lat(south) && lat(north) && south <= north, `${file}: caixa inválida`);
  for (const [name, y, x] of data.divisions) {
    assert.ok(/^[\p{Lu}\d]/u.test(name), `${file}: nome de divisão "${name}"`);
    assert.ok(lat(y) && lng(x), `${file}: rótulo fora do globo (${name})`);
  }
  for (const line of data.lines) {
    assert.ok(line.length >= 4 && line.length % 2 === 0, `${file}: linha incompleta`);
    for (let i = 0; i < line.length; i += 2) assert.ok(lng(line[i]) && lat(line[i + 1]), `${file}: ponto inválido`);
  }
  for (const [name, y, x, population, rank] of data.cities) {
    assert.ok(typeof name === 'string' && name.trim(), `${file}: cidade sem nome`);
    assert.ok(lat(y) && lng(x), `${file}: cidade fora do globo (${name})`);
    assert.ok(Number.isInteger(population) && population >= 0, `${file}: população (${name})`);
    assert.ok([0, 1, 2].includes(rank), `${file}: categoria (${name})`);
  }
  divisions += data.divisions.length;
  cities += data.cities.length;
}
assert.ok(largest < 400_000, 'nenhum país passa de 400 KB');
console.log(`Admin: ${files.length} países, ${divisions} divisões, ${cities} cidades; maior arquivo ${(largest / 1024).toFixed(0)} KB.`);
