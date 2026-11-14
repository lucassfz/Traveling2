import * as THREE from 'three';
import { geographicToCartesian } from './geospatial.js';

// Camada "aproxime para ver mais", no estilo de um globo de mapas:
//   distância ≤ STATE_ALL       → divisas e nomes de estados/províncias de todos os países à vista
//   país selecionado            → as dele já aparecem a partir de STATE_SELECTED
//   aproximando mais            → cidades: pontos para todas e nomes das maiores (CITY_TIERS)
// Cidades e estados são clicáveis (pick), como os países. Os dados vêm de
// data/admin/<ISO2>.json (scripts/build-admin.js), pedidos só para países no
// campo de visão. Rótulos são HTML sobre o canvas, com prevenção de
// sobreposição; divisas e pontos são WebGL recortados no horizonte.

const INDEX_URL = new URL('../data/admin/index.json', import.meta.url);
const countryUrl = code => new URL(`../data/admin/${code}.json`, import.meta.url);

const STATE_SELECTED = 2.15;
const STATE_ALL = 1.8;
const LINE_RADIUS = 1.0105;
const LABEL_RADIUS = 1.008;
const DOT_RADIUS = 1.0095;
const MAX_LOADED = 60;
const PICK_RADIUS_PX = 10;
// [distância máxima, população mínima com nome]; capitais têm faixa própria.
const CITY_TIERS = [
  [1.13, 0],
  [1.22, 50000],
  [1.36, 180000],
  [1.6, 800000],
  [1.85, 3000000]
];
// [distância máxima, população mínima com ponto]: pontos aparecem antes dos nomes.
const DOT_TIERS = [
  [1.22, 0],
  [1.36, 40000],
  [1.6, 150000],
  [1.85, 600000]
];
const CAPITAL_DISTANCE = 1.95;
const STATE_CAPITAL_DISTANCE = 1.55;

const toVector = (lat, lng, radius) => {
  const p = geographicToCartesian(lat, lng, radius);
  return new THREE.Vector3(p.x, p.y, p.z);
};

function tierPopulation(tiers, distance) {
  for (const [maxDistance, population] of tiers) if (distance <= maxDistance) return population;
  return Infinity;
}

function angularDistance(lat1, lng1, lat2, lng2) {
  const r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2
    + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lng2 - lng1) * r / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a))) / r;
}

// Ponto da caixa [oeste, sul, leste, norte] mais perto do centro da vista.
function boxDistance(box, lat, lng) {
  const [west, south, east, north] = box;
  const clampedLat = Math.min(north, Math.max(south, lat));
  if (east - west > 300) return angularDistance(lat, lng, clampedLat, lng); // cruza o antimeridiano
  let clampedLng = lng;
  if (lng < west || lng > east) {
    const toWest = Math.abs(((lng - west + 540) % 360) - 180);
    const toEast = Math.abs(((lng - east + 540) % 360) - 180);
    clampedLng = toWest < toEast ? west : east;
  }
  return angularDistance(lat, lng, clampedLat, clampedLng);
}

