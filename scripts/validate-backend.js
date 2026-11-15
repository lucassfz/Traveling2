// Auditoria offline do backend (fase 3.2): contrato, validação, modelos,
// confiabilidade e o Worker de ponta a ponta com fornecedores fictícios.
// Não usa rede, chaves nem dependências (Request/Response nativos do Node ≥ 20).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { iataCodes, renderModule } from './build-backend-airports.js';
import { ApiError } from '../backend/src/contract.js';
import { isKnownIata, validateFlightSearch, validateHotelSearch } from '../backend/src/validate.js';
import { checkFlightOffer, checkHotelOffer, checkHotelProperty, dedupeFlights, money, sortByPrice } from '../backend/src/models.js';
import { mockFlights, mockHotels } from '../backend/src/providers/mock.js';
import { registerProvider } from '../backend/src/providers/index.js';
import { CircuitBreaker, RateLimiter, TtlCache, cacheKey, withTimeout } from '../backend/src/reliability.js';
import { clientKey, createApp } from '../backend/src/index.js';

const NOW = new Date('2026-11-15T12:00:00Z');
const expectError = (fn, code, field) => {
  try {
    fn();
  } catch (error) {
    assert.ok(error instanceof ApiError, `esperava ApiError, veio ${error}`);
    assert.equal(error.code, code, `${error.message}`);
    if (field) assert.equal(error.field, field);
    return;
  }
  assert.fail(`esperava erro ${code}`);
};

// 1. Lista de aeroportos do backend em dia com data/airports.json.
{
  const generated = await readFile(new URL('../backend/src/airports.generated.js', import.meta.url), 'utf8');
  assert.equal(generated, renderModule(await iataCodes()), 'rode: npm run build:backend-airports');
  assert.ok(isKnownIata('GRU') && isKnownIata('LIS') && !isKnownIata('Q1Z'));
}

// 2. Validação de voos.
{
  const valid = validateFlightSearch({ origin: 'gru', destination: 'LIS', departureDate: '2027-04-02', returnDate: '2027-04-10', passengers: { adults: 2 } }, { now: NOW });
  assert.deepEqual(valid, { origin: 'GRU', destination: 'LIS', departureDate: '2027-04-02', returnDate: '2027-04-10', passengers: { adults: 2, children: 0, infants: 0 }, cabin: 'economy', currency: null, maxResults: 20 });
  const base = { origin: 'GRU', destination: 'LIS', departureDate: '2027-04-02', passengers: { adults: 1 } };
  const unknown = [...'QWXYZ'].map(letter => `${letter}${letter}${letter}`).find(code => !isKnownIata(code));
  expectError(() => validateFlightSearch({ ...base, origin: unknown }, { now: NOW }), 'INVALID_AIRPORT', 'origin');
  expectError(() => validateFlightSearch({ ...base, origin: 'SBGR' }, { now: NOW }), 'INVALID_AIRPORT', 'origin');
  expectError(() => validateFlightSearch({ ...base, destination: 'GRU' }, { now: NOW }), 'INVALID_ROUTE');
  expectError(() => validateFlightSearch({ ...base, departureDate: '2026-11-01' }, { now: NOW }), 'INVALID_DATES', 'departureDate');
  expectError(() => validateFlightSearch({ ...base, departureDate: '2027-02-30' }, { now: NOW }), 'INVALID_DATES', 'departureDate');
  expectError(() => validateFlightSearch({ ...base, departureDate: '2028-06-01' }, { now: NOW }), 'INVALID_DATES', 'departureDate');
  expectError(() => validateFlightSearch({ ...base, returnDate: '2027-03-30' }, { now: NOW }), 'INVALID_DATES', 'returnDate');
  expectError(() => validateFlightSearch({ ...base, passengers: { adults: 1, infants: 2 } }, { now: NOW }), 'INVALID_PASSENGERS');
  expectError(() => validateFlightSearch({ ...base, passengers: { adults: 6, children: 4 } }, { now: NOW }), 'INVALID_PASSENGERS');
  expectError(() => validateFlightSearch({ ...base, passengers: { adults: 0 } }, { now: NOW }), 'INVALID_PASSENGERS');
  expectError(() => validateFlightSearch({ ...base, cabin: 'suite' }, { now: NOW }), 'UNSUPPORTED_CABIN');
  expectError(() => validateFlightSearch({ ...base, price: 1 }, { now: NOW }), 'INVALID_REQUEST', 'price');
  expectError(() => validateFlightSearch({ ...base, currency: 'real' }, { now: NOW }), 'INVALID_REQUEST', 'currency');
  expectError(() => validateFlightSearch([], { now: NOW }), 'INVALID_REQUEST');
  // Mesmo dia de ida e volta e "hoje" com folga de fuso são aceitos.
  assert.equal(validateFlightSearch({ ...base, departureDate: '2026-11-14', returnDate: '2026-11-14' }, { now: NOW }).returnDate, '2026-11-14');
}

