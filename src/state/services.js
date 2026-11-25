// Serviços únicos do app (fora do React): armazenamentos, aeroportos, motor do
// globo e câmbio. Os componentes usam; nenhum deles conhece o DOM.
import { COUNTRIES } from '../../js/countries.dataset.js';
import { AirportRepository } from '../../js/airports.repository.js';
import { createTripStore } from '../../js/planner/trip.store.js';
import { createSavedStore } from '../../js/saved.store.js';
import { createRouteEstimator } from '../../js/planner/route.estimator.js';
import { rateFor, rateTable } from '../../js/planner/currency.js';
import { loadCities, resolveCity } from '../../js/geo/cities.js';
import { app } from './store.js';

export const airports = new AirportRepository();
export const tripStore = createTripStore({ countries: COUNTRIES });
export const savedStore = createSavedStore({ countries: COUNTRIES });

// Motor 3D: preenchido por components/Globe.jsx quando carrega.
export const globe = { map: null };

export const COUNTRY_BY_ALPHA2 = new Map(Object.entries(COUNTRIES).map(([key, country]) => [country.alpha2, key]));
export const countryKeyOfCity = city => COUNTRY_BY_ALPHA2.get(city?.country) ?? null;

// ---------- Aeroportos ----------

const destinationCache = new Map();

/** Aeroporto de entrada de um país (cadastrado ou o mais próximo), ou null. */
export async function resolveDestinationAirport(countryKey) {
  if (destinationCache.has(countryKey)) return destinationCache.get(countryKey);
  const country = COUNTRIES[countryKey];
  if (!country || country.flightUnavailable) return null;
  let airport = null;
  if (country.airport && country.airport !== '—') airport = await airports.resolve(country.airport);
  if (!airport && !country.airport && country.latlng) airport = await airports.findNearest(country.latlng[0], country.latlng[1]);
  destinationCache.set(countryKey, airport);
  return airport;
}

/** Aeroporto que atende uma cidade, ou null. */
export const resolveCityAirport = (lat, lng) => airports.findGateway(lat, lng);

// ---------- Câmbio ----------

export function rates() {
  const { fxSnapshot, liveRates, brlPerUsd } = app.get();
  return rateTable({ snapshot: fxSnapshot, live: { ...liveRates, ...(brlPerUsd ? { USD: brlPerUsd } : {}) } });
}

/** Dólar em reais ({ rate, date, kind, label, source }), ou null. */
export function usdRate() {
  const { brlPerUsd } = app.get();
  return rateFor('USD', rates()) ?? (brlPerUsd?.rate > 0 ? brlPerUsd : null);
}

// Uma estimativa de rota por viagem (etapa Voo, parceiros e custo no resumo).
export const routes = createRouteEstimator({ airportRepository: airports, resolveDestinationAirport, resolveCityAirport, usdRate });

// ---------- Cidades ----------

/** Cidade do globo que corresponde a um lugar de data/geo, ou null. */
export async function matchGlobeCity(country, place) {
  if (!country?.alpha2) return null;
  const cities = await loadCities(country.alpha2).catch(() => []);
  return resolveCity(cities, { name: place.name, lat: place.lat, lng: place.lng, geonameId: place.ids?.geonames });
}

const savedCityRef = item => ({ id: item.cityId, name: item.name, lat: item.lat, lng: item.lng, geonameId: item.geonameId });

/** Destino salvo desta cidade do globo. Evita salvar a mesma cidade duas vezes. */
export function savedEntryForCity(city, countryKey) {
  return savedStore.items.find(item => item.type === 'city' && item.countryKey === countryKey
    && resolveCity([city], savedCityRef(item)) === city) ?? null;
}

function cityEntry(city, countryKey) {
  return {
    id: `city:${city.id}`, type: 'city', countryKey, name: city.name,
    context: [city.region, COUNTRIES[countryKey]?.namePt].filter(Boolean).join(' · '),
    lat: city.lat, lng: city.lng, cityId: city.id, ...(city.region ? { region: city.region } : {}),
    ...(Number.isInteger(city.geonameId) ? { geonameId: city.geonameId } : {})
  };
}

/** @returns {boolean} a cidade ficou salva. */
export function toggleSavedCity(city, countryKey) {
  const existing = savedEntryForCity(city, countryKey);
  return existing ? !savedStore.remove(existing.id) : Boolean(savedStore.save(cityEntry(city, countryKey)));
}

// Cidade salva → cidade do globo, com a mesma regra de identidade de resolveCity.
export async function findSavedCity(item) {
  if (item.type !== 'city') return null;
  const cities = await loadCities(COUNTRIES[item.countryKey]?.alpha2).catch(() => []);
  return resolveCity(cities, savedCityRef(item));
}
