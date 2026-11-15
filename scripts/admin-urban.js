// Dono de cada contorno urbano em data/admin/urban: a MAIOR cidade cujo ponto
// está dentro dele. No globo, o clique dentro de uma mancha escolhe a dona
// (a menor mancha primeiro), então uma mancha com dono errado rouba a área da
// cidade grande: o Rio de Janeiro escolhia Itaguaí, Recife escolhia Igarassu,
// Brisbane escolhia Logan City, São Paulo escolhia Santana de Parnaíba.
//
// Isso acontecia porque as duas fontes do Natural Earth (LandScan nomeadas e
// manchas 1:10m) se sobrepõem: a cidade grande ficava com a mancha de uma
// fonte, e a outra mancha, que também a contém, ia para uma cidade menor da
// borda. Regra:
//   - a mancha cuja maior cidade dentro dela é a própria dona fica como está;
//   - se a maior cidade dentro dela já tem mancha, esta é descartada (duplicada);
//   - senão, a mancha passa para essa cidade.
//
//   node scripts/admin-urban.js       aplica a regra aos arquivos locais
//                                      (data/admin/urban e a coluna "tem contorno"
//                                      das cidades em data/admin), sem baixar nada
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { inFlatRing } from '../js/map.pick.js';

function ringsBox(rings) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i += 2) {
      box[0] = Math.min(box[0], ring[i]); box[2] = Math.max(box[2], ring[i]);
      box[1] = Math.min(box[1], ring[i + 1]); box[3] = Math.max(box[3], ring[i + 1]);
    }
  }
  return box;
}

/**
 * @param {{ lat: number, lng: number, population: number }[]} cities  Na ordem do arquivo.
 * @param {Array<[number, ...number[][]]>} outlines  [[índice da cidade, anel, anel…]] com anéis [lng, lat, …].
 * @returns {{ outlines: Array, changes: { from: number, to: number|null }[] }}
 *   `to` null = mancha descartada.
 */
export function urbanOwners(cities, outlines) {
  // Maior cidade dentro de cada mancha (empate: a primeira no arquivo).
  const rightful = outlines.map(([owner, ...rings]) => {
    const box = ringsBox(rings);
    let best = owner;
    cities.forEach((city, index) => {
      if (city.population <= cities[best].population || index === best) return;
      if (city.lng < box[0] || city.lng > box[2] || city.lat < box[1] || city.lat > box[3]) return;
      if (rings.some(ring => inFlatRing(ring, city.lng, city.lat))) best = index;
    });
    return best;
  });
  const keeps = new Set(outlines.filter(([owner], position) => rightful[position] === owner).map(([owner]) => owner));
  const result = [];
  const changes = [];
  outlines.forEach(([owner, ...rings], position) => {
    const target = rightful[position];
    if (target === owner) {
      result.push([owner, ...rings]);
      return;
    }
    if (keeps.has(target)) {
      changes.push({ from: owner, to: null });
      return;
    }
    keeps.add(target);
    result.push([target, ...rings]);
    changes.push({ from: owner, to: target });
  });
  return { outlines: result, changes };
}

/** Aplica a regra a um país a partir dos arquivos locais; atualiza a coluna 7 (tem contorno). */
export function fixCountryUrban(admin, urban) {
  const cities = admin.cities.map(([, lat, lng, population]) => ({ lat, lng, population }));
  const { outlines, changes } = urbanOwners(cities, urban.outlines);
  const owners = new Set(outlines.map(([owner]) => owner));
  const nextCities = admin.cities.map((row, index) => {
    const flag = owners.has(index) ? 1 : 0;
    if ((row[7] ?? 0) === flag) return row;
    const next = [...row];
    next[7] = flag;
    return next;
  });
  return { admin: { ...admin, cities: nextCities }, urban: { ...urban, outlines }, changes };
}

async function main() {
  const dir = new URL('../data/admin/', import.meta.url);
  const urbanDir = new URL('urban/', dir);
  let dropped = 0;
  let moved = 0;
  for (const file of (await readdir(urbanDir)).filter(name => name.endsWith('.json')).sort()) {
    const admin = JSON.parse(await readFile(new URL(file, dir), 'utf8'));
    const urban = JSON.parse(await readFile(new URL(file, urbanDir), 'utf8'));
    const result = fixCountryUrban(admin, urban);
    if (!result.changes.length) continue;
    for (const change of result.changes) {
      if (change.to === null) dropped += 1; else moved += 1;
    }
    await writeFile(new URL(file, urbanDir), `${JSON.stringify(result.urban)}\n`);
    await writeFile(new URL(file, dir), `${JSON.stringify(result.admin)}\n`);
  }
  console.log(`Contornos urbanos: ${dropped} duplicado(s) descartado(s), ${moved} passado(s) para a maior cidade dentro dele.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
