// Menores preços de passagem vistos recentemente (backend → Travelpayouts).
// Ligado pela meta <meta name="traveling-prices" content="https://…/api/v1">.
// Sem a meta, ou se o backend falhar, o site segue sem preços (só estimativa).

const cache = new Map();

export function pricesBase(doc = globalThis.document) {
  const value = doc?.querySelector?.('meta[name="traveling-prices"]')?.getAttribute('content')?.trim() ?? '';
  try {
    const url = new URL(value);
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    return url.protocol === 'https:' || local ? url.href.replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

/** Período da busca: datas exatas da viagem, senão o mês (no próximo ano em que ele ocorre). */
export function pricePeriod(trip, now = new Date()) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(trip?.startDate ?? '')) {
    return { departure: trip.startDate, return: /^\d{4}-\d{2}-\d{2}$/.test(trip?.endDate ?? '') ? trip.endDate : null };
  }
  if (!Number.isInteger(trip?.month)) return null;
  const year = trip.month >= now.getMonth() ? now.getFullYear() : now.getFullYear() + 1;
  const month = `${year}-${String(trip.month + 1).padStart(2, '0')}`;
  return { departure: month, return: month };
}

// Só mostra o que tem formato de preço e leva ao parceiro: a resposta vem da rede.
export function safeOffer(offer) {
  const amount = Number(offer?.price?.amount);
  return Number.isFinite(amount) && amount > 0 && String(offer.url).startsWith('https://www.aviasales.com/') ? offer : null;
}

/** @returns {Promise<object|null>} A oferta mais barata, ou null. */
export async function cheapestFlight({ origin, destination, departure, return: returnDate }, { base = pricesBase(), fetchImpl = fetch } = {}) {
  if (!base || !origin || !destination || !departure) return null;
  const params = new URLSearchParams({ origin, destination, departure, ...(returnDate ? { return: returnDate } : {}) });
  const key = params.toString();
  if (!cache.has(key)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    cache.set(key, fetchImpl(`${base}/flights/cheapest?${params}`, { signal: controller.signal })
      .then(response => (response.ok ? response.json() : null))
      .then(body => safeOffer(body?.offers?.[0]))
      .catch(() => { cache.delete(key); return null; })
      .finally(() => clearTimeout(timer)));
  }
  return cache.get(key);
}
