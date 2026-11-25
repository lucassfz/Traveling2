// Prévia da rota no globo ("Ver rota no globo", Descobrir e Planner).
import { COUNTRIES } from '../../js/countries.dataset.js';
import { buildFlightRoute, estimatedTravelMinutes } from '../../js/flight.route.js';
import { reducedMotion } from '../../js/core/motion.js';
import { app } from './store.js';
import { airports, globe, resolveDestinationAirport } from './services.js';
import { announce, focusElement, focusSoon } from './focus.js';

const NO_ROUTE = 'Rota ainda não disponível para este destino.';
let requestId = 0;
let returnTimer = 0;
let exploringKey = null;
let returnFocus = null;

const codeOf = airport => airport?.iata || airport?.icao || '';

/** "Ver rota no globo" sempre parte de GRU; para o próprio GRU não há rota. */
export function routeAvailability({ mapReady, countryKey, destinationAirport, route, routeLoading, exploreStatus }) {
  const sameAirport = codeOf(destinationAirport) === 'GRU';
  return {
    disabled: !mapReady || !countryKey || !destinationAirport || Boolean(route) || routeLoading || sameAirport,
    status: sameAirport && countryKey
      ? 'A rota de demonstração parte de São Paulo (GRU), que já fica aqui. Para voos nacionais, planeje uma viagem e escolha outra origem.'
      : exploreStatus
  };
}

/** Aeroporto de destino do país aberto (rota no globo e salas VIP da rota). */
export async function primeDestination(countryKey) {
  app.set({ destinationAirport: null, routeContext: null, exploreStatus: '' });
  const airport = await resolveDestinationAirport(countryKey).catch(() => null);
  if (app.get().countryKey !== countryKey) return;
  if (!airport) app.set({ exploreStatus: NO_ROUTE });
  else app.set({ destinationAirport: airport, routeContext: { origin: app.get().originAirport, destination: airport } });
}

export function closeRoute({ camera = true, restore = false } = {}) {
  requestId += 1;
  clearTimeout(returnTimer);
  exploringKey = null;
  if (!app.get().route) return;
  app.set({ route: null });
  globe.map?.stopRoutePreview(camera);
  document.body.classList.remove('route-mode');
  const target = returnFocus;
  returnFocus = null;
  if (restore) focusElement(target, 'country-explore-button');
}

/**
 * Abre a prévia. @returns {Promise<boolean>} abriu.
 * Com `airportCode`, um erro é lançado para quem chamou explicar o motivo.
 */
export async function openRoute({ countryKey = app.get().countryKey, airportCode, originCode = 'GRU', focusBack = document.activeElement, isCurrent = () => app.get().countryKey === countryKey } = {}) {
  if (!globe.map?.ready || !countryKey || app.get().route) return false;
  const id = ++requestId;
  app.set({ routeLoading: true });
  try {
    const [origin, destination, miles, tools] = await Promise.all([
      airports.resolve(originCode),
      airportCode ? airports.resolve(airportCode) : resolveDestinationAirport(countryKey),
      import('../../js/miles.data.js').catch(() => null),
      import('../../js/miles.tools.js').catch(() => null)
    ]);
    if (id !== requestId || !isCurrent()) return false;
    if (!origin || !destination) throw new Error('Aeroporto indisponível. Verifique sua conexão e tente novamente.');
    const route = buildFlightRoute(origin, destination);
    if (!globe.map.startRoutePreview(route)) throw new Error('O globo 3D está indisponível.');
    const minutes = estimatedTravelMinutes(route.distanceKm);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const country = COUNTRIES[countryKey];
    const city = (airportCode ? destination.city : country.airportCity) || destination.city || country.capital || country.namePt;
    const guide = miles && tools
      ? [origin, destination].find(airport => airport?.iata && tools.findVerifiedLounges(miles.AIRPORT_GUIDES, airport.iata).length)
      : null;
    returnFocus = focusBack;
    document.body.classList.add('route-mode');
    app.set({
      routeContext: { origin, destination },
      route: {
        title: `${origin.city || origin.name} → ${city}`,
        codes: `${codeOf(origin)} → ${codeOf(destination) || countryKey}`,
        details: `${Math.round(route.distanceKm).toLocaleString('pt-BR')} km · Tempo de viagem estimado: cerca de ${hours} h${rest ? ` ${rest} min` : ''}`,
        airportCode: guide?.iata ?? null
      }
    });
    focusSoon('#flight-preview-close');
    announce(`Rota no globo: ${origin.city || origin.name} até ${city}.`);
    return true;
  } catch (error) {
    if (airportCode) throw error;
    return false;
  } finally {
    app.set({ routeLoading: false });
  }
}

/** Botão "Ver rota no globo" do guia do país: volta sozinho ao guia na chegada. */
export async function exploreDestination() {
  const { countryKey, hub } = app.get();
  if (!countryKey || routeAvailability(app.get()).disabled) return;
  if (hub === 'miles') app.set({ hub: null });
  exploringKey = countryKey;
  app.set({ exploreStatus: '' });
  const opened = await openRoute({ countryKey, focusBack: document.getElementById('country-explore-button') }).catch(() => false);
  if (!opened && app.get().countryKey === countryKey) {
    exploringKey = null;
    app.set({ exploreStatus: NO_ROUTE });
  }
}

/** Chamado pelo motor quando o avião chega. */
export function routeArrived() {
  const countryKey = exploringKey;
  if (!countryKey || countryKey !== app.get().countryKey || !app.get().route) return;
  returnTimer = setTimeout(() => {
    if (!app.get().route || exploringKey !== countryKey) return;
    closeRoute();
    app.set({ tab: 'overview' });
    focusSoon('#country-name');
    announce(`Rota concluída. Guia de ${COUNTRIES[countryKey].namePt}.`);
  }, reducedMotion.matches ? 650 : 1100);
}
