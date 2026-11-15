// Etapa "Estilo" do Planner: hospedagem (fase 3.4).
//
// 1. Sempre que a viagem tem cidade e datas exatas: link para a busca de hotéis
//    do Booking.com já preenchida (cidade, datas, hóspedes, quartos). Sem preços no
//    Traveling. Com o id de afiliado (<meta name="traveling-booking-aid">), o link
//    leva o código e o aviso de comissão aparece; sem ele, é um link comum.
// 2. Com o backend ligado (<meta name="traveling-api">): busca de hospedagem com
//    preços, rótulo de procedência e "Adicionar à viagem" (cotação na categoria
//    Hospedagem do orçamento), no mesmo padrão da busca de voos.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { addLine, removeLine } from './trip.model.js';
import { convertToBRL } from './currency.js';
import { formatBRL, formatMoney } from './money.js';
import { hotelSearchFromTrip, isEnabled, searchHotels } from '../api/travel.client.js';

const BOARD_LABELS = { 'room-only': 'Só hospedagem', breakfast: 'Café da manhã incluído', 'half-board': 'Meia pensão', 'full-board': 'Pensão completa', 'all-inclusive': 'Tudo incluído' };
const SORTS = { price: 'Menor preço', rating: 'Mais estrelas' };
const clock = iso => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function affiliateId(doc = globalThis.document) {
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

export function createLiveHotelsSection({ getRates = () => ({}) } = {}) {
  const state = new Map();
  const tripKey = trip => [trip.city?.id ?? '', trip.startDate, trip.endDate, trip.travelers].join('|');

  function entry(trip) {
    let current = state.get(trip.id);
    if (!current || current.key !== tripKey(trip)) {
      current?.controller?.abort();
      current = { key: tripKey(trip), status: 'idle', result: null, error: null, sort: 'price', controller: null };
      state.set(trip.id, current);
    }
    return current;
  }

  const attachedLines = trip => trip.lines.filter(line => line.source?.kind === 'provider-offer' && line.category === 'lodging');
  const isExpired = offer => Boolean(offer.expiresAt) && Date.parse(offer.expiresAt) <= Date.now();

  function offerCard(offer, property, trip) {
    const attached = attachedLines(trip).some(line => line.source.provider === offer.provider && line.source.offerId === offer.offerId);
    const expired = isExpired(offer);
    const total = Number(offer.price.total.amount);
    const currency = offer.price.total.currency;
    const converted = currency === 'BRL' ? null : convertToBRL(total, currency, getRates());
    const perNight = offer.price.perNight ? formatMoney(Number(offer.price.perNight.amount), offer.price.perNight.currency) : null;
    const stars = property?.rating?.stars ? '★'.repeat(property.rating.stars) : '';
    const facts = [
      offer.room?.name,
      offer.board ? BOARD_LABELS[offer.board] : null,
      offer.cancellation?.refundable === true ? 'Cancelamento grátis' : offer.cancellation?.refundable === false ? 'Não reembolsável' : null
    ].filter(Boolean);
    return `
      <li class="live-offer${expired ? ' live-offer--expired' : ''}" data-offer-id="${escapeHtml(offer.offerId)}" data-provider="${escapeHtml(offer.provider)}">
        <div class="live-offer__head">
          <span class="live-hotel__name"><strong>${escapeHtml(property?.name ?? 'Hospedagem')}</strong>${stars ? `<small aria-label="${property.rating.stars} estrelas">${stars}</small>` : ''}</span>
          <span class="live-offer__price">
            <strong>${escapeHtml(formatMoney(total, currency))}</strong>
            <small>${offer.nights} ${offer.nights === 1 ? 'noite' : 'noites'}${perNight ? ` · ${escapeHtml(perNight)}/noite` : ''}${converted ? ` · ≈ ${escapeHtml(formatBRL(converted.amountBRL))}` : ''}${offer.price.taxesIncluded === true ? ' · taxas incluídas' : ''}</small>
          </span>
        </div>
        ${facts.length ? `<p class="live-hotel__facts">${facts.map(escapeHtml).join(' · ')}</p>` : ''}
        <div class="live-offer__foot">
          ${provenanceLabel(offer.dataSource === 'live' ? 'live' : offer.dataSource === 'cached' ? 'cached' : 'test', { tag: 'span', detail: expired ? 'preço expirado: busque de novo' : `consultado às ${clock(offer.searchedAt)}` })}
          <div class="live-offer__actions">
            <button class="${attached ? 'secondary-button' : 'primary-button'}" type="button" data-hotel-action="attach" ${attached || expired ? 'disabled' : ''}>${attached ? 'Na viagem ✓' : 'Adicionar à viagem'}</button>
            ${offer.reservationUrl && !expired ? `<a class="secondary-button" href="${escapeHtml(offer.reservationUrl)}" target="_blank" rel="noopener sponsored">Reservar ↗</a>` : ''}
          </div>
        </div>
      </li>`;
  }

  function resultsHtml(trip) {
    const current = entry(trip);
    if (current.status === 'loading') return '<p class="planner-hint" role="status">Buscando hospedagem…</p>';
    if (current.status === 'error') {
      return `<p class="planner-hint live-search__status--error" role="status">${escapeHtml(current.error.message)}</p>${current.error.retryable ? '<button class="secondary-button" type="button" data-hotel-action="search">Tentar de novo</button>' : ''}`;
    }
    if (current.status !== 'done') return '';
    const { offers, properties, warnings, providers } = current.result;
    if (!offers.length) return '<p class="planner-hint" role="status">Nenhuma hospedagem encontrada para essas datas.</p>';
    const byId = new Map(properties.map(property => [property.propertyId, property]));
    return `
      <div class="live-search__toolbar" role="group" aria-label="Ordenar hospedagens">
        ${Object.entries(SORTS).map(([id, label]) => `<button type="button" class="discovery-chip" data-hotel-sort="${id}" aria-pressed="${current.sort === id}">${label}</button>`).join('')}
      </div>
      <ul class="live-offers">${sortHotelOffers(offers, byId, current.sort).slice(0, 12).map(offer => offerCard(offer, byId.get(offer.propertyId), trip)).join('')}</ul>
      ${warnings.map(warning => `<p class="planner-hint">${escapeHtml(warning)}</p>`).join('')}
      <p class="planner-hint">Fonte: ${escapeHtml(providers.filter(provider => provider.status === 'ok').map(provider => provider.id).join(', '))}. Disponibilidade e preço confirmados só na reserva.</p>`;
  }

  function attachedHtml(trip) {
    const lines = attachedLines(trip);
    if (!lines.length) return '';
    return `
      <div class="live-attached">
        <h5 class="planner-block-title">Na sua viagem</h5>
        <ul>${lines.map(line => `
          <li data-line-id="${escapeHtml(line.id)}">
            <span><strong>${escapeHtml(line.note || 'Hospedagem')}</strong>
              <small>Cotação de ${escapeHtml(new Date(line.source.fetchedAt).toLocaleDateString('pt-BR'))} · ${escapeHtml(line.currency ? formatMoney(line.amount, line.currency) : formatBRL(line.amountBRL))} · pode ter mudado</small></span>
            <button class="planner-text-action" type="button" data-hotel-action="remove">Remover</button>
          </li>`).join('')}</ul>
      </div>`;
  }

  function sectionHtml(trip) {
    const aid = affiliateId();
    const link = bookingSearchUrl(trip, { aid });
    const built = hotelSearchFromTrip(trip);
    const live = isEnabled();
    const current = entry(trip);
    const hint = built.missing === 'city'
      ? 'Escolha a cidade na etapa Destino para ver hospedagens.'
      : built.missing === 'dates' ? 'Defina datas exatas na etapa Datas para ver hospedagens.' : '';
    const request = built.request;
    return `
      <div class="live-search__head">
        <div>
          <h4 class="planner-block-title">Onde ficar</h4>
          <p class="planner-hint">${request ? `${escapeHtml(trip.city.name)} · ${request.checkIn.slice(8, 10)}/${request.checkIn.slice(5, 7)}–${request.checkOut.slice(8, 10)}/${request.checkOut.slice(5, 7)} · ${request.guests.adults} ${request.guests.adults === 1 ? 'hóspede' : 'hóspedes'} · ${request.rooms} ${request.rooms === 1 ? 'quarto' : 'quartos'}` : escapeHtml(hint)}</p>
        </div>
        ${live && request ? `<button class="primary-button" type="button" data-hotel-action="search" ${current.status === 'loading' ? 'disabled' : ''}>${current.status === 'done' ? 'Buscar de novo' : 'Buscar'}</button>` : ''}
      </div>
      ${live ? `<div data-hotel-results aria-live="polite">${resultsHtml(trip)}</div>` : ''}
      ${link ? `<p class="live-hotel__external"><a class="secondary-button" href="${escapeHtml(link)}" target="_blank" rel="noopener${aid ? ' sponsored' : ''}">Ver hotéis em ${escapeHtml(trip.city.name)} no Booking.com ↗</a>
        <small>${aid ? 'Link de parceiro: o Traveling pode receber comissão, sem custo extra para você. <a href="privacidade.html" target="_blank" rel="noopener">Saiba mais</a>' : 'Abre a busca no site do Booking.com, com datas e hóspedes preenchidos.'}</small></p>` : ''}
      ${attachedHtml(trip)}`;
  }

  function fill(root, trip) {
    const slot = root.querySelector('[data-live-hotels]');
    if (slot) slot.innerHTML = sectionHtml(trip);
  }

  async function search(root, ui) {
    const trip = ui.trip;
    const built = hotelSearchFromTrip(trip);
    if (!('request' in built)) return;
    const current = entry(trip);
    current.controller?.abort();
    current.controller = new AbortController();
    current.status = 'loading';
    fill(root, trip);
    try {
      current.result = await searchHotels(built.request, { signal: current.controller.signal });
      current.status = 'done';
    } catch (error) {
      if (error.code === 'CANCELLED') return;
      current.status = 'error';
      current.error = error;
    }
    if (root.isConnected && ui.trip?.id === trip.id) fill(root, ui.trip);
  }

  function attach(root, ui, offerId, provider) {
    const trip = ui.trip;
    const result = entry(trip).result;
    const offer = result?.offers.find(item => item.offerId === offerId && item.provider === provider);
    if (!offer || isExpired(offer) || attachedLines(trip).some(line => line.source.offerId === offerId && line.source.provider === provider)) return;
    const property = result.properties.find(item => item.propertyId === offer.propertyId);
    const amount = Number(offer.price.total.amount);
    const currency = offer.price.total.currency;
    const fx = currency === 'BRL' ? null : convertToBRL(amount, currency, getRates());
    const summary = `${property?.name ?? 'Hospedagem'} · ${offer.nights} ${offer.nights === 1 ? 'noite' : 'noites'}${offer.board ? ` · ${BOARD_LABELS[offer.board]}` : ''}`;
    ui.store.save(addLine(trip, {
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
    }));
    fill(root, ui.trip);
  }

  return [{
    id: 'live-hotels',
    step: 4,
    render(trip) {
      return `<section class="planner-card live-search" data-live-hotels aria-label="Onde ficar">${sectionHtml(trip)}</section>`;
    },
    bind(root, trip, ui) {
      const container = root.querySelector('[data-live-hotels]');
      container?.addEventListener('click', event => {
        const sortButton = event.target.closest('[data-hotel-sort]');
        if (sortButton) {
          entry(ui.trip).sort = sortButton.dataset.hotelSort;
          fill(root, ui.trip);
          return;
        }
        const button = event.target.closest('[data-hotel-action]');
        if (!button) return;
        const action = button.dataset.hotelAction;
        const card = button.closest('[data-offer-id]');
        if (action === 'search') search(root, ui);
        if (action === 'attach' && card) attach(root, ui, card.dataset.offerId, card.dataset.provider);
        if (action === 'remove') {
          const lineId = button.closest('[data-line-id]')?.dataset.lineId;
          if (lineId) ui.store.save(removeLine(ui.trip, lineId));
          fill(root, ui.trip);
        }
      });
    },
    refresh(root, trip) {
      fill(root, trip);
    }
  }];
}
