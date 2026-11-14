// Destinos salvos: países, cidades e lugares que a pessoa quer ver depois.
// Separados das viagens (traveling.trips): salvar nunca cria viagem e excluir
// uma viagem nunca remove um destino salvo.
//
// Identificador estável por tipo, nunca o nome exibido:
//   country:<chave do catálogo>         ex.: country:Japan
//   city:<id da cidade no globo>        ex.: city:BR-174 (data/admin, o mesmo do Planner)
//   city:<id do lugar em data/geo>      ex.: city:BR-BA-porto-seguro (sem par no globo)
// Atenção: o id de data/admin é a POSIÇÃO no arquivo e muda quando o arquivo é
// regenerado. Por isso cada cidade salva guarda também nome, coordenadas e, quando
// existe, o geonameId; a cidade é reencontrada por geo/cities.js#resolveCity, nunca
// só pelo id.
//   place:<Wikidata>                    ex.: place:Q39231
import { STORAGE_KEYS, readJsonStorage, writeJsonStorage } from './core/storage.js';

export const SAVED_SCHEMA_VERSION = 1;
export const MAX_SAVED = 300;
const TYPES = new Set(['country', 'city', 'place']);
const ID_RE = /^(country:[^\s:][^:]{0,59}|city:[A-Z]{2}-[A-Za-z0-9-]{1,60}|place:Q\d{1,12})$/;

const text = (value, max = 120) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const number = value => (Number.isFinite(Number(value)) ? Number(value) : null);

export function normalizeSavedEntry(raw, { countries = null } = {}) {
  if (!raw || typeof raw !== 'object' || !TYPES.has(raw.type) || !ID_RE.test(raw.id ?? '')) return null;
  if (!raw.id.startsWith(`${raw.type}:`)) return null;
  const countryKey = text(raw.countryKey, 60);
  if (!countryKey || (countries && !countries[countryKey])) return null;
  const name = text(raw.name);
  if (!name) return null;
  const lat = number(raw.lat);
  const lng = number(raw.lng);
  const entry = { id: raw.id, type: raw.type, countryKey, name, savedAt: /^\d{4}-\d{2}-\d{2}/.test(raw.savedAt ?? '') ? raw.savedAt.slice(0, 10) : new Date().toISOString().slice(0, 10) };
  if (text(raw.context)) entry.context = text(raw.context);
  if (lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) Object.assign(entry, { lat, lng });
  for (const key of ['cityId', 'placeId', 'divisionId', 'region']) if (text(raw[key], 80)) entry[key] = text(raw[key], 80);
  if (Number.isInteger(raw.geonameId) && raw.geonameId > 0) entry.geonameId = raw.geonameId;
  if (/^https:\/\/(commons|upload)\.wikimedia\.org\//.test(raw.image ?? '')) entry.image = raw.image;
  return entry;
}

export function normalizeSaved(raw, options) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const items = [];
  const ids = new Set();
  for (const item of Array.isArray(source.items) ? source.items : []) {
    const entry = normalizeSavedEntry(item, options);
    if (!entry || ids.has(entry.id)) continue;
    ids.add(entry.id);
    items.push(entry);
    if (items.length >= MAX_SAVED) break;
  }
  return { version: SAVED_SCHEMA_VERSION, items };
}

export function createSavedStore({ countries = null, read = readJsonStorage, write = writeJsonStorage } = {}) {
  let raw = read(STORAGE_KEYS.saved, null);
  let persistent = true;
  // Primeira vez: os países da antiga lista "Quero ir" viram destinos salvos.
  // A chave antiga continua como está.
  if (raw === null) {
    const wishlist = read(STORAGE_KEYS.wishlist, []);
    const items = (Array.isArray(wishlist) ? wishlist : [])
      .filter(key => typeof key === 'string' && (!countries || countries[key]))
      .map(key => ({ id: `country:${key}`, type: 'country', countryKey: key, name: countries?.[key]?.namePt ?? key }));
    raw = { version: SAVED_SCHEMA_VERSION, items };
    if (items.length) persistent = write(STORAGE_KEYS.saved, normalizeSaved(raw, { countries })) !== false;
  }
  let data = normalizeSaved(raw, { countries });
  const listeners = new Set();

  function commit(items) {
    data = normalizeSaved({ items }, { countries });
    persistent = write(STORAGE_KEYS.saved, data) !== false;
    for (const listener of listeners) listener(data.items);
  }

  return {
    get items() { return data.items; },
    get persistent() { return persistent; },
    has(id) { return data.items.some(item => item.id === id); },
    get(id) { return data.items.find(item => item.id === id) ?? null; },
    // Salvar de novo o mesmo destino não duplica: atualiza os dados e mantém a posição.
    save(entry) {
      const clean = normalizeSavedEntry(entry, { countries });
      if (!clean) return null;
      const exists = data.items.some(item => item.id === clean.id);
      commit(exists
        ? data.items.map(item => (item.id === clean.id ? { ...clean, savedAt: item.savedAt } : item))
        : [clean, ...data.items]);
      return this.get(clean.id);
    },
    remove(id) {
      if (!this.has(id)) return false;
      commit(data.items.filter(item => item.id !== id));
      return true;
    },
    toggle(entry) {
      if (this.has(entry.id)) {
        this.remove(entry.id);
        return false;
      }
      return Boolean(this.save(entry));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
