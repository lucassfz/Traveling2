// Modelo de viagem do Planner v0. Funções puras: recebem e devolvem objetos
// novos, sem DOM nem armazenamento, para serem testadas em Node.
// Valores sempre em reais (BRL). Datas como texto AAAA-MM-DD (sem fuso horário).

export const TRIP_SCHEMA_VERSION = 1;
export const MAX_TRAVELERS = 9;
export const MAX_LINES = 60;
const MAX_AMOUNT = 10_000_000;
const MAX_TEXT = 120;

export const BUDGET_CATEGORIES = Object.freeze([
  { id: 'flights', label: 'Voos' },
  { id: 'lodging', label: 'Hospedagem' },
  { id: 'food', label: 'Alimentação' },
  { id: 'transport', label: 'Transporte local' },
  { id: 'activities', label: 'Passeios' },
  { id: 'insurance', label: 'Seguro e documentos' },
  { id: 'local', label: 'Gastos no destino' },
  { id: 'other', label: 'Outros' }
]);

// estimate = valor sugerido ou chutado; quote = preço encontrado pelo usuário;
// paid = já pago.
export const LINE_STATUSES = Object.freeze({
  estimate: 'Estimativa',
  quote: 'Cotação',
  paid: 'Pago'
});

const CATEGORY_IDS = new Set(BUDGET_CATEGORIES.map(category => category.id));
const DAY_MS = 86_400_000;

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function text(value, max = MAX_TEXT) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function amount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.min(Math.round(number * 100) / 100, MAX_AMOUNT) : null;
}

// Aceita só datas reais no formato AAAA-MM-DD.
export function isoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? match[0] : null;
}

function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function clampTravelers(value) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(MAX_TRAVELERS, Math.max(1, number)) : 1;
}

function airportCode(value) {
  const code = String(value ?? '').trim().toUpperCase();
  return /^[A-Z0-9]{3,4}$/.test(code) ? code : 'GRU';
}

// Procedência de uma linha sugerida pelo Traveling (nunca obrigatória).
function normalizeSource(source) {
  if (!source || typeof source !== 'object') return null;
  const kind = ['traveling-estimate', 'user'].includes(source.kind) ? source.kind : null;
  if (!kind) return null;
  const clean = { kind };
  for (const key of ['model', 'detail', 'fx', 'reviewedOn']) if (source[key]) clean[key] = text(source[key], 200);
  return clean;
}

export function normalizeLine(raw, { idFactory = randomId } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const value = amount(raw.amountBRL);
  if (value === null) return null;
  return {
    id: /^[a-z]_[a-z0-9]{4,20}$/i.test(raw.id ?? '') ? raw.id : idFactory('l'),
    category: CATEGORY_IDS.has(raw.category) ? raw.category : 'other',
    note: text(raw.note),
    amountBRL: value,
    status: Object.hasOwn(LINE_STATUSES, raw.status) ? raw.status : 'estimate',
    ...(normalizeSource(raw.source) ? { source: normalizeSource(raw.source) } : {})
  };
}

function normalizeMiles(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const miles = {};
  for (const key of ['fareBRL', 'points', 'taxesBRL', 'myCostPer1000BRL']) {
    if (raw[key] === null || raw[key] === undefined || raw[key] === '') continue;
    const value = amount(raw[key]);
    if (value !== null) miles[key] = value;
  }
  return Object.keys(miles).length ? miles : null;
}

/**
 * Limpa um objeto vindo do armazenamento (ou de qualquer lugar). Devolve null
 * quando não dá para recuperar uma viagem com destino.
 */
export function normalizeTrip(raw, { countries = null, idFactory = randomId } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const countryKey = text(raw.countryKey, 60);
  if (!countryKey || (countries && !countries[countryKey])) return null;
  let startDate = isoDate(raw.startDate);
  let endDate = isoDate(raw.endDate);
  if (startDate && endDate && endDate < startDate) [startDate, endDate] = [endDate, startDate];
  const budget = raw.budgetBRL === null || raw.budgetBRL === '' || raw.budgetBRL === undefined ? null : amount(raw.budgetBRL);
  const lines = (Array.isArray(raw.lines) ? raw.lines : [])
    .map(line => normalizeLine(line, { idFactory }))
    .filter(Boolean)
    .slice(0, MAX_LINES);
  const seen = new Set();
  for (const line of lines) {
    if (seen.has(line.id)) line.id = idFactory('l');
    seen.add(line.id);
  }
  const miles = normalizeMiles(raw.miles);
  return {
    id: /^t_[a-z0-9]{4,20}$/i.test(raw.id ?? '') ? raw.id : idFactory('t'),
    createdAt: isoDate(raw.createdAt) ?? todayIso(),
    updatedAt: isoDate(raw.updatedAt) ?? isoDate(raw.createdAt) ?? todayIso(),
    countryKey,
    origin: airportCode(raw.origin),
    cabin: ['economy', 'premium', 'business'].includes(raw.cabin) ? raw.cabin : 'economy',
    startDate,
    endDate,
    travelers: clampTravelers(raw.travelers),
    budgetBRL: budget,
    lines,
    ...(miles ? { miles } : {}),
    ...(text(raw.profileId, 60) ? { profileId: text(raw.profileId, 60) } : {})
  };
}

