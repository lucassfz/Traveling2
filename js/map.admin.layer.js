import * as THREE from 'three';
import { geographicToCartesian } from './geospatial.js';
import { inFlatRing, inFlatShape, nearestRegion, shapesBox } from './map.pick.js';

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
const regionUrl = code => new URL(`../data/admin/regions/${code}.json`, import.meta.url);
const HIGHLIGHT_CACHE = 24;

const FOCUS_DISTANCE = 2.15;   // abaixo disso há um país em foco
const STATE_DISTANCE = 1.9;    // divisas e nomes de estados do país em foco
const URBAN_DISTANCE = 1.6;    // contornos urbanos visíveis e clicáveis pela área
const URBAN_PREFETCH = 1.8;    // pede o arquivo de contornos um pouco antes
const MIN_HIT_PX = 12;
const LINE_RADIUS = 1.0105;
const POINT_RADIUS = 1.0095;   // pontos e rótulos usam o mesmo raio: nome centrado no ponto
// Raio das formas de cidade (contornos urbanos, regiões, destaques). O clique é
// calculado nesta mesma esfera: sem isso, a área clicável fica deslocada da
// desenhada (paralaxe), muito perto das bordas da tela.
export const URBAN_RADIUS = 1.0098;
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

// Preenchimento de formas [[anel externo, buraco…], …] em [lng, lat, …]:
// triangulação no plano lng/lat, com triângulos subdivididos até ~0,75° para
// acompanharem a curvatura do globo (senão regiões grandes afundam sob a terra).
function fillGeometry(shapes, radius) {
  const positions = [];
  const push = point => {
    const p = geographicToCartesian(point.y, point.x, radius);
    positions.push(p.x, p.y, p.z);
  };
  const subdivide = (a, b, c, depth) => {
    if (depth >= 6 || Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)) <= 0.75) {
      push(a); push(b); push(c);
      return;
    }
    const ab = a.clone().add(b).multiplyScalar(0.5);
    const bc = b.clone().add(c).multiplyScalar(0.5);
    const ca = c.clone().add(a).multiplyScalar(0.5);
    subdivide(a, ab, ca, depth + 1);
    subdivide(ab, b, bc, depth + 1);
    subdivide(ca, bc, c, depth + 1);
    subdivide(ab, bc, ca, depth + 1);
  };
  const toPoints = ring => {
    const points = [];
    for (let i = 0; i < ring.length; i += 2) points.push(new THREE.Vector2(ring[i], ring[i + 1]));
    if (points.length > 3 && points[0].equals(points.at(-1))) points.pop();
    return points;
  };
  for (const shape of shapes) {
    const outer = toPoints(shape[0]);
    const holes = shape.slice(1).map(toPoints);
    const all = [...outer, ...holes.flat()];
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(outer, holes)) subdivide(all[a], all[b], all[c], 0);
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
    this.hoverLineMaterial = new THREE.LineBasicMaterial({ ...lineOptions, opacity: 0.85 });
    this.hoverFillMaterial = new THREE.MeshBasicMaterial({ ...lineOptions, opacity: 0.12, side: THREE.DoubleSide });
    this.highlights = { selected: null, hover: null };
    this.shapeCache = new Map();   // chave → geometrias de destaque (LRU)
    this.lastPick = null;          // { city, region }: por onde a cidade foi apontada
    this.selectedRegion = null;
    this.dotMaterial = new THREE.PointsMaterial({
      size: 5, sizeAttenuation: false, map: dotTexture(), transparent: true, alphaTest: 0.3,
      depthWrite: false, depthTest: true, clippingPlanes: [clipPlane]
    });
    this.overlay = document.createElement('div');
    this.overlay.className = 'globe-labels';
    this.overlay.setAttribute('aria-hidden', 'true');
    stage.appendChild(this.overlay);
    this.labels = new Map();       // chave do lugar → elemento (o mesmo nó acompanha a cidade)
    this.freeLabels = [];          // elementos livres para reaproveitar
    this.fades = new Map();        // material → { to } (transição de opacidade dos destaques)
    this.lastFrame = performance.now();
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
    // Escolhida pela região (clique fora da mancha urbana): destaca a região inteira.
    this.selectedRegion = city && this.lastPick?.city === city ? this.lastPick.region : null;
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
    // A área inteira da cidade acende sob o ponteiro (exceto a já selecionada).
    const city = item?.kind === 'city' && item.id !== this.selectedCity?.id ? item : null;
    this.#setHighlight('hover', city, city && this.lastPick?.city === city ? this.lastPick.region : null);
    this.#touch();
  }

  /** ISO2 do país cujas cidades estão na tela (o selecionado ou o do centro), ou null. */
  get focusCode() {
    return this.focus?.status === 'ready' ? this.focus.code : null;
  }

  /** Pré-carrega um país (hover) no tempo ocioso: ao clicar, estados e cidades já estão prontos. */
  prefetch(alpha2) {
    if (!/^[A-Z]{2}$/.test(alpha2 ?? '') || this.cache.has(alpha2) || this.prefetchTimer) return;
    const run = () => {
      this.prefetchTimer = 0;
      if (!this.cache.has(alpha2)) this.#ensure(alpha2);
    };
    this.prefetchTimer = 'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 600 }) : setTimeout(run, 150);
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
    // O contorno da cidade selecionada usa uma cor que depende do tema e de a
    // cidade estar no país selecionado: refaz para não ficar com a cor antiga.
    this.#refreshSelectedOutline();
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
    // id = posição no arquivo (compatível com viagens e salvos antigos); geonameId,
    // quando o arquivo já traz a coluna 8, é a identidade estável da cidade.
    record.cities = data.cities.map(([name, lat, lng, population, rank, zone = -1, region = -1, urban = 0, geonameId = null], index) => ({
      id: `${record.code}-${index}`, index, name, population, rank, lat, lng, kind: 'city', country: record.code,
      geonameId: Number.isInteger(geonameId) && geonameId > 0 ? geonameId : null,
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
      // Áreas para o clique: caixa + anéis (com sobreposição, vale a cidade mais próxima; ver pick).
      record.areas = [...record.outlines].map(([index, rings]) => {
        const box = [Infinity, Infinity, -Infinity, -Infinity];
        for (const ring of rings) {
          for (let i = 0; i < ring.length; i += 2) {
            box[0] = Math.min(box[0], ring[i]); box[2] = Math.max(box[2], ring[i]);
            box[1] = Math.min(box[1], ring[i + 1]); box[3] = Math.max(box[3], ring[i + 1]);
          }
        }
        return { city: record.cities[index], rings, box, size: (box[2] - box[0]) * (box[3] - box[1]) };
      }).filter(area => area.city).sort((a, b) => a.size - b.size);
      record.urbanStatus = 'ready';
      this.#refreshSelectedOutline();
      this.#touch();
    }).catch(() => { record.urbanStatus = null; });
  }

  #refreshSelectedOutline() {
    this.#setHighlight('selected', this.selectedCity, this.selectedRegion);
    // A cidade selecionada não precisa mais do destaque de hover.
    if (this.highlights.hover?.city.id === this.selectedCity?.id) this.#setHighlight('hover', null);
  }

  // Geometrias (linhas + preenchimento) de uma forma, guardadas num LRU curto
  // para o hover não refazer a triangulação a cada movimento.
  #shapeGeometries(key, shapes) {
    let entry = this.shapeCache.get(key);
    if (entry) {
      this.shapeCache.delete(key);
      this.shapeCache.set(key, entry);
      return entry;
    }
    const lines = shapes.flat().map(ring => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(ringPositions(ring, URBAN_RADIUS + 0.0002), 3));
      return geometry;
    });
    entry = { lines, fill: fillGeometry(shapes, URBAN_RADIUS), users: 0 };
    this.shapeCache.set(key, entry);
    for (const [oldKey, old] of this.shapeCache) {
      if (this.shapeCache.size <= HIGHLIGHT_CACHE) break;
      if (old.users > 0) continue;
      for (const geometry of [...old.lines, old.fill]) geometry.dispose();
      this.shapeCache.delete(oldKey);
    }
    return entry;
  }

  // Destaque em dois "slots" (seleção e hover). A área é a região da cidade
  // quando ela foi apontada pela região; senão a mancha urbana, se houver.
  // Sobre o país selecionado (preenchido com a cor de destaque), usa a cor do fundo.
  #setHighlight(slot, city, region = null) {
    const current = this.highlights[slot];
    const key = !city ? null : region ? `r:${city.country}:${region.name}` : `u:${city.id}`;
    const onSelectedCountry = Boolean(city) && city.country === this.selectedCode;
    if (current?.key === key && current?.onSelected === onSelectedCountry && key) return;
    for (const object of current?.objects ?? []) this.group.remove(object);
    if (current) current.entry.users -= 1;
    this.highlights[slot] = null;
    if (!city) return;
    const rings = region ? null : this.cache.get(city.country)?.outlines?.get(city.index);
    const shapes = region ? region.polygons : rings?.map(ring => [ring]);
    if (!shapes?.length) return;
    const selected = slot === 'selected';
    const line = selected ? this.urbanSelectedMaterial : this.hoverLineMaterial;
    const fillMaterial = selected ? this.urbanFillMaterial : this.hoverFillMaterial;
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue(onSelectedCountry ? '--color-background' : '--color-accent').trim() || '#7cc9f5';
    line.color.set(color);
    fillMaterial.color.set(color);
    // Acende a partir do transparente. A ordem importa: com "reduzir movimento",
    // #fadeTo já aplica a opacidade final, que não pode ser zerada depois (era o
    // que deixava a área da cidade invisível nesses navegadores).
    fillMaterial.opacity = 0;
    line.opacity = 0;
    this.#fadeTo(fillMaterial, selected ? (onSelectedCountry ? 0.3 : 0.2) : (onSelectedCountry ? 0.16 : 0.1));
    this.#fadeTo(line, selected ? 1 : 0.85);
    const entry = this.#shapeGeometries(key, shapes);
    entry.users += 1;
    const objects = entry.lines.map(geometry => {
      const loop = new THREE.LineLoop(geometry, line);
      loop.renderOrder = selected ? 4.5 : 4.45;
      return loop;
    });
    const fill = new THREE.Mesh(entry.fill, fillMaterial);
    fill.renderOrder = selected ? 4.25 : 4.24;
    objects.push(fill);
    for (const object of objects) this.group.add(object);
    this.highlights[slot] = { city, key, entry, objects, onSelected: onSelectedCountry };
  }

  // Aproxima a opacidade do alvo a cada quadro; com "reduzir movimento", aplica na hora.
  #fadeTo(material, to) {
    if (this.reducedMotion.matches) {
      material.opacity = to;
      this.fades.delete(material);
      this.invalidate();
      return;
    }
    this.fades.set(material, { to });
    this.invalidate();
  }

  #updateFades(now) {
    const step = 1 - Math.exp(-(now - this.lastFrame) / 70);
    this.lastFrame = now;
    for (const [material, fade] of this.fades) {
      material.opacity += (fade.to - material.opacity) * step;
      if (Math.abs(fade.to - material.opacity) < 0.004) {
        material.opacity = fade.to;
        this.fades.delete(material);
      }
    }
    if (this.fades.size) this.invalidate();
  }

  // Regiões do país (área clicável da cidade principal de cada uma).
  #ensureRegions(record) {
    if (record.regionStatus) return;
    record.regionStatus = 'loading';
    fetchJson(regionUrl(record.code)).then(data => {
      record.regionAreas = data.areas.map(([name, seat, ...polygons]) => {
        const box = shapesBox(polygons);
        return { name, city: record.cities[seat] ?? null, polygons, box, size: (box[2] - box[0]) * (box[3] - box[1]) };
      }).sort((a, b) => a.size - b.size);
      record.regionStatus = 'ready';
      this.#touch();
    }).catch(() => { record.regionStatus = 'none'; });
  }

  // Cidade mais próxima de um ponto (regiões sem cidade de 15 mil+).
  #nearestCity(record, lat, lng) {
    const scale = Math.cos(THREE.MathUtils.degToRad(lat));
    let best = null;
    let bestDistance = Infinity;
    for (const city of record.cities) {
      const distance = ((city.lng - lng) * scale) ** 2 + (city.lat - lat) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = city;
      }
    }
    return best;
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
    this.#updateFades(performance.now());
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
    for (const highlight of Object.values(this.highlights)) {
      for (const object of highlight?.objects ?? []) object.visible = highlight.city.country === code;
    }
    if (!record || record.status !== 'ready') {
      this.#renderLabels([]);
      return;
    }
    this.#ensureRegions(record);
    const urbanActive = distance <= URBAN_DISTANCE || code === this.selectedCode;
    if (urbanActive || distance <= URBAN_PREFETCH) this.#ensureUrban(record);

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
      record.urban.visible = urbanActive;
      this.urbanMaterial.opacity = 0.2 + 0.45 * fade(URBAN_DISTANCE, 1.1);
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
      // A cidade sob o ponteiro sempre mostra o nome, mesmo pequena ou encoberta.
      const hovered = city === this.hoveredItem;
      const capital = city.rank === 0 && distance <= CAPITAL_DISTANCE + 0.3;
      const stateCapital = city.rank === 1 && distance <= STATE_CAPITAL_DISTANCE;
      if (!selected && !hovered && !capital && !stateCapital && city.population < minPopulation) continue;
      consider(city, (selected ? 1e12 : hovered ? 1e11 : 0) + (city.rank === 0 ? 1e9 : city.rank === 1 ? 2e6 : 0) + city.population);
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
    const used = new Set();
    for (const { item, x, y } of placed) {
      const key = item.id ?? `s:${item.country}:${item.name}`;
      used.add(key);
      let element = this.labels.get(key);
      if (!element) {
        element = this.freeLabels.pop();
        if (!element) {
          element = document.createElement('span');
          element.innerHTML = '<i class="globe-label__mark"></i><b class="globe-label__text"></b>';
          this.overlay.appendChild(element);
        }
        this.labels.set(key, element);
        element.lastChild.textContent = item.name;
        element.hidden = false;
        // Entrada suave (só opacidade: a posição usa transform a cada quadro).
        if (!this.reducedMotion.matches) element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      }
      let className = item.kind === 'state'
        ? 'globe-label globe-label--state'
        : `globe-label globe-label--city${item.rank === 0 ? ' globe-label--capital' : item.rank === 1 ? ' globe-label--seat' : ''}`;
      if (item.id && item.id === this.selectedCity?.id) className += ' globe-label--selected';
      if (item === this.hoveredItem) className += ' globe-label--hover';
      if (item.country === this.selectedCode) className += ' globe-label--on-selected';
      if (element.className !== className) element.className = className;
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }
    for (const [key, element] of this.labels) {
      if (used.has(key)) continue;
      this.labels.delete(key);
      // Sai esmaecendo; só volta para a reserva quando terminar (não é reaproveitado no meio).
      if (this.reducedMotion.matches || element.hidden) {
        element.hidden = true;
        this.freeLabels.push(element);
        continue;
      }
      element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in' }).onfinish = () => {
        element.hidden = true;
        this.freeLabels.push(element);
      };
    }
  }

  /**
   * Cidade sob o ponteiro (x, y relativos ao palco), ou null. Ordem:
   *   1. nome de cidade visível;
   *   2. mancha urbana que contém o ponto (com sobreposição, a da cidade mais próxima);
   *   3. alvo circular de cidades visíveis sem mancha;
   *   4. região que contém o ponto → cidade principal dela (a região inteira é a
   *      área clicável), ou a cidade mais próxima se a região não tem cidade;
   *      fora de toda região, um nome de estado sob o ponteiro vale pela região;
   *   5. ponto do país fora de toda região (litoral, fronteira) → região mais
   *      próxima; país sem regiões → cidade mais próxima.
   * `lastPick.region` diz se a cidade veio pela região (para destacar a área certa).
   * @param {() => {lat: number, lng: number}|null} surfacePoint  Calculado só se preciso.
   * @param {() => string|null} [countryUnder] ISO2 do país desenhado sob o ponteiro
   *   (o mesmo teste do clique em países); só é chamado no passo 5.
   */
  pick(x, y, surfacePoint = () => null, countryUnder = null) {
    this.lastPick = null;
    const record = this.focus;
    if (!record || record.status !== 'ready') return null;
    const regionOf = name => record.regionAreas?.find(area => area.name === name) ?? null;
    const found = (city, region = null) => {
      if (!city) return null;
      this.lastPick = { city, region };
      return city;
    };
    // Nome de cidade: escolhe a cidade. Nome de estado: só vale onde não há área
    // (sobre o mar, por exemplo). O nome é largo e invade o estado vizinho, e
    // some quando outro nome ocupa o lugar (o da cidade sob o ponteiro): se
    // valesse antes da área, o mesmo ponto mudaria de cidade entre o hover e o
    // clique. Assim, o que decide é a área, igual ao destaque.
    let stateLabel = null;
    for (let index = this.placed.length - 1; index >= 0; index -= 1) {
      const { item, box } = this.placed[index];
      if (x < box[0] - 3 || x > box[2] + 3 || y < box[1] - 3 || y > box[3] + 3) continue;
      if (item.kind === 'city') return found(item);
      stateLabel ??= regionOf(item.name);
    }

    let point;
    const surface = () => (point === undefined ? (point = surfacePoint()) : point);
    const inBox = (box, at) => at.lng >= box[0] && at.lng <= box[2] && at.lat >= box[1] && at.lat <= box[3];

    if (record.areas && surface()) {
      // Mais de uma mancha no ponto (fontes sobrepostas, ou a cidade vizinha
      // dentro da mancha da maior): vale a da cidade mais próxima do ponto. Uma
      // cidade pequena dentro da metrópole continua com a sua área, e a mancha
      // larga de uma vizinha não toma o centro da cidade grande.
      const scale = Math.cos(THREE.MathUtils.degToRad(point.lat));
      let nearest = null;
      let nearestDistance = Infinity;
      for (const area of record.areas) {
        if (!inBox(area.box, point) || !area.rings.some(ring => inFlatRing(ring, point.lng, point.lat))) continue;
        const distance = ((area.city.lng - point.lng) * scale) ** 2 + (area.city.lat - point.lat) ** 2;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = area;
        }
      }
      if (nearest) return found(nearest.city);
    }

    const minimum = tierPopulation(DOT_TIERS, this.distance);
    const labeled = new Set(this.placed.map(({ item }) => item));
    let best = null;
    let bestDistance = MIN_HIT_PX;
    for (const city of record.cities) {
      if ((city.population < minimum && !labeled.has(city)) || (record.areas && city.hasOutline) || !this.#visible(city)) continue;
      const projected = this.#project(city);
      if (!projected) continue;
      const distance = Math.hypot(projected.x - x, projected.y - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = city;
      }
    }
    if (best) return found(best);

    const regionCity = region => (region.city ? found(region.city, region) : found(this.#nearestCity(record, point.lat, point.lng)));
    if (record.regionAreas && surface()) {
      for (const region of record.regionAreas) {
        if (inBox(region.box, point) && region.polygons.some(shape => inFlatShape(shape, point.lng, point.lat))) return regionCity(region);
      }
    }
    if (stateLabel?.city) return found(stateLabel.city, stateLabel);

    // 5. Borda do país: o contorno do globo (world-atlas 1:110m) é mais grosseiro
    //    que o das regiões (Natural Earth 1:10m), e sobram faixas no litoral e nas
    //    fronteiras fora de qualquer região. Ponto dentro do país fica com a
    //    região mais próxima; país sem regiões, com a cidade mais próxima. Assim
    //    todo ponto do país escolhido pertence a uma cidade. O mar, não.
    const waiting = !record.regionStatus || record.regionStatus === 'loading';
    if (waiting || !surface()) return null;
    const under = countryUnder ? countryUnder() : this.countryAt(point.lat, point.lng);
    if (under !== record.code) return null;
    const nearest = record.regionAreas?.length ? nearestRegion(record.regionAreas, point) : null;
    return nearest ? regionCity(nearest) : found(this.#nearestCity(record, point.lat, point.lng));
  }

  hide() {
    this.placed = [];
    this.lastLabelKey = '';
    for (const object of this.focus?.objects ?? []) object.visible = false;
    for (const highlight of Object.values(this.highlights)) for (const object of highlight?.objects ?? []) object.visible = false;
    for (const element of this.labels.values()) {
      element.hidden = true;
      this.freeLabels.push(element);
    }
    this.labels.clear();
  }

  dispose() {
    for (const record of this.cache.values()) for (const object of record.objects) object.geometry.dispose();
    for (const entry of this.shapeCache.values()) for (const geometry of [...entry.lines, entry.fill]) geometry.dispose();
    for (const material of [this.stateMaterial, this.urbanMaterial, this.urbanSelectedMaterial, this.urbanFillMaterial, this.hoverLineMaterial, this.hoverFillMaterial]) material.dispose();
    this.dotMaterial.map?.dispose();
    this.dotMaterial.dispose();
    this.group.parent?.remove(this.group);
    this.overlay.remove();
  }
}
