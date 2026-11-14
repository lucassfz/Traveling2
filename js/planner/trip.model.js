// Modelo de viagem do Planner v0. Funções puras: recebem e devolvem objetos
// novos, sem DOM nem armazenamento, para serem testadas em Node.
// Valores sempre em reais (BRL). Datas como texto AAAA-MM-DD (sem fuso horário).

export const TRIP_SCHEMA_VERSION = 1;

// Etapas do Planner, na ordem do passo a passo.
export const PLANNER_STEPS = Object.freeze([
  { id: 'destination', label: 'Destino', title: 'Para onde você vai?' },
  { id: 'dates', label: 'Datas', title: 'Quando e com quem?' },
  { id: 'flight', label: 'Voo', title: 'Como você vai chegar?' },
  { id: 'budget', label: 'Estilo', title: 'Como você quer viajar?' },
  { id: 'prep', label: 'Preparação', title: 'Está tudo pronto?' },
  { id: 'summary', label: 'Resumo', title: 'Sua viagem' }
]);
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

// Categoria de hospedagem usada nas estimativas de gastos no destino.
export const LODGING_LEVELS = Object.freeze({
  hostel: 'Albergue (cama em quarto compartilhado)',
  simple: 'Simples (quarto privativo)',
  comfort: 'Conforto (hotel 3–4★)',
  superior: 'Superior (hotel 4–5★)'
});

// Escolhas do passo a passo: tudo por botões, sem campos de texto.
export const TRIP_DURATIONS = Object.freeze([
  { days: 3, label: 'Fim de semana' },
  { days: 5, label: '5 dias' },
  { days: 7, label: '1 semana' },
  { days: 10, label: '10 dias' },
  { days: 14, label: '2 semanas' },
  { days: 21, label: '3 semanas' },
  { days: 30, label: '1 mês' }
]);
export const TRAVEL_GROUPS = Object.freeze({ solo: 'Sozinho', couple: 'Casal', family: 'Família', friends: 'Amigos' });
export const PAY_OPTIONS = Object.freeze({ cash: 'Dinheiro', miles: 'Milhas', undecided: 'Ainda não sei' });
export const FLIGHT_PREFERENCES = Object.freeze({ direct: 'O mais direto possível', cheapest: 'O mais barato, mesmo com escalas' });
export const TRAVEL_STYLES = Object.freeze({ economic: 'Econômico', balanced: 'Equilibrado', comfort: 'Conforto' });
export const LOCAL_TRANSPORT = Object.freeze({ public: 'Transporte público', car: 'Carro alugado', tours: 'Passeios guiados', mixed: 'Um pouco de tudo' });
export const INTERESTS = Object.freeze({
  culture: 'Cultura e história',
  food: 'Gastronomia',
  nature: 'Natureza',
  beach: 'Praia',
  nightlife: 'Vida noturna',
  shopping: 'Compras',
  adventure: 'Aventura',
  relax: 'Descanso'
});
// Aeroportos de saída oferecidos como opção (os mais usados para voos internacionais).
export const ORIGIN_AIRPORTS = Object.freeze([
  ['GRU', 'São Paulo · Guarulhos'], ['VCP', 'Campinas · Viracopos'], ['GIG', 'Rio de Janeiro · Galeão'],
  ['BSB', 'Brasília'], ['CNF', 'Belo Horizonte · Confins'], ['POA', 'Porto Alegre'], ['CWB', 'Curitiba'],
  ['FLN', 'Florianópolis'], ['SSA', 'Salvador'], ['REC', 'Recife'], ['FOR', 'Fortaleza'], ['NAT', 'Natal'],
  ['BEL', 'Belém'], ['MAO', 'Manaus'], ['GYN', 'Goiânia'], ['VIX', 'Vitória']
]);
const DURATION_DAYS = new Set(TRIP_DURATIONS.map(item => item.days));
const choice = (options, value) => (Object.hasOwn(options, value) ? value : null);

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

function clampStep(value) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(PLANNER_STEPS.length, Math.max(1, number)) : 1;
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
  // Entradas da estimativa (valores por pessoa, por trecho ou por semana), para
  // recalcular a linha quando datas, viajantes, hospedagem ou câmbio mudam.
  if (source.basis && typeof source.basis === 'object') {
    const basis = {};
    for (const [key, value] of Object.entries(source.basis).slice(0, 12)) {
      if (!/^[a-z][a-zA-Z]{0,23}$/.test(key)) continue;
      if (typeof value === 'number' && Number.isFinite(value)) basis[key] = value;
      else if (typeof value === 'string' && value.trim()) basis[key] = text(value, 80);
    }
    if (Object.keys(basis).length) clean.basis = basis;
  }
  return clean;
}

// Moeda original de um gasto (ISO 4217). Real não é guardado: é o padrão.
function lineCurrency(value) {
  const code = String(value ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) && code !== 'BRL' ? code : null;
}

export function normalizeLine(raw, { idFactory = randomId } = {}) {
  if (!raw || typeof raw !== 'object') return null;
  // Gasto em moeda estrangeira: `amount` (na moeda) é a fonte; `amountBRL` é a
  // última conversão, refeita pelo Planner sempre a partir de `amount`.
  const currency = lineCurrency(raw.currency);
  const original = currency ? amount(raw.amount) : null;
  const foreign = currency && original !== null;
  const value = amount(raw.amountBRL) ?? (foreign ? 0 : null);
  if (value === null) return null;
  const fxRate = Number(raw.fx?.rate);
  const fx = foreign && Number.isFinite(fxRate) && fxRate > 0 && isoDate(raw.fx?.date) ? { rate: fxRate, date: raw.fx.date } : null;
  return {
    id: /^[a-z]_[a-z0-9]{4,20}$/i.test(raw.id ?? '') ? raw.id : idFactory('l'),
    category: CATEGORY_IDS.has(raw.category) ? raw.category : 'other',
    note: text(raw.note),
    amountBRL: value,
    status: Object.hasOwn(LINE_STATUSES, raw.status) ? raw.status : 'estimate',
    ...(foreign ? { currency, amount: original } : {}),
    ...(fx ? { fx } : {}),
    ...(normalizeSource(raw.source) ? { source: normalizeSource(raw.source) } : {})
  };
}

