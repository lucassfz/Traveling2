// Auditoria offline de data/admin (estados e cidades que aparecem ao aproximar
// o globo). Confere o índice, o formato de cada país e os limites de tamanho.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const dir = new URL('../data/admin/', import.meta.url);
const index = JSON.parse(await readFile(new URL('index.json', dir), 'utf8'));
const files = (await readdir(dir)).filter(file => file.endsWith('.json') && file !== 'index.json');
const urbanDir = new URL('urban/', dir);
const urbanFiles = new Set((await readdir(urbanDir)).filter(file => file.endsWith('.json')));
let outlines = 0;
let largestUrban = 0;

assert.equal(index.schema, 2);
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
  assert.ok(Array.isArray(data.zones) && Array.isArray(data.regions), `${file}: zones/regions`);
  for (const zone of data.zones) assert.ok(/^[A-Za-z_]+\/[A-Za-z0-9_/+-]+$/.test(zone), `${file}: fuso "${zone}"`);
  const flagged = new Set();
  for (const [index, [name, y, x, population, rank, zone, region, urban]] of data.cities.entries()) {
    assert.ok(urban === 0 || urban === 1, `${file}: marca de contorno (${name})`);
    if (urban) flagged.add(index);
    assert.ok(zone === -1 || (Number.isInteger(zone) && zone < data.zones.length), `${file}: índice de fuso (${name})`);
    assert.ok(region === -1 || (Number.isInteger(region) && region < data.regions.length), `${file}: índice de região (${name})`);
    assert.ok(typeof name === 'string' && name.trim(), `${file}: cidade sem nome`);
    assert.ok(lat(y) && lng(x), `${file}: cidade fora do globo (${name})`);
    assert.ok(Number.isInteger(population) && population >= 0, `${file}: população (${name})`);
    assert.ok([0, 1, 2].includes(rank), `${file}: categoria (${name})`);
  }
  // Contornos urbanos: um por cidade marcada, anéis fecháveis dentro do globo.
  if (urbanFiles.has(file)) {
    const urbanText = await readFile(new URL(file, urbanDir), 'utf8');
    largestUrban = Math.max(largestUrban, urbanText.length);
    const urbanData = JSON.parse(urbanText);
    assert.equal(urbanData.country, code, `urban/${file}: country`);
    const seen = new Set();
    for (const [cityIndex, ...rings] of urbanData.outlines) {
      assert.ok(flagged.has(cityIndex) && !seen.has(cityIndex), `urban/${file}: cidade ${cityIndex}`);
      seen.add(cityIndex);
      for (const ring of rings) {
        assert.ok(ring.length >= 8 && ring.length % 2 === 0, `urban/${file}: anel curto`);
        for (let i = 0; i < ring.length; i += 2) assert.ok(lng(ring[i]) && lat(ring[i + 1]), `urban/${file}: ponto inválido`);
      }
    }
    assert.equal(seen.size, flagged.size, `urban/${file}: cidades marcadas sem contorno`);
    outlines += seen.size;
  } else assert.equal(flagged.size, 0, `${file}: marcadas sem arquivo urban`);
  divisions += data.divisions.length;
  cities += data.cities.length;
}
assert.ok(largest < 400_000, 'nenhum país passa de 400 KB');
assert.ok(largestUrban < 1_500_000, 'nenhum arquivo de contornos passa de 1,5 MB');
console.log(`Admin: ${files.length} países, ${divisions} divisões, ${cities} cidades (${outlines} com contorno urbano); maior arquivo ${(largest / 1024).toFixed(0)} KB, maior contorno ${(largestUrban / 1024).toFixed(0)} KB.`);
