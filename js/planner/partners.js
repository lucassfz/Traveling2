// Links de parceiros (programas de afiliado via Travelpayouts) no Planner.
// Só links: nenhum script de terceiros, nenhum preço inventado. Cada link diz
// que é de parceiro e leva à página /parceiros.html.
//
// Aviasales aceita o marcador de parceiro em qualquer endereço, então a busca
// vai preenchida com origem, destino, datas e passageiros da viagem. Os demais
// parceiros usam o link curto gerado no painel (página inicial do parceiro).
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

/** Link e textos do eSIM, com o cupom só dentro da validade. */
export function esimOffer(now = new Date()) {
  const promo = activePromo('yesim', now);
  return {
    url: promo?.url ?? PARTNERS.yesim.home,
    label: promo ? `Ver eSIM no Yesim · ${promo.discount} de desconto` : 'Ver eSIM no Yesim',
    note: promo ? `Desconto de ${promo.discount} pelo link, válido até ${promo.until.split('-').reverse().join('/')}.` : ''
  };
}
