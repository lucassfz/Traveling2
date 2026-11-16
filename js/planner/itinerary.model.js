// Roteiro por dia de uma viagem (Fase 4.5): cidades, regiões, lugares e notas
// distribuídos pelos dias. Fica dentro da viagem (trip.itinerary), então entra
// no armazenamento, no backup, na importação, no link compartilhado e na impressão
// sem caminho paralelo.
//
// Cada item: { id, day, type, name, ref?, context?, lat?, lng?, countryKey?, time?, note? }
//   day   1 = primeiro dia da viagem. A ordem dentro do dia é a ordem da lista.
//   ref   id de destino (geo/destination.id.js): city:BR-gn…, place:Q…, region:BR-BA,
//         country:Japan. Notas livres (type "note") não têm ref.
// O roteiro não guarda preço: custos continuam só nas linhas do orçamento, para
// nada ser contado duas vezes.
import { DESTINATION_ID_RE } from '../geo/destination.id.js';

export const MAX_ITINERARY_ITEMS = 200;
export const MAX_ITINERARY_DAYS = 60;
const TYPES = new Set(['city', 'region', 'place', 'country', 'note']);

const text = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const randomItemId = () => `i_${Math.random().toString(36).slice(2, 10)}`;

export function normalizeItineraryItem(raw, { idFactory = randomItemId } = {}) {
  if (!raw || typeof raw !== 'object' || !TYPES.has(raw.type)) return null;
  const name = text(raw.name, 120);
  const day = Number(raw.day);
  if (!name || !Number.isInteger(day) || day < 1 || day > MAX_ITINERARY_DAYS) return null;
  const ref = raw.type === 'note' ? null : (DESTINATION_ID_RE.test(raw.ref ?? '') && raw.ref.startsWith(`${raw.type}:`) ? raw.ref : null);
  if (raw.type !== 'note' && !ref) return null;
  const item = { id: /^i_[a-z0-9]{4,20}$/i.test(raw.id ?? '') ? raw.id : idFactory(), day, type: raw.type, name };
  if (ref) item.ref = ref;
  if (text(raw.context, 120)) item.context = text(raw.context, 120);
  if (text(raw.countryKey, 60)) item.countryKey = text(raw.countryKey, 60);
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (raw.lat !== null && raw.lat !== undefined && raw.lat !== '' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    Object.assign(item, { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 });
  }
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time ?? '')) item.time = raw.time;
  if (text(raw.note, 280)) item.note = text(raw.note, 280);
  return item;
}

/** Lista limpa: itens inválidos saem, ids repetidos ganham id novo, ordem preservada. */
export function normalizeItinerary(raw, options = {}) {
  const idFactory = options.idFactory ?? randomItemId;
  const items = [];
  const ids = new Set();
  for (const entry of Array.isArray(raw) ? raw : []) {
    const item = normalizeItineraryItem(entry, { idFactory });
    if (!item) continue;
    if (ids.has(item.id)) item.id = idFactory();
    ids.add(item.id);
    items.push(item);
    if (items.length >= MAX_ITINERARY_ITEMS) break;
  }
  return items;
}

/**
 * Dias do roteiro: os dias da viagem (pelas datas ou pela duração) e, se algum
 * item ficou num dia depois do fim (as datas mudaram), os dias até ele — nada é
 * escondido nem apagado. Sem datas nem itens: 1 dia.
 */
export function itineraryDayCount(tripDayCount, items = []) {
  const planned = Number.isInteger(tripDayCount) && tripDayCount > 0 ? Math.min(tripDayCount, MAX_ITINERARY_DAYS) : 0;
  const used = items.reduce((max, item) => Math.max(max, item.day), 0);
  return Math.max(1, planned, used);
}

/** [{ day, date, outside, items }]: date "AAAA-MM-DD" quando a viagem tem ida. */
export function itineraryByDay(trip, tripDayCount) {
  const items = trip?.itinerary ?? [];
  const count = itineraryDayCount(tripDayCount, items);
  const start = trip?.startDate ? Date.parse(`${trip.startDate}T00:00:00Z`) : null;
  return Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    return {
      day,
      date: start === null ? null : new Date(start + index * 86_400_000).toISOString().slice(0, 10),
      outside: Number.isInteger(tripDayCount) && tripDayCount > 0 && day > tripDayCount,
      items: items.filter(item => item.day === day)
    };
  });
}

/** O mesmo destino já está neste dia? (evita duplicar ao tocar duas vezes) */
export function itineraryHas(items, ref, day) {
  return Boolean(ref) && items.some(item => item.ref === ref && (day === undefined || item.day === day));
}

export function addItineraryItem(items, entry, { idFactory } = {}) {
  if (items.length >= MAX_ITINERARY_ITEMS) return { items, added: null, reason: 'full' };
  const item = normalizeItineraryItem({ ...entry, id: undefined }, { idFactory });
  if (!item) return { items, added: null, reason: 'invalid' };
  if (itineraryHas(items, item.ref, item.day)) return { items, added: null, reason: 'duplicate' };
  return { items: [...items, item], added: item, reason: null };
}

export function removeItineraryItem(items, id) {
  return items.filter(item => item.id !== id);
}

/** Horário e anotação (os outros campos não mudam por aqui). */
export function updateItineraryItem(items, id, changes) {
  return items.map(item => {
    if (item.id !== id) return item;
    const next = { ...item };
    if (Object.hasOwn(changes, 'time')) {
      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(changes.time ?? '')) next.time = changes.time;
      else delete next.time;
    }
    if (Object.hasOwn(changes, 'note')) {
      const note = text(changes.note, 280);
      if (note) next.note = note;
      else delete next.note;
    }
    return next;
  });
}

/**
 * Sobe/desce dentro do dia (direction -1/+1) ou leva para outro dia (day), ao
 * fim da lista daquele dia. Fora dos limites, nada muda.
 */
export function moveItineraryItem(items, id, { direction = 0, day = null } = {}) {
  const index = items.findIndex(item => item.id === id);
  if (index < 0) return items;
  const item = items[index];
  if (day !== null) {
    if (!Number.isInteger(day) || day < 1 || day > MAX_ITINERARY_DAYS || day === item.day) return items;
    if (itineraryHas(items, item.ref, day)) return items;
    return [...items.filter(other => other.id !== id), { ...item, day }];
  }
  const sameDay = items.map((other, position) => ({ other, position })).filter(({ other }) => other.day === item.day);
  const at = sameDay.findIndex(({ other }) => other.id === id);
  const target = sameDay[at + direction];
  if (!direction || !target) return items;
  const next = [...items];
  [next[index], next[target.position]] = [next[target.position], next[index]];
  return next;
}
