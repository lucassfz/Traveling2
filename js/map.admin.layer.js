import * as THREE from 'three';
import { geographicToCartesian } from './geospatial.js';

// Camada "aproxime para ver mais". Mostra estados, cidades e contornos urbanos
// de UM país por vez, o país em foco:
//   1. o país da cidade selecionada, ou o país selecionado (clique);
//   2. senão, o país no centro da tela ao aproximar (sobre o mar mantém o anterior).
//
// Técnicas de desempenho:
//   - Só o país em foco é carregado, montado e desenhado; os demais ficam num
//     cache pequeno (LRU) e são descartados da GPU quando saem dele.
//   - Contornos urbanos (arquivo separado, maior) só são pedidos quando a
//     câmera chega perto o suficiente para vê-los.
//   - O país no centro é recalculado só quando a câmera gira mais que ~0,4°.
//   - Rótulos HTML só são reposicionados quando câmera, foco, seleção ou dados
//     mudam (verificação "suja"); com o globo parado, nada é recalculado.
//   - Pontos de cidade ordenados por população: o zoom só muda o drawRange.
//   - Picking testa só as cidades do país em foco.

const dataUrl = code => new URL(`../data/admin/${code}.json`, import.meta.url);
const urbanUrl = code => new URL(`../data/admin/urban/${code}.json`, import.meta.url);

const FOCUS_DISTANCE = 2.15;   // abaixo disso há um país em foco
const STATE_DISTANCE = 1.9;    // divisas e nomes de estados do país em foco
const URBAN_DISTANCE = 1.45;   // contornos urbanos
const LINE_RADIUS = 1.0105;
const POINT_RADIUS = 1.0095;   // pontos e rótulos usam o mesmo raio: nome centrado no ponto
const URBAN_RADIUS = 1.0098;
const CACHE_SIZE = 6;
const PICK_RADIUS_PX = 11;
// [distância máxima, população mínima com nome]; capitais têm faixa própria.
const CITY_TIERS = [[1.13, 0], [1.22, 50000], [1.36, 180000], [1.6, 600000], [1.9, 2000000]];
// [distância máxima, população mínima com ponto]: pontos aparecem antes dos nomes.
const DOT_TIERS = [[1.25, 0], [1.4, 40000], [1.65, 150000], [1.95, 500000]];
const CAPITAL_DISTANCE = 2.15;
const STATE_CAPITAL_DISTANCE = 1.6;

function tierPopulation(tiers, distance) {
  for (const [maxDistance, population] of tiers) if (distance <= maxDistance) return population;
  return Infinity;
}

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

