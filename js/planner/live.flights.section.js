// Etapa "Voo" do Planner: busca de voos reais pelo backend do Traveling (fase 3.3).
// Só aparece quando o backend está ligado (<meta name="traveling-api">); sem ele,
// a etapa continua só com a estimativa de sempre (flight.section.js).
//
// Tudo vem da viagem: origem, aeroporto que atende a cidade, datas, viajantes e
// cabine. Cada oferta diz de onde vem o preço (Ao vivo, Preço visto recentemente
// ou Dados de teste) e quando foi consultado. "Adicionar à viagem" grava uma
// cotação no orçamento (trip.lines), com a referência da oferta, uma vez só.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { addLine, removeLine } from './trip.model.js';
import { convertToBRL } from './currency.js';
import { formatBRL, formatMoney } from './money.js';
import { flightSearchFromTrip, isEnabled, searchFlights } from '../api/travel.client.js';

const SORTS = { price: 'Menor preço', duration: 'Mais rápido', stops: 'Menos escalas' };
const PROVENANCE = { live: 'live', cached: 'cached', test: 'test' };
const time = iso => iso?.slice(11, 16) ?? '';
const minutesLabel = minutes => `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
const stopsLabel = stops => (stops === 0 ? 'direto' : stops === 1 ? '1 escala' : `${stops} escalas`);
const clock = iso => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

function carriers(offer) {
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

const isExpired = (offer, now = Date.now()) => offer.status === 'expired' || (offer.expiresAt && Date.parse(offer.expiresAt) <= now);

/**
 * @param {object} deps
 * @param {(trip: object) => Promise<{ origin: object|null, destination: object|null }>} deps.resolveAirports  Aeroportos (objetos do AirportRepository).
 * @param {() => object} deps.getRates  Tabela de câmbio (currency.rateTable()).
 * @param {(origin: object, destination: object, trip: object) => void} [deps.onPreviewRoute]
 */
export function createLiveFlightsSection({ resolveAirports, getRates = () => ({}), onPreviewRoute = null }) {
  const state = new Map(); // id da viagem → { key, status, result, error, sort, airports, controller }

  const tripKey = trip => [trip.origin, trip.countryKey, trip.city?.id ?? '', trip.startDate, trip.endDate, trip.travelers, trip.cabin].join('|');

  function entry(trip) {
    let current = state.get(trip.id);
    if (!current || current.key !== tripKey(trip)) {
      current?.controller?.abort();
      current = { key: tripKey(trip), status: 'idle', result: null, error: null, sort: 'price', airports: null, controller: null };
      state.set(trip.id, current);
    }
    return current;
  }

  function attachedLines(trip) {
    return trip.lines.filter(line => line.source?.kind === 'provider-offer' && line.category === 'flights');
  }

  function offerCard(offer, trip, sort) {
    const expired = isExpired(offer);
    const attached = attachedLines(trip).some(line => line.source.provider === offer.provider && line.source.offerId === offer.offerId);
    const total = Number(offer.price.total.amount);
    const converted = offer.price.total.currency === 'BRL' ? null : convertToBRL(total, offer.price.total.currency, getRates());
    const rows = offer.slices.map((slice, index) => `
      <div class="live-offer__slice">
        <span class="live-offer__tag">${index ? 'Volta' : 'Ida'} ${escapeHtml(slice.departAt.slice(8, 10))}/${escapeHtml(slice.departAt.slice(5, 7))}</span>
        <strong>${escapeHtml(time(slice.departAt))} ${escapeHtml(slice.origin)}</strong>
        <span class="live-offer__line" aria-hidden="true"></span>
        <strong>${escapeHtml(time(slice.arriveAt))} ${escapeHtml(slice.destination)}</strong>
        <small>${minutesLabel(slice.durationMinutes)} · ${stopsLabel(slice.stops)}${slice.connections.length ? ` (${escapeHtml(slice.connections.join(', '))})` : ''}</small>
      </div>`).join('');
    const label = provenanceLabel(PROVENANCE[offer.dataSource] ?? 'unverified', {
      tag: 'span',
      detail: expired ? 'preço expirado: busque de novo' : offer.dataSource === 'cached' && offer.observedAt
        ? `visto em ${new Date(offer.observedAt).toLocaleDateString('pt-BR')}`
        : `consultado às ${clock(offer.searchedAt)}${offer.expiresAt ? ` · vale até ${clock(offer.expiresAt)}` : ''}`
    });
    return `
      <li class="live-offer${expired ? ' live-offer--expired' : ''}" data-offer-id="${escapeHtml(offer.offerId)}" data-provider="${escapeHtml(offer.provider)}">
        <div class="live-offer__head">
          <strong class="live-offer__carrier">${escapeHtml(carriers(offer))}</strong>
          <span class="live-offer__price">
            <strong>${escapeHtml(formatMoney(total, offer.price.total.currency))}</strong>
            <small>total · ${offer.passengers.adults} ${offer.passengers.adults === 1 ? 'adulto' : 'adultos'}${converted ? ` · ≈ ${escapeHtml(formatBRL(converted.amountBRL))}` : ''}</small>
          </span>
        </div>
        ${rows}
        <div class="live-offer__foot">
          ${label}
          <div class="live-offer__actions">
            ${onPreviewRoute ? '<button class="secondary-button" type="button" data-live-action="route">Ver rota</button>' : ''}
            <button class="${attached ? 'secondary-button' : 'primary-button'}" type="button" data-live-action="attach" ${attached || expired ? 'disabled' : ''}>${attached ? 'Na viagem ✓' : 'Adicionar à viagem'}</button>
            ${offer.bookingUrl && !expired ? `<a class="secondary-button" href="${escapeHtml(offer.bookingUrl)}" target="_blank" rel="noopener sponsored">Reservar ↗</a>` : ''}
          </div>
        </div>
      </li>`;
  }

  function resultsHtml(trip) {
    const current = entry(trip);
    if (current.status === 'loading') return '<p class="planner-hint live-search__status" role="status">Buscando voos…</p>';
    if (current.status === 'error') {
      return `<p class="planner-hint live-search__status live-search__status--error" role="status">${escapeHtml(current.error.message)}</p>
        ${current.error.retryable ? '<button class="secondary-button" type="button" data-live-action="search">Tentar de novo</button>' : ''}`;
    }
    if (current.status !== 'done') return '';
    const { offers, warnings, providers } = current.result;
    if (!offers.length) return '<p class="planner-hint" role="status">Nenhum voo encontrado para essas datas. Tente outras datas ou outra cabine.</p>';
    const hasLinks = offers.some(offer => offer.bookingUrl);
    return `
      <div class="live-search__toolbar" role="group" aria-label="Ordenar voos">
        ${Object.entries(SORTS).map(([id, label]) => `<button type="button" class="discovery-chip" data-live-sort="${id}" aria-pressed="${current.sort === id}">${label}</button>`).join('')}
      </div>
      <ul class="live-offers">${sortOffers(offers, current.sort).slice(0, 12).map(offer => offerCard(offer, trip, current.sort)).join('')}</ul>
      ${warnings.map(warning => `<p class="planner-hint">${escapeHtml(warning)}</p>`).join('')}
      <p class="planner-hint">Fonte: ${escapeHtml(providers.filter(provider => provider.status === 'ok').map(provider => provider.id).join(', '))}. Preços sujeitos a alteração até a reserva.${hasLinks ? ' Links de reserva podem ser de parceiros: o Traveling pode receber comissão, sem custo extra para você. <a href="privacidade.html" target="_blank" rel="noopener">Saiba mais</a>' : ''}</p>`;
  }

  function attachedHtml(trip) {
    const lines = attachedLines(trip);
    if (!lines.length) return '';
    return `
      <div class="live-attached">
        <h5 class="planner-block-title">Na sua viagem</h5>
        <ul>${lines.map(line => `
          <li data-line-id="${escapeHtml(line.id)}">
            <span><strong>${escapeHtml(line.note || line.source.summary || 'Voo')}</strong>
              <small>Cotação de ${escapeHtml(new Date(line.source.fetchedAt).toLocaleDateString('pt-BR'))} · ${escapeHtml(line.currency ? formatMoney(line.amount, line.currency) : formatBRL(line.amountBRL))} · pode ter mudado</small></span>
            <button class="planner-text-action" type="button" data-live-action="remove">Remover</button>
          </li>`).join('')}</ul>
      </div>`;
  }

  function sectionHtml(trip) {
    const current = entry(trip);
    const built = flightSearchFromTrip(trip, { origin: current.airports?.origin?.iata, destination: current.airports?.destination?.iata });
    const needsDates = !trip.startDate;
    const summary = current.airports?.origin && current.airports?.destination
      ? `${current.airports.origin.iata} → ${current.airports.destination.iata}`
      : 'Origem e destino da viagem';
    const when = trip.startDate ? `${trip.startDate.slice(8, 10)}/${trip.startDate.slice(5, 7)}${trip.endDate ? `–${trip.endDate.slice(8, 10)}/${trip.endDate.slice(5, 7)}` : ''}` : 'datas a definir';
    const ready = 'request' in built;
    return `
      <div class="live-search__head">
        <div>
          <h4 class="planner-block-title">Buscar voos reais</h4>
          <p class="planner-hint">${escapeHtml(summary)} · ${escapeHtml(when)} · ${trip.travelers} ${trip.travelers === 1 ? 'viajante' : 'viajantes'}</p>
        </div>
        <button class="primary-button" type="button" data-live-action="search" ${ready && current.status !== 'loading' ? '' : 'disabled'}>${current.status === 'done' ? 'Buscar de novo' : 'Buscar'}</button>
      </div>
      ${needsDates ? '<p class="planner-hint">Para buscar voos reais, defina datas exatas na etapa Datas ("Tenho datas exatas").</p>' : ''}
      ${!needsDates && built.missing === 'airports' && current.airports ? '<p class="planner-hint">Não encontramos o código IATA de um dos aeroportos desta viagem.</p>' : ''}
      <div data-live-results aria-live="polite">${resultsHtml(trip)}</div>
      ${attachedHtml(trip)}`;
  }

  function fill(root, trip) {
    const slot = root.querySelector('[data-live-flights]');
    if (slot) slot.innerHTML = sectionHtml(trip);
  }

  async function ensureAirports(root, trip) {
    const current = entry(trip);
    if (current.airports) return current.airports;
    current.airports = await resolveAirports(trip).catch(() => ({ origin: null, destination: null }));
    const latest = root.isConnected ? root : null;
    if (latest) fill(root, trip);
    return current.airports;
  }

  async function search(root, ui) {
    const trip = ui.trip;
    const current = entry(trip);
    const airports = await ensureAirports(root, trip);
    const built = flightSearchFromTrip(trip, { origin: airports.origin?.iata, destination: airports.destination?.iata });
    if (!('request' in built)) return;
    current.controller?.abort();
    current.controller = new AbortController();
    current.status = 'loading';
    fill(root, trip);
    try {
      current.result = await searchFlights(built.request, { signal: current.controller.signal });
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
    const offer = entry(trip).result?.offers.find(item => item.offerId === offerId && item.provider === provider);
    if (!offer || isExpired(offer)) return;
    if (attachedLines(trip).some(line => line.source.offerId === offerId && line.source.provider === provider)) return;
    const amount = Number(offer.price.total.amount);
    const currency = offer.price.total.currency;
    const fx = currency === 'BRL' ? null : convertToBRL(amount, currency, getRates());
    const line = {
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
    ui.store.save(addLine(trip, line));
    fill(root, ui.trip);
  }

  return [{
    id: 'live-flights',
    step: 3,
    render(trip) {
      if (!isEnabled()) return '';
      return `<section class="planner-card live-search" data-live-flights aria-label="Buscar voos reais">${sectionHtml(trip)}</section>`;
    },
    bind(root, trip, ui) {
      const container = root.querySelector('[data-live-flights]');
      if (!container) return;
      ensureAirports(root, trip);
      container.addEventListener('click', event => {
        const sortButton = event.target.closest('[data-live-sort]');
        if (sortButton) {
          entry(ui.trip).sort = sortButton.dataset.liveSort;
          fill(root, ui.trip);
          return;
        }
        const button = event.target.closest('[data-live-action]');
        if (!button) return;
        const action = button.dataset.liveAction;
        const card = button.closest('[data-offer-id]');
        if (action === 'search') search(root, ui);
        if (action === 'attach' && card) attach(root, ui, card.dataset.offerId, card.dataset.provider);
        if (action === 'remove') {
          const lineId = button.closest('[data-line-id]')?.dataset.lineId;
          if (lineId) ui.store.save(removeLine(ui.trip, lineId));
          fill(root, ui.trip);
        }
        if (action === 'route' && onPreviewRoute) {
          const airports = entry(ui.trip).airports;
          if (airports?.origin && airports?.destination) onPreviewRoute(airports.origin, airports.destination, ui.trip);
        }
      });
    },
    refresh(root, trip) {
      const current = entry(trip);
      // Mudou origem, datas, viajantes ou cabine: resultados antigos não valem mais.
      if (current.status === 'idle' && !current.airports) ensureAirports(root, trip);
      fill(root, trip);
    }
  }];
}

// Usado pelos testes e pela etapa Resumo: total das cotações de voos anexadas.
export function attachedFlightsTotal(trip) {
  return trip.lines.filter(line => line.source?.kind === 'provider-offer' && line.category === 'flights')
    .reduce((sum, line) => sum + line.amountBRL, 0);
}

