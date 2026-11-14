// Gera data/admin/<ISO2>.json (estados/províncias e cidades por país) e
// data/admin/index.json (caixa de cada país), usados pelo globo ao aproximar:
// primeiro aparecem as divisas e nomes dos estados, depois as cidades.
//
//   node scripts/build-admin.js
//
// Fontes:
// - Natural Earth 10m admin-1 (domínio público), commit fixo abaixo. Só as
//   linhas INTERNAS entre divisões do mesmo país são guardadas: o litoral e a
//   fronteira nacional já vêm do world-atlas do globo.
// - GeoNames cities15000 (CC BY 4.0): cidades com 15 mil habitantes ou mais.
//   O arquivo muda diariamente; a data da extração fica registrada no índice.
//
// Sem dependências: simplificação Douglas–Peucker e descompactação do ZIP
// (uma única entrada deflate) feitas aqui mesmo.
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

const NE_COMMIT = 'ca96624a56bd078437bca8184e78163e5039ad19';
const ADMIN1_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${NE_COMMIT}/geojson/ne_10m_admin_1_states_provinces.geojson`;
const CITIES_URL = 'https://download.geonames.org/export/dump/cities15000.zip';
const OUTPUT_DIR = new URL('../data/admin/', import.meta.url);
// ~0.8 km: suficiente para o zoom máximo do globo, mantendo arquivos pequenos.
const SIMPLIFY_TOLERANCE = 0.008;
const PRECISION = 1000;

const round = value => Math.round(value * PRECISION) / PRECISION;

async function download(url, kind = 'json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return kind === 'json' ? response.json() : Buffer.from(await response.arrayBuffer());
}

function unzipSingle(buffer) {
  // Cabeçalho local: assinatura 0x04034b50, método em +8, tamanhos em +18/+22.
  if (buffer.readUInt32LE(0) !== 0x04034b50) throw new Error('ZIP inválido');
  const method = buffer.readUInt16LE(8);
  const nameLength = buffer.readUInt16LE(26);
  const extraLength = buffer.readUInt16LE(28);
  const start = 30 + nameLength + extraLength;
  // O tamanho pode vir zerado (data descriptor); inflateRaw para no fim do fluxo.
  const data = buffer.subarray(start);
  if (method === 0) return data.toString('utf8');
  if (method !== 8) throw new Error(`ZIP com método ${method}`);
  return inflateRawSync(data).toString('utf8');
}

function polygonsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

const pointKey = ([lng, lat]) => `${lng},${lat}`;

// Segmentos que aparecem em duas divisões diferentes do mesmo país = divisa interna.
function innerLines(features) {
  const owners = new Map();
  const points = new Map();
  features.forEach((feature, featureIndex) => {
    for (const polygon of polygonsOf(feature.geometry)) {
      for (const ring of polygon) {
        for (let index = 0; index < ring.length - 1; index += 1) {
          const a = pointKey(ring[index]);
          const b = pointKey(ring[index + 1]);
          if (a === b) continue;
          points.set(a, ring[index]);
          points.set(b, ring[index + 1]);
          const key = a < b ? `${a}|${b}` : `${b}|${a}`;
          let set = owners.get(key);
          if (!set) owners.set(key, set = new Set());
          set.add(featureIndex);
        }
      }
    }
  });

  const adjacency = new Map();
  const link = (a, b) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    adjacency.get(a).add(b);
  };
  for (const [key, set] of owners) {
    if (set.size < 2) continue;
    const [a, b] = key.split('|');
    link(a, b);
    link(b, a);
  }

  const used = new Set();
  const edgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const walk = start => {
    const line = [start];
    let current = start;
    for (;;) {
      const next = [...(adjacency.get(current) ?? [])].find(candidate => !used.has(edgeKey(current, candidate)));
      if (!next) break;
      used.add(edgeKey(current, next));
      line.push(next);
      current = next;
      if ((adjacency.get(current)?.size ?? 0) !== 2) break;
    }
    return line;
  };

  const lines = [];
  // Primeiro a partir de pontas e junções (grau ≠ 2), depois ciclos fechados.
  for (const [node, neighbours] of adjacency) {
    if (neighbours.size === 2) continue;
    for (const neighbour of neighbours) {
      if (used.has(edgeKey(node, neighbour))) continue;
      used.add(edgeKey(node, neighbour));
      lines.push([node, ...walk(neighbour)]);
    }
  }
  for (const [node, neighbours] of adjacency) {
    for (const neighbour of neighbours) {
      if (used.has(edgeKey(node, neighbour))) continue;
      used.add(edgeKey(node, neighbour));
      lines.push([node, ...walk(neighbour)]);
    }
  }
  return lines.map(line => line.map(key => points.get(key)));
}

function simplify(points, tolerance) {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy);
    let maxDistance = 0;
    let maxIndex = -1;
    for (let index = first + 1; index < last; index += 1) {
      const [px, py] = points[index];
      const distance = length === 0
        ? Math.hypot(px - ax, py - ay)
        : Math.abs(dy * px - dx * py + bx * ay - by * ax) / length;
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = index;
      }
    }
    if (maxDistance > tolerance && maxIndex > 0) {
      keep[maxIndex] = 1;
      stack.push([first, maxIndex], [maxIndex, last]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

function flatLine(points) {
  const flat = [];
  let previous = null;
  for (const [lng, lat] of points) {
    const x = round(lng);
    const y = round(lat);
    if (previous && previous[0] === x && previous[1] === y) continue;
    flat.push(x, y);
    previous = [x, y];
  }
  return flat.length >= 4 ? flat : null;
}

function expandBox(box, lng, lat) {
  box[0] = Math.min(box[0], lng);
  box[1] = Math.min(box[1], lat);
  box[2] = Math.max(box[2], lng);
  box[3] = Math.max(box[3], lat);
}

// Nome em português quando ele é um nome próprio completo; senão o original.
// (O Natural Earth tem alguns name_pt truncados, como "do Tibete".)
function divisionName(properties) {
  return [properties.name_pt, properties.name]
    .map(value => (typeof value === 'string' ? value.trim() : ''))
    .find(value => value && /^[\p{Lu}\d]/u.test(value)) ?? null;
}

function parseCities(text) {
  // Colunas do GeoNames: 1 name, 4 lat, 5 lng, 7 feature code, 8 país, 14 população.
  const byCountry = new Map();
  for (const line of text.split('\n')) {
    if (!line) continue;
    const cells = line.split('\t');
    const country = cells[8];
    const lat = Number(cells[4]);
    const lng = Number(cells[5]);
    const population = Number(cells[14]) || 0;
    if (!/^[A-Z]{2}$/.test(country) || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    // 0 capital nacional, 1 sede de estado/província, 2 demais cidades.
    const code = cells[7];
    const rank = code === 'PPLC' ? 0 : code === 'PPLA' ? 1 : 2;
    if (!byCountry.has(country)) byCountry.set(country, []);
    byCountry.get(country).push([cells[1], round(lat), round(lng), population, rank]);
  }
  for (const list of byCountry.values()) list.sort((a, b) => a[4] - b[4] || b[3] - a[3]);
  return byCountry;
}

async function main() {
  console.log('Baixando Natural Earth admin-1 (~40 MB) e GeoNames cities15000…');
  const [admin1, citiesZip] = await Promise.all([download(ADMIN1_URL), download(CITIES_URL, 'buffer')]);
  const cities = parseCities(unzipSingle(citiesZip));

  const byCountry = new Map();
  for (const feature of admin1.features) {
    const code = feature.properties?.iso_a2;
    // "-1" marca áreas sem código ISO (zonas de soberania, bases): ficam de fora.
    if (!/^[A-Z]{2}$/.test(code ?? '')) continue;
    if (!byCountry.has(code)) byCountry.set(code, []);
    byCountry.get(code).push(feature);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const file of await readdir(OUTPUT_DIR)) {
    if (file.endsWith('.json')) await rm(new URL(file, OUTPUT_DIR));
  }

  const index = {};
  const codes = new Set([...byCountry.keys(), ...cities.keys()]);
  let totalBytes = 0;
  for (const code of [...codes].sort()) {
    const features = byCountry.get(code) ?? [];
    const box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const feature of features) {
      for (const polygon of polygonsOf(feature.geometry)) {
        for (const [lng, lat] of polygon[0]) expandBox(box, lng, lat);
      }
    }
    const places = cities.get(code) ?? [];
    for (const [, lat, lng] of places) expandBox(box, lng, lat);
    if (!Number.isFinite(box[0])) continue;

    // Um país com uma só divisão (microestados) não tem divisa interna nem rótulo útil.
    const divisions = features.length > 1 ? features.map(feature => {
      const p = feature.properties;
      const name = divisionName(p);
      return name && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
        ? [name, round(p.latitude), round(p.longitude), p.type_en || 'Region'] : null;
    }).filter(Boolean) : [];
    const lines = features.length > 1
      ? innerLines(features).map(line => flatLine(simplify(line, SIMPLIFY_TOLERANCE))).filter(Boolean)
      : [];

    const data = { country: code, divisions, lines, cities: places };
    const json = JSON.stringify(data);
    totalBytes += json.length;
    await writeFile(new URL(`${code}.json`, OUTPUT_DIR), `${json}\n`);
    index[code] = box.map(round);
  }

  const retrievedAt = new Date().toISOString().slice(0, 10);
  const indexFile = {
    schema: 1,
    sources: [
      { id: 'natural-earth-admin1', name: 'Natural Earth — Admin 1 states/provinces 1:10m', url: `https://github.com/nvkelso/natural-earth-vector/tree/${NE_COMMIT}`, license: 'Domínio público', covers: ['divisions', 'lines'] },
      { id: 'geonames-cities15000', name: 'GeoNames — cities15000', url: 'https://download.geonames.org/export/dump/', license: 'CC BY 4.0', retrievedAt, covers: ['cities'] }
    ],
    // Linhas: [lng, lat, lng, lat, …]; divisões: [nome, lat, lng, tipo];
    // cidades: [nome, lat, lng, população, 0 capital | 1 sede regional | 2 cidade].
    countries: index
  };
  await writeFile(new URL('index.json', OUTPUT_DIR), `${JSON.stringify(indexFile)}\n`);
  console.log(`${Object.keys(index).length} países, ${(totalBytes / 1024 / 1024).toFixed(2)} MB no total.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
