// localStorage pode lançar exceção (modo privado, armazenamento bloqueado ou
// cota cheia). A interface continua funcionando; só a persistência é perdida.

// Chaves usadas pelo app. Novas chaves entram aqui para evitar colisões.
export const STORAGE_KEYS = Object.freeze({
  visited: 'traveling.visited',
  wishlist: 'traveling.wishlist',
  checklist: 'traveling.checklist',
  theme: 'traveling.theme',
  trips: 'traveling.trips'
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
