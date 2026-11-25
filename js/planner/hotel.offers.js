// Hospedagem no Planner (fase 3.4): link do Booking.com, ordenação, filtro pelo
// estilo e a cotação que vai para o orçamento. Só dados; a tela é
// src/planner/sections/LiveHotels.jsx.
//
// O link sai sempre que a viagem tem cidade e datas exatas. Com o id de afiliado
// (<meta name="traveling-booking-aid">) ele leva o código e o aviso de comissão
// aparece; sem ele, é um link comum.
import { convertToBRL } from './currency.js';
import { hotelSearchFromTrip } from '../api/travel.client.js';

export const BOARD_LABELS = { 'room-only': 'Só hospedagem', breakfast: 'Café da manhã incluído', 'half-board': 'Meia pensão', 'full-board': 'Pensão completa', 'all-inclusive': 'Tudo incluído' };
export const HOTEL_SORTS = { price: 'Menor preço', rating: 'Mais estrelas' };

export function affiliateId(doc = globalThis.document) {
  const value = doc?.querySelector?.('meta[name="traveling-booking-aid"]')?.getAttribute('content')?.trim();
  return /^\d{3,12}$/.test(value ?? '') ? value : null;
}

/** Link da busca de hotéis do Booking.com para a viagem, ou null sem cidade/datas. */
export function bookingSearchUrl(trip, { aid = null } = {}) {
  const built = hotelSearchFromTrip(trip);
  if (!('request' in built)) return null;
  const { request } = built;
  const params = new URLSearchParams({
    ss: trip.city.name,
    checkin: request.checkIn,
    checkout: request.checkOut,
    group_adults: String(request.guests.adults),
    group_children: '0',
    no_rooms: String(request.rooms),
    lang: 'pt-br'
  });
  if (aid) params.set('aid', aid);
  return `https://www.booking.com/searchresults.pt-br.html?${params}`;
}

export function sortHotelOffers(offers, properties, sort) {
  const stars = offer => properties.get(offer.propertyId)?.rating?.stars ?? 0;
  const price = offer => Number(offer.price.total.amount);
  return [...offers].sort((a, b) => (sort === 'rating' ? stars(b) - stars(a) : 0) || price(a) - price(b));
}

// A escolha "Onde quer ficar?" vira o filtro inicial dos resultados.
export const LODGING_STARS = Object.freeze({ comfort: Object.freeze([3, 4]), superior: Object.freeze([4, 5]) });

/**
 * Ofertas do estilo de hospedagem da viagem. Hotel sem estrelas informadas não
 * entra no filtro (não dá para saber). Sem nenhuma oferta no estilo, devolve
 * todas, para nunca mostrar uma lista vazia por causa do filtro.
 */
export function filterByLodging(offers, properties, lodging) {
  const range = LODGING_STARS[lodging];
  if (!range) return { offers, range: null, applied: false };
  const matching = offers.filter(offer => {
    const stars = properties.get(offer.propertyId)?.rating?.stars;
    return Number.isFinite(stars) && stars >= range[0] && stars <= range[1];
  });
  return matching.length ? { offers: matching, range, applied: true } : { offers, range, applied: false, empty: true };
}

export function attachedHotels(trip) {
  return trip.lines.filter(line => line.source?.kind === 'provider-offer' && line.category === 'lodging');
}

export const isHotelOfferExpired = (offer, now = Date.now()) => Boolean(offer.expiresAt) && Date.parse(offer.expiresAt) <= now;

/** Linha do orçamento com a referência da oferta. */
export function hotelOfferLine(offer, property, rates) {
  const amount = Number(offer.price.total.amount);
  const currency = offer.price.total.currency;
  const fx = currency === 'BRL' ? null : convertToBRL(amount, currency, rates);
  const summary = `${property?.name ?? 'Hospedagem'} · ${offer.nights} ${offer.nights === 1 ? 'noite' : 'noites'}${offer.board ? ` · ${BOARD_LABELS[offer.board]}` : ''}`;
  return {
    category: 'lodging',
    status: 'quote',
    note: summary,
    ...(currency === 'BRL' ? { amountBRL: amount } : { currency, amount, amountBRL: fx?.amountBRL ?? 0, ...(fx?.date ? { fx: { rate: fx.rate, date: fx.date } } : {}) }),
    source: {
      kind: 'provider-offer',
      provider: offer.provider,
      offerId: offer.offerId,
      dataSource: offer.dataSource,
      fetchedAt: offer.searchedAt,
      ...(offer.expiresAt ? { expiresAt: offer.expiresAt } : {}),
      summary,
      ...(offer.reservationUrl ? { url: offer.reservationUrl } : {})
    }
  };
}
