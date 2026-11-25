// Estimativa de rota do Planner (origem → aeroporto da cidade ou do país).
// Uma por viagem, usada pela etapa Voo, pelos parceiros e pelo custo no resumo.
import { estimateFlightPricing } from '../pricing.engine.js';
import { tripMonth } from './trip.model.js';

export const CABINS = Object.freeze({ economy: 'Econômica', premium: 'Premium Economy', business: 'Executiva' });

/** Estimativa de um trecho com o câmbio informado ({ rate } de fx.service.js). */
export function estimateRoute({ origin, destination, cabin = 'economy', month = new Date().getMonth(), fx = null }) {
  return estimateFlightPricing({ origin, destination, cabin, month, brlPerUsd: fx?.rate ?? null });
}

/**
 * Rota estimada da viagem (origem → aeroporto da cidade ou do país), uma por vez
 * e reaproveitada por quem precisar: a etapa Voo e o custo no resumo.
 * @param {object} deps { airportRepository, resolveDestinationAirport, resolveCityAirport, usdRate }
 * @returns {{ key: (trip) => string, get: (trip) => object|null, load: (trip) => Promise<object> }}
 */
export function createRouteEstimator({ airportRepository, resolveDestinationAirport, resolveCityAirport = async () => null, usdRate = () => null }) {
  let route = null;
  let pending = null;
  const key = trip => [trip.id, trip.origin, trip.countryKey, trip.city?.id ?? '', trip.cabin, tripMonth(trip) ?? new Date().getMonth()].join('|');

  async function compute(trip, routeKey) {
    const [origin, destination] = await Promise.all([
      airportRepository.resolve(trip.origin),
      // Com cidade escolhida: aeroporto que atende a cidade; senão o do país.
      (trip.city ? resolveCityAirport(trip.city.lat, trip.city.lng) : Promise.resolve(null))
        .then(airport => airport ?? resolveDestinationAirport(trip.countryKey))
    ]);
    if (!origin) return { key: routeKey, status: 'error', message: `Aeroporto de origem ${trip.origin} não encontrado. Confira o código na etapa Datas.` };
    if (!destination) return { key: routeKey, status: 'error', message: 'Ainda não há estimativa de voo para este destino.' };
    if ((origin.iata || origin.icao) === (destination.iata || destination.icao)) return { key: routeKey, status: 'error', message: 'Origem e destino são o mesmo aeroporto.' };
    const month = tripMonth(trip) ?? new Date().getMonth();
    return { key: routeKey, status: 'ready', origin, destination, estimate: estimateRoute({ origin, destination, cabin: trip.cabin, month, fx: usdRate() }) };
  }

  return {
    key,
    get: trip => (route?.key === key(trip) ? route : null),
    load(trip) {
      const routeKey = key(trip);
      if (route?.key === routeKey && route.status !== 'error' && route.status !== 'loading') return Promise.resolve(route);
      if (pending?.key === routeKey) return pending.promise;
      route = { key: routeKey, status: 'loading' };
      const promise = compute(trip, routeKey)
        .catch(() => ({ key: routeKey, status: 'error', message: 'Não foi possível calcular agora.' }))
        .then(result => {
          if (route?.key === routeKey) route = result;
          if (pending?.key === routeKey) pending = null;
          return result;
        });
      pending = { key: routeKey, promise };
      return promise;
    }
  };
}
