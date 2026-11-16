// Tabela de migração dos ids antigos de cidade ("BR-174" = posição no arquivo).
//
// Até a Fase 4.1, data/admin/<ISO2>.json não tinha o geonameid e a cidade era
// identificada pela posição na lista. A mesma lista valeu de bfa9745 (quando o
// Planner passou a guardar a cidade) até 9dac631 (último commit antes da
// regeneração). Este script compara aquela lista com a atual e grava, para cada
// posição antiga que mudou, o geonameid da cidade (ou null se a cidade saiu).
// Posições que não mudaram não entram: a cidade continua no mesmo índice.
//
// Uso: node scripts/build-legacy-cities.js   (precisa do histórico do git)
import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const FIRST = 'bfa9745';  // primeiro commit com cidade guardada pelo índice
const LAST = '9dac631';   // último commit com a lista antiga
const dir = new URL('../data/admin/', import.meta.url);
const output = new URL('../data/legacy-cities.json', import.meta.url);

const show = (rev, file) => {
  try {
    return JSON.parse(execFileSync('git', ['show', `${rev}:data/admin/${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  } catch {
    return null;
  }
};
const key = ([name, lat, lng]) => `${name}|${lat}|${lng}`;

const files = (await readdir(dir)).filter(file => /^[A-Z]{2}\.json$/.test(file)).sort();
const countries = {};
let moved = 0;
let removed = 0;
let total = 0;
for (const file of files) {
  const code = file.slice(0, 2);
  const old = show(LAST, file);
  if (!old) continue;
  const first = show(FIRST, file);
  // A lista antiga precisa ser a mesma durante todo o período: senão um índice
  // guardado teria dois significados e a tabela não seria exata.
  if (first && JSON.stringify(first.cities.map(key)) !== JSON.stringify(old.cities.map(key))) {
    throw new Error(`${code}: a lista de cidades mudou entre ${FIRST} e ${LAST}`);
  }
  const current = JSON.parse(await readFile(new URL(file, dir), 'utf8'));
  const byKey = new Map(current.cities.map((row, index) => [key(row), index]));
  const map = {};
  old.cities.forEach((row, index) => {
    total += 1;
    const now = byKey.get(key(row));
    if (now === index) return;
    if (now === undefined) {
      removed += 1;
      map[index] = null;
    } else {
      moved += 1;
      map[index] = current.cities[now][8];
    }
  });
  if (Object.keys(map).length) countries[code] = map;
}

const json = { schema: 1, from: LAST, since: FIRST, note: 'Índice antigo da cidade → geonameid atual; null = cidade que saiu do arquivo. Índices ausentes não mudaram.', countries };
await writeFile(output, `${JSON.stringify(json)}\n`);
console.log(`Ids antigos: ${total} cidades conferidas, ${moved} mudaram de posição, ${removed} saíram (${Object.keys(countries).length} países).`);