const toVector = (lat, lng, radius) => {
  const p = geographicToCartesian(lat, lng, radius);
  return new THREE.Vector3(p.x, p.y, p.z);
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Anel [lng, lat, …] → posições na esfera.
function ringPositions(ring, radius) {
  const positions = new Float32Array(ring.length / 2 * 3);
  for (let i = 0, j = 0; i < ring.length; i += 2, j += 3) {
    const p = geographicToCartesian(ring[i + 1], ring[i], radius);
    positions[j] = p.x; positions[j + 1] = p.y; positions[j + 2] = p.z;
  }
  return positions;
}

// Preenchimento do contorno selecionado: triangulação no plano lng/lat (áreas
// urbanas são pequenas o bastante para isso), projetada na esfera.
function fillGeometry(rings, radius) {
  const positions = [];
  for (const ring of rings) {
    const points = [];
    for (let i = 0; i < ring.length; i += 2) points.push(new THREE.Vector2(ring[i], ring[i + 1]));
    if (points.length > 3 && points[0].equals(points.at(-1))) points.pop();
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(points, [])) {
      for (const point of [points[a], points[b], points[c]]) {
        const p = geographicToCartesian(point.y, point.x, radius);
        positions.push(p.x, p.y, p.z);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

export class AdminLayer {
  /**
   * @param {object} deps
   * @param {(lat: number, lng: number) => string|null} deps.countryAt  ISO2 do país num ponto.
   */
  constructor({ scene, camera, stage, clipPlane, invalidate, countryAt }) {
    Object.assign(this, { camera, invalidate, countryAt });
    this.group = new THREE.Group();
    scene.add(this.group);
    const lineOptions = { transparent: true, depthWrite: false, depthTest: true, clippingPlanes: [clipPlane] };
    this.stateMaterial = new THREE.LineBasicMaterial({ ...lineOptions, opacity: 0.4 });
    this.urbanMaterial = new THREE.LineBasicMaterial({ ...lineOptions, opacity: 0.55 });
    this.urbanSelectedMaterial = new THREE.LineBasicMaterial({ ...lineOptions, opacity: 1 });
    this.urbanFillMaterial = new THREE.MeshBasicMaterial({ ...lineOptions, opacity: 0.22, side: THREE.DoubleSide });
    this.dotMaterial = new THREE.PointsMaterial({
      size: 5, sizeAttenuation: false, map: dotTexture(), transparent: true, alphaTest: 0.3,
      depthWrite: false, depthTest: true, clippingPlanes: [clipPlane]
    });
    this.overlay = document.createElement('div');
    this.overlay.className = 'globe-labels';
    this.overlay.setAttribute('aria-hidden', 'true');
    stage.appendChild(this.overlay);
    this.pool = [];
    this.placed = [];
    this.cache = new Map();        // ISO2 → registro (LRU pela ordem de inserção)
    this.selectedCode = null;      // país selecionado no app
    this.selectedCity = null;
    this.hoveredItem = null;
    this.centerCode = null;        // país no centro da tela
    this.lastCenterDirection = new THREE.Vector3();
    this.focus = null;             // registro em foco
    this.distance = Infinity;
    this.size = { width: 1, height: 1 };
    this.projected = new THREE.Vector3();
    this.cameraDirection = new THREE.Vector3();
    this.lastLabelKey = '';
    this.version = 0;              // muda quando dados ou seleção mudam
    this.selectedOutline = null;   // contorno + preenchimento da cidade selecionada
    this.setTheme();
  }

  // ---------- API usada pelo MapEngine ----------

  setSize(width, height) {
    this.size = { width, height };
    this.#touch();
  }

  setSelectedCountry(alpha2) {
    this.selectedCode = /^[A-Z]{2}$/.test(alpha2 ?? '') ? alpha2 : null;
    this.#refreshSelectedOutline();
    this.#touch();
  }

  // Aceita a cidade do globo ou de js/geo/cities.js (mesmo id e índice).
  setSelectedCity(city) {
    this.selectedCity = city ?? null;
    if (city) {
      const record = this.#ensure(city.country);
      record.ready.then(() => {
        if (city.hasOutline) this.#ensureUrban(record);
        this.#touch();
      });
    }
    this.#refreshSelectedOutline();
    this.#touch();
  }

  setHovered(item) {
    if (this.hoveredItem === item) return;
    this.hoveredItem = item ?? null;
    this.#touch();
  }

  /** Cidades do país (carrega o arquivo se preciso). Usado pelo Planner e pela Descoberta. */
  async citiesOf(code) {
    const record = this.#ensure(code);
    await record.ready;
    return record.cities ?? [];
  }

  setTheme() {
    const style = getComputedStyle(document.documentElement);
    const token = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    const border = token('--color-land-border', '#888');
    const accent = token('--color-accent', border);
    const text = token('--color-text-secondary', '#ccc');
    this.stateMaterial.color.set(border);
    this.urbanMaterial.color.set(text);
    this.urbanSelectedMaterial.color.set(accent);
    this.urbanFillMaterial.color.set(accent);
    this.dotMaterial.color.set(text);
    this.colors = { text, background: token('--color-background', '#05070c') };
    this.onSelectedFill = null;
    this.#touch();
  }

  #touch() {
    this.version += 1;
    this.invalidate();
  }

  // ---------- Dados (cache LRU) ----------

  #ensure(code) {
    let record = this.cache.get(code);
    if (record) {
      // Reinsere para marcar como usado recentemente.
      this.cache.delete(code);
      this.cache.set(code, record);
      return record;
    }
    record = { code, status: 'loading', objects: [] };
    record.ready = fetchJson(dataUrl(code))
      .then(data => { this.#build(record, data); record.status = 'ready'; this.#touch(); })
      .catch(() => { record.status = 'failed'; setTimeout(() => this.cache.delete(code), 60000); });
    this.cache.set(code, record);
    this.#evict();
    return record;
  }

  #evict() {
    for (const [code, record] of this.cache) {
      if (this.cache.size <= CACHE_SIZE) break;
      if (record === this.focus || code === this.selectedCode || code === this.selectedCity?.country) continue;
      for (const object of record.objects) {
        this.group.remove(object);
        object.geometry.dispose();
      }
      this.cache.delete(code);
    }
  }

  #add(record, object) {
    object.visible = false;
    record.objects.push(object);
    this.group.add(object);
    return object;
  }

  #build(record, data) {
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
      record.lines = this.#add(record, new THREE.LineSegments(geometry, this.stateMaterial));
      record.lines.renderOrder = 4.2;
    }
    record.divisions = data.divisions.map(([name, lat, lng, type]) => ({
      name, type, lat, lng, kind: 'state', country: record.code, position: toVector(lat, lng, POINT_RADIUS)
    }));
    const zones = data.zones ?? [];
    const regions = data.regions ?? [];
    record.cities = data.cities.map(([name, lat, lng, population, rank, zone = -1, region = -1, urban = 0], index) => ({
      id: `${record.code}-${index}`, index, name, population, rank, lat, lng, kind: 'city', country: record.code,
      timeZone: zones[zone] ?? null, region: regions[region] ?? null, hasOutline: urban === 1,
      position: toVector(lat, lng, POINT_RADIUS)
    }));
    const byPopulation = [...record.cities].sort((a, b) => b.population - a.population);
    record.dotPopulations = byPopulation.map(city => city.population);
    const dots = new Float32Array(byPopulation.length * 3);
    byPopulation.forEach((city, index) => dots.set([city.position.x, city.position.y, city.position.z], index * 3));
    if (byPopulation.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(dots, 3));
      record.dots = this.#add(record, new THREE.Points(geometry, this.dotMaterial));
      record.dots.renderOrder = 4.4;
    }
  }

  // Contornos urbanos: arquivo separado, pedido só quando a câmera chega perto
  // (ou quando uma cidade com contorno é selecionada).
  #ensureUrban(record) {
    if (record.urbanStatus || !record.cities?.some(city => city.hasOutline)) return;
    record.urbanStatus = 'loading';
    fetchJson(urbanUrl(record.code)).then(data => {
      record.outlines = new Map(data.outlines.map(([index, ...rings]) => [index, rings]));
      const positions = [];
      for (const rings of record.outlines.values()) {
        for (const ring of rings) {
          const points = ringPositions(ring, URBAN_RADIUS);
          for (let i = 0; i + 5 < points.length; i += 3) {
            positions.push(points[i], points[i + 1], points[i + 2], points[i + 3], points[i + 4], points[i + 5]);
          }
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      record.urban = this.#add(record, new THREE.LineSegments(geometry, this.urbanMaterial));
      record.urban.renderOrder = 4.3;
      record.urbanStatus = 'ready';
      this.#refreshSelectedOutline();
      this.#touch();
    }).catch(() => { record.urbanStatus = null; });
  }

  // Contorno destacado (linha + preenchimento) da cidade selecionada.
  #refreshSelectedOutline() {
    if (this.selectedOutline) {
      for (const object of this.selectedOutline.objects) {
        this.group.remove(object);
        object.geometry.dispose();
      }
      this.selectedOutline = null;
    }
    const city = this.selectedCity;
    const rings = city ? this.cache.get(city.country)?.outlines?.get(city.index) : null;
    if (!rings) return;
    // Sobre o país selecionado o preenchimento já usa a cor de destaque: o contorno
    // da cidade passa para a cor do fundo para continuar visível.
    const style = getComputedStyle(document.documentElement);
    const onSelectedCountry = city.country === this.selectedCode;
    const color = style.getPropertyValue(onSelectedCountry ? '--color-background' : '--color-accent').trim() || '#7cc9f5';
    this.urbanSelectedMaterial.color.set(color);
    this.urbanFillMaterial.color.set(color);
    this.urbanFillMaterial.opacity = onSelectedCountry ? 0.35 : 0.22;
    const objects = rings.map(ring => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(ringPositions(ring, URBAN_RADIUS + 0.0002), 3));
      const line = new THREE.LineLoop(geometry, this.urbanSelectedMaterial);
      line.renderOrder = 4.5;
      return line;
    });
    const fill = new THREE.Mesh(fillGeometry(rings, URBAN_RADIUS), this.urbanFillMaterial);
    fill.renderOrder = 4.25;
    objects.push(fill);
    for (const object of objects) this.group.add(object);
    this.selectedOutline = { city, objects };
  }

  // ---------- Foco ----------

  #focusCode(distance) {
    const preferred = this.selectedCity?.country ?? this.selectedCode;
    if (preferred && distance <= FOCUS_DISTANCE + 0.3) return preferred;
    if (distance > FOCUS_DISTANCE) return null;
    // País no centro da tela, recalculado só quando a câmera gira o bastante.
    if (!this.centerCode || this.lastCenterDirection.angleTo(this.cameraDirection) > 0.007) {
      this.lastCenterDirection.copy(this.cameraDirection);
      const lat = THREE.MathUtils.radToDeg(Math.asin(this.cameraDirection.y));
      const lng = THREE.MathUtils.radToDeg(Math.atan2(-this.cameraDirection.z, this.cameraDirection.x));
      this.centerCode = this.countryAt(lat, lng) ?? this.centerCode;
    }
    return this.centerCode;
  }

  // ---------- Quadro ----------

  // Chamado a cada quadro desenhado pelo globo (antes do render).
  update() {
    const distance = this.camera.position.length();
    this.distance = distance;
    this.cameraDirection.copy(this.camera.position).normalize();
    const code = this.#focusCode(distance);
    const record = code ? this.#ensure(code) : null;
    if (this.focus !== record) {
      for (const object of this.focus?.objects ?? []) object.visible = false;
      this.focus = record;
      this.version += 1;
    }
    if (this.selectedOutline) {
      for (const object of this.selectedOutline.objects) object.visible = this.selectedOutline.city.country === code;
    }
    if (!record || record.status !== 'ready') {
      this.#renderLabels([]);
      return;
    }
    if (distance <= URBAN_DISTANCE) this.#ensureUrban(record);

    const fade = (start, end) => THREE.MathUtils.clamp((start - distance) / (start - end), 0, 1);
    if (record.lines) {
      record.lines.visible = distance <= STATE_DISTANCE || code === this.selectedCode;
      this.stateMaterial.opacity = 0.3 + 0.35 * fade(STATE_DISTANCE, 1.25);
    }
    // Sobre o preenchimento claro do país selecionado, pontos e contornos usam a cor do fundo.
    const onFill = code === this.selectedCode;
    if (onFill !== this.onSelectedFill) {
      this.onSelectedFill = onFill;
      const color = onFill ? this.colors.background : this.colors.text;
      this.urbanMaterial.color.set(color);
      this.dotMaterial.color.set(color);
    }
    if (record.urban) {
      record.urban.visible = distance <= URBAN_DISTANCE;
      this.urbanMaterial.opacity = 0.25 + 0.4 * fade(URBAN_DISTANCE, 1.1);
    }
    if (record.dots) {
      const minimum = tierPopulation(DOT_TIERS, distance);
      const list = record.dotPopulations;
      let low = 0;
      let high = list.length;
      while (low < high) {
        const mid = (low + high) >> 1;
        if (list[mid] >= minimum) low = mid + 1; else high = mid;
      }
      record.dots.visible = low > 0;
      record.dots.geometry.setDrawRange(0, low);
      this.dotMaterial.opacity = 0.55 + 0.4 * fade(1.95, 1.2);
    }

    // Verificação suja: só reposiciona rótulos se câmera, tamanho, foco, seleção ou dados mudaram.
    const e = this.camera.matrixWorld.elements;
    const key = `${e[12].toFixed(5)},${e[13].toFixed(5)},${e[14].toFixed(5)},${e[0].toFixed(4)},${e[5].toFixed(4)},${this.camera.view?.offsetX ?? 0},${this.version}`;
    if (key === this.lastLabelKey) return;
    this.lastLabelKey = key;
    this.#placeLabels(record, distance);
  }

  #visible(item) {
    return item.position.dot(this.cameraDirection) / POINT_RADIUS >= 1 / this.distance + 0.012;
  }

  #project(item) {
    this.projected.copy(item.position).project(this.camera);
    if (Math.abs(this.projected.x) > 1.02 || Math.abs(this.projected.y) > 1.02) return null;
    return { x: (this.projected.x + 1) / 2 * this.size.width, y: (1 - this.projected.y) / 2 * this.size.height };
  }

  #placeLabels(record, distance) {
    const minPopulation = tierPopulation(CITY_TIERS, distance);
    const maxLabels = distance < 1.2 ? 120 : 80;
    const candidates = [];
    const consider = (item, priority) => {
      if (!this.#visible(item)) return;
      const point = this.#project(item);
      if (point) candidates.push({ item, priority, ...point });
    };
    if ((distance <= STATE_DISTANCE || record.code === this.selectedCode) && distance > 1.15) {
      // Estados competem com as cidades grandes; perto demais, cedem espaço às cidades.
      for (const division of record.divisions) consider(division, distance > 1.45 ? 2e7 : 1e5);
    }
    for (const city of record.cities) {
      const selected = city.id === this.selectedCity?.id;
      const capital = city.rank === 0 && distance <= CAPITAL_DISTANCE + 0.3;
      const stateCapital = city.rank === 1 && distance <= STATE_CAPITAL_DISTANCE;
      if (!selected && !capital && !stateCapital && city.population < minPopulation) continue;
      consider(city, (selected ? 1e12 : 0) + (city.rank === 0 ? 1e9 : city.rank === 1 ? 2e6 : 0) + city.population);
    }

    candidates.sort((a, b) => b.priority - a.priority);
    const placed = [];
    for (const candidate of candidates) {
      if (placed.length >= maxLabels) break;
      const { item, x, y } = candidate;
      const width = item.name.length * (item.kind === 'state' ? 6.6 : 6.9) + 6;
      // Estado: nome centrado no ponto. Cidade: nome centrado logo acima do ponto.
      const box = item.kind === 'state'
        ? [x - width / 2, y - 7, x + width / 2, y + 7]
        : [x - width / 2, y - 22, x + width / 2, y + 4];
      if (box[2] < 0 || box[0] > this.size.width || box[3] < 0 || box[1] > this.size.height) continue;
      if (placed.some(({ box: other }) => box[0] < other[2] + 3 && box[2] + 3 > other[0] && box[1] < other[3] + 2 && box[3] + 2 > other[1])) continue;
      placed.push({ ...candidate, box });
    }
    this.placed = placed;
    this.#renderLabels(placed);
  }

  #renderLabels(placed) {
    if (!placed.length) {
      this.placed = [];
      this.lastLabelKey = '';
    }
    while (this.pool.length < placed.length) {
      const element = document.createElement('span');
      element.innerHTML = '<i class="globe-label__mark"></i><b class="globe-label__text"></b>';
      this.overlay.appendChild(element);
      this.pool.push(element);
    }
    placed.forEach(({ item, x, y }, index) => {
      const element = this.pool[index];
      let className = item.kind === 'state'
        ? 'globe-label globe-label--state'
        : `globe-label globe-label--city${item.rank === 0 ? ' globe-label--capital' : item.rank === 1 ? ' globe-label--seat' : ''}`;
      if (item.id && item.id === this.selectedCity?.id) className += ' globe-label--selected';
      if (item === this.hoveredItem) className += ' globe-label--hover';
      if (item.country === this.selectedCode) className += ' globe-label--on-selected';
      if (element.className !== className) element.className = className;
      const text = element.lastChild;
      if (text.textContent !== item.name) text.textContent = item.name;
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
    const record = this.focus;
    if (!record || record.status !== 'ready') return null;
    for (let index = this.placed.length - 1; index >= 0; index -= 1) {
      const { item, box } = this.placed[index];
      if (x >= box[0] - 3 && x <= box[2] + 3 && y >= box[1] - 3 && y <= box[3] + 3) return item;
    }
    const minimum = tierPopulation(DOT_TIERS, this.distance);
    if (minimum === Infinity) return null;
    let best = null;
    let bestDistance = PICK_RADIUS_PX ** 2;
    for (const city of record.cities) {
      if (city.population < minimum || !this.#visible(city)) continue;
      const point = this.#project(city);
      if (!point) continue;
      const squared = (point.x - x) ** 2 + (point.y - y) ** 2;
      if (squared < bestDistance) {
        bestDistance = squared;
        best = city;
      }
    }
    return best;
  }

  hide() {
    this.placed = [];
    this.lastLabelKey = '';
    for (const object of this.focus?.objects ?? []) object.visible = false;
    for (const object of this.selectedOutline?.objects ?? []) object.visible = false;
    for (const element of this.pool) element.hidden = true;
  }

  dispose() {
    for (const record of this.cache.values()) for (const object of record.objects) object.geometry.dispose();
    for (const object of this.selectedOutline?.objects ?? []) object.geometry.dispose();
    for (const material of [this.stateMaterial, this.urbanMaterial, this.urbanSelectedMaterial, this.urbanFillMaterial]) material.dispose();
    this.dotMaterial.map?.dispose();
    this.dotMaterial.dispose();
    this.group.parent?.remove(this.group);
    this.overlay.remove();
  }
}
