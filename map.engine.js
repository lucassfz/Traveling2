import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  cartesianToGeographic,
  createRafThrottle,
  geometryToPolygons,
  geographicToCartesian,
  prepareGeometry,
  preparedGeometryContains,
  unwrapRing
} from './geospatial.js';
import {
  COUNTRIES,
  CONTINENT_LABELS,
  WORLD_ID_TO_NAME,
  WORLD_KEY_MAP
} from './countries.dataset.js';

const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const GLOBE_RADIUS = 1;
const LAND_RADIUS = 1.007;
const BORDER_RADIUS = 1.012;
// Keep the navigation grid almost flush with the ocean. Country meshes are
// lifted above it, so grid lines cannot bleed through their triangulated area.
const GRATICULE_RADIUS = 1.0005;
const PICK_SURFACE_TOLERANCE = 0.02;
const MAX_RING_CLOSURE_DEGREES = 24;
const HORIZON_CLIP_EPSILON = Math.sin(THREE.MathUtils.degToRad(0.1));
const GLOBE_YAW = 0;
const GLOBE_ORIGIN = new THREE.Vector3(0, 0, 0);

const CONTINENT_COLOR_TOKENS = Object.freeze({
  EU: '--color-continent-europe',
  NA: '--color-continent-north-america',
  SA: '--color-continent-south-america',
  AF: '--color-continent-africa',
  AS: '--color-continent-asia',
  OC: '--color-continent-oceania'
});


async function fetchJsonWithTimeout(url, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { mode: 'cors', cache: 'force-cache', signal: controller.signal });
    if (!response.ok) throw new Error(`Falha ao carregar geometria mundial (${response.status}).`);
    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Tempo limite ao carregar a geometria mundial.');
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function latLngToCartesian(latitude, longitude, radius = 1, yaw = 0, origin = new THREE.Vector3()) {
  const raw = geographicToCartesian(latitude, longitude, radius);
  const vector = new THREE.Vector3(raw.x, raw.y, raw.z);
  if (yaw !== 0) vector.applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
  return vector.add(origin);
}

function cartesianToLatLng(worldPoint, yaw = 0, origin = new THREE.Vector3()) {
  const local = worldPoint.clone().sub(origin);
  if (yaw !== 0) local.applyAxisAngle(THREE.Object3D.DEFAULT_UP, -yaw);
  return cartesianToGeographic(local);
}

const CONTINENT_CAMERA = Object.freeze({
  EU: { lat: 52, lng: 16, distance: 2.15 },
  NA: { lat: 43, lng: -98, distance: 2.35 },
  SA: { lat: -15, lng: -60, distance: 2.25 },
  AF: { lat: 7, lng: 20, distance: 2.35 },
  AS: { lat: 33, lng: 92, distance: 2.5 },
  OC: { lat: -24, lng: 138, distance: 2.25 }
});

function cssToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function colorToken(name) {
  return new THREE.Color(cssToken(name));
}

function normalizeCountryName(rawName) {
  if (!rawName || rawName === 'Antarctica') return null;
  const mapped = WORLD_KEY_MAP[rawName] ?? rawName;
  return COUNTRIES[mapped] ? mapped : null;
}

function ringCenterLongitude(ring) {
  return ring.reduce((sum, [lng]) => sum + lng, 0) / Math.max(1, ring.length);
}

function densifyRing(ring, maximumStepDegrees = 4.5, closeRing = true) {
  const points = [];
  const edgeCount = closeRing ? ring.length : Math.max(0, ring.length - 1);
  for (let index = 0; index < edgeCount; index += 1) {
    const start = ring[index];
    const end = ring[(index + 1) % ring.length];
    points.push(start);
    const midLatitude = THREE.MathUtils.degToRad((start[1] + end[1]) / 2);
    const dx = (end[0] - start[0]) * Math.cos(midLatitude);
    const dy = end[1] - start[1];
    const divisions = Math.min(24, Math.max(1, Math.ceil(Math.hypot(dx, dy) / maximumStepDegrees)));
    for (let step = 1; step < divisions; step += 1) {
      const amount = step / divisions;
      points.push([
        start[0] + (end[0] - start[0]) * amount,
        start[1] + (end[1] - start[1]) * amount
      ]);
    }
  }
  return points;
}

function planarDistance(a, b) {
  const latitude = THREE.MathUtils.degToRad((a[1] + b[1]) / 2);
  return Math.hypot((a[0] - b[0]) * Math.cos(latitude), a[1] - b[1]);
}