// 3. Validação de hotéis.
{
  const destination = { lat: 38.7223, lng: -9.1393, label: '  Lisboa  ' };
  const valid = validateHotelSearch({ destination, checkIn: '2027-04-03', checkOut: '2027-04-10', guests: { adults: 2 }, rooms: 1 }, { now: NOW });
  assert.equal(valid.nights, 7);
  assert.deepEqual(valid.destination, { lat: 38.7223, lng: -9.1393, radiusKm: 10, label: 'Lisboa' });
  const base = { destination, checkIn: '2027-04-03', checkOut: '2027-04-10', guests: { adults: 2 } };
  expectError(() => validateHotelSearch({ ...base, checkOut: '2027-04-03' }, { now: NOW }), 'INVALID_DATES', 'checkOut');
  expectError(() => validateHotelSearch({ ...base, checkOut: '2027-05-10' }, { now: NOW }), 'INVALID_DATES', 'checkOut');
  expectError(() => validateHotelSearch({ ...base, rooms: 3 }, { now: NOW }), 'INVALID_PASSENGERS', 'rooms');
  expectError(() => validateHotelSearch({ ...base, guests: { adults: 2, children: 1 } }, { now: NOW }), 'INVALID_PASSENGERS', 'guests.childAges');
  expectError(() => validateHotelSearch({ ...base, destination: { lat: 91, lng: 0 } }, { now: NOW }), 'INVALID_DESTINATION', 'destination.lat');
  expectError(() => validateHotelSearch({ ...base, destination: { lat: '38', lng: 0 } }, { now: NOW }), 'INVALID_DESTINATION', 'destination.lat');
  expectError(() => validateHotelSearch({ ...base, destination: { lat: 0, lng: 0, radiusKm: 500 } }, { now: NOW }), 'INVALID_DESTINATION', 'destination.radiusKm');
  assert.equal(validateHotelSearch({ ...base, guests: { adults: 2, children: 2, childAges: [4, 9] } }, { now: NOW }).guests.children, 2);
}

// 4. Modelos: o fornecedor fictício cumpre o contrato; regras de dinheiro, duplicados e ordem.
{
  const flightRequest = validateFlightSearch({ origin: 'GRU', destination: 'LIS', departureDate: '2027-04-02', returnDate: '2027-04-10', passengers: { adults: 2, infants: 1 }, cabin: 'business' }, { now: NOW });
  const { offers } = await mockFlights.searchFlights(flightRequest, { now: NOW });
  assert.ok(offers.length >= 3);
  for (const offer of offers) assert.deepEqual(checkFlightOffer(offer), [], offer.offerId);
  assert.deepEqual((await mockFlights.searchFlights(flightRequest, { now: NOW })).offers, offers, 'determinístico');
  const hotelRequest = validateHotelSearch({ destination: { lat: -22.9, lng: -43.2 }, checkIn: '2027-01-10', checkOut: '2027-01-13', guests: { adults: 2 } }, { now: NOW });
  const hotels = await mockHotels.searchHotels(hotelRequest, { now: NOW });
  for (const property of hotels.properties) assert.deepEqual(checkHotelProperty(property), [], property.propertyId);
  for (const offer of hotels.offers) assert.deepEqual(checkHotelOffer(offer), [], offer.offerId);
  assert.ok(hotels.properties.every(property => property.images === undefined), 'nenhuma foto inventada');

  assert.deepEqual(money(10, 'BRL'), { amount: '10.00', currency: 'BRL' });
  assert.equal(money('10.005', 'BRL'), null);
  assert.equal(money(10, 'real'), null);
  const broken = { ...offers[0], price: { total: { amount: 10, currency: 'BRL' } } };
  assert.ok(checkFlightOffer(broken).some(problem => problem.startsWith('price.total')), 'valor numérico é rejeitado');
  assert.ok(checkFlightOffer({ ...offers[0], dataSource: 'cached' }).includes('preço em cache precisa de observedAt'));
  assert.ok(checkFlightOffer({ ...offers[0], bookingUrl: 'http://x.test' }).includes('bookingUrl inválido'));
  const cheaper = { ...offers[0], offerId: 'dup', price: { ...offers[0].price, total: { amount: '1.00', currency: offers[0].price.total.currency } } };
  const deduped = dedupeFlights([offers[0], cheaper]);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].offerId, 'dup');
  const sorted = sortByPrice(offers);
  for (let index = 1; index < sorted.length; index += 1) assert.ok(Number(sorted[index - 1].price.total.amount) <= Number(sorted[index].price.total.amount));
}

