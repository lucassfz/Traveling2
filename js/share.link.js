// Links compartilháveis: o endereço acompanha o país ou a cidade aberta, e quem
// recebe o link abre o globo direto nela.
//   #/PT           país (ISO2)
//   #/PT/c3117735  cidade pelo geonameId (identidade estável)
//   #/PT/i12       cidade pela posição no arquivo, quando não há geonameId
// Hash e não caminho: o GitHub Pages não reescreve rotas.

const HASH = /^#\/([A-Z]{2})(?:\/(c\d{1,10}|i\d{1,6}))?$/;

export function countryHash(alpha2) {
  return /^[A-Z]{2}$/.test(alpha2 ?? '') ? `#/${alpha2}` : '';
}

export function cityHash(city) {
  if (!/^[A-Z]{2}$/.test(city?.country ?? '')) return '';
  if (Number.isInteger(city.geonameId) && city.geonameId > 0) return `#/${city.country}/c${city.geonameId}`;
  return Number.isInteger(city.index) && city.index >= 0 ? `#/${city.country}/i${city.index}` : countryHash(city.country);
}

/** @returns {{ alpha2: string, geonameId?: number, index?: number } | null} */
export function parseHash(hash) {
  const match = HASH.exec(String(hash ?? '').trim());
  if (!match) return null;
  const [, alpha2, city] = match;
  if (!city) return { alpha2 };
  const value = Number(city.slice(1));
  return city[0] === 'c' ? { alpha2, geonameId: value } : { alpha2, index: value };
}

/** Endereço completo para compartilhar (sem o hash atual). */
export function shareUrl(hash, location = globalThis.location) {
  return `${location.origin}${location.pathname}${hash}`;
}

/** Troca o hash sem criar entrada no histórico nem rolar a página. */
export function setHash(hash) {
  const current = globalThis.location?.hash ?? '';
  if (current === hash || (!hash && !current)) return;
  const { pathname, search } = globalThis.location;
  globalThis.history?.replaceState(null, '', `${pathname}${search}${hash}`);
}

/**
 * Compartilha pelo menu do sistema (celular) ou copia o link.
 * @returns {Promise<'shared'|'copied'|'cancelled'|'failed'>}
 */
export async function shareLink({ title, text, url }, nav = globalThis.navigator) {
  if (nav?.share && (nav.maxTouchPoints > 0 || /Mobi|Android/i.test(nav.userAgent ?? ''))) {
    try {
      await nav.share({ title, text, url });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await nav.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
