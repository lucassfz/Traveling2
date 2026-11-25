// Estado global do app: um objeto imutável e assinantes. Componentes leem com
// useApp(seletor); as ações ficam em actions.js. Sem biblioteca de estado.
import { useSyncExternalStore } from 'react';
import { COUNTRIES } from '../../js/countries.dataset.js';
import { STORAGE_KEYS, readJsonStorage, readStorage } from '../../js/core/storage.js';
import { readSettings } from '../../js/accessibility.js';

function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

const savedTheme = readStorage(STORAGE_KEYS.theme);
const visited = readJsonStorage(STORAGE_KEYS.visited, []);

export const app = createStore({
  theme: savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark',
  countryKey: null,
  countryOpen: false,
  tab: 'overview',
  // Vista de Estados e cidades no guia: { level: 'country' | 'division' | 'place', id }.
  region: { level: 'country', id: null },
  continent: null,
  visited: new Set((Array.isArray(visited) ? visited : []).filter(key => Object.hasOwn(COUNTRIES, key))),
  visaFilter: false,
  seasonMonth: null,
  // Painel da esquerda: 'miles' | 'planner' | 'saved' | 'places' | null.
  hub: null,
  discoveryOpen: false,
  a11yOpen: false,
  helpOpen: false,
  tourOpen: false,
  searchOpen: false,
  city: null,
  tooltip: null,
  mapReady: false,
  mapFailed: false,
  mapStatus: 'Construindo países em 3D…',
  originAirport: null,
  destinationAirport: null,
  exploreStatus: '',
  // Prévia da rota no globo: null ou { title, codes, details, airportCode }.
  route: null,
  routeLoading: false,
  routeContext: null,
  // Pedido de salas VIP vindo da rota: { code, id }.
  milesRequest: null,
  // Painel do planejador: ver planner/Planner.jsx. view null = escolhe sozinho.
  planner: { view: null, draft: null },
  compare: { open: false, keys: null },
  fxSnapshot: null,
  brlPerUsd: null,
  liveRates: {},
  a11y: readSettings(),
  // Microfone dos comandos de voz ligado (state/voice.js).
  listening: false,
  announcement: ''
});

/** Lê uma parte do estado; o componente só redesenha quando ela muda. */
export function useApp(selector) {
  return useSyncExternalStore(app.subscribe, () => selector(app.get()));
}

/** Assina um armazenamento com subscribe() (viagens, salvos). */
export function useExternal(store, snapshot) {
  return useSyncExternalStore(store.subscribe, snapshot);
}
