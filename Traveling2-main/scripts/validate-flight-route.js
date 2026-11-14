import assert from 'node:assert/strict';
import { AirportRepository } from '../js/airports.repository.js';
import { cartesianToGeographic, haversineKm } from '../js/geospatial.js';
import { buildFlightRoute, estimatedTravelMinutes, routePoint } from '../js/flight.route.js';

const airports = new AirportRepository();
const origin = await airports.resolve('GRU');
assert(origin, 'GRU must be available locally');

for (const code of ['FCO', 'NRT', 'JFK', 'JNB', 'SYD', 'MLE']) {
  const destination = await airports.resolve(code);
  assert(destination, `${code} must be available locally`);
  const route = buildFlightRoute(origin, destination);
  assert.equal(route.samples.length, 192);
  assert(route.angle > 0 && route.angle < Math.PI);
  assert(route.distanceKm > 1000);
  assert(estimatedTravelMinutes(route.distanceKm) > 0);
  for (const [progress, airport] of [[0, origin], [1, destination]]) {
    const geographic = cartesianToGeographic(routePoint(route, progress));
    assert(haversineKm(geographic.latitude, geographic.longitude, airport.lat, airport.lng) < 0.01,
      `${code}: route endpoint must align with airport`);
  }
  for (const point of route.samples) {
    const radius = Math.hypot(point.x, point.y, point.z);
    assert(radius >= 1.0209 && radius < 1.06, `${code}: route leaves the subtle altitude band`);
  }
  console.log(`${code}: ${Math.round(route.distanceKm).toLocaleString('pt-BR')} km; 192 samples`);
}

assert.throws(() => buildFlightRoute(origin, origin));
const remoteAirports = await airports.loadAll();
for (const code of ['GRU', 'FCO', 'NRT', 'JFK', 'JNB', 'SYD', 'MLE']) {
  const curated = airports.coreAirports.find(airport => airport.iata === code);
  const loaded = await airports.resolve(code);
  assert.equal(loaded, curated, `${code}: curated airport must not be overwritten`);
  const remote = remoteAirports.find(airport => airport.iata === code);
  assert(remote && haversineKm(curated.lat, curated.lng, remote.lat, remote.lng) < 10,
    `${code}: remote airport coordinates differ from the curated reference`);
}
console.log('Rotas de referência: 6/6; extremos, arco, altitude e validação: OK');
