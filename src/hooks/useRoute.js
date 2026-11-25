// Rota estimada e preço visto recentemente de uma viagem, compartilhados entre a
// etapa Voo, os parceiros e o custo no resumo.
import { useEffect, useReducer } from 'react';
import { cheapestFlight, pricePeriod } from '../../js/api/prices.client.js';
import { useApp } from '../state/store.js';
import { routes } from '../state/services.js';

/** Rota da viagem: null/'loading' enquanto calcula; depois 'ready' ou 'error'. */
export function useRoute(trip) {
  const [, refresh] = useReducer(value => value + 1, 0);
  // O câmbio entra no cálculo: redesenha quando chega.
  useApp(state => state.brlPerUsd);
  useApp(state => state.fxSnapshot);
  const key = routes.key(trip);
  useEffect(() => {
    let current = true;
    const known = routes.get(trip);
    if (!known || known.status === 'loading') routes.load(trip).then(() => { if (current) refresh(); });
    return () => { current = false; };
  }, [key]);
  return routes.get(trip);
}

const prices = new Map();

/** Passagem mais barata vista recentemente para a rota e o período, ou null. */
export function useRecentFare(trip, route) {
  const [, refresh] = useReducer(value => value + 1, 0);
  const period = pricePeriod(trip);
  const key = route?.status === 'ready' && period ? [trip.origin, route.destination.iata, period.departure, period.return ?? ''].join('|') : null;
  useEffect(() => {
    if (!key) return undefined;
    let current = true;
    if (!prices.has(key)) {
      prices.set(key, null);
      cheapestFlight({ origin: trip.origin, destination: route.destination.iata, departure: period.departure, return: period.return })
        .then(offer => { prices.set(key, offer ?? null); if (current) refresh(); })
        .catch(() => {});
    }
    return () => { current = false; };
  }, [key]);
  return key ? prices.get(key) ?? null : null;
}
