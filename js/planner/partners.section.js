// Links de parceiros (programas de afiliado via Travelpayouts) no Planner.
// Só links: nenhum script de terceiros, nenhum preço inventado. Cada link diz
// que é de parceiro e leva à página /parceiros.html.
//
// Aviasales aceita o marcador de parceiro em qualquer endereço, então a busca
// vai preenchida com origem, destino, datas e passageiros da viagem. Os demais
// parceiros usam o link curto gerado no painel (página inicial do parceiro).
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { cheapestFlight, pricePeriod } from '../api/prices.client.js';

export const PARTNER_MARKER = '806253';

export const PARTNERS = Object.freeze({
  aviasales: { name: 'Aviasales', home: 'https://aviasales.tpm.lv/YqesGlPB' },
  getrentacar: { name: 'GetRentacar', home: 'https://getrentacar.tpm.lv/nAFLYO3y' },
  yesim: { name: 'Yesim', home: 'https://yesim.tpm.lv/oOPtfYpz' },
  gocity: { name: 'Go City', home: 'https://gocity.tpm.lv/AUS85rkb' },
  klook: { name: 'Klook', home: 'https://klook.tpm.lv/cRw8FTug' }
});

const IATA = /^[A-Z]{3}$/;
const ddmm = iso => `${iso.slice(8, 10)}${iso.slice(5, 7)}`;

/**
 * Busca do Aviasales para a viagem: /search/GRU0304LIS10041 (origem, dia e mês
 * da ida, destino, dia e mês da volta, passageiros). Sem aeroportos ou datas
 * exatas, a página inicial com o marcador.
 */
export function aviasalesUrl(trip, { origin = null, destination = null } = {}) {
  const passengers = Math.min(9, Math.max(1, trip?.travelers || 1));
  const start = trip?.startDate;
  const end = trip?.endDate;
  if (!IATA.test(origin ?? '') || !IATA.test(destination ?? '') || origin === destination || !/^\d{4}-\d{2}-\d{2}$/.test(start ?? '')) {
    return PARTNERS.aviasales.home;
  }
  const back = /^\d{4}-\d{2}-\d{2}$/.test(end ?? '') && end > start ? ddmm(end) : '';
  const path = `${origin}${ddmm(start)}${destination}${back}${passengers}`;
  return `https://www.aviasales.com/search/${path}?marker=${PARTNER_MARKER}`;
}

const disclosure = '<small>Link de parceiro: o Traveling pode receber comissão, sem custo extra para você. <a href="parceiros.html" target="_blank" rel="noopener">Saiba mais</a></small>';

// Klook: o link de parceiro aceita o destino em k_site, então abre a busca de
// passeios da cidade (ou do país) da viagem.
const KLOOK_AID = 'api|13694|06faab81c58f40e7a915a1d89-806253|pid|806253';

export function klookUrl(place) {
  const query = String(place ?? '').trim();
  if (!query) return PARTNERS.klook.home;
  const target = `https://www.klook.com/pt-BR/search/result/?query=${encodeURIComponent(query)}`;
  return `https://affiliate.klook.com/redirect?aid=${encodeURIComponent(KLOOK_AID)}&k_site=${encodeURIComponent(target)}`;
}

// Cupons do painel de parceiros: só aparecem dentro da validade (até o fim do
// dia `until`, horário de Brasília), para o site nunca anunciar cupom vencido.
export const PROMOS = Object.freeze({
  yesim: { url: 'https://yesim.tpm.lv/2AikNy4L', discount: '20%', until: '2027-02-28' }
});

export function activePromo(id, now = new Date()) {
  const promo = PROMOS[id];
  return promo && now.getTime() <= Date.parse(`${promo.until}T23:59:59-03:00`) ? promo : null;
}

export function esimHtml(now = new Date()) {
  const promo = activePromo('yesim', now);
  const until = promo ? promo.until.split('-').reverse().join('/') : '';
  return `<p class="live-hotel__external">
      ${partnerLink(promo?.url ?? PARTNERS.yesim.home, promo ? `Ver eSIM no Yesim · ${promo.discount} de desconto` : 'Ver eSIM no Yesim')}
      ${promo ? `<small>Desconto de ${escapeHtml(promo.discount)} pelo link, válido até ${escapeHtml(until)}.</small>` : ''}
      ${disclosure}
    </p>`;
}

function partnerLink(url, label) {
  return `<a class="secondary-button" href="${escapeHtml(url)}" target="_blank" rel="noopener sponsored">${escapeHtml(label)} ↗</a>`;
}

/**
 * @param {object} deps
 * @param {object} deps.routes  createRouteEstimator compartilhado (aeroportos da viagem).
 * @returns {object[]} Seções { id, step, render, bind, refresh, slot }.
 */
