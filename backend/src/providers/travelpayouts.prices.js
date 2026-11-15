// Travelpayouts Data API (Aviasales): menores preços VISTOS recentemente por
// outros usuários para uma rota e um período. Não é cotação ao vivo: o site
// mostra como "preço visto recentemente", com a data, e leva ao Aviasales
// (com o marcador de parceiro) para conferir e comprar.
//
// Endpoint: GET https://api.travelpayouts.com/aviasales/v3/prices_for_dates
// Token só no Worker (Secret TRAVELPAYOUTS_TOKEN), enviado no cabeçalho.

const ENDPOINT = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';
const IATA = /^[A-Z]{3}$/;
const PERIOD = /^\d{4}-\d{2}(?:-\d{2})?$/;

export class PricesRequestError extends Error {}

/** "13112026" (search_date do link) → "2026-11-13". */
function foundOn(link) {
  const match = /search_date=(\d{2})(\d{2})(\d{4})/.exec(link ?? '');
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

/**
 * @param {object} query { origin, destination, departure ('YYYY-MM' ou 'YYYY-MM-DD'), returnDate?, limit? }
 * @param {object} options { token, marker, fetchImpl, signal }
 * @returns {Promise<object[]>} Ofertas normalizadas, da mais barata para a mais cara.
 */
export async function cheapestFlights(query, { token, marker = '', fetchImpl = fetch, signal } = {}) {
  const { origin, destination, departure, returnDate = null, limit = 5 } = query;
  if (!token) throw new PricesRequestError('Sem token da Travelpayouts.');
  if (!IATA.test(origin) || !IATA.test(destination) || origin === destination) throw new PricesRequestError('Rota inválida.');
  if (!PERIOD.test(departure) || (returnDate && !PERIOD.test(returnDate))) throw new PricesRequestError('Período inválido.');
  const params = new URLSearchParams({
    origin, destination, departure_at: departure, currency: 'brl', sorting: 'price',
    limit: String(Math.min(10, Math.max(1, limit))), one_way: returnDate ? 'false' : 'true'
  });
  if (returnDate) params.set('return_at', returnDate);
  const response = await fetchImpl(`${ENDPOINT}?${params}`, { headers: { 'x-access-token': token, accept: 'application/json' }, signal });
  if (!response.ok) throw new PricesRequestError(`Travelpayouts respondeu ${response.status}`);
  const body = await response.json();
  return (Array.isArray(body?.data) ? body.data : [])
    .filter(item => Number.isFinite(item?.price) && item.price > 0 && typeof item.link === 'string' && item.link.startsWith('/'))
    .map(item => ({
      price: { amount: item.price.toFixed(2), currency: 'BRL' },
      origin: item.origin_airport || item.origin,
      destination: item.destination_airport || item.destination,
      departureAt: item.departure_at ?? null,
      returnAt: item.return_at ?? null,
      transfers: Number.isInteger(item.transfers) ? item.transfers : null,
      returnTransfers: Number.isInteger(item.return_transfers) ? item.return_transfers : null,
      airline: typeof item.airline === 'string' ? item.airline : null,
      durationMinutes: Number.isFinite(item.duration) ? item.duration : null,
      foundOn: foundOn(item.link),
      url: `https://www.aviasales.com${item.link}${marker ? `&marker=${encodeURIComponent(marker)}` : ''}`,
      dataSource: 'cached'
    }))
    .sort((a, b) => Number(a.price.amount) - Number(b.price.amount));
}
