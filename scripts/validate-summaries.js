// Auditoria offline de data/summaries.pt.json (resumos da Wikipédia e fotos do Commons).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { COUNTRIES } from '../js/countries.dataset.js';
import { LANDMARK_MEDIA } from '../js/landmarks.media.js';

const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const data = await read('../data/summaries.pt.json');
const geo = await read('../data/geo/BR.json');

assert.equal(data.license, 'CC BY-SA 4.0');
const alpha2 = new Set(Object.values(COUNTRIES).map(country => country.alpha2));
const landmarks = new Map(Object.entries(LANDMARK_MEDIA).flatMap(([, items]) => items.map(item => [item.wikidataId, item])));
const divisions = new Set(geo.divisions.map(division => division.id));
const places = new Set(geo.places.map(place => place.id));
const owners = { countries: id => alpha2.has(id), landmarks: id => landmarks.has(id), divisions: id => divisions.has(id), places: id => places.has(id) };

const counts = {};
for (const [kind, isKnown] of Object.entries(owners)) {
  const entries = Object.entries(data[kind] ?? {});
  counts[kind] = entries.length;
  for (const [id, entry] of entries) {
    assert.ok(isKnown(id), `${kind}/${id}: id não existe no app`);
    assert.ok(typeof entry.text === 'string' && entry.text.length >= 20 && entry.text.length <= 420, `${kind}/${id}: texto fora do tamanho`);
    assert.doesNotMatch(entry.text, /<[a-z]/i, `${kind}/${id}: HTML no texto`);
    assert.match(entry.url, /^https:\/\/pt\.wikipedia\.org\/wiki\//, `${kind}/${id}: link precisa ser da Wikipédia em português`);
    assert.match(entry.retrievedAt, /^\d{4}-\d{2}-\d{2}$/, `${kind}/${id}: data de consulta`);
    if (entry.image) {
      assert.match(entry.image.url, /^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//, `${kind}/${id}: foto fora do Commons`);
      assert.match(entry.image.sourcePage, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      assert.ok(entry.image.author && entry.image.license, `${kind}/${id}: foto sem autor ou licença`);
      assert.doesNotMatch(decodeURIComponent(entry.image.url), /\.svg|bandeira|flag|bras[aã]o|coat.of.arms|mapa|locator/i, `${kind}/${id}: foto parece bandeira, brasão ou mapa`);
    }
  }
}
assert.ok(counts.countries > 150, 'resumos de países');
assert.ok(counts.places >= 60, 'resumos das cidades do Brasil');
console.log(`Resumos: ${counts.countries} países, ${counts.landmarks} lugares, ${counts.divisions} estados, ${counts.places} cidades; ids, links, licença e fotos verificados.`);
