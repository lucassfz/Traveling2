// localStorage pode lançar exceção (modo privado, armazenamento bloqueado ou
// cota cheia). A interface continua funcionando; só a persistência é perdida.

// Chaves usadas pelo app. Novas chaves entram aqui para evitar colisões.
export const STORAGE_KEYS = Object.freeze({
  visited: 'traveling.visited',
  wishlist: 'traveling.wishlist',
  checklist: 'traveling.checklist',
  theme: 'traveling.theme',
  trips: 'traveling.trips',
  // Cópia intacta de traveling.trips no formato antigo, gravada uma vez antes da
  // migração para a versão 2 (checklist por viagem). Nunca é apagada pelo app.
  tripsBackupV1: 'traveling.trips.backup-v1',
  // Cópia intacta da versão 2 (antes do roteiro por dia e do id estável de cidade).
  tripsBackupV2: 'traveling.trips.backup-v2',
  // Destinos salvos (países, regiões, cidades, lugares), separados das viagens.
  saved: 'traveling.saved',
  // Cópia intacta dos salvos da versão 1, gravada uma vez antes da migração.
  savedBackupV1: 'traveling.saved.backup-v1',
  // Relatório da troca de ids antigos de cidade (geo/id.migration.js).
  migrations: 'traveling.migrations',
  globeHint: 'traveling.globeHint'
});

export function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Traveling: não foi possível salvar "${key}" no armazenamento local.`, error);
    return false;
  }
}

export function readJsonStorage(key, fallback) {
  try {
    const value = JSON.parse(readStorage(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key, value) {
  return writeStorage(key, JSON.stringify(value));
}