export function createTrip({ countryKey, origin = 'GRU', startDate = null, endDate = null, travelers = 1, budgetBRL = null, profileId = null, now = new Date(), idFactory = randomId } = {}) {
  const today = todayIso(now);
  return normalizeTrip({ countryKey, origin, startDate, endDate, travelers, budgetBRL, profileId, lines: [], createdAt: today, updatedAt: today }, { idFactory });
}

// Aplica mudanças e devolve uma viagem nova, normalizada e com updatedAt.
export function updateTrip(trip, changes, { now = new Date() } = {}) {
  return normalizeTrip({ ...trip, ...changes, id: trip.id, createdAt: trip.createdAt, updatedAt: todayIso(now) });
}

export function addLine(trip, line, options) {
  if (trip.lines.length >= MAX_LINES) return trip;
  const normalized = normalizeLine(line);
  return normalized ? updateTrip(trip, { lines: [...trip.lines, normalized] }, options) : trip;
}

export function updateLine(trip, lineId, changes, options) {
  return updateTrip(trip, { lines: trip.lines.map(line => line.id === lineId ? { ...line, ...changes, id: line.id } : line) }, options);
}

export function removeLine(trip, lineId, options) {
  return updateTrip(trip, { lines: trip.lines.filter(line => line.id !== lineId) }, options);
}

// Dias de viagem, contando o dia de ida e o de volta. null sem as duas datas.
export function tripDays(trip) {
  if (!trip?.startDate || !trip?.endDate) return null;
  return Math.round((Date.parse(`${trip.endDate}T00:00:00Z`) - Date.parse(`${trip.startDate}T00:00:00Z`)) / DAY_MS) + 1;
}

// Mês (0–11) da data de ida, para estimativas sazonais e checklist.
export function tripMonth(trip) {
  return trip?.startDate ? Number(trip.startDate.slice(5, 7)) - 1 : null;
}

const round2 = value => Math.round(value * 100) / 100;

export function tripTotals(trip) {
  const byStatus = Object.fromEntries(Object.keys(LINE_STATUSES).map(status => [status, 0]));
  const byCategory = Object.fromEntries(BUDGET_CATEGORIES.map(category => [category.id, 0]));
  let total = 0;
  for (const line of trip?.lines ?? []) {
    total += line.amountBRL;
    byStatus[line.status] += line.amountBRL;
    byCategory[line.category] += line.amountBRL;
  }
  total = round2(total);
  const budget = trip?.budgetBRL ?? null;
  return {
    total,
    perPerson: round2(total / (trip?.travelers || 1)),
    byStatus: Object.fromEntries(Object.entries(byStatus).map(([key, value]) => [key, round2(value)])),
    byCategory: Object.fromEntries(Object.entries(byCategory).map(([key, value]) => [key, round2(value)])),
    budget,
    remaining: budget === null ? null : round2(budget - total),
    overBudget: budget !== null && total > budget,
    paidShare: total > 0 ? round2(byStatus.paid / total) : 0
  };
}

// Conjunto salvo: { version, activeTripId, trips }. Qualquer coisa inválida vira
// um conjunto vazio, sem lançar exceção.
export function normalizeStore(raw, { countries = null } = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const trips = [];
  const ids = new Set();
  for (const item of Array.isArray(source.trips) ? source.trips : []) {
    const trip = normalizeTrip(item, { countries });
    if (!trip || ids.has(trip.id)) continue;
    ids.add(trip.id);
    trips.push(trip);
  }
  const activeTripId = ids.has(source.activeTripId) ? source.activeTripId : trips[0]?.id ?? null;
  return { version: TRIP_SCHEMA_VERSION, activeTripId, trips };
}
