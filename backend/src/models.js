// Modelos normalizados (§7 do documento da fase 3.1): FlightOffer, HotelProperty
// e HotelOffer. Todo adaptador de fornecedor devolve estes formatos; o front
// nunca vê o formato do fornecedor. As funções `check*` devolvem a lista de
// problemas (vazia = válido) e são usadas pelo roteador (ofertas inválidas são
// descartadas, não repassadas) e pelos testes de contrato.
import { AVAILABILITY, BOARDS, CABINS, DATA_SOURCES, OFFER_STATUSES } from './contract.js';

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^\d{1,9}(\.\d{1,2})?$/;
const CURRENCY = /^[A-Z]{3}$/;
const IATA = /^[A-Z]{3}$/;

const isText = value => typeof value === 'string' && value.trim().length > 0;
const isInstant = value => typeof value === 'string' && ISO_INSTANT.test(value) && !Number.isNaN(Date.parse(value));
const isHttps = value => {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

/** Valor monetário: decimal em string + moeda ISO 4217 (evita erro de ponto flutuante). */
export function money(amount, currency) {
  const value = typeof amount === 'number' ? amount.toFixed(2) : String(amount ?? '');
  if (!DECIMAL.test(value) || !CURRENCY.test(currency ?? '')) return null;
  return { amount: value, currency };
}

function checkMoney(value, field, problems, { optional = false } = {}) {
  if (value === undefined && optional) return;
  // `typeof` antes da regex: RegExp#test converteria um número em texto e o aceitaria.
  if (!value || typeof value.amount !== 'string' || !DECIMAL.test(value.amount) || typeof value.currency !== 'string' || !CURRENCY.test(value.currency)) {
    problems.push(`${field}: valor decimal em string + moeda ISO 4217`);
  }
}

function checkOptional(object, key, test, problems, label = key) {
  if (object[key] !== undefined && !test(object[key])) problems.push(`${label} inválido`);
}

export function checkFlightOffer(offer) {
  const problems = [];
  if (offer?.kind !== 'flight-offer') problems.push('kind deve ser flight-offer');
  if (!isText(offer?.provider)) problems.push('provider ausente');
  if (!isText(offer?.offerId)) problems.push('offerId ausente');
  if (!DATA_SOURCES.includes(offer?.dataSource)) problems.push('dataSource inválido');
  if (!isInstant(offer?.searchedAt)) problems.push('searchedAt ISO 8601');
  checkOptional(offer ?? {}, 'observedAt', isInstant, problems);
  checkOptional(offer ?? {}, 'expiresAt', isInstant, problems);
  if (offer?.dataSource === 'cached' && !isInstant(offer?.observedAt)) problems.push('preço em cache precisa de observedAt');
  const passengers = offer?.passengers;
  if (!passengers || !Number.isInteger(passengers.adults) || passengers.adults < 1) problems.push('passengers.adults');
  checkOptional(offer ?? {}, 'cabin', value => CABINS.includes(value), problems);
  checkMoney(offer?.price?.total, 'price.total', problems);
  checkMoney(offer?.price?.base, 'price.base', problems, { optional: true });
  checkMoney(offer?.price?.taxes, 'price.taxes', problems, { optional: true });
  const slices = offer?.slices;
  if (!Array.isArray(slices) || slices.length < 1 || slices.length > 2) problems.push('slices: 1 ou 2 trechos');
  for (const [index, slice] of (Array.isArray(slices) ? slices : []).entries()) {
    const at = `slices[${index}]`;
    if (!IATA.test(slice?.origin ?? '') || !IATA.test(slice?.destination ?? '')) problems.push(`${at}: origem/destino IATA`);
    if (!isInstant(slice?.departAt) || !isInstant(slice?.arriveAt)) problems.push(`${at}: horários ISO 8601 com offset`);
    else if (Date.parse(slice.arriveAt) <= Date.parse(slice.departAt)) problems.push(`${at}: chegada depois da partida`);
    if (!Number.isInteger(slice?.durationMinutes) || slice.durationMinutes <= 0) problems.push(`${at}: durationMinutes`);
    if (!Number.isInteger(slice?.stops) || slice.stops < 0) problems.push(`${at}: stops`);
    if (!Array.isArray(slice?.connections) || slice.connections.some(code => !IATA.test(code)) || slice.connections.length !== slice.stops) problems.push(`${at}: connections deve listar uma conexão por escala`);
    if (!Array.isArray(slice?.segments) || !slice.segments.length) problems.push(`${at}: segments`);
    for (const [s, segment] of (slice?.segments ?? []).entries()) {
      if (!IATA.test(segment?.origin ?? '') || !IATA.test(segment?.destination ?? '')) problems.push(`${at}.segments[${s}]: IATA`);
      if (!isInstant(segment?.departAt) || !isInstant(segment?.arriveAt)) problems.push(`${at}.segments[${s}]: horários`);
      if (!isText(segment?.marketingCarrier?.name)) problems.push(`${at}.segments[${s}]: marketingCarrier.name`);
    }
  }
  checkOptional(offer ?? {}, 'bookingUrl', isHttps, problems);
  if (!OFFER_STATUSES.includes(offer?.status)) problems.push('status inválido');
  return problems;
}

export function checkHotelProperty(property) {
  const problems = [];
  if (property?.kind !== 'hotel-property') problems.push('kind deve ser hotel-property');
  if (!isText(property?.provider) || !isText(property?.propertyId) || !isText(property?.name)) problems.push('provider/propertyId/name');
  const location = property?.location ?? {};
  if (location.lat !== undefined && !(Math.abs(location.lat) <= 90)) problems.push('location.lat');
  if (location.lng !== undefined && !(Math.abs(location.lng) <= 180)) problems.push('location.lng');
  if (property?.images !== undefined && (!Array.isArray(property.images) || property.images.some(image => !isHttps(image?.url) || !isText(image?.source)))) problems.push('images: URL https + source');
  if (!isInstant(property?.fetchedAt)) problems.push('fetchedAt ISO 8601');
  return problems;
}

export function checkHotelOffer(offer) {
  const problems = [];
  if (offer?.kind !== 'hotel-offer') problems.push('kind deve ser hotel-offer');
  if (!isText(offer?.provider) || !isText(offer?.offerId) || !isText(offer?.propertyId)) problems.push('provider/offerId/propertyId');
  if (!DATA_SOURCES.includes(offer?.dataSource)) problems.push('dataSource inválido');
  if (!isInstant(offer?.searchedAt)) problems.push('searchedAt ISO 8601');
  checkOptional(offer ?? {}, 'expiresAt', value => value === null || isInstant(value), problems);
  if (!ISO_DATE.test(offer?.checkIn ?? '') || !ISO_DATE.test(offer?.checkOut ?? '') || offer.checkOut <= offer.checkIn) problems.push('checkIn/checkOut');
  if (!Number.isInteger(offer?.nights) || offer.nights < 1) problems.push('nights');
  checkMoney(offer?.price?.total, 'price.total', problems);
  checkMoney(offer?.price?.perNight, 'price.perNight', problems, { optional: true });
  if (offer?.price?.perNight && offer.price.perNight.currency !== offer.price.total?.currency) problems.push('price.perNight na mesma moeda do total');
  checkOptional(offer ?? {}, 'board', value => BOARDS.includes(value), problems);
  if (!AVAILABILITY.includes(offer?.availability)) problems.push('availability inválido');
  checkOptional(offer ?? {}, 'reservationUrl', isHttps, problems);
  return problems;
}

// Mesma viagem vendida por fontes diferentes: fica a mais barata (mesma moeda).
export function flightKey(offer) {
  return [offer.cabin ?? '', ...offer.slices.flatMap(slice => slice.segments.map(segment => `${segment.marketingCarrier.iata ?? segment.marketingCarrier.name}${segment.flightNumber ?? ''}@${segment.departAt}`))].join('|');
}

export function dedupeFlights(offers) {
  const best = new Map();
  for (const offer of offers) {
    const key = flightKey(offer);
    const current = best.get(key);
    if (!current || (current.price.total.currency === offer.price.total.currency && Number(offer.price.total.amount) < Number(current.price.total.amount))) best.set(key, offer);
  }
  return [...best.values()];
}

// Ordena por preço total quando a moeda é a mesma; moedas diferentes não são comparadas
// aqui (a conversão é só de exibição, no front).
export function sortByPrice(offers) {
  return [...offers].sort((a, b) => (a.price.total.currency === b.price.total.currency
    ? Number(a.price.total.amount) - Number(b.price.total.amount)
    : a.price.total.currency.localeCompare(b.price.total.currency)));
}
