// Ações do app: única porta para mudar o estado global. Regras de convivência
// entre painéis, seleção no globo, links (hash), salvos e planejador.
import { COUNTRIES } from '../../js/countries.dataset.js';
import { STORAGE_KEYS, writeJsonStorage, writeStorage } from '../../js/core/storage.js';
import { isVisaFreeForBrazil } from '../../js/country.exploration.js';
import { applySettings, saveSettings } from '../../js/accessibility.js';
import { cityHash, countryHash, pageUrl, parseHash, setHash } from '../../js/share.link.js';
import { createTrip } from '../../js/planner/trip.model.js';
import { loadCities } from '../../js/geo/cities.js';
import { app } from './store.js';
import { COUNTRY_BY_ALPHA2, findSavedCity, globe, matchGlobeCity, savedStore, tripStore } from './services.js';
import { announce, focusSoon, rememberOpener, restoreFocus, usingKeyboard } from './focus.js';
import { closeRoute, primeDestination } from './route.js';

const narrow = () => window.innerWidth < 1200;

// ---------- Tema e acessibilidade ----------

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  writeStorage(STORAGE_KEYS.theme, theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#05070c' : '#f4f6f7');
  app.set({ theme });
  globe.map?.setTheme();
}

export const toggleTheme = () => setTheme(app.get().theme === 'dark' ? 'light' : 'dark');

export function updateA11y(changes) {
  const a11y = { ...app.get().a11y, ...changes };
  saveSettings(a11y);
  applySettings(a11y);
  app.set({ a11y });
}

export function setA11yOpen(open) {
  if (open === app.get().a11yOpen) return;
  if (open) rememberOpener('a11y');
  app.set({ a11yOpen: open });
  if (open) focusSoon('#a11y-title');
  else restoreFocus('a11y', 'a11y-button');
}

export function setHelpOpen(open) {
  if (open === app.get().helpOpen) return;
  if (open) rememberOpener('help');
  app.set({ helpOpen: open });
  if (!open) restoreFocus('help', 'a11y-button');
}

// ---------- Filtros do globo ----------

export const VISA_FREE_KEYS = Object.entries(COUNTRIES).filter(([, country]) => isVisaFreeForBrazil(country)).map(([key]) => key);

/** Países com ótima época (months[m] === 2) no mês. */
export const seasonKeys = month => Object.entries(COUNTRIES)
  .filter(([, country]) => Array.isArray(country.months) && country.months[month] === 2).map(([key]) => key);

export function syncFilters() {
  const { seasonMonth, visaFilter } = app.get();
  if (Number.isInteger(seasonMonth)) globe.map?.setVisaFreeFilter(true, seasonKeys(seasonMonth));
  else globe.map?.setVisaFreeFilter(visaFilter, VISA_FREE_KEYS);
}

// Os dois filtros usam o mesmo destaque do globo: nunca ficam ligados juntos.
export function toggleVisaFilter() {
  const visaFilter = !app.get().visaFilter;
  app.set({ visaFilter, ...(visaFilter ? { seasonMonth: null } : {}) });
  syncFilters();
}

export function setSeasonMonth(month) {
  const seasonMonth = month === app.get().seasonMonth ? null : month;
  app.set({ seasonMonth, ...(Number.isInteger(seasonMonth) ? { visaFilter: false } : {}) });
  syncFilters();
}

export function toggleVisited() {
  const { countryKey, visited } = app.get();
  if (!countryKey) return;
  const next = new Set(visited);
  if (!next.delete(countryKey)) next.add(countryKey);
  app.set({ visited: next });
  writeJsonStorage(STORAGE_KEYS.visited, [...next]);
  globe.map?.setVisitedCountries?.(next);
}

// ---------- Painéis da esquerda (milhas, viagens, salvos, lista de lugares) ----------

const HUB_LAUNCHERS = { miles: 'miles-launcher', planner: 'trips-launcher', saved: 'saved-launcher', places: 'places-launcher' };