// 5. Confiabilidade.
{
  const cache = new TtlCache();
  let calls = 0;
  const task = () => new Promise(resolve => setTimeout(() => resolve({ n: ++calls }), 10));
  const [a, b] = await Promise.all([cache.through('k', task, () => 1000), cache.through('k', task, () => 1000)]);
  assert.equal(calls, 1, 'buscas idênticas simultâneas viram uma');
  assert.deepEqual([a.cache, b.cache].sort(), ['coalesced', 'miss']);
  assert.equal((await cache.through('k', task, () => 1000)).cache, 'hit');
  cache.set('old', 1, 10, 0);
  assert.equal(cache.get('old', 11), null, 'expira');
  const limiter = new RateLimiter({ limit: 2, windowMs: 60_000 });
  assert.ok(limiter.hit('a', 0).allowed && limiter.hit('a', 1).allowed);
  assert.deepEqual(limiter.hit('a', 2), { allowed: false, retryAfter: 60 });
  assert.ok(limiter.hit('b', 3).allowed, 'por cliente');
  assert.ok(limiter.hit('a', 60_000).allowed, 'nova janela');
  const breaker = new CircuitBreaker({ threshold: 2, cooldownMs: 1000 });
  breaker.failure('p', 0);
  assert.equal(breaker.status('p', 0), 'operational');
  breaker.failure('p', 0);
  assert.equal(breaker.status('p', 500), 'degraded');
  assert.equal(breaker.status('p', 1500), 'operational');
  await assert.rejects(withTimeout(signal => new Promise(resolve => setTimeout(resolve, 200, signal)), 20), error => error.timeout === true);
  assert.equal(cacheKey('f', { b: 1, a: { d: 1, c: 2 } }), cacheKey('f', { a: { c: 2, d: 1 }, b: 1 }), 'chave estável');
}

