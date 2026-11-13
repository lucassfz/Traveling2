// Viagens salvas neste navegador (localStorage, chave traveling.trips).
// Sem conta e sem servidor: se o armazenamento estiver bloqueado, tudo
// continua funcionando na sessão e `persistent` vira false para a interface avisar.
import { STORAGE_KEYS, readJsonStorage, writeJsonStorage } from '../core/storage.js';
import { normalizeStore } from './trip.model.js';

export function createTripStore({ countries = null, read = readJsonStorage, write = writeJsonStorage } = {}) {
  let data = normalizeStore(read(STORAGE_KEYS.trips, null), { countries });
  let persistent = true;
  const listeners = new Set();

  function commit(next) {
    data = normalizeStore(next, { countries });
    persistent = write(STORAGE_KEYS.trips, data) !== false;
    for (const listener of listeners) listener(data);
    return data;
  }

  return {
    get trips() { return data.trips; },
    get activeTripId() { return data.activeTripId; },
    get persistent() { return persistent; },
    get(id) { return data.trips.find(trip => trip.id === id) ?? null; },
    active() { return data.trips.find(trip => trip.id === data.activeTripId) ?? null; },
    findByCountry(countryKey) { return data.trips.find(trip => trip.countryKey === countryKey) ?? null; },
    // Insere ou substitui pelo id e torna a viagem ativa.
    save(trip) {
      const exists = data.trips.some(item => item.id === trip.id);
      const trips = exists ? data.trips.map(item => item.id === trip.id ? trip : item) : [...data.trips, trip];
      commit({ ...data, trips, activeTripId: trip.id });
      return this.get(trip.id);
    },
    remove(id) {
      const trips = data.trips.filter(trip => trip.id !== id);
      commit({ ...data, trips, activeTripId: data.activeTripId === id ? trips[0]?.id ?? null : data.activeTripId });
    },
    setActive(id) {
      if (data.trips.some(trip => trip.id === id)) commit({ ...data, activeTripId: id });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