/** Abre um painel da esquerda. Só um por vez; em telas menores fecha o guia do país. */
export function openHub(hub, { focus = true, opener = document.activeElement } = {}) {
  const current = app.get();
  if (current.hub === hub) return;
  if (current.hub === null) rememberOpener('hub', opener);
  closeDiscovery();
  if (narrow() && current.countryOpen) closeCountry();
  app.set({ hub });
  if (focus) focusSoon(`[data-hub="${hub}"] .miles-hub__title`);
}

/** Fecha o painel da esquerda. `restore` devolve o foco a quem o abriu. */
export function closeHub({ restore = false } = {}) {
  const { hub } = app.get();
  if (!hub) return;
  app.set({ hub: null });
  if (restore) restoreFocus('hub', HUB_LAUNCHERS[hub]);
}

export function toggleHub(hub) {
  if (app.get().hub === hub) closeHub({ restore: true });
  else openHub(hub);
}

// ---------- Descobrir ----------

export function openDiscovery() {
  rememberOpener('discovery');
  closeHub();
  closeCountry();
  app.set({ discoveryOpen: true });
  focusSoon('#discovery-title');
}

export function closeDiscovery({ restore = false } = {}) {
  if (!app.get().discoveryOpen) return;
  app.set({ discoveryOpen: false });
  closeRoute({ camera: false });
  if (restore) restoreFocus('discovery', 'discover-button');
}

// ---------- País ----------

/** Abre o guia de um país e leva o globo até ele. */
export function selectCountry(countryKey, { focus = usingKeyboard() } = {}) {
  const country = COUNTRIES[countryKey];
  if (!country) return;
  if (!app.get().countryOpen) rememberOpener('country');
  app.set({ tourOpen: false });
  closeCity();
  closeRoute({ camera: false });
  closeDiscovery();
  const { hub } = app.get();
  if (hub === 'miles' || (narrow() && hub)) closeHub();
  globe.map?.selectCountry(countryKey);
  app.set({ countryKey, countryOpen: true, tab: 'overview', continent: country.continent, region: { level: 'country', id: null }, exploreStatus: '' });
  setHash(countryHash(country.alpha2));
  primeDestination(countryKey);
  if (focus) focusSoon('#country-name');
  else announce(`Guia de ${country.namePt} aberto.`);
}

/** Descobrir destaca o país no globo sem abrir o guia. */
export function highlightCountry(countryKey) {
  closeRoute({ camera: false });
  app.set({ countryKey, continent: COUNTRIES[countryKey].continent, destinationAirport: null });
  globe.map?.selectCountry(countryKey);
}

export function closeCountry({ restore = false } = {}) {
  const { countryOpen, countryKey } = app.get();
  closeRoute({ camera: false });
  if (!countryOpen && !countryKey) return;
  app.set({ countryOpen: false, countryKey: null, region: { level: 'country', id: null } });
  globe.map?.clearSelection();
  setHash('');
  if (restore) restoreFocus('country', 'country-search-input');
}

export function setTab(tab) {
  app.set({ tab });
}

export function selectContinent(continent) {
  closeRoute({ camera: false });
  closeDiscovery();
  closeCountry();
  app.set({ continent });
  globe.map?.setContinent(continent);
}

/** Globo inteiro, sem seleção; os dados salvos não mudam. */
export function home() {
  closeCity();
  closeRoute({ camera: false });
  closeDiscovery();
  app.set({ countryKey: null, countryOpen: false, continent: null, region: { level: 'country', id: null }, visaFilter: false });
  setHash('');
  globe.map?.home();
  syncFilters();
}

/** X do país ou dos painéis: volta ao globo inteiro e devolve o foco a quem abriu. */
export function resetToGlobe() {
  const { countryOpen, hub } = app.get();
  app.set({ hub: null });
  home();
  if (hub) restoreFocus('hub', HUB_LAUNCHERS[hub]);
  else if (countryOpen) restoreFocus('country', 'country-search-input');
  else focusSoon('#home-button');
}

// ---------- Cidade ----------

