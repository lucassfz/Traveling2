// Adaptador Duffel (voos). Escrito a partir da documentação oficial lida em
// 15/11/2026 (docs/PHASE-3.1-TRAVEL-INTEGRATION-ARCHITECTURE.md §2.2):
//   POST https://api.duffel.com/air/offer_requests?return_offers=true
//   corpo { data: { slices: [{ origin, destination, departure_date }], passengers: [{ type: 'adult' }], cabin_class } }
//   oferta: id, total_amount/total_currency, base_amount, tax_amount, expires_at,
//           slices[].segments[] (departing_at/arriving_at locais + time_zone do aeroporto),
//           marketing_carrier, operating_carrier, passengers[].baggages, conditions.
//
// Ativação: Secret DUFFEL_TOKEN + "duffel" em FLIGHT_PROVIDERS. Token de teste
// (duffel_test_…) → dataSource "test" (companhia fictícia Duffel Airways); token
// live só depois da decisão de vender passagens (D2). A Duffel não oferece link de
// reserva externo: as ofertas não têm bookingUrl.
//
// Limitação deliberada: só adultos. A Duffel pede a idade de cada menor e o
// Planner não a coleta; inventar idades mudaria o preço.
import { money } from '../models.js';

const API = 'https://api.duffel.com';
const CABINS = { economy: 'economy', premium: 'premium_economy', business: 'business', first: 'first' };

export class ProviderRequestError extends Error {}

/** "2027-04-02T22:10:00" no fuso "America/Sao_Paulo" → "2027-04-02T22:10:00-03:00". */
export function localToOffsetIso(local, timeZone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(local ?? '');
  if (!match) return null;
  const [year, month, day, hour, minute, second = '0'] = match.slice(1);
  const asUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second);
  const offsetAt = instant => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).formatToParts(new Date(instant)).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - instant;
  };
  let offset;
  try {
    // Duas passadas resolvem a hora local perto de mudanças de horário de verão.
    offset = offsetAt(asUtc - offsetAt(asUtc));
  } catch {
    return null; // fuso desconhecido
  }
  const minutes = Math.round(offset / 60_000);
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${year}-${month}-${day}T${hour}:${minute}:${String(second).padStart(2, '0')}${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** "PT10H15M" / "P1DT2H" → minutos, ou null. */
export function durationMinutes(value) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:\d+S)?)?$/.exec(value ?? '');
  if (!match) return null;
  const total = (Number(match[1] ?? 0) * 24 + Number(match[2] ?? 0)) * 60 + Number(match[3] ?? 0);
  return total > 0 ? total : null;
}

const carrier = value => (value?.name ? { ...(value.iata_code ? { iata: value.iata_code } : {}), name: value.name } : null);

function mapSegment(segment) {
  const departAt = localToOffsetIso(segment.departing_at, segment.origin?.time_zone);
  const arriveAt = localToOffsetIso(segment.arriving_at, segment.destination?.time_zone);
  const marketingCarrier = carrier(segment.marketing_carrier);
  if (!departAt || !arriveAt || !marketingCarrier) return null;
  return {
    origin: segment.origin?.iata_code,
    destination: segment.destination?.iata_code,
    departAt,
    arriveAt,
    marketingCarrier,
    ...(carrier(segment.operating_carrier) ? { operatingCarrier: carrier(segment.operating_carrier) } : {}),
    ...(segment.marketing_carrier_flight_number && marketingCarrier.iata ? { flightNumber: `${marketingCarrier.iata}${segment.marketing_carrier_flight_number}` } : {})
  };
}

function mapSlice(slice) {
  const segments = (slice.segments ?? []).map(mapSegment);
  if (!segments.length || segments.includes(null)) return null;
  const first = segments[0];
  const last = segments.at(-1);
  // Duração: a informada pelo fornecedor; senão, pelos instantes absolutos.
  const duration = durationMinutes(slice.duration) ?? Math.round((Date.parse(last.arriveAt) - Date.parse(first.departAt)) / 60_000);
  return {
    origin: first.origin,
    destination: last.destination,
    departAt: first.departAt,
    arriveAt: last.arriveAt,
    durationMinutes: duration,
    stops: segments.length - 1,
    connections: segments.slice(0, -1).map(segment => segment.destination),
    segments
  };
}

