// Validação estrita das requisições de busca (§8 do documento da fase 3.1).
// Funções puras: recebem o corpo já decodificado e devolvem a requisição
// normalizada, ou lançam ApiError com o campo problemático. Campos
// desconhecidos são rejeitados (evita que o front dependa de algo não suportado).
import { ApiError, CABINS, LIMITS } from './contract.js';
import { IATA_CODES } from './airports.generated.js';

let iataSet = null;
export function isKnownIata(code) {
  if (!iataSet) {
    iataSet = new Set();
    for (let index = 0; index < IATA_CODES.length; index += 3) iataSet.add(IATA_CODES.slice(index, index + 3));
  }
  return iataSet.has(code);
}

const DAY_MS = 86_400_000;

function fail(code, message, field) {
  throw new ApiError(code, message, { field });
}

function plainObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_REQUEST', `${field} precisa ser um objeto.`, field);
  return value;
}

function onlyKeys(object, allowed, prefix = '') {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) fail('INVALID_REQUEST', `Campo não suportado: ${prefix}${key}.`, `${prefix}${key}`);
  }
}

function integer(value, { field, min, max, fallback, code = 'INVALID_REQUEST' }) {
  if (value === undefined && fallback !== undefined) return fallback;
  if (!Number.isInteger(value) || value < min || value > max) fail(code, `${field} precisa ser um inteiro entre ${min} e ${max}.`, field);
  return value;
}

// 'AAAA-MM-DD' real → número de dias desde 1970 (UTC), ou erro.
function dateDay(value, field) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!match) fail('INVALID_DATES', `${field} precisa estar no formato AAAA-MM-DD.`, field);
  const [year, month, day] = match.slice(1).map(Number);
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) fail('INVALID_DATES', `${field} não é uma data válida.`, field);
  return time / DAY_MS;
}

// "Hoje" com um dia de folga para trás: quem está a oeste de UTC ainda pode estar no dia anterior.
function today(now) {
  return Math.floor(now.getTime() / DAY_MS) - 1;
}

function currency(value) {
  if (value === undefined) return null;
  if (!/^[A-Z]{3}$/.test(value ?? '')) fail('INVALID_REQUEST', 'currency precisa ser um código ISO 4217, como BRL.', 'currency');
  return value;
}

function airport(value, field) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^[A-Z]{3}$/.test(code)) fail('INVALID_AIRPORT', `${field} precisa ser um código IATA de 3 letras.`, field);
  if (!isKnownIata(code)) fail('INVALID_AIRPORT', `Aeroporto ${code} não encontrado.`, field);
  return code;
}

/** @returns {{origin, destination, departureDate, returnDate, passengers, cabin, currency, maxResults}} */
export function validateFlightSearch(body, { now = new Date() } = {}) {
  plainObject(body, 'body');
  onlyKeys(body, ['origin', 'destination', 'departureDate', 'returnDate', 'passengers', 'cabin', 'currency', 'maxResults']);
  const origin = airport(body.origin, 'origin');
  const destination = airport(body.destination, 'destination');
  if (origin === destination) fail('INVALID_ROUTE', 'Origem e destino precisam ser diferentes.', 'destination');

  const departure = dateDay(body.departureDate, 'departureDate');
  const start = today(now);
  if (departure < start) fail('INVALID_DATES', 'A ida não pode ser no passado.', 'departureDate');
  if (departure > start + 1 + LIMITS.maxDaysAhead) fail('INVALID_DATES', `A ida precisa ser em até ${LIMITS.maxDaysAhead} dias.`, 'departureDate');
  let returnDate = null;
  if (body.returnDate !== undefined && body.returnDate !== null) {
    const back = dateDay(body.returnDate, 'returnDate');
    if (back < departure) fail('INVALID_DATES', 'A volta precisa ser no mesmo dia ou depois da ida.', 'returnDate');
    if (back > start + 1 + LIMITS.maxDaysAhead) fail('INVALID_DATES', `A volta precisa ser em até ${LIMITS.maxDaysAhead} dias.`, 'returnDate');
    returnDate = body.returnDate;
  }

  const passengers = plainObject(body.passengers ?? { adults: 1 }, 'passengers');
  onlyKeys(passengers, ['adults', 'children', 'infants'], 'passengers.');
  const adults = integer(passengers.adults, { field: 'passengers.adults', min: 1, max: LIMITS.maxPassengers, code: 'INVALID_PASSENGERS' });
  const children = integer(passengers.children, { field: 'passengers.children', min: 0, max: LIMITS.maxPassengers, fallback: 0, code: 'INVALID_PASSENGERS' });
  const infants = integer(passengers.infants, { field: 'passengers.infants', min: 0, max: LIMITS.maxPassengers, fallback: 0, code: 'INVALID_PASSENGERS' });
  if (infants > adults) fail('INVALID_PASSENGERS', 'Cada bebê de colo precisa de um adulto.', 'passengers.infants');
  if (adults + children + infants > LIMITS.maxPassengers) fail('INVALID_PASSENGERS', `No máximo ${LIMITS.maxPassengers} passageiros por busca.`, 'passengers');

  const cabin = body.cabin ?? 'economy';
  if (!CABINS.includes(cabin)) fail('UNSUPPORTED_CABIN', `cabin precisa ser uma de: ${CABINS.join(', ')}.`, 'cabin');

  return {
    origin,
    destination,
    departureDate: body.departureDate,
    returnDate,
    passengers: { adults, children, infants },
    cabin,
    currency: currency(body.currency),
    maxResults: integer(body.maxResults, { field: 'maxResults', min: 1, max: LIMITS.maxResults, fallback: LIMITS.defaultResults })
  };
}