// Linha calculada pelo Traveling: valor e descrição não são digitáveis.
export function isEstimateLine(line) {
  return line?.source?.kind === 'traveling-estimate';
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
    lodging: Object.hasOwn(LODGING_LEVELS, raw.lodging) ? raw.lodging : 'simple',
    startDate,
    endDate,
    travelers: clampTravelers(raw.travelers),
    budgetBRL: budget,
    lines,
    step: clampStep(raw.step),
    entryReviewed: raw.entryReviewed === true,
    month: Number.isInteger(raw.month) && raw.month >= 0 && raw.month <= 11 ? raw.month : null,
    duration: DURATION_DAYS.has(raw.duration) ? raw.duration : null,
    group: choice(TRAVEL_GROUPS, raw.group),
    payWith: choice(PAY_OPTIONS, raw.payWith),
    flightPreference: choice(FLIGHT_PREFERENCES, raw.flightPreference),
    style: choice(TRAVEL_STYLES, raw.style),
    transport: choice(LOCAL_TRANSPORT, raw.transport),
    interests: [...new Set(Array.isArray(raw.interests) ? raw.interests : [])].filter(id => Object.hasOwn(INTERESTS, id)),
    ...(miles ? { miles } : {}),
    ...(text(raw.profileId, 60) ? { profileId: text(raw.profileId, 60) } : {})
  };
}

export function createTrip({ countryKey, origin = 'GRU', startDate = null, endDate = null, travelers = 1, budgetBRL = null, profileId = null, step = 1, now = new Date(), idFactory = randomId } = {}) {
  const today = todayIso(now);
  return normalizeTrip({ countryKey, origin, startDate, endDate, travelers, budgetBRL, profileId, step, lines: [], createdAt: today, updatedAt: today }, { idFactory });
}

// Aplica mudanças e devolve uma viagem nova, normalizada e com updatedAt.
export function updateTrip(trip, changes, { now = new Date() } = {}) {
  return normalizeTrip({ ...trip, ...changes, id: trip.id, createdAt: trip.createdAt, updatedAt: todayIso(now) });
}

/**
 * Quais etapas estão concluídas (uma por item de PLANNER_STEPS) e qual é a
 * próxima pendente. O resumo conta como concluído quando as anteriores estão.
 */
export function tripProgress(trip) {
  const lines = trip?.lines ?? [];
  const done = [
    Boolean(trip?.countryKey),
    Boolean(trip?.startDate && trip?.endDate) || (Number.isInteger(trip?.month) && Boolean(trip?.duration)),
    // Viagens antigas (gastos digitados) continuam contando como etapa feita.
    Boolean(trip?.payWith) || lines.some(line => line.category === 'flights') || Boolean(trip?.miles?.fareBRL),
    Boolean(trip?.style) || trip?.budgetBRL !== null && trip?.budgetBRL !== undefined || lines.some(line => line.category !== 'flights'),
    trip?.entryReviewed === true
  ];
  done.push(done.every(Boolean));
  const pending = done.findIndex(value => !value);
  return { done, completed: done.slice(0, -1).filter(Boolean).length, total: done.length - 1, next: pending < 0 ? null : pending + 1 };
}

export function addLine(trip, line, options) {
  if (trip.lines.length >= MAX_LINES) return trip;
  const normalized = normalizeLine(line);
  return normalized ? updateTrip(trip, { lines: [...trip.lines, normalized] }, options) : trip;
}

export function updateLine(trip, lineId, changes, options) {
  return updateTrip(trip, { lines: trip.lines.map(line => {
    if (line.id !== lineId) return line;
    const next = { ...line, ...changes, id: line.id };
    // Voltar para reais: o valor digitado passa a ser o próprio valor em reais.
    if (Object.hasOwn(changes, 'currency') && !lineCurrency(changes.currency)) {
      delete next.currency;
      delete next.amount;
      delete next.fx;
    }
    return next;
  }) }, options);
}

export function removeLine(trip, lineId, options) {
  return updateTrip(trip, { lines: trip.lines.filter(line => line.id !== lineId) }, options);
}

// Dias de viagem, contando o dia de ida e o de volta. Sem as duas datas, usa a
// duração escolhida; null sem nenhuma das duas.
export function tripDays(trip) {
  if (!trip?.startDate || !trip?.endDate) return trip?.duration ?? null;
  return Math.round((Date.parse(`${trip.endDate}T00:00:00Z`) - Date.parse(`${trip.startDate}T00:00:00Z`)) / DAY_MS) + 1;
}

// Noites de hospedagem (dias − 1). null sem as duas datas.
export function tripNights(trip) {
  const days = tripDays(trip);
  return days === null ? null : Math.max(0, days - 1);
}

// Mês (0–11) da data de ida (ou o mês escolhido), para estimativas sazonais e checklist.
export function tripMonth(trip) {
  if (trip?.startDate) return Number(trip.startDate.slice(5, 7)) - 1;
  return Number.isInteger(trip?.month) ? trip.month : null;
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
