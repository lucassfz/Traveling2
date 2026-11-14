import assert from 'node:assert/strict';
import { COUNTRIES } from '../js/countries.dataset.js';
import { entryPresentation } from '../js/entry.presentation.js';

const expected = {
  Portugal: 'Sem visto',
  'United Kingdom': 'Autorização eletrônica (ETA)',
  Mexico: 'Visto eletrônico (eVisa)',
  Cuba: 'Visto eletrônico (eVisa)',
  Madagascar: 'Visto na chegada',
  'Fr. Guiana': 'Visto antes da viagem',
  Bolivia: 'Sem visto',
  Suriname: 'Sem visto',
  Argentina: 'Sem visto',
  'United States of America': 'Visto antes da viagem',
  Brazil: 'Viagem nacional'
};
const counts = {};
const noSource = [];
for (const country of Object.values(COUNTRIES)) {
  const view = entryPresentation(country);
  assert.ok(view.status.title && view.status.detail && view.stay, country.key);
  assert.ok(!JSON.stringify(view).includes('undefined'), country.key);
  assert.ok(view.sources.every(([, url]) => url.startsWith('https://')), country.key);
  assert.equal(new Set(view.notes).size, view.notes.length, country.key);
  counts[view.status.title] = (counts[view.status.title] || 0) + 1;
  if (!country.entryRequirements?.officialSource && country.key !== 'Brazil') noSource.push(country.key);
}
for (const [key, title] of Object.entries(expected)) assert.equal(entryPresentation(COUNTRIES[key]).status.title, title, key);
assert.match(entryPresentation(COUNTRIES['Fr. Guiana']).status.detail, /fora|não faz parte|não integra/i);
assert.match(entryPresentation(COUNTRIES.Suriname).status.detail, /Entry Fee/);
assert.match(entryPresentation(COUNTRIES.Bolivia).preparation[0][1], /RG válido/);
assert.ok(!entryPresentation(COUNTRIES.Portugal).notes.some(note => /não se aplica/.test(note)));
assert.ok(!entryPresentation(COUNTRIES.Cuba).notes.some(note => /DViajero/i.test(note)));
console.log(`Entrada: ${Object.keys(COUNTRIES).length} destinos; categorias ${JSON.stringify(counts)}.`);
console.log(`Sem fonte oficial de entrada no modelo: ${noSource.length} (${noSource.join(', ')}).`);