/** Cartão da cidade. A vista fica onde está, a não ser que `fly` seja pedido. */
export function selectCity(city, { fly = false } = {}) {
  if (!city) return;
  if (!app.get().city) rememberOpener('city');
  globe.map?.selectCity(city, { fly });
  app.set({ city });
  setHash(cityHash(city));
  focusSoon('#city-card-title');
}

/** Fecha o cartão e tira o destaque da cidade no globo. @returns {boolean} havia cartão. */
export function closeCity({ restore = false } = {}) {
  const { city, countryOpen, countryKey } = app.get();
  globe.map?.selectCity(null);
  setHash(countryOpen ? countryHash(COUNTRIES[countryKey]?.alpha2) : '');
  if (!city) return false;
  app.set({ city: null });
  if (restore) restoreFocus('city', countryOpen ? 'country-name' : 'globe-stage');
  return true;
}

// ---------- Planejador ----------

/** "Planejar viagem": abre a confirmação; nada é criado até a pessoa confirmar. */
export function planTrip(countryKey, { city = null, profileId = null, budgetBRL = null } = {}) {
  if (!COUNTRIES[countryKey]) return;
  const ref = city ? { id: city.id, name: city.name, lat: city.lat, lng: city.lng, region: city.region } : null;
  app.set({ planner: { view: 'draft', draft: { countryKey, city: ref, profileId, budgetBRL } } });
  openHub('planner', { focus: false });
  focusSoon('#wizard-title');
}

/** Viagem nova: começa na etapa 1 (depois do país, a pessoa escolhe a cidade). */
export const newTrip = (countryKey, extra = {}) => createTrip({ countryKey, step: 1, ...extra });

export function showCountryFromPlanner(countryKey) {
  if (narrow()) closeHub();
  selectCountry(countryKey, { focus: true });
}

// ---------- Destinos salvos ----------

export function toggleSavedCountry(countryKey) {
  const country = COUNTRIES[countryKey];
  if (!country) return;
  const saved = savedStore.toggle({ id: `country:${countryKey}`, type: 'country', countryKey, name: country.namePt, context: country.region || '' });
  announce(saved ? `${country.namePt} salvo.` : `${country.namePt} removido dos salvos.`);
}

export async function openSaved(item) {
  if (narrow()) closeHub();
  if (item.type === 'city' && !item.placeId) {
    const city = await findSavedCity(item);
    if (city) return selectCity(city, { fly: true });
    // Cidade não reencontrada com segurança: abre o país e mostra o ponto salvo.
    selectCountry(item.countryKey, { focus: true });
    if (Number.isFinite(item.lat)) globe.map?.flyTo(item.lat, item.lng, 1.7);
    return undefined;
  }
  selectCountry(item.countryKey, { focus: item.type !== 'city' });
  if (item.type === 'city') {
    app.set({ region: { level: 'place', id: item.placeId, divisionId: item.divisionId } });
    const city = await findSavedCity(item);
    if (city) globe.map?.selectCity(city);
    else if (Number.isFinite(item.lat)) globe.map?.flyTo(item.lat, item.lng, 1.7);
  } else if (item.type === 'place' && Number.isFinite(item.lat)) {
    globe.map?.flyTo(item.lat, item.lng, 1.6);
  }
  return undefined;
}

export async function planSaved(item) {
  planTrip(item.countryKey, { city: await findSavedCity(item) });
}

// ---------- Estados e cidades (data/geo) ----------

export async function showPlaceOnGlobe(place) {
  const { countryKey } = app.get();
  const city = await matchGlobeCity(COUNTRIES[countryKey], place);
  if (app.get().countryKey !== countryKey) return;
  // Sem par no globo, a câmera vai ao ponto do IBGE/GeoNames, sem destaque.
  if (city) globe.map?.selectCity(city);
  else globe.map?.flyTo(place.lat, place.lng, 1.7);
  announce(`${place.name} em destaque no globo.`);
}

export async function planPlace(place) {
  const { countryKey } = app.get();
  planTrip(countryKey, { city: await matchGlobeCity(COUNTRIES[countryKey], place) });
}