/** @returns {{destination, checkIn, checkOut, nights, guests, rooms, currency, maxResults}} */
export function validateHotelSearch(body, { now = new Date() } = {}) {
  plainObject(body, 'body');
  onlyKeys(body, ['destination', 'checkIn', 'checkOut', 'guests', 'rooms', 'currency', 'maxResults']);
  const destination = plainObject(body.destination, 'destination');
  onlyKeys(destination, ['lat', 'lng', 'radiusKm', 'label'], 'destination.');
  const lat = Number(destination.lat);
  const lng = Number(destination.lng);
  if (typeof destination.lat !== 'number' || !(Math.abs(lat) <= 90)) fail('INVALID_DESTINATION', 'destination.lat precisa ser um número entre -90 e 90.', 'destination.lat');
  if (typeof destination.lng !== 'number' || !(Math.abs(lng) <= 180)) fail('INVALID_DESTINATION', 'destination.lng precisa ser um número entre -180 e 180.', 'destination.lng');
  const radiusKm = destination.radiusKm === undefined ? LIMITS.defaultRadiusKm : Number(destination.radiusKm);
  if (typeof (destination.radiusKm ?? 0) !== 'number' || !(radiusKm > 0 && radiusKm <= LIMITS.maxRadiusKm)) fail('INVALID_DESTINATION', `destination.radiusKm precisa estar entre 0 e ${LIMITS.maxRadiusKm}.`, 'destination.radiusKm');
  const label = destination.label === undefined ? null : String(destination.label).replace(/\s+/g, ' ').trim().slice(0, 80) || null;

  const checkIn = dateDay(body.checkIn, 'checkIn');
  const checkOut = dateDay(body.checkOut, 'checkOut');
  const start = today(now);
  if (checkIn < start) fail('INVALID_DATES', 'O check-in não pode ser no passado.', 'checkIn');
  if (checkIn > start + 1 + LIMITS.maxDaysAhead) fail('INVALID_DATES', `O check-in precisa ser em até ${LIMITS.maxDaysAhead} dias.`, 'checkIn');
  const nights = checkOut - checkIn;
  if (nights < 1) fail('INVALID_DATES', 'O check-out precisa ser depois do check-in.', 'checkOut');
  if (nights > LIMITS.maxNights) fail('INVALID_DATES', `No máximo ${LIMITS.maxNights} noites por busca.`, 'checkOut');

  const guests = plainObject(body.guests ?? { adults: 1 }, 'guests');
  onlyKeys(guests, ['adults', 'children', 'childAges'], 'guests.');
  const adults = integer(guests.adults, { field: 'guests.adults', min: 1, max: LIMITS.maxPassengers, code: 'INVALID_PASSENGERS' });
  const children = integer(guests.children, { field: 'guests.children', min: 0, max: LIMITS.maxPassengers, fallback: 0, code: 'INVALID_PASSENGERS' });
  const childAges = guests.childAges ?? [];
  if (!Array.isArray(childAges) || childAges.length !== children || childAges.some(age => !Number.isInteger(age) || age < 0 || age > 17)) {
    fail('INVALID_PASSENGERS', 'guests.childAges precisa ter uma idade (0–17) por criança.', 'guests.childAges');
  }
  if (adults + children > LIMITS.maxPassengers) fail('INVALID_PASSENGERS', `No máximo ${LIMITS.maxPassengers} hóspedes por busca.`, 'guests');
  const rooms = integer(body.rooms, { field: 'rooms', min: 1, max: LIMITS.maxRooms, fallback: 1, code: 'INVALID_PASSENGERS' });
  if (rooms > adults) fail('INVALID_PASSENGERS', 'Cada quarto precisa de pelo menos um adulto.', 'rooms');

  return {
    destination: { lat, lng, radiusKm, label },
    checkIn: body.checkIn,
    checkOut: body.checkOut,
    nights,
    guests: { adults, children, childAges },
    rooms,
    currency: currency(body.currency),
    maxResults: integer(body.maxResults, { field: 'maxResults', min: 1, max: LIMITS.maxResults, fallback: LIMITS.defaultResults })
  };
}

// Códigos que o catálogo do site usa e que saíram da lista IATA atual.
const LEGACY_IATA = new Set(['FRU']);

function period(value, field, now) {
  const month = /^(\d{4})-(\d{2})$/.exec(value);
  const day = month ? dateDay(`${value}-01`, field) + 30 : dateDay(value, field);
  const start = today(now);
  // Um mês inteiro vale até o último dia dele; um ano e pouco à frente cobre "o mês no ano que vem".
  if (day < start || day > start + 400 + 30) fail('INVALID_DATES', 'Período fora do intervalo de busca.', field);
  return day;
}

/** Preços vistos recentemente: aeroportos reais e período entre hoje e ~13 meses. */
export function validateCheapestQuery({ origin, destination, departure, returnDate }, { now = new Date() } = {}) {
  for (const [code, field] of [[origin, 'origin'], [destination, 'destination']]) {
    if (!/^[A-Z]{3}$/.test(code) || !(isKnownIata(code) || LEGACY_IATA.has(code))) fail('INVALID_AIRPORT', 'Aeroportos inválidos.', field);
  }
  if (origin === destination) fail('INVALID_AIRPORT', 'Aeroportos inválidos.', 'destination');
  const go = period(departure, 'departure', now);
  if (returnDate && period(returnDate, 'return', now) < go - 31) fail('INVALID_DATES', 'A volta precisa ser depois da ida.', 'return');
}
