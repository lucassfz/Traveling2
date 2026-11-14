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
  // Destinos salvos (países, cidades, lugares), separados das viagens.
  saved: 'traveling.saved',
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
