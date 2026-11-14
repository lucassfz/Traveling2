// Uses the same pinned Three module as index.html; no installed runtime dependency.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AirportRepository } from '../js/airports.repository.js';
import { buildFlightRoute } from '../js/flight.route.js';
const response = await fetch('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
assert(response.ok, 'Pinned Three module available');
const threeUrl = `data:text/javascript;base64,${Buffer.from(await response.text()).toString('base64')}`;
const THREE = await import(threeUrl);
const source = (await readFile(new URL('../js/flight.visualization.js', import.meta.url), 'utf8'))
  .replace("'three'", JSON.stringify(threeUrl))
  .replace("'./flight.route.js'", JSON.stringify(new URL('../js/flight.route.js', import.meta.url).href));
const { FlightVisualization } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const airports = new AirportRepository();
const origin = await airports.resolve('GRU');
const scene = new THREE.Scene();
const view = new FlightVisualization(scene, new THREE.Plane(new THREE.Vector3(0, 0, 1), 2));
for (const code of ['FCO', 'JFK', 'NRT', 'JNB', 'SYD', 'MLE']) {
  const route = buildFlightRoute(origin, await airports.resolve(code));
  view.start(route, 1000);
  const geometry = view.line.geometry;
  for (const timestamp of [1000, 2000, 3000, 4200, 5200]) {
    view.update(timestamp);
    assert.equal(view.line.geometry, geometry, 'Geometry reused');
    assert(Math.abs(view.airplane.quaternion.length() - 1) < 1e-7);
    assert(view.airplane.position.length() > 1.02);
    const nose = new THREE.Vector3(0, 0, 1).applyQuaternion(view.airplane.quaternion);
    assert(nose.dot(view.forward) > 0.999, 'Aircraft points along route');
  }
  assert(view.completed);
  view.update(5550);
  assert(view.destinationMarker.scale.x > 1 && view.destinationMarker.scale.x <= 1.45);
  view.update(6000);
  assert(Math.abs(view.destinationMarker.scale.x - 1) < 1e-7);
  view.update(9000);
  assert(Math.abs(view.destinationMarker.scale.x - 1) < 1e-7, 'No repeated pulse');
  assert(view.group.visible && view.line.geometry.drawRange.count === route.samples.length);
  view.clear();
  assert(!view.group.visible && view.line === null);
  view.start(route, 1000, true);
  view.update(9999);
  assert.equal(view.destinationMarker.scale.x, 1, 'Reduced motion skips pulse');
  assert(view.airplane.position.distanceTo(view.destinationMarker.position) < 1e-6);
}
view.dispose();
assert.equal(scene.children.length, 0);
console.log('Mesh, quaternion, reused geometry, 6 routes, one pulse, reduced motion and cleanup: OK');
