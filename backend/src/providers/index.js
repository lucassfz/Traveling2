// Registro de fornecedores. A interface comum de um adaptador é:
//
//   { id, kind: 'flights' | 'hotels', mode: 'test' | 'live', dataSource: 'live' | 'cached' | 'test',
//     searchFlights?(request, { signal, now }) → Promise<{ offers: FlightOffer[] }>,
//     searchHotels?(request, { signal, now })  → Promise<{ properties: HotelProperty[], offers: HotelOffer[] }> }
//
// Os adaptadores reais (Duffel, Travelpayouts, LiteAPI…) entram aqui nas fases
// 3.3 e 3.4, lendo as credenciais SOMENTE de `env` (Secrets do Worker).
// A lista ativa vem das variáveis FLIGHT_PROVIDERS e HOTEL_PROVIDERS ("mock" por padrão).
import { mockFlights, mockHotels } from './mock.js';
import { createDuffelFlights } from './duffel.flights.js';

const FACTORIES = {
  flights: { mock: () => mockFlights, duffel: env => createDuffelFlights(env) },
  hotels: { mock: () => mockHotels }
};

/** Registra um adaptador (usado pelos adaptadores reais e pelos testes). */
export function registerProvider(kind, id, factory) {
  if (!FACTORIES[kind]) throw new Error(`Tipo de fornecedor desconhecido: ${kind}`);
  FACTORIES[kind][id] = factory;
}

export function providersFor(kind, env = {}) {
  const variable = kind === 'flights' ? env.FLIGHT_PROVIDERS : env.HOTEL_PROVIDERS;
  const ids = String(variable ?? 'mock').split(',').map(value => value.trim()).filter(Boolean);
  return ids.map(id => {
    const factory = FACTORIES[kind][id];
    if (!factory) throw new Error(`Fornecedor desconhecido em ${kind}: ${id}`);
    return factory(env);
  });
}

export function allProviders(env = {}) {
  return [...providersFor('flights', env), ...providersFor('hotels', env)];
}
