import { COUNTRIES } from '../js/countries.dataset.js';
import { atlasFeatureParts } from '../js/map.topology.js';
import { prepareGeometry, preparedGeometryContains, unwrapRing } from '../js/geospatial.js';

const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const atlasResponse = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
const clientResponse = await fetch('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm');
if (!atlasResponse.ok || !clientResponse.ok) throw new Error('Não foi possível carregar a topologia para validação.');
const atlas = await atlasResponse.json();
const clientSource = await clientResponse.text();
const topojson = await import(`data:text/javascript;base64,${Buffer.from(clientSource).toString('base64')}`);
const features = topojson.feature(atlas, atlas.objects.countries).features;
const parts = features.flatMap(atlasFeatureParts);
const byKey = new Map();
for (const part of parts) {
  if (!part.key) continue;
  if (!byKey.has(part.key)) byKey.set(part.key, []);
  byKey.get(part.key).push(...prepareGeometry(part.geometry));
}

const samples = [
  ['Japan', 35.7, 139.7], ['Taiwan', 25.05, 121.55], ['Kosovo', 42.66, 21.16],
  ['Sudan', 15.6, 32.5], ['S. Sudan', 4.85, 31.6], ['Morocco', 34.02, -6.84],
  ['France', 48.86, 2.35], ['Fr. Guiana', 4.92, -52.33], ['Suriname', 5.85, -55.17],
  ['Russia', 55.75, 37.62], ['Russia', 43.12, 131.89],
  ['Belarus', 53.9, 27.57], ['Vanuatu', -16.2, 167.5]
];
for (const [key, latitude, longitude] of samples) {
  assert(preparedGeometryContains(byKey.get(key) || [], latitude, longitude), `${key}: ponto ${latitude},${longitude} não selecionável`);
}
const sahara = parts.find(part => !part.key && prepareGeometry(part.geometry).some(polygon => preparedGeometryContains([polygon], 24, -12)));
assert(Boolean(sahara), 'Saara Ocidental não se mantém como território neutro visível');
assert(!preparedGeometryContains(byKey.get('Morocco') || [], 24, -12), 'Saara Ocidental foi atribuído indevidamente a Marrocos');
assert(!preparedGeometryContains(byKey.get('France') || [], 4.92, -52.33), 'Guiana Francesa ainda resolve como França europeia');
assert(!preparedGeometryContains(byKey.get('Sudan') || [], 4.85, 31.6), 'Sudão engloba Sudão do Sul');

const russianFeature = parts.find(part => part.key === 'Russia');
const russianPolygons = russianFeature.geometry.coordinates;
const threeSource = await (await fetch('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js')).text();
const THREE = await import(`data:text/javascript;base64,${Buffer.from(threeSource).toString('base64')}`);
const mainRussiaRing = unwrapRing(russianPolygons[9][0]);
const shape = new THREE.Shape();
mainRussiaRing.forEach(([longitude, latitude], index) => index ? shape.lineTo(longitude, latitude) : shape.moveTo(longitude, latitude));
const triangulated = new THREE.ShapeGeometry(shape, 1);
const pos = triangulated.getAttribute('position');
const idx = triangulated.index;
const read = vertex => [pos.getX(vertex), pos.getY(vertex)];
const planarDistance = (a, b) => Math.hypot((a[0] - b[0]) * Math.cos((a[1] + b[1]) * Math.PI / 360), a[1] - b[1]);
const measure = depthLimit => {
  let count = 0, max = 0, oversized = 0;
  const subdivide = (a, b, c, depth = 0) => {
    const edges = [[a, b], [b, c], [c, a]].map(([u, v]) => ({ u, v, length: planarDistance(u, v) })).sort((x, y) => y.length - x.length);
    if (edges[0].length < 4 || depth >= depthLimit) { count++; max = Math.max(max, edges[0].length); if (edges[0].length >= 4) oversized++; return; }
    const [u, v] = [edges[0].u, edges[0].v];
    const midpoint = [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2];
    if (edges[0].u === a && edges[0].v === b) { subdivide(a, midpoint, c, depth + 1); subdivide(midpoint, b, c, depth + 1); }
    else if (edges[0].u === b && edges[0].v === c) { subdivide(a, b, midpoint, depth + 1); subdivide(a, midpoint, c, depth + 1); }
    else { subdivide(a, b, midpoint, depth + 1); subdivide(midpoint, b, c, depth + 1); }
  };
  for (let cursor = 0; cursor < idx.count; cursor += 3) subdivide(read(idx.getX(cursor)), read(idx.getX(cursor + 1)), read(idx.getX(cursor + 2)));
  return { depthLimit, count, oversized, max };
};
const russianMesh = measure(8);
assert(russianMesh.oversized === 0 && russianMesh.count < 2000, 'Rússia: subdivisão deixa triângulos largos ou aumenta excessivamente a malha');
console.log(`Rússia: ${russianMesh.count} triângulos na massa principal, ${russianMesh.oversized} acima do limite de 4°`);
console.log('Cobertura 110m:', byKey.size, '/', Object.keys(COUNTRIES).length, 'países com geometria; pontos testados:', samples.length);
console.log('Sem geometria 110m:', Object.keys(COUNTRIES).filter(key => !byKey.has(key)).join(', '));
for (const error of errors) console.error('ERRO', error);
console.log('Erros:', errors.length);
if (errors.length) process.exitCode = 1;