// Textura redonda para os pontos de cidade (sem ela, WebGL desenha quadrados).
function dotTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d');
  context.beginPath();
  context.arc(16, 16, 13, 0, Math.PI * 2);
  context.fillStyle = '#fff';
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class AdminLayer {
  constructor({ scene, camera, stage, clipPlane, invalidate }) {
    this.camera = camera;
    this.invalidate = invalidate;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.material = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      clippingPlanes: [clipPlane]
    });
    this.selectedMaterial = this.material.clone();
    this.dotMaterial = new THREE.PointsMaterial({
      size: 5,
      sizeAttenuation: false,
      map: dotTexture(),
      transparent: true,
      alphaTest: 0.3,
      depthWrite: false,
      depthTest: true,
      clippingPlanes: [clipPlane]
    });
    this.overlay = document.createElement('div');
    this.overlay.className = 'globe-labels';
    this.overlay.setAttribute('aria-hidden', 'true');
    stage.appendChild(this.overlay);
    this.pool = [];
    this.placed = [];
    this.index = null;
    this.indexPromise = null;
    this.countries = new Map(); // ISO2 → { status, lines, dots, dotPopulations, cities, divisions, usedAt }
    this.selectedCode = null;
    this.selectedCity = null;
    this.hoveredItem = null;
    this.active = new Set();
    this.distance = Infinity;
    this.size = { width: 1, height: 1 };
    this.projected = new THREE.Vector3();
    this.cameraDirection = new THREE.Vector3();
    this.setTheme();
  }

  setSize(width, height) {
    this.size = { width, height };
  }

  setSelectedCountry(alpha2) {
    this.selectedCode = /^[A-Z]{2}$/.test(alpha2 ?? '') ? alpha2 : null;
    if (this.selectedCode) this.#ensureCountry(this.selectedCode);
    this.invalidate();
  }

  setSelectedCity(city) {
    this.selectedCity = city ?? null;
    this.invalidate();
  }

  setHovered(item) {
    if (this.hoveredItem === item) return;
    this.hoveredItem = item ?? null;
    this.invalidate();
  }

  setTheme() {
    const style = getComputedStyle(document.documentElement);
    const border = style.getPropertyValue('--color-land-border').trim() || '#888';
    const accent = style.getPropertyValue('--color-accent').trim() || border;
    const text = style.getPropertyValue('--color-text-secondary').trim() || '#ccc';
    this.material.color.set(border);
    this.selectedMaterial.color.set(accent);
    this.dotMaterial.color.set(text);
    this.invalidate();
  }

  #loadIndex() {
    if (!this.indexPromise) {
      this.indexPromise = fetch(INDEX_URL)
        .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
        .then(index => { this.index = index; this.invalidate(); return index; })
        .catch(() => {
          // Sem índice, o globo segue só com países; nova tentativa em 60 s.
          setTimeout(() => { this.indexPromise = null; }, 60000);
          return null;
        });
    }
    return this.indexPromise;
  }

  #ensureCountry(code) {
    const existing = this.countries.get(code);
    if (existing) {
      existing.usedAt = performance.now();
      return existing;
    }
    const record = { status: 'loading', usedAt: performance.now() };
    this.countries.set(code, record);
    fetch(countryUrl(code))
      .then(response => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then(data => {
        record.status = 'ready';
        this.#build(code, record, data);
        this.#evict();
        this.invalidate();
      })
      .catch(() => {
        record.status = 'failed';
        setTimeout(() => this.countries.delete(code), 60000);
      });
    return record;
  }

  #build(code, record, data) {
    const positions = [];
    for (const line of data.lines) {
      for (let index = 0; index + 3 < line.length; index += 2) {
        const a = geographicToCartesian(line[index + 1], line[index], LINE_RADIUS);
        const b = geographicToCartesian(line[index + 3], line[index + 2], LINE_RADIUS);
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    if (positions.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      record.lines = new THREE.LineSegments(geometry, this.material);
      record.lines.renderOrder = 4.2;
      record.lines.visible = false;
      this.group.add(record.lines);
    }
    record.divisions = data.divisions.map(([name, lat, lng, type]) => ({
      name, type, lat, lng, kind: 'state', country: code, position: toVector(lat, lng, LABEL_RADIUS)
    }));
    const zones = data.zones ?? [];
    const regions = data.regions ?? [];
    record.cities = data.cities.map(([name, lat, lng, population, rank, zone = -1, region = -1]) => ({
      name, population, rank, lat, lng, kind: 'city', country: code,
      timeZone: zones[zone] ?? null, region: regions[region] ?? null,
      position: toVector(lat, lng, LABEL_RADIUS)
    }));
    // Pontos de todas as cidades, da maior para a menor: o zoom só muda o drawRange.
    const byPopulation = [...record.cities].sort((a, b) => b.population - a.population);
    record.dotPopulations = byPopulation.map(city => city.population);
    const dots = new Float32Array(byPopulation.length * 3);
    byPopulation.forEach((city, index) => {
      const p = geographicToCartesian(city.lat, city.lng, DOT_RADIUS);
      dots.set([p.x, p.y, p.z], index * 3);
    });
    if (byPopulation.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(dots, 3));
      record.dots = new THREE.Points(geometry, this.dotMaterial);
      record.dots.renderOrder = 4.3;
      record.dots.visible = false;
      this.group.add(record.dots);
    }
  }

  // Mantém no máximo MAX_LOADED países em memória, descartando os usados há mais tempo.
  #evict() {
    if (this.countries.size <= MAX_LOADED) return;
    const ready = [...this.countries.entries()]
      .filter(([code, record]) => record.status === 'ready' && code !== this.selectedCode && !this.active.has(code))
      .sort((a, b) => a[1].usedAt - b[1].usedAt);
    for (const [code, record] of ready.slice(0, Math.max(0, this.countries.size - MAX_LOADED))) {
      for (const object of [record.lines, record.dots]) {
        if (!object) continue;
        this.group.remove(object);
        object.geometry.dispose();
      }
      this.countries.delete(code);
    }
  }

  // Raio angular (graus) da superfície visível a partir do centro da tela.
  #viewRadius(distance) {
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const aspect = Math.max(1, this.size.width / Math.max(1, this.size.height));
    const alpha = Math.atan(Math.tan(halfFov) * Math.hypot(1, aspect));
    const horizon = Math.acos(Math.min(1, 1 / distance));
    const ray = distance * Math.sin(alpha);
    const angle = ray >= 1 ? horizon : Math.asin(ray) - alpha;
    return THREE.MathUtils.radToDeg(Math.min(horizon, angle));
  }

  // Chamado a cada quadro desenhado pelo globo (antes do render).
  update() {
    const distance = this.camera.position.length();
    this.distance = distance;
    const selectedActive = this.selectedCode && distance <= STATE_SELECTED;
    if (distance > STATE_ALL && !selectedActive) {
      this.hide();
      return;
    }
    if (!this.index) {
      this.#loadIndex();
      if (selectedActive) this.#ensureCountry(this.selectedCode);
    }

    this.cameraDirection.copy(this.camera.position).normalize();
    const centerLat = THREE.MathUtils.radToDeg(Math.asin(this.cameraDirection.y));
    const centerLng = THREE.MathUtils.radToDeg(Math.atan2(-this.cameraDirection.z, this.cameraDirection.x));
    const radius = this.#viewRadius(distance) + 1.5;

    const active = new Set();
    if (selectedActive) active.add(this.selectedCode);
    if (distance <= STATE_ALL && this.index) {
      for (const [code, box] of Object.entries(this.index.countries)) {
        if (boxDistance(box, centerLat, centerLng) <= radius) active.add(code);
      }
    }
    this.active = active;
    for (const code of active) this.#ensureCountry(code);

    // Opacidade das divisas cresce enquanto a câmera se aproxima.
    const fade = (start, end) => THREE.MathUtils.clamp((start - distance) / (start - end), 0, 1);
    this.material.opacity = 0.22 + 0.33 * fade(STATE_ALL, 1.2);
    this.selectedMaterial.opacity = 0.35 + 0.35 * fade(STATE_SELECTED, 1.4);
    this.dotMaterial.opacity = 0.55 + 0.4 * fade(1.85, 1.2);
    const dotPopulation = tierPopulation(DOT_TIERS, distance);
    for (const [code, record] of this.countries) {
      if (record.status !== 'ready') continue;
      const showAll = distance <= STATE_ALL && active.has(code);
      const isSelected = code === this.selectedCode && selectedActive;
      if (record.lines) {
        record.lines.visible = showAll || isSelected;
        record.lines.material = isSelected ? this.selectedMaterial : this.material;
      }
      if (record.dots) {
        // Populações em ordem decrescente: conta quantas passam do mínimo.
        let count = 0;
        if (showAll || isSelected) {
          const list = record.dotPopulations;
          let low = 0;
          let high = list.length;
          while (low < high) {
            const mid = (low + high) >> 1;
            if (list[mid] >= dotPopulation) low = mid + 1; else high = mid;
          }
          count = low;
        }
        record.dots.visible = count > 0;
        record.dots.geometry.setDrawRange(0, count);
      }
    }
    this.#placeLabels(distance, active);
  }

  #visibleDot(item) {
    return item.position.dot(this.cameraDirection) / LABEL_RADIUS >= 1 / this.distance + 0.012;
  }

  #project(item) {
    this.projected.copy(item.position).project(this.camera);
    if (Math.abs(this.projected.x) > 1.02 || Math.abs(this.projected.y) > 1.02) return null;
    return { x: (this.projected.x + 1) / 2 * this.size.width, y: (1 - this.projected.y) / 2 * this.size.height };
  }

  #placeLabels(distance, active) {
    const minPopulation = tierPopulation(CITY_TIERS, distance);
    const maxLabels = distance < 1.2 ? 130 : 90;
    const candidates = [];
    const consider = (item, priority) => {
      if (!this.#visibleDot(item)) return;
      const point = this.#project(item);
      if (point) candidates.push({ item, priority, ...point });
    };

    for (const code of active) {
      const record = this.countries.get(code);
      if (record?.status !== 'ready') continue;
      const statesVisible = distance <= STATE_ALL || code === this.selectedCode;
      if (statesVisible && distance > 1.15) {
        // Estados competem com as cidades grandes; perto demais, cedem espaço às cidades.
        for (const division of record.divisions) consider(division, distance > 1.4 ? 2e7 : 1e5);
      }
      for (const city of record.cities) {
        const capital = city.rank === 0 && distance <= CAPITAL_DISTANCE;
        const stateCapital = city.rank === 1 && distance <= STATE_CAPITAL_DISTANCE;
        if (!capital && !stateCapital && city.population < minPopulation && city !== this.selectedCity) continue;
        consider(city, (city === this.selectedCity ? 1e12 : 0) + (city.rank === 0 ? 1e9 : city.rank === 1 ? 2e6 : 0) + city.population);
      }
    }

    candidates.sort((a, b) => b.priority - a.priority);
    const placed = [];
    for (const candidate of candidates) {
      if (placed.length >= maxLabels) break;
      const { item } = candidate;
      const charWidth = item.kind === 'state' ? 6.6 : 6.9;
      const labelWidth = item.name.length * charWidth + (item.kind === 'city' ? 14 : 4);
      const labelHeight = item.kind === 'state' ? 14 : 17;
      const box = item.kind === 'state'
        ? [candidate.x - labelWidth / 2, candidate.y - labelHeight / 2, candidate.x + labelWidth / 2, candidate.y + labelHeight / 2]
        : [candidate.x - 5, candidate.y - labelHeight / 2, candidate.x - 5 + labelWidth, candidate.y + labelHeight / 2];
      if (box[2] < 0 || box[0] > this.size.width || box[3] < 0 || box[1] > this.size.height) continue;
      if (placed.some(({ box: other }) => box[0] < other[2] + 4 && box[2] + 4 > other[0] && box[1] < other[3] + 2 && box[3] + 2 > other[1])) continue;
      placed.push({ ...candidate, box });
    }
    this.placed = placed;
    this.#render(placed);
  }

  #render(placed) {
    while (this.pool.length < placed.length) {
      const element = document.createElement('span');
      this.overlay.appendChild(element);
      this.pool.push(element);
    }
    placed.forEach(({ item, x, y }, index) => {
      const element = this.pool[index];
      let className = item.kind === 'state'
        ? 'globe-label globe-label--state'
        : `globe-label globe-label--city${item.rank === 0 ? ' globe-label--capital' : item.rank === 1 ? ' globe-label--seat' : ''}`;
      if (item === this.selectedCity) className += ' globe-label--selected';
      // Rótulos sobre o país selecionado (preenchimento de destaque): cores invertidas.
      if (item.country === this.selectedCode) className += ' globe-label--on-selected';
      if (item === this.hoveredItem) className += ' globe-label--hover';
      if (element.className !== className) element.className = className;
      if (element.textContent !== item.name) element.textContent = item.name;
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      element.hidden = false;
    });
    for (let index = placed.length; index < this.pool.length; index += 1) this.pool[index].hidden = true;
  }

  /**
   * Cidade ou estado sob o ponteiro (coordenadas relativas ao palco), ou null.
   * Primeiro os rótulos visíveis; depois o ponto de cidade mais próximo.
   */
  pick(x, y) {
    if (!this.placed.length && this.distance > STATE_ALL) return null;
    for (let index = this.placed.length - 1; index >= 0; index -= 1) {
      const { item, box } = this.placed[index];
      if (x >= box[0] - 3 && x <= box[2] + 3 && y >= box[1] - 3 && y <= box[3] + 3) return item;
    }
    const dotPopulation = tierPopulation(DOT_TIERS, this.distance);
    if (dotPopulation === Infinity) return null;
    let best = null;
    let bestDistance = PICK_RADIUS_PX ** 2;
    for (const code of this.active) {
      const record = this.countries.get(code);
      if (record?.status !== 'ready') continue;
      for (const city of record.cities) {
        if (city.population < dotPopulation || !this.#visibleDot(city)) continue;
        const point = this.#project(city);
        if (!point) continue;
        const squared = (point.x - x) ** 2 + (point.y - y) ** 2;
        if (squared < bestDistance) {
          bestDistance = squared;
          best = city;
        }
      }
    }
    return best;
  }

  hide() {
    this.placed = [];
    for (const record of this.countries.values()) {
      if (record.lines) record.lines.visible = false;
      if (record.dots) record.dots.visible = false;
    }
    for (const element of this.pool) element.hidden = true;
  }

  dispose() {
    for (const record of this.countries.values()) {
      record.lines?.geometry.dispose();
      record.dots?.geometry.dispose();
    }
    this.material.dispose();
    this.selectedMaterial.dispose();
    this.dotMaterial.map?.dispose();
    this.dotMaterial.dispose();
    this.group.parent?.remove(this.group);
    this.overlay.remove();
  }
}
