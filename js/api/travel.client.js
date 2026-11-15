// Cliente do backend do Traveling (fase 3.2). DESLIGADO por padrão: só funciona
// quando a página declara o endereço do backend em
//   <meta name="traveling-api" content="https://…/api/v1">
// Sem a meta (ou vazia), `isEnabled()` é false e nada é chamado.
//
// Também monta as requisições do contrato (§8 do documento da fase 3.1) a partir
// da viagem do Planner, para o usuário não digitar de novo o que já escolheu.
// Funções de montagem são puras e testadas em Node (scripts/validate-backend.js),
// inclusive contra a validação do próprio backend.

const TIMEOUT_MS = 15_000;
const CABIN_MAP = Object.freeze({ economy: 'economy', premium: 'premium', business: 'business' });

/** Endereço base do backend, ou null quando a busca real está desligada. */
export function apiBase(doc = globalThis.document) {
  const value = doc?.querySelector?.('meta[name="traveling-api"]')?.getAttribute('content')?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1' ? url.href.replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

export function isEnabled(doc) {
  return apiBase(doc) !== null;
}

/**
 * Busca de voos a partir da viagem. `origin` e `destination` são códigos IATA já
 * resolvidos pelo AirportRepository (ICAO é convertido antes).
 * @returns {{ request: object } | { missing: 'dates' | 'airports' }}
 */
export function flightSearchFromTrip(trip, { origin, destination } = {}) {
  if (!/^[A-Z]{3}$/.test(origin ?? '') || !/^[A-Z]{3}$/.test(destination ?? '')) return { missing: 'airports' };
  if (!trip?.startDate) return { missing: 'dates' };
  return {
    request: {
      origin,
      destination,
      departureDate: trip.startDate,
      ...(trip.endDate && trip.endDate !== trip.startDate ? { returnDate: trip.endDate } : {}),
      // O Planner não distingue idades: todos contam como adultos.
      passengers: { adults: Math.min(9, Math.max(1, trip.travelers ?? 1)) },
      cabin: CABIN_MAP[trip.cabin] ?? 'economy',
      currency: 'BRL'
    }
  };
}

/**
 * Busca de hospedagem a partir da viagem: coordenadas da cidade escolhida e datas exatas.
 * Quartos: um para cada dois viajantes (máx. 4).
 * @returns {{ request: object } | { missing: 'city' | 'dates' }}
 */
export function hotelSearchFromTrip(trip) {
  if (!Number.isFinite(trip?.city?.lat) || !Number.isFinite(trip?.city?.lng)) return { missing: 'city' };
  if (!trip.startDate || !trip.endDate || trip.endDate <= trip.startDate) return { missing: 'dates' };
  const adults = Math.min(9, Math.max(1, trip.travelers ?? 1));
  return {
    request: {
      destination: { lat: trip.city.lat, lng: trip.city.lng, radiusKm: 10, label: trip.city.name },
      checkIn: trip.startDate,
      checkOut: trip.endDate,
      guests: { adults },
      rooms: Math.min(4, Math.ceil(adults / 2)),
      currency: 'BRL'
    }
  };
}

/** Erro uniforme para a interface: { code, message, retryable, status }. */
export class TravelApiError extends Error {
  constructor({ code, message, retryable = false, status = 0, field = null }) {
    super(message);
    Object.assign(this, { code, retryable, status, field });
  }
}

async function call(path, { method = 'GET', body, signal, doc, fetchImpl = globalThis.fetch } = {}) {
  const base = apiBase(doc);
  if (!base) throw new TravelApiError({ code: 'SEARCH_DISABLED', message: 'A busca de preços reais ainda não está disponível.' });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetchImpl(`${base}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'omit'
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new TravelApiError({
        code: data?.error?.code ?? 'PROVIDER_ERROR',
        message: data?.error?.message ?? 'Não foi possível buscar agora.',
        retryable: data?.error?.retryable ?? response.status >= 500,
        status: response.status,
        field: data?.error?.field ?? null
      });
    }
    return data;
  } catch (error) {
    if (error instanceof TravelApiError) throw error;
    if (signal?.aborted) throw new TravelApiError({ code: 'CANCELLED', message: 'Busca cancelada.' });
    if (controller.signal.aborted) throw new TravelApiError({ code: 'PROVIDER_TIMEOUT', message: 'A busca demorou demais. Tente de novo.', retryable: true });
    throw new TravelApiError({ code: 'NETWORK_ERROR', message: 'Sem conexão com o serviço de busca.', retryable: true });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

export const searchFlights = (request, options) => call('/flights/search', { method: 'POST', body: request, ...options });
export const searchHotels = (request, options) => call('/hotels/search', { method: 'POST', body: request, ...options });
export const providerStatus = options => call('/providers/status', options);
