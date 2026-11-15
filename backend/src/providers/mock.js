// Fornecedor fictício para desenvolvimento e testes (fase 3.2). Implementa a mesma
// interface dos adaptadores reais (ver providers/index.js) sem rede e sem chaves.
// É declaradamente de teste: dataSource "test", companhia "ZZ / Companhia de teste",
// hotéis sem fotos. Determinístico: a mesma busca devolve sempre o mesmo resultado.
import { money } from '../models.js';

// Gerador pseudoaleatório com semente (mulberry32) a partir do texto da busca.
function seeded(text) {
  let hash = 1779033703 ^ text.length;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const iso = time => new Date(time).toISOString().replace('.000Z', 'Z');
const CABIN_FACTOR = { economy: 1, premium: 1.6, business: 3, first: 4.5 };
const CONNECTIONS = ['PTY', 'MAD', 'LIS', 'MIA', 'BOG', 'SCL'];

function slice(origin, destination, date, random, stops, cabin) {
  const departHour = 6 + Math.floor(random() * 16);
  const departAt = Date.parse(`${date}T${String(departHour).padStart(2, '0')}:${random() < 0.5 ? '05' : '40'}:00Z`);
  const flyMinutes = 120 + Math.floor(random() * 600);
  const layover = stops ? 70 + Math.floor(random() * 120) : 0;
  const durationMinutes = flyMinutes + layover;
  const arriveAt = departAt + durationMinutes * 60_000;
  const connection = stops ? CONNECTIONS.find(code => code !== origin && code !== destination) : null;
  const carrier = { iata: 'ZZ', name: 'Companhia de teste' };
  const number = () => `ZZ${100 + Math.floor(random() * 800)}`;
  const segments = stops
    ? [
      { origin, destination: connection, departAt: iso(departAt), arriveAt: iso(departAt + (flyMinutes / 2) * 60_000), marketingCarrier: carrier, operatingCarrier: carrier, flightNumber: number() },
      { origin: connection, destination, departAt: iso(departAt + (flyMinutes / 2 + layover) * 60_000), arriveAt: iso(arriveAt), marketingCarrier: carrier, operatingCarrier: carrier, flightNumber: number() }
    ]
    : [{ origin, destination, departAt: iso(departAt), arriveAt: iso(arriveAt), marketingCarrier: carrier, operatingCarrier: carrier, flightNumber: number() }];
  return { origin, destination, departAt: iso(departAt), arriveAt: iso(arriveAt), durationMinutes, stops, connections: connection ? [connection] : [], segments, cabin };
}

export const mockFlights = {
  id: 'mock',
  kind: 'flights',
  mode: 'test',
  dataSource: 'test',
  async searchFlights(request, { now = new Date() } = {}) {
    const random = seeded(`${request.origin}-${request.destination}-${request.departureDate}-${request.returnDate ?? ''}-${request.cabin}`);
    const travelers = request.passengers.adults + request.passengers.children + request.passengers.infants;
    const currency = request.currency ?? 'BRL';
    const count = 3 + Math.floor(random() * 3);
    const offers = [];
    for (let index = 0; index < count; index += 1) {
      const stops = index === 0 ? 0 : random() < 0.6 ? 1 : 0;
      const outbound = slice(request.origin, request.destination, request.departureDate, random, stops, request.cabin);
      const slices = [outbound];
      if (request.returnDate) slices.push(slice(request.destination, request.origin, request.returnDate, random, stops, request.cabin));
      const perPerson = (900 + random() * 4200) * (CABIN_FACTOR[request.cabin] ?? 1) * (stops ? 0.85 : 1) * (request.returnDate ? 1.8 : 1);
      const total = perPerson * travelers;
      offers.push({
        kind: 'flight-offer',
        provider: 'mock',
        offerId: `mock_${request.origin}${request.destination}_${index}`,
        dataSource: 'test',
        searchedAt: iso(now.getTime()),
        expiresAt: iso(now.getTime() + 30 * 60_000),
        passengers: request.passengers,
        cabin: request.cabin,
        price: { total: money(total, currency), base: money(total * 0.82, currency), taxes: money(total - Number((total * 0.82).toFixed(2)), currency) },
        slices: slices.map(({ cabin, ...rest }) => rest),
        baggage: [{ type: 'carry_on', quantity: 1, per: 'passenger' }],
        conditions: { refundable: false, changeable: random() < 0.5 },
        status: 'available'
      });
    }
    return { offers };
  }
};

export const mockHotels = {
  id: 'mock',
  kind: 'hotels',
  mode: 'test',
  dataSource: 'test',
  async searchHotels(request, { now = new Date() } = {}) {
    const { lat, lng, label } = request.destination;
    const random = seeded(`${lat.toFixed(3)},${lng.toFixed(3)}-${request.checkIn}-${request.checkOut}-${request.rooms}`);
    const currency = request.currency ?? 'BRL';
    const properties = [];
    const offers = [];
    const count = 3 + Math.floor(random() * 3);
    for (let index = 0; index < count; index += 1) {
      const propertyId = `mock_h${index}`;
      const stars = 2 + Math.floor(random() * 4);
      properties.push({
        kind: 'hotel-property',
        provider: 'mock',
        propertyId,
        name: `Hotel de teste ${index + 1}`,
        location: {
          city: label ?? undefined,
          lat: Number((lat + (random() - 0.5) * 0.04).toFixed(5)),
          lng: Number((lng + (random() - 0.5) * 0.04).toFixed(5))
        },
        rating: { stars },
        amenities: random() < 0.7 ? ['wifi'] : [],
        fetchedAt: iso(now.getTime())
      });
      const perNight = (160 + random() * 900) * (stars / 3) * request.rooms;
      offers.push({
        kind: 'hotel-offer',
        provider: 'mock',
        offerId: `mock_r${index}`,
        propertyId,
        dataSource: 'test',
        searchedAt: iso(now.getTime()),
        expiresAt: null,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        nights: request.nights,
        guests: { adults: request.guests.adults, children: request.guests.children },
        rooms: request.rooms,
        room: { name: request.rooms > 1 ? `${request.rooms} quartos duplos` : 'Quarto duplo' },
        board: random() < 0.5 ? 'breakfast' : 'room-only',
        price: { total: money(perNight * request.nights, currency), perNight: money(perNight, currency), taxesIncluded: true },
        cancellation: { refundable: random() < 0.6 },
        availability: 'available'
      });
    }
    return { properties, offers };
  }
};
