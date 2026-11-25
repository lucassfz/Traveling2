// Ofertas de voo do backend (fase 3.3): ordenação, textos e a cotação que vai
// para o orçamento da viagem. Só dados; a tela é src/planner/sections/LiveFlights.jsx.
import { convertToBRL } from './currency.js';

export const FLIGHT_SORTS = { price: 'Menor preço', duration: 'Mais rápido', stops: 'Menos escalas' };
export const offerTime = iso => iso?.slice(11, 16) ?? '';
export const minutesLabel = minutes => `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
export const stopsLabel = stops => (stops === 0 ? 'direto' : stops === 1 ? '1 escala' : `${stops} escalas`);
export const clock = iso => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export function carriers(offer) {
  return [...new Set(offer.slices.flatMap(slice => slice.segments.map(segment => segment.marketingCarrier.name)))].join(' + ');
}

export function offerSummary(offer) {
  const out = offer.slices[0];
  const back = offer.slices[1];
  const dates = [out.departAt.slice(0, 10), back?.departAt.slice(0, 10)].filter(Boolean).map(date => `${date.slice(8, 10)}/${date.slice(5, 7)}`).join('–');
  return `${carriers(offer)} · ${out.origin}→${out.destination} · ${dates} · ${stopsLabel(out.stops)}`;
}

export function sortOffers(offers, sort) {
  const total = offer => Number(offer.price.total.amount);
  const duration = offer => offer.slices.reduce((sum, slice) => sum + slice.durationMinutes, 0);
  const stops = offer => offer.slices.reduce((sum, slice) => sum + slice.stops, 0);
  const key = sort === 'duration' ? duration : sort === 'stops' ? stops : total;
  return [...offers].sort((a, b) => key(a) - key(b) || total(a) - total(b));
}

export const isOfferExpired = (offer, now = Date.now()) => offer.status === 'expired' || (offer.expiresAt && Date.parse(offer.expiresAt) <= now);

export function attachedFlights(trip) {
  return trip.lines.filter(line => line.source?.kind === 'provider-offer' && line.category === 'flights');
}

/** Total das cotações de voos anexadas à viagem. */
export function attachedFlightsTotal(trip) {
  return attachedFlights(trip).reduce((sum, line) => sum + line.amountBRL, 0);
}

/** Linha do orçamento com a referência da oferta (uma cotação, em reais). */
export function flightOfferLine(offer, rates) {
  const amount = Number(offer.price.total.amount);
  const currency = offer.price.total.currency;
  const fx = currency === 'BRL' ? null : convertToBRL(amount, currency, rates);
  return {
    category: 'flights',
    status: 'quote',
    note: offerSummary(offer),
    ...(currency === 'BRL'
      ? { amountBRL: amount }
      : { currency, amount, amountBRL: fx?.amountBRL ?? 0, ...(fx?.date ? { fx: { rate: fx.rate, date: fx.date } } : {}) }),
    source: {
      kind: 'provider-offer',
      provider: offer.provider,
      offerId: offer.offerId,
      dataSource: offer.dataSource,
      fetchedAt: offer.searchedAt,
      ...(offer.expiresAt ? { expiresAt: offer.expiresAt } : {}),
      summary: offerSummary(offer),
      ...(offer.bookingUrl ? { url: offer.bookingUrl } : {})
    }
  };
}