function mapConditions(conditions) {
  if (!conditions) return undefined;
  const refund = conditions.refund_before_departure;
  const change = conditions.change_before_departure;
  const result = {};
  if (refund && typeof refund.allowed === 'boolean') result.refundable = refund.allowed;
  if (change && typeof change.allowed === 'boolean') {
    result.changeable = change.allowed;
    const penalty = change.allowed && change.penalty_amount ? money(change.penalty_amount, change.penalty_currency) : null;
    if (penalty) result.changePenalty = penalty;
  }
  return Object.keys(result).length ? result : undefined;
}

// Bagagem despachada incluída por passageiro, pelo primeiro segmento da ida.
function mapBaggage(offer) {
  const baggages = offer.slices?.[0]?.segments?.[0]?.passengers?.[0]?.baggages;
  if (!Array.isArray(baggages)) return undefined;
  const items = baggages.filter(bag => ['checked', 'carry_on'].includes(bag?.type) && Number.isInteger(bag?.quantity) && bag.quantity > 0)
    .map(bag => ({ type: bag.type, quantity: bag.quantity, per: 'passenger' }));
  return items.length ? items : undefined;
}

/** Converte uma oferta da Duffel para FlightOffer, ou null se faltar algo essencial. */
export function mapOffer(offer, { request, searchedAt, dataSource }) {
  const total = money(offer.total_amount, offer.total_currency);
  const slices = (offer.slices ?? []).map(mapSlice);
  if (!total || !slices.length || slices.includes(null)) return null;
  const base = money(offer.base_amount, offer.base_currency ?? offer.total_currency);
  const taxes = money(offer.tax_amount, offer.tax_currency ?? offer.total_currency);
  const expiresAt = offer.expires_at && !Number.isNaN(Date.parse(offer.expires_at)) ? new Date(offer.expires_at).toISOString().replace('.000Z', 'Z') : undefined;
  const conditions = mapConditions(offer.conditions);
  const baggage = mapBaggage(offer);
  return {
    kind: 'flight-offer',
    provider: 'duffel',
    offerId: String(offer.id),
    dataSource,
    searchedAt,
    ...(expiresAt ? { expiresAt } : {}),
    passengers: request.passengers,
    cabin: request.cabin,
    price: { total, ...(base ? { base } : {}), ...(taxes ? { taxes } : {}) },
    slices,
    ...(baggage ? { baggage } : {}),
    ...(conditions ? { conditions } : {}),
    status: expiresAt && Date.parse(expiresAt) <= Date.parse(searchedAt) ? 'expired' : 'available'
  };
}

export function createDuffelFlights(env, { fetchImpl = globalThis.fetch } = {}) {
  const token = env.DUFFEL_TOKEN;
  if (!token) throw new Error('DUFFEL_TOKEN ausente: configure com `npx wrangler secret put DUFFEL_TOKEN`.');
  const test = token.startsWith('duffel_test_');
  const dataSource = test ? 'test' : 'live';
  return {
    id: 'duffel',
    kind: 'flights',
    mode: test ? 'test' : 'live',
    dataSource,
    async searchFlights(request, { signal, now = new Date() } = {}) {
      if (request.passengers.children || request.passengers.infants) {
        throw new ProviderRequestError('A Duffel exige a idade de cada menor; esta busca aceita só adultos.');
      }
      const slices = [{ origin: request.origin, destination: request.destination, departure_date: request.departureDate }];
      if (request.returnDate) slices.push({ origin: request.destination, destination: request.origin, departure_date: request.returnDate });
      const response = await fetchImpl(`${API}/air/offer_requests?return_offers=true&supplier_timeout=9000`, {
        method: 'POST',
        signal,
        headers: {
          authorization: `Bearer ${token}`,
          'duffel-version': 'v2',
          accept: 'application/json',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            slices,
            passengers: Array.from({ length: request.passengers.adults }, () => ({ type: 'adult' })),
            cabin_class: CABINS[request.cabin] ?? 'economy'
          }
        })
      });
      if (!response.ok) {
        // Nunca repassar o corpo do fornecedor: só o status, para o log do roteador.
        throw new ProviderRequestError(`Duffel respondeu ${response.status}`);
      }
      const payload = await response.json();
      const searchedAt = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
      const offers = (payload?.data?.offers ?? [])
        .map(offer => mapOffer(offer, { request, searchedAt, dataSource }))
        .filter(Boolean);
      return { offers };
    }
  };
}