function hasStableRingClosure(ring) {
  if (ring.length < 3) return false;
  return planarDistance(ring[0], ring.at(-1)) <= MAX_RING_CLOSURE_DEGREES;
}

function sanitizeRing(rawRing, anchor = null) {
  const unwrapped = unwrapRing(rawRing, anchor);
  const sanitized = [];

  for (const point of unwrapped) {
    const longitude = Number(point?.[0]);
    const latitude = Number(point?.[1]);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;
    if (sanitized.length && planarDistance(sanitized.at(-1), [longitude, latitude]) < 1e-6) continue;
    sanitized.push([longitude, latitude]);
  }

  return sanitized.length >= 3 && hasStableRingClosure(sanitized) ? sanitized : null;
}

function sanitizePolygon(polygon) {
  if (!polygon?.[0]?.length) return null;
  const outer = sanitizeRing(polygon[0]);
  if (!outer) return null;
  const anchor = ringCenterLongitude(outer);
  const holes = polygon.slice(1)
    .map(ring => sanitizeRing(ring, anchor))
    .filter(Boolean);
  return [outer, ...holes];
}

function sanitizeOpenLine(rawLine) {
  if (!Array.isArray(rawLine) || rawLine.length < 2) return [];
  const first = rawLine.find(point => Number.isFinite(Number(point?.[0])) && Number.isFinite(Number(point?.[1])));
  if (!first) return [];
  const line = [[Number(first[0]), Number(first[1])]];

  for (const point of rawLine.slice(rawLine.indexOf(first) + 1)) {
    const rawLongitude = Number(point?.[0]);
    const latitude = Number(point?.[1]);
    if (!Number.isFinite(rawLongitude) || !Number.isFinite(latitude)) continue;
    let longitude = rawLongitude;
    const previousLongitude = line.at(-1)[0];
    while (longitude - previousLongitude > 180) longitude -= 360;
    while (longitude - previousLongitude < -180) longitude += 360;
    if (planarDistance(line.at(-1), [longitude, latitude]) < 1e-6) continue;
    line.push([longitude, latitude]);
  }

  return line;
}

function collectTopologyArcIndexes(value, indexes) {
  if (typeof value === 'number') {
    indexes.add(value < 0 ? ~value : value);
    return;
  }
  if (Array.isArray(value)) value.forEach(item => collectTopologyArcIndexes(item, indexes));
}

function decodeTopologyArc(topology, index) {
  const arc = topology.arcs?.[index];
  if (!Array.isArray(arc)) return [];
  const scale = topology.transform?.scale ?? [1, 1];
  const translate = topology.transform?.translate ?? [0, 0];
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
}

function subdivideTriangle(a, b, c, output, depth = 0) {
  const edges = [
    { pair: 'ab', distance: planarDistance(a, b) },
    { pair: 'bc', distance: planarDistance(b, c) },
    { pair: 'ca', distance: planarDistance(c, a) }
  ].sort((left, right) => right.distance - left.distance);

  // Small spherical triangles stay outside the ocean/graticule surface after
  // projection. Larger planar triangles sag into the globe and expose a
  // straight grid segment through a country.
  if (edges[0].distance < 4 || depth >= 6) {
    output.push([a, b, c]);
    return;
  }

  if (edges[0].pair === 'ab') {
    const midpoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    subdivideTriangle(a, midpoint, c, output, depth + 1);
    subdivideTriangle(midpoint, b, c, output, depth + 1);
  } else if (edges[0].pair === 'bc') {
    const midpoint = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
    subdivideTriangle(a, b, midpoint, output, depth + 1);
    subdivideTriangle(a, midpoint, c, output, depth + 1);
  } else {
    const midpoint = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
    subdivideTriangle(a, b, midpoint, output, depth + 1);
    subdivideTriangle(midpoint, b, c, output, depth + 1);
  }
}

