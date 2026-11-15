// Geometria do clique em cidades e regiões (sem Three.js, testável em Node).
// Anéis planos [lng, lat, lng, lat, …]; formas = [anel externo, buraco…].

export function inFlatRing(ring, lng, lat) {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i]; const yi = ring[i + 1];
    const xj = ring[j]; const yj = ring[j + 1];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export const inFlatShape = (shape, lng, lat) => inFlatRing(shape[0], lng, lat) && !shape.slice(1).some(hole => inFlatRing(hole, lng, lat));

/** Caixa [oeste, sul, leste, norte] dos anéis externos. */
export function shapesBox(shapes) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const shape of shapes) {
    const ring = shape[0];
    for (let i = 0; i < ring.length; i += 2) {
      box[0] = Math.min(box[0], ring[i]); box[2] = Math.max(box[2], ring[i]);
      box[1] = Math.min(box[1], ring[i + 1]); box[3] = Math.max(box[3], ring[i + 1]);
    }
  }
  return box;
}

/**
 * Região cuja borda passa mais perto de um ponto (plano lng/lat, com a
 * longitude encolhida pela latitude). Caixas primeiro: só mede as bordas das
 * regiões cuja caixa pode estar mais perto que a melhor até agora.
 * @param {{ polygons: number[][][], box: number[] }[]} regions
 * @param {{ lat: number, lng: number }} point
 */
export function nearestRegion(regions, point) {
  const scale = Math.cos(point.lat * Math.PI / 180);
  const boxGap = box => Math.hypot(
    Math.max(box[0] - point.lng, 0, point.lng - box[2]) * scale,
    Math.max(box[1] - point.lat, 0, point.lat - box[3])
  );
  const ringGap = ring => {
    let best = Infinity;
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
      const ax = (ring[j] - point.lng) * scale; const ay = ring[j + 1] - point.lat;
      const bx = (ring[i] - point.lng) * scale; const by = ring[i + 1] - point.lat;
      const dx = bx - ax; const dy = by - ay;
      const length = dx * dx + dy * dy;
      const t = length ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length)) : 0;
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
    }
    return best;
  };
  let best = null;
  let bestGap = Infinity;
  const byBox = regions.map(region => ({ region, gap: boxGap(region.box) })).sort((a, b) => a.gap - b.gap);
  for (const { region, gap } of byBox) {
    if (gap >= bestGap) break;
    for (const shape of region.polygons) {
      const distance = ringGap(shape[0]);
      if (distance < bestGap) {
        bestGap = distance;
        best = region;
      }
    }
  }
  return best;
}
