import * as THREE from 'three';
import { routePoint } from './flight.route.js';

const FLIGHT_DURATION_MS = 4200;

function createAirplane(material) {
  // Nose is +Z, upper surface is +Y. Every part is a genuine 3D mesh in the
  // globe's world frame; there are no camera-facing sprites or image assets.
  const airplane = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0027, 0.0036, 0.031, 7), material);
  body.rotation.x = Math.PI / 2;
  airplane.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.0027, 0.009, 7), material);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 0.019;
  airplane.add(nose);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.019, 0.0011, 0.007), material);
    wing.position.set(side * 0.0105, 0, -0.001);
    wing.rotation.y = side * 0.17;
    airplane.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.001, 0.0035), material);
    tail.position.set(side * 0.0045, 0.001, -0.012);
    airplane.add(tail);
  }

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.006, 0.006), material);
  fin.position.set(0, 0.0035, -0.012);
  airplane.add(fin);
  airplane.scale.setScalar(1.3);
  return airplane;
}

export class FlightVisualization {
  constructor(scene, horizonClipPlane) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x68d8f4, transparent: true, opacity: 0.96,
      depthTest: true, depthWrite: false, clippingPlanes: [horizonClipPlane]
    });
    this.airplaneMaterial = new THREE.MeshStandardMaterial({
      color: 0xf0f8ff, metalness: 0.12, roughness: 0.48,
      side: THREE.DoubleSide, clippingPlanes: [horizonClipPlane]
    });
    this.markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x85e8f8, depthTest: true, depthWrite: false,
      clippingPlanes: [horizonClipPlane]
    });
    this.airplane = createAirplane(this.airplaneMaterial);
    this.group.add(this.airplane);
    const markerGeometry = new THREE.SphereGeometry(0.006, 10, 8);
    this.originMarker = new THREE.Mesh(markerGeometry, this.markerMaterial);
    // Solid origin / open destination ring; both attached to the same sphere.
    this.destinationMarker = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0017, 4, 24), this.markerMaterial);
    this.group.add(this.originMarker, this.destinationMarker);
    this.group.visible = false;
    this.forward = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.up = new THREE.Vector3();
    this.matrix = new THREE.Matrix4();
  }

  setTheme(accentColor, bodyColor) {
    this.lineMaterial.color.copy(accentColor);
    this.markerMaterial.color.copy(accentColor);
    this.airplaneMaterial.color.copy(bodyColor);
  }

  start(route, startedAt, reducedMotion = false) {
    this.clear();
    this.route = route;
    this.startedAt = startedAt;
    this.reducedMotion = reducedMotion;
    this.completed = reducedMotion;
    const points = route.samples.map(point => new THREE.Vector3(point.x, point.y, point.z));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setDrawRange(0, reducedMotion ? points.length : 0);
    this.line = new THREE.Line(geometry, this.lineMaterial);
    this.line.renderOrder = 5;
    this.group.add(this.line);
    this.originMarker.position.copy(points[0]);
    this.destinationMarker.position.copy(points.at(-1));
    this.destinationMarker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), points.at(-1).clone().normalize());
    this.destinationMarker.scale.setScalar(1);
    this.arrivedAt = null;
    this.group.visible = true;
    this.#placeAirplane(reducedMotion ? 1 : 0);
  }

  #placeAirplane(progress) {
    const position = routePoint(this.route, progress);
    const before = routePoint(this.route, Math.max(0, progress - 0.004));
    const after = routePoint(this.route, Math.min(1, progress + 0.004));
    this.airplane.position.set(position.x, position.y, position.z);
    this.forward.set(after.x - before.x, after.y - before.y, after.z - before.z).normalize();
    this.normal.copy(this.airplane.position).normalize();
    this.right.crossVectors(this.normal, this.forward).normalize();
    this.up.crossVectors(this.forward, this.right).normalize();
    this.matrix.makeBasis(this.right, this.up, this.forward);
    this.airplane.quaternion.setFromRotationMatrix(this.matrix);
  }

  update(timestamp) {
    if (!this.route) return 0;
    if (this.reducedMotion) return 1;
    if (this.completed) {
      const pulse = THREE.MathUtils.clamp((timestamp - this.arrivedAt) / 700, 0, 1);
      this.destinationMarker.scale.setScalar(1 + Math.sin(pulse * Math.PI) * 0.45);
      return 1;
    }
    const linear = THREE.MathUtils.clamp((timestamp - this.startedAt) / FLIGHT_DURATION_MS, 0, 1);
    if (linear <= 0) return 0;
    const eased = linear * linear * (3 - 2 * linear);
    const visiblePoints = Math.max(2, Math.ceil(eased * (this.route.samples.length - 1)) + 1);
    this.line.geometry.setDrawRange(0, visiblePoints);
    this.#placeAirplane(eased);
    if (linear >= 1) {
      this.completed = true;
      this.arrivedAt = timestamp;
    }
    return eased;
  }

  clear() {
    if (this.line) {
      this.group.remove(this.line);
      this.line.geometry.dispose();
      this.line = null;
    }
    this.route = null;
    this.group.visible = false;
  }

  dispose() {
    this.clear();
    this.group.parent?.remove(this.group);
    const geometries = new Set();
    this.group.traverse(object => { if (object.geometry) geometries.add(object.geometry); });
    geometries.forEach(geometry => geometry.dispose());
    this.lineMaterial.dispose();
    this.airplaneMaterial.dispose();
    this.markerMaterial.dispose();
  }
}
