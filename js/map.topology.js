import { COUNTRIES, WORLD_ID_TO_NAME, WORLD_KEY_MAP } from './countries.dataset.js';

// The 110m atlas has nameless-ID Kosovo and embeds French Guiana in France.
// Resolve by the source name only when the numeric mapping is unavailable.
export function atlasCountryKey(feature) {
  const id = feature.id == null ? null : String(Number(feature.id));
  const rawName = (id && WORLD_ID_TO_NAME[id]) || feature.properties?.name;
  const key = WORLD_KEY_MAP[rawName] ?? rawName;
  return key && COUNTRIES[key] ? key : null;
}

export function atlasFeatureParts(feature) {
  const key = atlasCountryKey(feature);
  if (key !== 'France' || feature.geometry?.type !== 'MultiPolygon') return [{ key, geometry: feature.geometry }];
  const frenchGuiana = [];
  const metropolitan = [];
  for (const polygon of feature.geometry.coordinates) {
    const outer = polygon?.[0] ?? [];
    const meanLongitude = outer.reduce((sum, point) => sum + point[0], 0) / Math.max(outer.length, 1);
    const meanLatitude = outer.reduce((sum, point) => sum + point[1], 0) / Math.max(outer.length, 1);
    (meanLongitude < -40 && meanLatitude < 15 ? frenchGuiana : metropolitan).push(polygon);
  }
  return [
    { key: 'France', geometry: { type: 'MultiPolygon', coordinates: metropolitan } },
    { key: 'Fr. Guiana', geometry: { type: 'MultiPolygon', coordinates: frenchGuiana } }
  ];
}
