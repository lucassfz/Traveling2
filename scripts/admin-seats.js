// Cidade principal de cada região (estado/província) em data/admin/regions:
// é a cidade escolhida quando se clica em qualquer ponto da região no globo.
//
// Regra: a primeira cidade, na ordem do arquivo (capital nacional, sedes
// regionais, depois por população), que pertence à região — pelo nome da
// região da cidade (o mesmo do cartão da cidade) ou por estar dentro do
// polígono. Só o polígono não basta: capitais em ilhas ou na ponta do litoral
// (Florianópolis, São Luís, Vitória, Belém) ficam fora do contorno 1:10m e a
// região acabava com outra cidade (Joinville, Imperatriz, Serra, Ananindeua).
// O nome só vale quando é único no país (a Argentina tem duas regiões "Buenos
// Aires"; a Letônia, dezenas de "Valmiera" no Natural Earth).
//
//   node scripts/admin-seats.js        aplica a regra aos arquivos locais, sem
//                                       baixar nada: a cidade principal atual
//                                       (escolhida pelo polígono 1:10m na geração)
//                                       só muda para uma cidade de prioridade
//                                       maior com o mesmo nome de região.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/**
 * @param {object[]} cities  Na ordem do arquivo.
 * @param {object} region
 * @param {string} region.name
 * @param {boolean} region.unique  Nome único entre as regiões do país.
 * @param {(city: object) => string|null} region.regionOf  Nome da região da cidade.
 * @param {(city: object, index: number) => boolean} region.inside  Cidade dentro do polígono.
 * @returns {number} Índice da cidade principal, ou -1.
 */
export function regionSeat(cities, { name, unique, regionOf, inside }) {
  return cities.findIndex((city, index) => (unique && regionOf(city) === name) || inside(city, index));
}

/** Nomes que aparecem uma vez só entre as regiões. */
export function uniqueNames(names) {
  const counts = new Map();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  return new Set([...counts].filter(([, count]) => count === 1).map(([name]) => name));
}

/** Aplica a regra a um país a partir dos arquivos locais. */
export function reseatCountry(admin, regions) {
  const cities = admin.cities.map(([name, lat, lng, , , , region]) => ({ name, lat, lng, region: admin.regions[region] ?? null }));
  const unique = uniqueNames(regions.areas.map(([name]) => name));
  const changes = [];
  const areas = regions.areas.map(([name, seat, ...polygons]) => {
    // O polígono já foi testado na geração (1:10m, sem simplificar): a cidade
    // principal atual é a primeira dentro dele.
    const next = regionSeat(cities, { name, unique: unique.has(name), regionOf: city => city.region, inside: (_, index) => index === seat });
    if (next !== seat) changes.push({ region: name, from: cities[seat]?.name ?? null, to: cities[next]?.name ?? null });
    return [name, next, ...polygons];
  });
  return { regions: { ...regions, areas }, changes };
}

async function main() {
  const dir = new URL('../data/admin/', import.meta.url);
  const regionDir = new URL('regions/', dir);
  let total = 0;
  for (const file of (await readdir(regionDir)).filter(name => name.endsWith('.json')).sort()) {
    const admin = JSON.parse(await readFile(new URL(file, dir), 'utf8'));
    const regions = JSON.parse(await readFile(new URL(file, regionDir), 'utf8'));
    const result = reseatCountry(admin, regions);
    if (!result.changes.length) continue;
    total += result.changes.length;
    for (const change of result.changes) console.log(`${file.slice(0, 2)} ${change.region}: ${change.from ?? '—'} → ${change.to ?? '—'}`);
    await writeFile(new URL(file, regionDir), `${JSON.stringify(result.regions)}\n`);
  }
  console.log(`${total} cidade(s) principal(is) corrigida(s).`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