// ---------- Links (#/PT, #/PT/c123, #/viagem/…) ----------

const TRIP_PREFIX = '#/viagem/';
// Destino, datas e escolhas; nunca gastos, checklist ou milhas (são pessoais).
const SHARED_FIELDS = ['countryKey', 'city', 'origin', 'startDate', 'endDate', 'month', 'days', 'travelers', 'group', 'cabin', 'payWith', 'flightPreference', 'style', 'lodging', 'transport', 'interests', 'budgetBRL'];

export function tripShareUrl(trip) {
  const payload = Object.fromEntries(SHARED_FIELDS.filter(key => trip[key] !== undefined && trip[key] !== null).map(key => [key, trip[key]]));
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const data = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  return pageUrl(`${TRIP_PREFIX}${data}`);
}

function readSharedTrip(hash) {
  if (!hash.startsWith(TRIP_PREFIX) || hash.length > 4000) return null;
  try {
    const base64 = hash.slice(TRIP_PREFIX.length).replaceAll('-', '+').replaceAll('_', '/');
    const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), char => char.charCodeAt(0))));
    if (!raw || typeof raw !== 'object' || !COUNTRIES[raw.countryKey]) return null;
    return Object.fromEntries(SHARED_FIELDS.filter(key => key in raw).map(key => [key, raw[key]]));
  } catch {
    return null;
  }
}

function openSharedTrip(payload) {
  setHash('');
  // A mesma viagem já está aqui (ex.: a pessoa abriu o próprio link): só abre.
  let target = tripStore.trips.find(trip => trip.countryKey === payload.countryKey && (trip.city?.id ?? null) === (payload.city?.id ?? null)
    && trip.startDate === (payload.startDate ?? null) && trip.endDate === (payload.endDate ?? null) && trip.travelers === (payload.travelers ?? 1));
  if (!target) {
    const before = new Set(tripStore.trips.map(trip => trip.id));
    tripStore.importData({ trips: [{ ...payload, step: 1 }] });
    target = tripStore.trips.find(trip => !before.has(trip.id));
  }
  if (!target) return;
  tripStore.setActive(target.id);
  app.set({ planner: { view: 'trip', draft: null } });
  openHub('planner', { focus: false });
  focusSoon('#wizard-title');
}

export async function openFromHash() {
  const shared = readSharedTrip(location.hash);
  if (shared) return openSharedTrip(shared);
  const target = parseHash(location.hash);
  const countryKey = target ? COUNTRY_BY_ALPHA2.get(target.alpha2) : null;
  if (!countryKey) return undefined;
  const wantsCity = target.geonameId !== undefined || target.index !== undefined;
  // No celular o guia cobre a tela: link de cidade abre só o cartão da cidade.
  const phone = window.matchMedia('(max-width: 760px)').matches;
  if (app.get().countryKey !== countryKey && !(wantsCity && phone)) selectCountry(countryKey, { focus: false });
  if (!wantsCity) return undefined;
  const cities = await loadCities(target.alpha2).catch(() => []);
  const city = target.geonameId !== undefined
    ? cities.find(item => item.geonameId === target.geonameId)
    : cities.find(item => item.index === target.index);
  if (city && (phone || app.get().countryKey === countryKey)) selectCity(city, { fly: true });
  return undefined;
}

// ---------- Esc ----------

/** Fecha a camada do topo. @returns {boolean} algo foi fechado. */
export function closeTopLayer() {
  const state = app.get();
  if (state.tourOpen) { app.set({ tourOpen: false }); return true; }
  if (state.a11yOpen) { setA11yOpen(false); return true; }
  if (closeCity({ restore: true })) return true;
  if (state.route) { closeRoute({ restore: true }); return true; }
  if (state.discoveryOpen) { closeDiscovery({ restore: true }); return true; }
  if (state.hub) { closeHub({ restore: true }); return true; }
  if (state.countryOpen) { closeCountry({ restore: true }); return true; }
  return false;
}