// 6. Worker de ponta a ponta.
{
  const ORIGIN = 'https://lucassfz.github.io';
  const env = { ALLOWED_ORIGINS: `${ORIGIN},http://localhost:8765`, FLIGHT_PROVIDERS: 'mock', HOTEL_PROVIDERS: 'mock', RATE_PER_MINUTE: '5' };
  const logs = [];
  const app = createApp({ now: () => NOW, log: line => logs.push(JSON.stringify(line)) });
  const call = (path, { method = 'POST', body, origin = ORIGIN, ip = '203.0.113.77', raw } = {}) => app.fetch(new Request(`https://api.test/api/v1${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}), 'cf-connecting-ip': ip },
    ...(raw !== undefined ? { body: raw } : body !== undefined ? { body: JSON.stringify(body) } : {})
  }), env);
  const flight = { origin: 'GRU', destination: 'LIS', departureDate: '2027-04-02', returnDate: '2027-04-10', passengers: { adults: 2 } };

  let response = await call('/providers/status', { method: 'GET' });
  assert.equal(response.status, 200);
  let data = await response.json();
  assert.equal(data.searchEnabled, true);
  assert.deepEqual(data.providers.map(provider => `${provider.kind}:${provider.id}:${provider.status}`), ['flights:mock:operational', 'hotels:mock:operational']);

  response = await call('/flights/search', { body: flight });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('x-request-id'), /^req_/);
  assert.equal(response.headers.get('x-cache'), 'miss');
  data = await response.json();
  assert.equal(data.status, 'ok');
  assert.ok(data.offers.length >= 3 && data.offers.every(offer => checkFlightOffer(offer).length === 0));
  assert.deepEqual(data.warnings, ['Dados de teste: preços, horários e hotéis são fictícios.']);
  assert.deepEqual(data.providers, [{ id: 'mock', status: 'ok', dataSource: 'test' }]);
  assert.equal((await call('/flights/search', { body: flight })).headers.get('x-cache'), 'hit');

  response = await call('/hotels/search', { body: { destination: { lat: 38.72, lng: -9.14, label: 'Lisboa' }, checkIn: '2027-04-03', checkOut: '2027-04-10', guests: { adults: 2 } }, ip: '198.51.100.1' });
  assert.equal(response.status, 200);
  data = await response.json();
  const propertyIds = new Set(data.properties.map(property => property.propertyId));
  assert.ok(data.offers.length && data.offers.every(offer => propertyIds.has(offer.propertyId)), 'toda oferta aponta para uma propriedade');

  // Origem, preflight, rotas, métodos, corpo.
  assert.equal((await call('/flights/search', { body: flight, origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('/flights/search', { body: flight, origin: null })).status, 403);
  response = await app.fetch(new Request('https://api.test/api/v1/flights/search', { method: 'OPTIONS', headers: { origin: ORIGIN } }), env);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
  assert.equal((await app.fetch(new Request('https://api.test/api/v1/flights/search', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }), env)).status, 403);
  assert.equal((await call('/nada', { body: flight })).status, 404);
  assert.equal((await call('/flights/search', { method: 'GET' })).status, 405);
  response = await call('/flights/search', { raw: JSON.stringify({ ...flight, pad: 'x'.repeat(3000) }) });
  assert.equal(response.status, 413);
  response = await call('/flights/search', { raw: '{nope' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'INVALID_REQUEST');
  response = await call('/flights/search', { body: { ...flight, destination: 'GRU' } });
  assert.equal(response.status, 422);
  data = await response.json();
  assert.deepEqual(data.error, { code: 'INVALID_ROUTE', message: 'Origem e destino precisam ser diferentes.', field: 'destination', retryable: false });

  // Limite por cliente (5/min neste cenário; o mesmo /24 conta junto).
  const limited = createApp({ now: () => NOW, log: () => {} });
  const statuses = [];
  for (let index = 0; index < 7; index += 1) {
    statuses.push((await limited.fetch(new Request('https://api.test/api/v1/flights/search', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': `192.0.2.${index}` },
      body: JSON.stringify({ ...flight, departureDate: `2027-04-0${index + 1}` })
    }), env)).status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429, 429]);
  assert.equal(clientKey(new Request('https://x.test', { headers: { 'cf-connecting-ip': '2001:db8:1:2:3::1' } })), '2001:db8:1');

  // Busca desligada.
  assert.equal((await call('/flights/search', { body: flight, ip: '198.51.100.9' }).then(() => app.fetch(new Request('https://api.test/api/v1/flights/search', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN }, body: JSON.stringify(flight)
  }), { ...env, SEARCH_ENABLED: 'false' }))).status, 503);

  // Fornecedor com falha: resultado parcial com o que funcionou; todos falhando → 502; disjuntor → 503.
  registerProvider('flights', 'broken', () => ({ id: 'broken', kind: 'flights', mode: 'test', dataSource: 'test', async searchFlights() { throw new Error('boom'); } }));
  registerProvider('flights', 'invalid', () => ({ id: 'invalid', kind: 'flights', mode: 'test', dataSource: 'test', async searchFlights() { return { offers: [{ kind: 'flight-offer', provider: 'invalid' }] }; } }));
  const mixed = createApp({ now: () => NOW, log: () => {} });
  const post = (appInstance, providers, ip) => appInstance.fetch(new Request('https://api.test/api/v1/flights/search', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': ip }, body: JSON.stringify(flight)
  }), { ...env, FLIGHT_PROVIDERS: providers, RATE_PER_MINUTE: '100' });
  response = await post(mixed, 'mock,broken,invalid', '10.0.0.1');
  data = await response.json();
  assert.equal(data.status, 'partial');
  assert.ok(data.offers.every(offer => offer.provider === 'mock'), 'oferta fora do contrato é descartada');
  assert.deepEqual(data.providers.map(provider => `${provider.id}:${provider.status}`), ['mock:ok', 'invalid:ok', 'broken:error']);
  assert.equal(response.headers.get('x-cache'), 'miss');
  assert.equal((await post(mixed, 'mock,broken,invalid', '10.0.0.1')).headers.get('x-cache'), 'miss', 'resultado parcial não é guardado');
  const failing = createApp({ now: () => NOW, log: () => {} });
  for (let index = 0; index < 3; index += 1) assert.equal((await post(failing, 'broken', '10.0.1.1')).status, 502);
  response = await post(failing, 'broken', '10.0.1.1');
  assert.equal(response.status, 503, 'disjuntor aberto');
  assert.equal((await response.json()).error.retryable, true);

  // Registros sem dados pessoais.
  assert.ok(logs.length > 10);
  assert.ok(logs.every(line => !line.includes('203.0.113') && !line.includes('GRU')), 'logs sem IP nem conteúdo da busca');
}

// 7. Cliente do site (js/api/travel.client.js): desligado por padrão, requisições
//    montadas a partir da viagem aceitas pelo backend, e conversa de ponta a ponta.
{
  const { apiBase, isEnabled, flightSearchFromTrip, hotelSearchFromTrip, searchFlights, searchHotels, TravelApiError } = await import('../js/api/travel.client.js');
  const doc = content => ({ querySelector: () => (content === null ? null : { getAttribute: () => content }) });
  assert.equal(isEnabled(doc(null)), false, 'sem meta: desligado');
  assert.equal(isEnabled(doc('')), false, 'meta vazia: desligado');
  assert.equal(apiBase(doc('http://api.example.com/api/v1')), null, 'http fora de localhost é recusado');
  assert.equal(apiBase(doc('https://api.example.com/api/v1/')), 'https://api.example.com/api/v1');
  assert.equal(apiBase(doc('http://localhost:8787/api/v1')), 'http://localhost:8787/api/v1');
  assert.equal(isEnabled(undefined), false, 'em Node, sem document: desligado');

  const trip = { startDate: '2027-04-02', endDate: '2027-04-10', travelers: 3, cabin: 'premium', city: { name: 'Lisboa', lat: 38.72, lng: -9.14 } };
  const flight = flightSearchFromTrip(trip, { origin: 'GRU', destination: 'LIS' });
  assert.deepEqual(validateFlightSearch(flight.request, { now: NOW }).passengers, { adults: 3, children: 0, infants: 0 }, 'aceito pelo backend');
  assert.deepEqual(flightSearchFromTrip({ ...trip, startDate: null }, { origin: 'GRU', destination: 'LIS' }), { missing: 'dates' });
  assert.deepEqual(flightSearchFromTrip(trip, { origin: 'SBGR', destination: 'LIS' }), { missing: 'airports' });
  assert.equal(flightSearchFromTrip({ ...trip, endDate: trip.startDate }, { origin: 'GRU', destination: 'LIS' }).request.returnDate, undefined, 'mesmo dia: só ida');
  const hotel = hotelSearchFromTrip(trip);
  const validatedHotel = validateHotelSearch(hotel.request, { now: NOW });
  assert.equal(validatedHotel.rooms, 2, 'um quarto para cada dois');
  assert.equal(validatedHotel.nights, 8);
  assert.deepEqual(hotelSearchFromTrip({ ...trip, city: null }), { missing: 'city' });
  assert.deepEqual(hotelSearchFromTrip({ ...trip, endDate: trip.startDate }), { missing: 'dates' });
  assert.equal(validateHotelSearch(hotelSearchFromTrip({ ...trip, travelers: 9 }).request, { now: NOW }).rooms, 4, 'máximo de 4 quartos');

  // Ponta a ponta: o cliente fala com o Worker como um navegador (Origin do site).
  const ORIGIN = 'https://lucassfz.github.io';
  const app = createApp({ now: () => NOW, log: () => {} });
  const env = { ALLOWED_ORIGINS: ORIGIN };
  const fetchImpl = (url, init) => app.fetch(new Request(url, { ...init, headers: { ...init.headers, origin: ORIGIN, 'cf-connecting-ip': '100.64.0.1' } }), env);
  const options = { doc: doc('https://api.example.com/api/v1'), fetchImpl };
  const flights = await searchFlights(flight.request, options);
  assert.ok(flights.offers.length && flights.offers.every(offer => checkFlightOffer(offer).length === 0));
  const hotels = await searchHotels(hotel.request, options);
  assert.ok(hotels.offers.length && hotels.properties.length);
  await assert.rejects(searchFlights({ ...flight.request, destination: 'GRU' }, options), error => error instanceof TravelApiError && error.code === 'INVALID_ROUTE' && error.status === 422 && error.retryable === false);
  await assert.rejects(searchFlights(flight.request, { fetchImpl }), error => error.code === 'SEARCH_DISABLED', 'sem meta, nem tenta');
  const aborted = new AbortController();
  aborted.abort();
  const neverAnswers = (url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
  await assert.rejects(searchFlights(flight.request, { ...options, fetchImpl: neverAnswers, signal: aborted.signal }), error => error.code === 'CANCELLED');
  await assert.rejects(searchFlights(flight.request, { ...options, fetchImpl: () => Promise.reject(new TypeError('offline')) }), error => error.code === 'NETWORK_ERROR' && error.retryable);
}

// 8. Adaptador Duffel. Resposta SINTÉTICA, montada com os nomes de campo da
//    documentação oficial (duffel.com/docs/api/v2/offers); não é uma resposta gravada.
{
  const { createDuffelFlights, durationMinutes, localToOffsetIso, mapOffer } = await import('../backend/src/providers/duffel.flights.js');
  assert.equal(localToOffsetIso('2027-04-02T22:10:00', 'America/Sao_Paulo'), '2027-04-02T22:10:00-03:00');
  assert.equal(localToOffsetIso('2027-04-03T12:05:00', 'Europe/Lisbon'), '2027-04-03T12:05:00+01:00', 'horário de verão');
  assert.equal(localToOffsetIso('2027-01-10T08:00:00', 'Europe/Lisbon'), '2027-01-10T08:00:00+00:00');
  assert.equal(localToOffsetIso('2027-03-14T12:00:00', 'America/New_York'), '2027-03-14T12:00:00-04:00', 'dia da mudança');
  assert.equal(localToOffsetIso('2027-04-02T22:10:00', 'Nao/Existe'), null);
  assert.equal(durationMinutes('PT10H15M'), 615);
  assert.equal(durationMinutes('P1DT2H'), 1560);
  assert.equal(durationMinutes('10h'), null);

  const airport = (iata_code, time_zone) => ({ iata_code, time_zone });
  const tap = { name: 'TAP Air Portugal', iata_code: 'TP' };
  const syntheticResponse = {
    data: {
      offers: [{
        id: 'off_synthetic_1',
        total_amount: '8420.50', total_currency: 'BRL', base_amount: '7100.00', base_currency: 'BRL', tax_amount: '1320.50', tax_currency: 'BRL',
        expires_at: '2026-11-15T12:30:00.000Z',
        owner: tap,
        conditions: { refund_before_departure: { allowed: false }, change_before_departure: { allowed: true, penalty_amount: '450.00', penalty_currency: 'BRL' } },
        slices: [
          { duration: 'PT9H55M', segments: [{ origin: airport('GRU', 'America/Sao_Paulo'), destination: airport('LIS', 'Europe/Lisbon'), departing_at: '2027-04-02T22:10:00', arriving_at: '2027-04-03T12:05:00', marketing_carrier: tap, operating_carrier: tap, marketing_carrier_flight_number: '88', passengers: [{ baggages: [{ type: 'checked', quantity: 1 }, { type: 'carry_on', quantity: 1 }] }] }] },
          { duration: 'PT12H50M', segments: [
            { origin: airport('LIS', 'Europe/Lisbon'), destination: airport('OPO', 'Europe/Lisbon'), departing_at: '2027-04-10T09:00:00', arriving_at: '2027-04-10T10:00:00', marketing_carrier: tap, operating_carrier: tap, marketing_carrier_flight_number: '1940' },
            { origin: airport('OPO', 'Europe/Lisbon'), destination: airport('GRU', 'America/Sao_Paulo'), departing_at: '2027-04-10T12:30:00', arriving_at: '2027-04-10T17:50:00', marketing_carrier: tap, operating_carrier: tap, marketing_carrier_flight_number: '107' }
          ] }
        ]
      }, { id: 'off_broken', total_amount: 'abc', total_currency: 'BRL', slices: [] }]
    }
  };
  const request = validateFlightSearch({ origin: 'GRU', destination: 'LIS', departureDate: '2027-04-02', returnDate: '2027-04-10', passengers: { adults: 2 } }, { now: NOW });
  const mapped = mapOffer(syntheticResponse.data.offers[0], { request, searchedAt: '2026-11-15T12:00:00Z', dataSource: 'test' });
  assert.deepEqual(checkFlightOffer(mapped), [], 'oferta Duffel convertida cumpre o modelo');
  assert.equal(mapped.slices[0].departAt, '2027-04-02T22:10:00-03:00');
  assert.equal(mapped.slices[0].durationMinutes, 595);
  assert.deepEqual(mapped.slices[1].connections, ['OPO']);
  assert.equal(mapped.slices[1].segments[1].flightNumber, 'TP107');
  assert.deepEqual(mapped.baggage, [{ type: 'checked', quantity: 1, per: 'passenger' }, { type: 'carry_on', quantity: 1, per: 'passenger' }]);
  assert.deepEqual(mapped.conditions, { refundable: false, changeable: true, changePenalty: { amount: '450.00', currency: 'BRL' } });
  assert.equal(mapped.bookingUrl, undefined, 'Duffel não tem link de reserva externo');
  assert.equal(mapOffer(syntheticResponse.data.offers[1], { request, searchedAt: '2026-11-15T12:00:00Z', dataSource: 'test' }), null, 'oferta incompleta é ignorada');

  // Pedido enviado conforme a documentação; token só no cabeçalho; nunca em erros.
  const TOKEN = `duffel_test_${'x'.repeat(24)}`;
  let sent = null;
  const fetchImpl = async (url, init) => {
    sent = { url, init };
    return new Response(JSON.stringify(syntheticResponse), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const duffel = createDuffelFlights({ DUFFEL_TOKEN: TOKEN }, { fetchImpl });
  assert.deepEqual([duffel.mode, duffel.dataSource], ['test', 'test'], 'token de teste → dados de teste');
  const { offers } = await duffel.searchFlights(request, { now: NOW });
  assert.equal(offers.length, 1);
  assert.equal(sent.url, 'https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=9000');
  assert.equal(sent.init.headers.authorization, `Bearer ${TOKEN}`);
  assert.equal(sent.init.headers['duffel-version'], 'v2');
  assert.deepEqual(JSON.parse(sent.init.body), { data: {
    slices: [{ origin: 'GRU', destination: 'LIS', departure_date: '2027-04-02' }, { origin: 'LIS', destination: 'GRU', departure_date: '2027-04-10' }],
    passengers: [{ type: 'adult' }, { type: 'adult' }],
    cabin_class: 'economy'
  } });
  assert.equal(createDuffelFlights({ DUFFEL_TOKEN: `duffel_live_${'y'.repeat(24)}` }, { fetchImpl }).dataSource, 'live');
  assert.throws(() => createDuffelFlights({}), /DUFFEL_TOKEN ausente/);
  await assert.rejects(duffel.searchFlights({ ...request, passengers: { adults: 1, children: 1, infants: 0 } }), /só adultos/);
  const failingDuffel = createDuffelFlights({ DUFFEL_TOKEN: TOKEN }, { fetchImpl: async () => new Response(`{"errors":[{"message":"token ${TOKEN} inválido"}]}`, { status: 401 }) });
  await assert.rejects(failingDuffel.searchFlights(request), error => error.message === 'Duffel respondeu 401' && !error.message.includes(TOKEN));

  // Pelo Worker: oferta Duffel convertida chega ao front e o token não aparece na resposta.
  registerProvider('flights', 'duffel-synthetic', env => createDuffelFlights(env, { fetchImpl }));
  const ORIGIN = 'https://lucassfz.github.io';
  const app = createApp({ now: () => NOW, log: () => {} });
  const response = await app.fetch(new Request('https://api.test/api/v1/flights/search', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '100.64.1.1' },
    body: JSON.stringify({ origin: 'GRU', destination: 'LIS', departureDate: '2027-04-02', returnDate: '2027-04-10', passengers: { adults: 2 } })
  }), { ALLOWED_ORIGINS: ORIGIN, FLIGHT_PROVIDERS: 'duffel-synthetic', DUFFEL_TOKEN: TOKEN });
  const text = await response.text();
  assert.equal(response.status, 200);
  assert.ok(!text.includes(TOKEN), 'token nunca vai ao navegador');
  assert.equal(JSON.parse(text).offers[0].provider, 'duffel');
}

console.log('Backend: contrato, validação (voos e hotéis), modelos, confiabilidade, Worker de ponta a ponta, cliente do site e adaptador Duffel verificados (Duffel com resposta sintética da documentação).');

// 9. Seção de voos do Planner: ordenação, resumo e total anexado (funções puras).
{
  const { sortOffers, offerSummary, attachedFlightsTotal } = await import('../js/planner/live.flights.section.js');
  const request = validateFlightSearch({ origin: 'GRU', destination: 'LIS', departureDate: '2027-04-02', returnDate: '2027-04-10', passengers: { adults: 1 } }, { now: NOW });
  const { offers } = await mockFlights.searchFlights(request, { now: NOW });
  const byPrice = sortOffers(offers, 'price');
  for (let index = 1; index < byPrice.length; index += 1) assert.ok(Number(byPrice[index - 1].price.total.amount) <= Number(byPrice[index].price.total.amount));
  const totalMinutes = offer => offer.slices.reduce((sum, slice) => sum + slice.durationMinutes, 0);
  const byDuration = sortOffers(offers, 'duration');
  for (let index = 1; index < byDuration.length; index += 1) assert.ok(totalMinutes(byDuration[index - 1]) <= totalMinutes(byDuration[index]));
  assert.equal(sortOffers(offers, 'stops')[0].slices[0].stops, 0);
  assert.match(offerSummary(offers[0]), /^Companhia de teste · GRU→LIS · 02\/04–10\/04 · /);
  assert.equal(attachedFlightsTotal({ lines: [
    { category: 'flights', amountBRL: 100, source: { kind: 'provider-offer' } },
    { category: 'flights', amountBRL: 50, source: { kind: 'traveling-estimate' } },
    { category: 'lodging', amountBRL: 70, source: { kind: 'provider-offer' } }
  ] }), 100);
  console.log('Backend: seção de voos do Planner (ordenação, resumo, total) verificada.');
}

// 10. Hospedagem no Planner: link do Booking.com e ordenação (funções puras).
{
  const { bookingSearchUrl, sortHotelOffers } = await import('../js/planner/live.hotels.section.js');
  const trip = { startDate: '2027-04-03', endDate: '2027-04-10', travelers: 3, city: { name: 'Lisboa', lat: 38.72, lng: -9.14 } };
  const url = new URL(bookingSearchUrl(trip));
  assert.equal(url.origin + url.pathname, 'https://www.booking.com/searchresults.pt-br.html');
  assert.deepEqual(Object.fromEntries(url.searchParams), { ss: 'Lisboa', checkin: '2027-04-03', checkout: '2027-04-10', group_adults: '3', group_children: '0', no_rooms: '2', lang: 'pt-br' });
  assert.equal(new URL(bookingSearchUrl(trip, { aid: '123456' })).searchParams.get('aid'), '123456', 'código de afiliado só quando configurado');
  assert.equal(bookingSearchUrl({ ...trip, city: null }), null);
  assert.equal(bookingSearchUrl({ ...trip, endDate: null }), null);
  const request = validateHotelSearch({ destination: { lat: 38.72, lng: -9.14 }, checkIn: '2027-04-03', checkOut: '2027-04-10', guests: { adults: 2 } }, { now: NOW });
  const { properties, offers } = await mockHotels.searchHotels(request, { now: NOW });
  const byId = new Map(properties.map(property => [property.propertyId, property]));
  const byPrice = sortHotelOffers(offers, byId, 'price');
  for (let index = 1; index < byPrice.length; index += 1) assert.ok(Number(byPrice[index - 1].price.total.amount) <= Number(byPrice[index].price.total.amount));
  const byRating = sortHotelOffers(offers, byId, 'rating');
  for (let index = 1; index < byRating.length; index += 1) assert.ok((byId.get(byRating[index - 1].propertyId).rating.stars) >= byId.get(byRating[index].propertyId).rating.stars);
  console.log('Backend: hospedagem no Planner (link Booking.com, ordenação) verificada.');
}
