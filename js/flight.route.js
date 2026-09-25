import { geographicToCartesian, haversineKm } from './geospatial.js';

const SAMPLE_COUNT = 192;
const BASE_RADIUS = 1.021;

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function length(vector) {
  return Math.hypot(vector.x, vector.y, vector.z);
}

function normalized(vector) {
  const size = length(vector) || 1;
  return { x: vector.x / size, y: vector.y / size, z: vector.z / size };
}

function routeBasis(origin, destination) {
  const start = normalized(geographicToCartesian(origin.lat, origin.lng));
  const end = normalized(geographicToCartesian(destination.lat, destination.lng));
  const cosine = Math.max(-1, Math.min(1, dot(start, end)));
  const angle = Math.acos(cosine);
  let tangent = {
    x: end.x - start.x * cosine,
    y: end.y - start.y * cosine,
    z: end.z - start.z * cosine
  };
  if (length(tangent) < 1e-6) {
    // Antipodal routes have infinitely many great circles. Choose a stable
    // local tangent instead of allowing numerical noise to flip the aircraft.
    const reference = Math.abs(start.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    tangent = {
      x: reference.y * start.z - reference.z * start.y,
      y: reference.z * start.x - reference.x * start.z,
      z: reference.x * start.y - reference.y * start.x
    };
  }
  return { start, tangent: normalized(tangent), angle };
}

export function buildFlightRoute(origin, destination) {
  for (const airport of [origin, destination]) {
    if (!Number.isFinite(airport?.lat) || !Number.isFinite(airport?.lng)) {
      throw new Error('Coordenadas de aeroporto indisponíveis para esta rota.');
    }
  }
  const distanceKm = haversineKm(origin.lat, origin.lng, destination.lat, destination.lng);
  if (distanceKm < 15) throw new Error('Escolha um destino diferente de Guarulhos para visualizar a rota.');
  const basis = routeBasis(origin, destination);
  const arcHeight = 0.008 + 0.027 * (basis.angle / Math.PI);
  const samples = Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const t = index / (SAMPLE_COUNT - 1);
    const cos = Math.cos(basis.angle * t);
    const sin = Math.sin(basis.angle * t);
    const normal = normalized({
      x: basis.start.x * cos + basis.tangent.x * sin,
      y: basis.start.y * cos + basis.tangent.y * sin,
      z: basis.start.z * cos + basis.tangent.z * sin
    });
    const radius = BASE_RADIUS + arcHeight * Math.sin(Math.PI * t) ** 1.25;
    return { x: normal.x * radius, y: normal.y * radius, z: normal.z * radius };
  });
  return { origin, destination, distanceKm, angle: basis.angle, samples };
}

export function routePoint(route, progress) {
  const position = Math.max(0, Math.min(1, progress)) * (route.samples.length - 1);
  const index = Math.floor(position);
  const first = route.samples[index];
  const second = route.samples[Math.min(index + 1, route.samples.length - 1)];
  const mix = position - index;
  return {
    x: first.x + (second.x - first.x) * mix,
    y: first.y + (second.y - first.y) * mix,
    z: first.z + (second.z - first.z) * mix
  };
}

export function estimatedTravelMinutes(distanceKm) {
  // Geographic preview, not an airline timetable. Ground time, stops and
  // routing can make the real journey substantially longer.
  return Math.round((distanceKm / 800 + 1.5) * 4) * 15;
}
