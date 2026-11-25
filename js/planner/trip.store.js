// Viagens salvas neste navegador (localStorage, chave traveling.trips).
// Sem conta e sem servidor: se o armazenamento estiver bloqueado, tudo
// continua funcionando na sessão e `persistent` vira false para a interface avisar.
// O checklist de cada viagem fica dentro dela; o antigo traveling.checklist
// (um por país) só é lido uma vez, para migrar conjuntos da versão 1, e nunca apagado.
import { STORAGE_KEYS, readJsonStorage, writeJsonStorage } from '../core/storage.js';
import { MAX_TRIPS, TRIP_SCHEMA_VERSION, duplicateTrip, normalizeStore } from './trip.model.js';

export function createTripStore({ countries = null, read = readJsonStorage, write = writeJsonStorage } = {}) {
  const raw = read(STORAGE_KEYS.trips, null);
  const needsMigration = Array.isArray(raw?.trips) && raw.trips.length > 0 && !(Number(raw.version) >= TRIP_SCHEMA_VERSION);
  let data = normalizeStore(raw, {
    countries,
    legacyChecklist: needsMigration ? read(STORAGE_KEYS.checklist, {}) : null
  });
  let persistent = true;
  if (needsMigration) {
    // 1. Guarda o conjunto antigo, como estava, antes de qualquer escrita
    //    (só se ainda não houver backup: abrir de novo não sobrescreve).
    // 2. Só então grava o formato novo, para a migração acontecer uma vez só.
    // Se o backup não puder ser gravado, a migração fica só na memória desta
    // sessão e o conjunto antigo continua intacto no armazenamento.
    const backedUp = read(STORAGE_KEYS.tripsBackupV1, null) !== null
      || write(STORAGE_KEYS.tripsBackupV1, { savedAt: new Date().toISOString(), data: raw }) !== false;
    persistent = backedUp && write(STORAGE_KEYS.trips, data) !== false;
  }
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
    filterByCountry(countryKey) { return data.trips.filter(trip => trip.countryKey === countryKey); },
    // Insere ou substitui pelo id e torna a viagem ativa.
    save(trip) {
      const exists = data.trips.some(item => item.id === trip.id);
      const trips = exists ? data.trips.map(item => item.id === trip.id ? trip : item) : [...data.trips, trip];
      commit({ ...data, trips, activeTripId: trip.id });
      return this.get(trip.id);
    },
    // Remove exatamente uma viagem (e, com ela, o checklist dela). Devolve o
    // necessário para desfazer: a viagem e a posição que ela ocupava.
    remove(id) {
      const index = data.trips.findIndex(trip => trip.id === id);
      if (index < 0) return null;
      const removed = data.trips[index];
      const trips = data.trips.filter(trip => trip.id !== id);
      commit({ ...data, trips, activeTripId: data.activeTripId === id ? trips[0]?.id ?? null : data.activeTripId });
      return { trip: removed, index };
    },
    // Desfazer a exclusão: volta para a mesma posição, se o id ainda estiver livre.
    restore({ trip, index } = {}) {
      if (!trip || data.trips.some(item => item.id === trip.id)) return null;
      const trips = [...data.trips];
      trips.splice(Math.min(Math.max(0, index ?? trips.length), trips.length), 0, trip);
      commit({ ...data, trips, activeTripId: trip.id });
      return this.get(trip.id);
    },
    // Cópia logo depois da original, com id novo.
    duplicate(id) {
      const index = data.trips.findIndex(trip => trip.id === id);
      if (index < 0) return null;
      const copy = duplicateTrip(data.trips[index]);
      const trips = [...data.trips];
      trips.splice(index + 1, 0, copy);
      commit({ ...data, trips, activeTripId: copy.id });
      return this.get(copy.id);
    },
    // Backup: o conteúdo salvo, para baixar como arquivo.
    exportData() {
      return { app: 'traveling', exportedAt: new Date().toISOString(), ...data };
    },
    // Importa um backup: acrescenta as viagens que ainda não existem (id igual
    // e conteúdo igual é ignorado; id igual e conteúdo diferente vira cópia).
    // Tudo passa pela mesma normalização do armazenamento. Devolve quantas entraram.
    importData(raw) {
      const incoming = normalizeStore(raw, { countries }).trips;
      const byId = new Map(data.trips.map(trip => [trip.id, trip]));
      const added = [];
      for (const trip of incoming) {
        if (data.trips.length + added.length >= MAX_TRIPS) break;
        const existing = byId.get(trip.id);
        if (existing && JSON.stringify(existing) === JSON.stringify(trip)) continue;
        added.push(existing ? duplicateTrip(trip) : trip);
      }
      if (added.length) commit({ ...data, trips: [...data.trips, ...added], activeTripId: data.activeTripId ?? added[0].id });
      return added.length;
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