function sphericalGeometryFromShape(shape) {
  const planarGeometry = new THREE.ShapeGeometry(shape, 1);
  const positions = planarGeometry.getAttribute('position');
  const index = planarGeometry.index;
  const triangleCount = index ? index.count : positions.count;
  const triangles = [];
  const read = vertexIndex => [positions.getX(vertexIndex), positions.getY(vertexIndex)];

  for (let cursor = 0; cursor < triangleCount; cursor += 3) {
    const a = read(index ? index.getX(cursor) : cursor);
    const b = read(index ? index.getX(cursor + 1) : cursor + 1);
    const c = read(index ? index.getX(cursor + 2) : cursor + 2);
    subdivideTriangle(a, b, c, triangles);
  }
  planarGeometry.dispose();

  const outputPositions = [];
  const outputNormals = [];
  for (const triangle of triangles) {
    const sphericalPoints = triangle.map(([longitude, latitude]) => (
      latLngToCartesian(latitude, longitude, LAND_RADIUS, GLOBE_YAW, GLOBE_ORIGIN)
    ));
    const [a, b, c] = sphericalPoints;
    const radialNormal = a.clone().add(b).add(c).sub(GLOBE_ORIGIN).normalize();
    const faceNormal = b.clone().sub(a).cross(c.clone().sub(a));

    // Discard zero-area triangles originating in repeated/degenerate source
    // coordinates before they can produce a visible vertical stitch.
    if (faceNormal.lengthSq() < 1e-12 || radialNormal.lengthSq() < 1e-12) continue;

    // ShapeGeometry is planar. Reorienting each transformed triangle makes
    // face culling reliable on the sphere and prevents rear hemisphere faces
    // from leaking through the front surface as dark stitching artifacts.
    if (faceNormal.dot(radialNormal) < 0) [sphericalPoints[1], sphericalPoints[2]] = [sphericalPoints[2], sphericalPoints[1]];

    for (const point of sphericalPoints) {
      const normal = point.clone().sub(GLOBE_ORIGIN).normalize();
      outputPositions.push(point.x, point.y, point.z);
      outputNormals.push(normal.x, normal.y, normal.z);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(outputPositions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(outputNormals, 3));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function polygonToMesh(polygon, material, countryKey, continent) {
  if (!polygon?.[0]?.length) return null;
  const outer = polygon[0];
  const anchor = ringCenterLongitude(outer);
  const shape = new THREE.Shape();
  outer.forEach(([longitude, latitude], index) => {
    if (index === 0) shape.moveTo(longitude, latitude);
    else shape.lineTo(longitude, latitude);
  });

  for (const holeCoordinates of polygon.slice(1)) {
    const hole = holeCoordinates;
    const path = new THREE.Path();
    hole.forEach(([longitude, latitude], index) => {
      if (index === 0) path.moveTo(longitude, latitude);
      else path.lineTo(longitude, latitude);
    });
    shape.holes.push(path);
  }

  const geometry = sphericalGeometryFromShape(shape);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.countryKey = countryKey;
  mesh.userData.continent = continent;
  mesh.renderOrder = 2;
  mesh.updateMatrixWorld(true);
  return mesh;
}

function polygonBorder(polygon, material) {
  const group = new THREE.Group();
  for (const rawRing of polygon) {
    const rawUnwrappedRing = rawRing;
    const closeRing = hasStableRingClosure(rawUnwrappedRing);
    const ring = densifyRing(rawUnwrappedRing, 4.5, closeRing);
    const points = ring.map(([longitude, latitude]) => (
      latLngToCartesian(latitude, longitude, BORDER_RADIUS, GLOBE_YAW, GLOBE_ORIGIN)
    ));
    if (closeRing && points.length) points.push(points[0].clone());
    if (points.length < 2) continue;
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    // A continuous, explicitly closed line preserves valid local edges while
    // avoiding a renderer-generated segment across malformed source rings.
    const line = new THREE.Line(geometry, material);
    line.renderOrder = 4;
    group.add(line);
  }
  return group;
}

export class MapEngine {
  constructor(stageElement, callbacks = {}) {
    this.stage = stageElement;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.02, 100);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.localClippingEnabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setClearAlpha(0);
    this.renderer.domElement.className = 'globe__canvas';
    this.renderer.domElement.tabIndex = 0;
    this.stage.appendChild(this.renderer.domElement);

    this.camera.position.copy(latLngToCartesian(18, -18, 3.05, GLOBE_YAW, GLOBE_ORIGIN));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.16;
    this.controls.maxDistance = 4.8;
    this.controls.rotateSpeed = 0.52;
    this.controls.zoomSpeed = 0.72;
    this.controls.target.copy(GLOBE_ORIGIN);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(2, 2);
    this.raycastMeshes = [];
    this.countryRecords = new Map();
    this.preparedGeometries = new Map();
    this.selectedCountry = null;
    this.hoveredCountry = null;
    this.activeContinent = null;
    this.visitedCountries = new Set();
    this.visaFreeFilterActive = false;
    this.visaFreeCountries = new Set();
    this.cameraFlight = null;
    this.disposed = false;
    // Equivalent to an orthographic clipAngle(89.9): anything on the rear
    // hemisphere is clipped before land/border fragments reach the framebuffer.
    this.horizonClipPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -HORIZON_CLIP_EPSILON);

    this.worldGroup = new THREE.Group();
    this.borderGroup = new THREE.Group();
    this.globalBorderGroup = new THREE.Group();
    this.borderGroup.add(this.globalBorderGroup);
    this.scene.add(this.worldGroup, this.borderGroup);

    this.#createOcean();
    this.#createAtmosphere();
    this.#createGraticule();
    this.#createLights();
    this.#bindPointerEvents();
    this.#bindResize();
    this.setTheme();
  }

  #createOcean() {
    this.oceanMaterial = new THREE.MeshPhysicalMaterial({
      roughness: 0.8,
      metalness: 0,
      clearcoat: 0.04,
      clearcoatRoughness: 0.9,
      ior: 1.33
    });
    this.ocean = new THREE.Mesh(new THREE.SphereGeometry(GLOBE_RADIUS, 80, 56), this.oceanMaterial);
    this.ocean.position.copy(GLOBE_ORIGIN);
    this.ocean.rotation.y = GLOBE_YAW;
    this.ocean.renderOrder = 0;
    this.scene.add(this.ocean);
  }

  #createAtmosphere() {
    // A tiny Fresnel shell defines the circumference without turning the globe
    // into a neon object. It is independent from the land meshes and never
    // participates in picking, so map interaction remains unchanged.
    this.atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        atmosphereColor: { value: colorToken('--color-globe-atmosphere') },
        atmosphereOpacity: { value: 0.11 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = normalize(-viewPosition.xyz);
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 atmosphereColor;
        uniform float atmosphereOpacity;
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          float facing = max(dot(normalize(vNormal), normalize(vViewDirection)), 0.0);
          float rim = pow(1.0 - facing, 2.65);
          gl_FragColor = vec4(atmosphereColor, rim * atmosphereOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide
    });
    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.022, 80, 56),
      this.atmosphereMaterial
    );
    this.atmosphere.position.copy(GLOBE_ORIGIN);
    this.atmosphere.renderOrder = 5;
    this.scene.add(this.atmosphere);
  }

  #createGraticule() {
    this.graticuleGroup = new THREE.Group();
    this.graticuleMaterial = new THREE.LineBasicMaterial({
      color: colorToken('--color-graticule'),
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
      depthTest: true
    });

    const addLine = coordinates => {
      const points = coordinates.map(([latitude, longitude]) => (
        latLngToCartesian(latitude, longitude, GRATICULE_RADIUS, GLOBE_YAW, GLOBE_ORIGIN)
      ));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, this.graticuleMaterial);
      line.renderOrder = 1;
      this.graticuleGroup.add(line);
    };

    // Linhas de 15°: precisão suficiente para navegação, quase invisíveis a 5%.
    for (let latitude = -75; latitude <= 75; latitude += 15) {
      const coordinates = [];
      for (let longitude = -180; longitude <= 180; longitude += 3) {
        coordinates.push([latitude, longitude]);
      }
      addLine(coordinates);
    }

    for (let longitude = -180; longitude < 180; longitude += 15) {
      const coordinates = [];
      for (let latitude = -90; latitude <= 90; latitude += 3) {
        coordinates.push([latitude, longitude]);
      }
      addLine(coordinates);
    }

    this.scene.add(this.graticuleGroup);
  }

  #createLights() {
    this.ambientLight = new THREE.AmbientLight(colorToken('--color-light-ambient'), 0.86);
    this.hemisphereLight = new THREE.HemisphereLight(
      colorToken('--color-light-sky'),
      colorToken('--color-light-ground'),
      1.15
    );
    this.keyLight = new THREE.DirectionalLight(colorToken('--color-light-key'), 2.35);
    this.keyLight.position.set(4.8, 3.1, 5.6);
    this.fillLight = new THREE.DirectionalLight(colorToken('--color-light-fill'), 0.72);
    this.fillLight.position.set(-4.2, 0.4, 3.1);
    this.scene.add(this.ambientLight, this.hemisphereLight, this.keyLight, this.fillLight);
  }

  async init() {
    this.resize();
    if (!this.renderStarted) {
      this.renderStarted = true;
      requestAnimationFrame(timestamp => this.#render(timestamp));
    }
    this.callbacks.onProgress?.('Carregando geometria mundial…');
    const [topology, topojson] = await Promise.all([
      fetchJsonWithTimeout(WORLD_ATLAS_URL, 7000),
      import('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm')
    ]);
    const features = topojson.feature(topology, topology.objects.countries).features;
    this.callbacks.onProgress?.('Construindo países em 3D…');
    this.#buildGlobalBorders(topojson, topology);
    await this.#buildWorld(features);
    this.setTheme();
    this.resize();
    this.callbacks.onReady?.();
  }

  async #buildWorld(features) {
    for (let index = 0; index < features.length; index += 1) {
      const feature = features[index];
      const rawName = WORLD_ID_TO_NAME[String(Number(feature.id))] ?? null;
      const countryKey = normalizeCountryName(rawName);
      if (!countryKey) continue;
      const country = COUNTRIES[countryKey];
      const continent = country.continent;
      const existing = this.countryRecords.get(countryKey);

      const landMaterial = existing?.landMaterial ?? new THREE.MeshStandardMaterial({
        color: colorToken('--color-land'),
        roughness: 0.82,
        metalness: 0,
        // Ring winding from compact TopoJSON is not globally consistent.
        // The horizon plane below supplies the actual back-face clipping,
        // while DoubleSide prevents valid front polygons from disappearing.
        side: THREE.DoubleSide,
        clippingPlanes: [this.horizonClipPlane],
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });
      const borderMaterial = existing?.borderMaterial ?? new THREE.LineBasicMaterial({
        color: colorToken('--color-land-border'),
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        depthTest: true,
        linewidth: 0.75,
        clippingPlanes: [this.horizonClipPlane]
      });
      const group = existing?.group ?? new THREE.Group();
      const borderContainer = existing?.borderContainer ?? new THREE.Group();
      const polygons = geometryToPolygons(feature.geometry)
        .map(sanitizePolygon)
        .filter(Boolean);
      const childCountBefore = group.children.length;

      for (const polygon of polygons) {
        const mesh = polygonToMesh(polygon, landMaterial, countryKey, continent);
        if (mesh) {
          group.add(mesh);
          this.raycastMeshes.push(mesh);
        }
      }

      if (group.children.length === childCountBefore && !existing) {
        landMaterial.dispose();
        borderMaterial.dispose();
        continue;
      }

      if (!existing) {
        group.userData = { countryKey, continent };
        borderContainer.userData = { countryKey, continent };
        borderContainer.visible = true;
        this.worldGroup.add(group);
        this.borderGroup.add(borderContainer);
        this.countryRecords.set(countryKey, {
          group,
          borderContainer,
          landMaterial,
          borderMaterial,
          continent
        });
      }

      const prepared = this.preparedGeometries.get(countryKey) ?? [];
      prepared.push(...prepareGeometry(feature.geometry));
      this.preparedGeometries.set(countryKey, prepared);

      if (index % 16 === 0) {
        this.callbacks.onProgress?.(`Construindo mapa… ${Math.round((index / Math.max(1, features.length - 1)) * 100)}%`);
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    }
    this.worldGroup.updateMatrixWorld(true);
    this.borderGroup.updateMatrixWorld(true);
    this.#refreshCountryMaterials();
  }

  #buildGlobalBorders(_topojson, topology) {
    if (this.globalBorderMaterial || !topology?.arcs) return;
    this.globalBorderMaterial = new THREE.LineBasicMaterial({
      color: colorToken('--color-land-border'),
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      depthTest: true,
      linewidth: 0.5,
      clippingPlanes: [this.horizonClipPlane]
    });

    // Render each compressed arc separately. Stitching arcs into long paths
    // can create a false bridge at a topology junction (the Brazil/Guyana
    // artifact); independent arcs cannot cross-connect in the renderer.
    const arcIndexes = new Set();
    for (const geometry of topology.objects.countries.geometries ?? []) {
      collectTopologyArcIndexes(geometry.arcs, arcIndexes);
    }

    for (const arcIndex of arcIndexes) {
      const rawLine = decodeTopologyArc(topology, arcIndex);
      const cleanLine = sanitizeOpenLine(rawLine);
      if (cleanLine.length < 2) continue;
      const samples = densifyRing(cleanLine, 4.5, false);
      samples.push(cleanLine.at(-1));
      const points = samples.map(([longitude, latitude]) => (
        latLngToCartesian(latitude, longitude, BORDER_RADIUS, GLOBE_YAW, GLOBE_ORIGIN)
      ));
      if (points.length < 2) continue;
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, this.globalBorderMaterial);
      line.renderOrder = 4;
      this.globalBorderGroup.add(line);
    }
  }

  #bindPointerEvents() {
    this.onPointerMove = createRafThrottle((clientX, clientY) => {
      if (this.cameraFlight) return;
      const countryKey = this.pickCountry(clientX, clientY);
      this.#setHovered(countryKey);
      if (countryKey) {
        this.stage.classList.add('globe__stage--interactive');
        this.callbacks.onHover?.(countryKey, clientX, clientY);
      } else {
        this.stage.classList.remove('globe__stage--interactive');
        this.callbacks.onHover?.(null, clientX, clientY);
      }
    }, 24);

    this.pointerDown = null;
    this.renderer.domElement.addEventListener('pointermove', event => {
      this.onPointerMove(event.clientX, event.clientY);
    }, { passive: true });

    this.renderer.domElement.addEventListener('pointerleave', () => {
      this.onPointerMove.cancel();
      this.#setHovered(null);
      this.stage.classList.remove('globe__stage--interactive');
      this.callbacks.onHover?.(null);
    });

    this.renderer.domElement.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      this.pointerDown = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startedAt: performance.now()
      };
      this.renderer.domElement.setPointerCapture?.(event.pointerId);
    });

    this.renderer.domElement.addEventListener('pointerup', event => {
      if (!this.pointerDown || event.pointerId !== this.pointerDown.id || event.button !== 0) return;
      this.renderer.domElement.releasePointerCapture?.(event.pointerId);
      const travel = Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y);
      const duration = performance.now() - this.pointerDown.startedAt;
      this.pointerDown = null;
      if (travel > 7 || duration > 650) return;
      const countryKey = this.pickCountry(event.clientX, event.clientY);
      if (countryKey) this.callbacks.onSelect?.(countryKey);
    });
  }

  #bindResize() {
    this.resizeFrame = 0;
    this.resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => this.resize());
    });
    this.resizeObserver.observe(this.stage);
  }

  #pointerToNdc(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  #findCountryByGeo(latitude, longitude) {
    const matches = [];
    for (const [countryKey, polygons] of this.preparedGeometries.entries()) {
      if (!preparedGeometryContains(polygons, latitude, longitude)) continue;
      const record = this.countryRecords.get(countryKey);
      const continentPriority = record?.continent === this.activeContinent ? 0 : 1;
      const smallestBounds = Math.min(...polygons.map(polygon => (
        Math.max(0.0001, polygon.maxLongitude - polygon.minLongitude)
        * Math.max(0.0001, polygon.maxLatitude - polygon.minLatitude)
      )));
      matches.push({ countryKey, continentPriority, smallestBounds });
    }
    matches.sort((left, right) => (
      left.continentPriority - right.continentPriority
      || left.smallestBounds - right.smallestBounds
    ));
    return matches[0]?.countryKey ?? null;
  }

  pickCountry(clientX, clientY) {
    this.#pointerToNdc(clientX, clientY);
    this.camera.updateMatrixWorld(true);
    this.worldGroup.updateMatrixWorld(true);
    this.borderGroup.updateMatrixWorld(true);
    this.ocean.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // The nearest ocean-sphere intersection is the authoritative FRONT surface.
    // Any land hit behind this distance is on the antipodal/back side of the globe
    // and must never be selectable through the ocean.
    const sphereHit = this.raycaster.intersectObject(this.ocean, false)[0];
    if (!sphereHit) return null;
    const frontSurfaceLimit = sphereHit.distance + PICK_SURFACE_TOLERANCE;

    const landHits = this.raycaster.intersectObjects(this.raycastMeshes, false);
    for (const hit of landHits) {
      if (hit.distance > frontSurfaceLimit) continue;
      const countryKey = hit.object?.userData?.countryKey;
      if (countryKey) return countryKey;
    }

    // Ocean itself is never selectable. The front-surface point is converted back
    // to WGS84 and accepted only if strict point-in-polygon says it is land.
    const { latitude, longitude } = cartesianToLatLng(sphereHit.point, GLOBE_YAW, GLOBE_ORIGIN);
    return this.#findCountryByGeo(latitude, longitude);
  }

  #setHovered(countryKey) {
    if (countryKey === this.hoveredCountry) return;
    const previous = this.hoveredCountry;
    this.hoveredCountry = countryKey;
    if (previous) this.#updateCountryMaterial(previous);
    if (countryKey) this.#updateCountryMaterial(countryKey);
  }

  #countryState(countryKey) {
    if (countryKey === this.selectedCountry) return 'selected';
    if (this.visaFreeFilterActive) {
      if (!this.visaFreeCountries.has(countryKey)) return 'visa-dimmed';
      if (countryKey === this.hoveredCountry) return 'visa-free-hover';
      return 'visa-free';
    }
    if (countryKey === this.hoveredCountry) return 'hover';
    if (this.visitedCountries.has(countryKey)) return 'visited';
    const record = this.countryRecords.get(countryKey);
    if (this.activeContinent && record?.continent !== this.activeContinent) return 'dimmed';
    return 'base';
  }

  #updateCountryMaterial(countryKey) {
    const record = this.countryRecords.get(countryKey);
    if (!record) return;
    const state = this.#countryState(countryKey);
    const visitedColorName = CONTINENT_COLOR_TOKENS[record.continent] ?? '--color-land-visited';
    const colorName = state === 'selected'
      ? '--color-land-selected'
      : state === 'visa-free' || state === 'visa-free-hover'
        ? '--color-land-visa-free'
      : state === 'hover'
        ? '--color-land-hover'
        : state === 'visited'
          ? visitedColorName
          : state === 'dimmed' || state === 'visa-dimmed'
            ? '--color-land-dimmed'
            : '--color-land';
    const borderName = state === 'visited'
      ? visitedColorName
      : state === 'selected'
      ? '--color-border-selected'
      : state === 'visa-free' || state === 'visa-free-hover'
        ? '--color-land-visa-free-border'
        : '--color-land-border';

    const fillColor = colorToken(colorName);
    record.landMaterial.color.copy(fillColor);
    record.landMaterial.emissive.copy(fillColor);
    record.landMaterial.emissiveIntensity = state === 'selected'
      ? 0.13
      : state === 'visa-free-hover'
        ? 0.09
        : state === 'visa-free'
          ? 0.06
          : state === 'hover'
            ? 0.075
            : state === 'visited'
              ? 0.045
              : 0.025;
    record.landMaterial.opacity = state === 'visa-dimmed' ? 0.25 : state === 'dimmed' ? 0.52 : 1;
    record.landMaterial.transparent = state === 'visa-dimmed' || state === 'dimmed';
    const borderColor = colorToken(borderName);
    if (state === 'visited') borderColor.offsetHSL(0, 0, -0.14);
    record.borderMaterial.color.copy(borderColor);
    record.borderMaterial.opacity = state === 'selected'
      ? 1
      : state === 'visa-free-hover'
        ? 1
        : state === 'visa-free'
          ? 0.96
          : state === 'visa-dimmed'
            ? 0.18
            : state === 'hover'
              ? 0.95
              : state === 'dimmed'
                ? 0.28
                : 0.76;
  }

  #refreshCountryMaterials() {
    for (const countryKey of this.countryRecords.keys()) this.#updateCountryMaterial(countryKey);
  }

  selectCountry(countryKey, { fly = true } = {}) {
    const previous = this.selectedCountry;
    this.selectedCountry = countryKey;
    if (previous) this.#updateCountryMaterial(previous);
    if (countryKey) this.#updateCountryMaterial(countryKey);
    if (fly && countryKey) {
      const country = COUNTRIES[countryKey];
      if (country?.latlng) this.flyTo(country.latlng[0], country.latlng[1], 2.02, 880);
    }
  }

  clearSelection() {
    const previous = this.selectedCountry;
    this.selectedCountry = null;
    if (previous) this.#updateCountryMaterial(previous);
  }


  setVisitedCountries(countries) {
    this.visitedCountries = new Set(countries ?? []);
    this.#refreshCountryMaterials();
  }

  setVisaFreeFilter(active, countryKeys = []) {
    this.visaFreeFilterActive = Boolean(active);
    this.visaFreeCountries = new Set(countryKeys ?? []);
    this.#refreshCountryMaterials();
  }

  setContinent(continent) {
    this.activeContinent = continent || null;
    this.#refreshCountryMaterials();
    if (!continent) return;
    const camera = CONTINENT_CAMERA[continent];
    if (camera) this.flyTo(camera.lat, camera.lng, camera.distance, 820);
  }

  home() {
    this.activeContinent = null;
    this.clearSelection();
    this.#refreshCountryMaterials();
    this.flyTo(18, -18, 3.05, 900);
  }

  flyTo(latitude, longitude, distance = 2.05, duration = 850) {
    const startVector = this.camera.position.clone().sub(GLOBE_ORIGIN);
    const startDistance = startVector.length();
    const startDirection = startVector.normalize();
    const endDirection = latLngToCartesian(latitude, longitude, 1, GLOBE_YAW, GLOBE_ORIGIN)
      .sub(GLOBE_ORIGIN)
      .normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(startDirection, endDirection);
    this.cameraFlight = {
      startedAt: performance.now(),
      duration,
      startDirection,
      startDistance,
      endDistance: distance,
      rotation
    };
    this.controls.enabled = false;
  }

  #updateCameraFlight(timestamp) {
    if (!this.cameraFlight) return;
    const flight = this.cameraFlight;
    const linear = THREE.MathUtils.clamp((timestamp - flight.startedAt) / flight.duration, 0, 1);
    const eased = linear < 0.5
      ? 4 * linear ** 3
      : 1 - Math.pow(-2 * linear + 2, 3) / 2;
    const partialRotation = new THREE.Quaternion().slerpQuaternions(
      new THREE.Quaternion(),
      flight.rotation,
      eased
    );
    const direction = flight.startDirection.clone().applyQuaternion(partialRotation).normalize();
    const distance = THREE.MathUtils.lerp(flight.startDistance, flight.endDistance, eased);
    this.camera.position.copy(GLOBE_ORIGIN).add(direction.multiplyScalar(distance));
    this.camera.lookAt(GLOBE_ORIGIN);
    this.camera.updateMatrixWorld(true);
    if (linear >= 1) {
      this.cameraFlight = null;
      this.controls.enabled = true;
      this.controls.target.copy(GLOBE_ORIGIN);
      this.controls.update();
    }
  }

  #updateHorizonClip() {
    const cameraDirection = this.camera.position.clone().sub(GLOBE_ORIGIN).normalize();
    this.horizonClipPlane.normal.copy(cameraDirection);
    this.horizonClipPlane.constant = -HORIZON_CLIP_EPSILON;
  }

  setTheme() {
    const theme = document.documentElement.dataset.theme || 'dark';
    const dark = theme === 'dark';
    this.oceanMaterial.color.copy(colorToken('--color-ocean'));
    this.oceanMaterial.emissive.copy(colorToken('--color-ocean-emissive'));
    this.oceanMaterial.emissiveIntensity = dark ? 0.1 : 0.06;
    this.oceanMaterial.roughness = dark ? 0.82 : 0.78;
    this.oceanMaterial.clearcoat = dark ? 0.03 : 0.05;
    this.atmosphereMaterial.uniforms.atmosphereColor.value.copy(colorToken('--color-globe-atmosphere'));
    this.atmosphereMaterial.uniforms.atmosphereOpacity.value = dark ? 0.12 : 0.045;
    this.graticuleMaterial.color.copy(colorToken('--color-graticule'));
    this.graticuleMaterial.opacity = dark ? 0.055 : 0.05;
    this.globalBorderMaterial?.color.copy(colorToken('--color-land-border'));

    this.ambientLight.color.copy(colorToken('--color-light-ambient'));
    this.hemisphereLight.color.copy(colorToken('--color-light-sky'));
    this.hemisphereLight.groundColor.copy(colorToken('--color-light-ground'));
    this.keyLight.color.copy(colorToken('--color-light-key'));
    this.fillLight.color.copy(colorToken('--color-light-fill'));
    this.ambientLight.intensity = dark ? 0.9 : 0.92;
    this.hemisphereLight.intensity = dark ? 1.12 : 1.02;
    this.keyLight.intensity = dark ? 2.5 : 1.72;
    this.fillLight.intensity = dark ? 0.76 : 0.46;
    this.renderer.toneMappingExposure = dark ? 1.08 : 1;
    this.#refreshCountryMaterials();
  }

  resize() {
    const rect = this.stage.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  #render(timestamp) {
    if (this.disposed) return;
    requestAnimationFrame(nextTimestamp => this.#render(nextTimestamp));
    this.#updateCameraFlight(timestamp);
    if (!this.cameraFlight) this.controls.update();
    this.#updateHorizonClip();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.onPointerMove?.cancel?.();
    this.resizeObserver?.disconnect();
    cancelAnimationFrame(this.resizeFrame);
    this.controls.dispose();

    for (const record of this.countryRecords.values()) {
      record.group.traverse(object => object.geometry?.dispose?.());
      record.borderContainer.traverse(object => object.geometry?.dispose?.());
      record.landMaterial.dispose();
      record.borderMaterial.dispose();
    }
    this.ocean.geometry.dispose();
    this.oceanMaterial.dispose();
    this.atmosphere.geometry.dispose();
    this.atmosphereMaterial.dispose();
    this.graticuleGroup.traverse(object => object.geometry?.dispose?.());
    this.graticuleMaterial.dispose();
    this.globalBorderGroup.traverse(object => object.geometry?.dispose?.());
    this.globalBorderMaterial?.dispose();
    this.renderer.dispose();
  }
}

export { CONTINENT_LABELS };