export function createPartnerSections({ routes, countryName = () => null }) {
  // Preço visto recentemente (Travelpayouts), por rota e período.
  const prices = new Map();
  const priceKey = (trip, route) => {
    const period = pricePeriod(trip);
    return route?.status === 'ready' && period ? [trip.origin, route.destination.iata, period.departure, period.return ?? ''].join('|') : null;
  };

  function priceHtml(trip, route) {
    const entry = prices.get(priceKey(trip, route));
    if (!entry || entry.status !== 'done' || !entry.offer) return '';
    const offer = entry.offer;
    const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(offer.price.amount));
    const seen = offer.foundOn ? offer.foundOn.split('-').reverse().slice(0, 2).join('/') : null;
    const stops = offer.transfers === 0 ? 'voo direto' : Number.isInteger(offer.transfers) ? `${offer.transfers} ${offer.transfers === 1 ? 'escala' : 'escalas'} na ida` : '';
    return `
      <div class="planner-fare">
        <span class="planner-fare__label">${offer.returnAt ? 'Ida e volta' : 'Só ida'}, por pessoa, a partir de</span>
        <strong class="planner-fare__value">${escapeHtml(amount)}</strong>
        <small>${escapeHtml([`${offer.origin} → ${offer.destination}`, stops].filter(Boolean).join(' · '))}</small>
      </div>
      ${provenanceLabel('cached', { tag: 'p', detail: `${seen ? `visto em ${seen}` : 'visto recentemente'} por outros viajantes; pode ter mudado` })}
      <p class="live-hotel__external">${partnerLink(offer.url, 'Ver esse preço no Aviasales')}</p>`;
  }

  function loadPrice(root, trip, ui, route) {
    const key = priceKey(trip, route);
    if (!key || prices.has(key)) return;
    const period = pricePeriod(trip);
    prices.set(key, { status: 'loading' });
    cheapestFlight({ origin: trip.origin, destination: route.destination.iata, departure: period.departure, return: period.return }).then(offer => {
      prices.set(key, { status: 'done', offer });
      const current = ui.trip;
      if (current && root.isConnected && priceKey(current, routes.get(current)) === key) fillFlight(root, current);
    });
  }

  function flightHtml(trip) {
    const route = routes.get(trip);
    const ready = route?.status === 'ready';
    const url = aviasalesUrl(trip, ready ? { origin: route.origin.iata, destination: route.destination.iata } : {});
    const filled = url !== PARTNERS.aviasales.home;
    return `
      <h4 class="planner-block-title">Comparar passagens</h4>
      ${priceHtml(trip, route)}
      <p class="live-hotel__external">
        ${partnerLink(url, filled ? `Ver voos ${route.origin.iata} → ${route.destination.iata} no Aviasales` : 'Buscar voos no Aviasales')}
        <small>${filled ? 'Abre a busca com aeroportos, datas e passageiros da viagem.' : 'Defina datas exatas para abrir a busca já preenchida.'}</small>
        ${disclosure}
      </p>`;
  }

  function fillFlight(root, trip) {
    const slot = root.querySelector('[data-partner-flight]');
    if (slot) slot.innerHTML = flightHtml(trip);
  }

  function updateFlight(root, trip, ui) {
    fillFlight(root, trip);
    const known = routes.get(trip);
    if (known && known.status !== 'loading') {
      loadPrice(root, trip, ui, known);
      return;
    }
    const key = routes.key(trip);
    routes.load(trip).then(route => {
      const current = ui.trip;
      if (current && routes.key(current) === key && root.isConnected) {
        fillFlight(root, current);
        loadPrice(root, current, ui, route);
      }
    });
  }

  function styleHtml(trip) {
    const car = trip.transport === 'car' || trip.transport === 'mixed';
    const place = trip.city?.name || countryName(trip.countryKey);
    return `
      <h4 class="planner-block-title">Para a viagem</h4>
      <div class="partner-links">
        ${car ? partnerLink(PARTNERS.getrentacar.home, 'Alugar carro no GetRentacar') : ''}
        ${partnerLink(klookUrl(place), place ? `Passeios em ${place} no Klook` : 'Passeios no Klook')}
        ${partnerLink(PARTNERS.gocity.home, 'Passes de atrações no Go City')}
      </div>
      <p class="live-hotel__external">${car ? '' : '<small>Escolheu carro alugado? O link de aluguel aparece aqui.</small>'}${disclosure}</p>`;
  }

  return [
    {
      id: 'partner-flight',
      step: 3,
      render: trip => `<section class="planner-card" data-partner-flight aria-label="Comparar passagens">${flightHtml(trip)}</section>`,
      bind: (root, trip, ui) => updateFlight(root, trip, ui),
      refresh: (root, trip, ui) => updateFlight(root, trip, ui)
    },
    {
      id: 'partner-style',
      step: 4,
      slot: 'end',
      render: trip => `<section class="planner-card" data-partner-style aria-label="Para a viagem">${styleHtml(trip)}</section>`,
      refresh: (root, trip) => {
        const slot = root.querySelector('[data-partner-style]');
        if (slot) slot.innerHTML = styleHtml(trip);
      }
    },
    {
      id: 'partner-esim',
      step: 5,
      slot: 'end',
      render: () => `
        <section class="planner-card" aria-label="Internet no destino">
          <h4 class="planner-block-title">Internet no destino</h4>
          <p class="planner-hint">Um eSIM de viagem funciona no celular sem trocar de chip, se o aparelho for compatível.</p>
          ${esimHtml()}
        </section>`
    }
  ];
}
