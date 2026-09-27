import {
  AIRLINE_UPGRADE_EXAMPLES,
  AIRPORT_GUIDES,
  CARD_OFFERS,
  LEARNING_PATHS,
  LOUNGE_TYPES,
  MILES_TABS,
  UPGRADE_METHODS
} from './miles.data.js';
import { annualFeeAmount, cardMatches, evaluateRedemption, filterLoungesByTerminal, findVerifiedLounges, loungeNetworks, rankAirportMatches, verifiedRecord } from './miles.tools.js';

const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(value);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function officialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function isVerified(item) {
  return verifiedRecord(item);
}

function trustLine(item) {
  if (item?.status === 'outdated') return '<span class="miles-trust">Informação desatualizada · confirme as regras atuais em fonte oficial</span>';
  if (!isVerified(item)) return '<span class="miles-trust">Dados específicos pendentes de verificação</span>';
  const [year, month] = item.verifiedAt.split('-').map(Number);
  const date = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)));
  return `<span class="miles-trust">Verificado em ${escapeHtml(date)} · <a href="${escapeHtml(officialUrl(item.officialSource))}" target="_blank" rel="noopener noreferrer">Fonte oficial</a>${item.uncertainFields?.length ? ` · A confirmar: ${escapeHtml(item.uncertainFields.join(', '))}` : ''}</span>`;
}

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function detailRow(title, summary, body) {
  return `<details class="miles-detail">
    <summary><span><strong>${escapeHtml(title)}</strong><span class="miles-detail__summary">${escapeHtml(summary)}</span></span><span class="miles-detail__chevron" aria-hidden="true">+</span></summary>
    <div class="miles-detail__body">${body}</div>
  </details>`;
}

function list(items) {
  return `<ul class="miles-copy-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function sectionHeading(kicker, title, intro) {
  return `<header class="miles-section-header"><span class="eyebrow">${escapeHtml(kicker)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(intro)}</p></header>`;
}

function renderOverview() {
  return `${sectionHeading('Comece por aqui', 'O que você quer fazer?', 'Escolha uma tarefa da sua viagem. Você pode voltar a este guia a qualquer momento.')}
    <div class="miles-actions">
      <button type="button" data-miles-focus="miles-cash-fare">🧮 Comparar dinheiro e pontos</button>
      <button type="button" data-miles-go="cards">💳 Entender cartões</button>
      <button type="button" data-miles-go="lounges">🛋️ Encontrar sala VIP</button>
      <button type="button" data-miles-go="upgrades">⬆️ Entender um upgrade</button>
      <button type="button" data-miles-go="airports">✈️ Explorar aeroporto</button>
    </div>
    <h4 class="miles-subheading">Comparar dinheiro x pontos</h4>
    <p class="miles-section-copy">Veja quanto custaria a passagem em dinheiro e quanto você ainda pagaria ao usar pontos. Use o preço da passagem que você realmente compraria.</p>
    <form id="miles-redemption-form" class="miles-tool-form" novalidate>
      <label>Passagem em dinheiro (R$)<input id="miles-cash-fare" name="cashFare" inputmode="decimal" placeholder="4.200,00" autocomplete="off"></label>
      <label>Pontos ou milhas necessários<input name="points" inputmode="numeric" placeholder="80.000" autocomplete="off"></label>
      <label>Taxas pagas em dinheiro (R$)<input name="fees" inputmode="decimal" placeholder="350,00" autocomplete="off"></label>
      <button class="secondary-button" type="submit">Comparar opções</button>
    </form>
    <div class="miles-tool-result" id="miles-redemption-result" role="status" aria-live="polite"></div>
    <details class="miles-tool-help"><summary>Como a comparação é calculada?</summary><p>Subtraímos as taxas em dinheiro do preço da passagem. O restante é o valor substituído pelos pontos. Para comparar usos diferentes, dividimos esse valor pelo número de pontos e multiplicamos por 1.000. Não existe um resultado universalmente bom ou ruim: compare com suas alternativas reais.</p></details>
    <h4 class="miles-subheading">Aprenda o essencial</h4>
    <div class="miles-paths" aria-label="Três caminhos para começar">
      ${LEARNING_PATHS.map((path, index) => `<details class="miles-path">
        <summary><span class="miles-path__number">0${index + 1}</span><span class="miles-path__text"><strong>${escapeHtml(path.title)}</strong><span>${escapeHtml(path.summary)}</span></span><span class="miles-path__action">Saiba mais <span aria-hidden="true">+</span></span></summary>
        <div class="miles-path__body">${list(path.lessons)}</div>
      </details>`).join('')}
    </div>
    <p class="miles-footnote">Antes de transferir ou resgatar, confira disponibilidade, taxas e validade nas fontes oficiais.</p>`;
}

function renderCardRecord(card) {
  const facts = [
    ['Bandeira', card.network], ['Programa', card.loyaltyProgram], ['Salas VIP', card.loungeAccess], ['Anuidade', card.annualFee],
    ['Isenção', card.feeWaiver], ['Convidados', card.guests], ['Viagem', card.travelBenefits]
  ].filter(([, value]) => value);
  return `<details class="miles-detail miles-card-record"><summary><span class="miles-card-record__intro"><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.issuer)}</small><span>${escapeHtml(card.earning)}</span><em>${escapeHtml(card.idealFor)}</em></span><span class="miles-detail__chevron" aria-hidden="true">+</span></summary><div class="miles-detail__body"><div class="miles-tags">${(card.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div><dl class="miles-facts">${facts.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>${trustLine(card)}</div></details>`;
}

function renderCards() {
  const verifiedCards = CARD_OFFERS.filter(verifiedRecord);
  const choices = '<option value="points">Pontos ou milhas</option><option value="lounges">Salas VIP</option><option value="airports">Benefícios no aeroporto</option><option value="simple">Simplicidade</option><option value="international">Viagens internacionais</option>';
  return `${sectionHeading('Cartões', 'Comparação guiada dos cartões verificados', 'Compare somente os cartões do catálogo do Traveling. As preferências mudam a ordem, mas não excluem cartões. Isso não avalia todo o mercado brasileiro.')}
    <form id="miles-card-form" class="miles-tool-form">
      <label>Viagens por ano<select name="trips"><option value="start">Estou começando</option><option value="1-2">1–2</option><option value="3-5">3–5</option><option value="6+">6 ou mais</option></select></label>
      <label>Importância da sala VIP<select name="lounge"><option value="none">Não é prioridade</option><option value="useful">Seria útil</option><option value="important">Muito importante</option></select></label>
      <label>Compras fora do Brasil<select name="abroad"><option value="rare">Raramente</option><option value="sometimes">Às vezes</option><option value="often">Frequentemente</option></select></label>
      <label>O que você mais valoriza?<select name="primary">${choices}</select></label>
      <label>Segunda prioridade (opcional)<select name="secondary"><option value="">Nenhuma</option>${choices}</select></label>
      <label>Em relação à anuidade<select name="fee"><option value="avoid">Prefiro evitar</option><option value="conditional">Aceito se compensar</option><option value="any">Não é prioridade</option></select></label>
      <button class="secondary-button" type="submit">Ver cartões do catálogo</button>
    </form>
    <div class="miles-tool-result" id="miles-card-result" role="status" aria-live="polite"></div>
    <details class="miles-tool-help" id="miles-card-compare"><summary>Comparar dois cartões verificados</summary>
      <div class="miles-compare-controls"><label>Primeiro<select id="miles-compare-first">${verifiedCards.map(card => `<option value="${escapeHtml(card.id)}">${escapeHtml(card.name)}</option>`).join('')}</select></label><label>Segundo<select id="miles-compare-second">${verifiedCards.map((card, index) => `<option value="${escapeHtml(card.id)}" ${index === 1 ? 'selected' : ''}>${escapeHtml(card.name)}</option>`).join('')}</select></label></div>
      <div id="miles-compare-result" class="miles-compare-grid"></div>
    </details>
    <details class="miles-tool-help"><summary>Ver todos os cartões do catálogo</summary><div class="miles-detail-list">${verifiedCards.map(renderCardRecord).join('')}</div></details>
    <p class="miles-footnote">Taxas e benefícios podem mudar; confira a fonte oficial antes de pedir um cartão. Pontuação por dólar significa pontos recebidos a cada US$ 1 em compras elegíveis.</p>`;
}

function renderLounges() {
  const networks = loungeNetworks(AIRPORT_GUIDES);
  const cardOnly = AIRPORT_GUIDES.some(guide => guide.lounges?.some(lounge => verifiedRecord(lounge) && !lounge.networks?.length));
  return `${sectionHeading('Salas VIP', 'Encontre uma sala no seu aeroporto', 'Busque pelo código, cidade ou nome do aeroporto. O resultado mostra somente salas do catálogo verificado.')}
    <label class="miles-search-label" for="miles-lounge-search">Onde você vai embarcar?</label>
    <input class="miles-search" id="miles-lounge-search" type="search" placeholder="GRU, Lisboa, JFK…" autocomplete="off">
    <div id="miles-lounge-airports" class="miles-airport-choices"></div>
    <label class="miles-search-label" for="miles-lounge-network">Como você acessa salas VIP?</label>
    <select class="miles-search" id="miles-lounge-network"><option value="all">Mostrar todas</option>${networks.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')}${cardOnly ? '<option value="card">Outras formas (ver elegibilidade)</option>' : ''}</select>
    <label class="miles-search-label" id="miles-lounge-terminal-label" for="miles-lounge-terminal" hidden>Terminal do seu voo</label>
    <select class="miles-search" id="miles-lounge-terminal" hidden><option value="all">Todos os terminais</option></select>
    <p class="miles-section-copy">A rede é a forma de acesso informada pela sala; seu cartão ou benefício ainda precisa ser elegível. Veja o terminal antes de viajar.</p>
    <div id="miles-lounge-results" class="miles-airport-results" aria-live="polite"><p class="miles-empty">Selecione um aeroporto para ver as salas verificadas.</p></div>
    <p class="miles-footnote">Visitas gratuitas e convidados dependem das regras do seu benefício.</p>
    <details class="miles-tool-help"><summary>Como funcionam as redes?</summary><div class="miles-detail-list">${LOUNGE_TYPES.map(type => detailRow(type.name, 'Acesso e condições', `<p>${escapeHtml(type.explanation)}</p>${trustLine(type)}`)).join('')}</div></details>`;
}

function renderUpgradeExample(example) {
  const title = `${example.airline || 'Companhia'} · ${example.method || 'Método'}`;
  if (!isVerified(example)) return detailRow(title, 'Regra pendente de verificação', `<p>Confira as condições atuais com a companhia aérea.</p>${trustLine(example)}`);
  return detailRow(title, example.eligibleRouteCabin || 'Condições da companhia', `${list([
    `Quando solicitar: ${example.timing || 'consulte a companhia'}`,
    `Pontos ou milhas: ${example.milesRequired || 'consulte a companhia'}`,
    `Restrições: ${example.restrictions || 'consulte a companhia'}`
  ])}${trustLine(example)}`);
}

function renderUpgrades() {
  return `${sectionHeading('Guia prático', 'Quatro caminhos para um upgrade', 'Upgrade é uma mudança de cabine sujeita às regras e à disponibilidade do seu voo.')}
    <p class="miles-section-copy">Como você pretende tentar o upgrade?</p>
    <div class="miles-choice-row" role="group" aria-label="Forma de tentar upgrade"><button type="button" data-upgrade-method="advance">💳 Pagar</button><button type="button" data-upgrade-method="miles">⭐ Usar pontos</button><button type="button" data-upgrade-method="status">🎖️ Status/benefício</button><button type="button" data-upgrade-method="unsure">🤔 Ainda não sei</button></div>
    <div id="miles-upgrade-response" role="status" aria-live="polite"></div>
    <div class="miles-detail-list" id="miles-upgrade-methods">${UPGRADE_METHODS.map(method => `<div data-upgrade-card="${escapeHtml(method.id)}">${detailRow(method.title, method.summary, `<p>${escapeHtml(method.detail)}</p>`)}</div>`).join('')}</div>
    <div class="miles-soft-note"><strong>Antes de decidir</strong><p>Veja a classe tarifária do bilhete, o custo total e quais benefícios da cabine superior estarão incluídos.</p></div>
    ${AIRLINE_UPGRADE_EXAMPLES.length ? `<h4 class="miles-subheading">Exemplos por companhia</h4>${AIRLINE_UPGRADE_EXAMPLES.map(renderUpgradeExample).join('')}` : '<p class="miles-footnote">Exemplos por companhia serão incluídos quando suas regras forem verificadas em fonte oficial.</p>'}`;
}

function airportFacts(label, items) {
  return items?.length ? `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(items.join(', '))}</p>` : '';
}

function renderAirport(guide, airport) {
  const city = airport?.city || 'Cidade a confirmar';
  const heading = `${guide.iata} · ${city}`;
  let facts = '<p>Dados operacionais a confirmar.</p>';
  if (isVerified(guide)) {
    const verifiedLounges = guide.lounges?.filter(isVerified) ?? [];
    facts = `${airportFacts('Terminais', guide.terminals)}${airportFacts('Companhias', guide.airlines)}
      ${verifiedLounges.length ? `<div class="miles-airport__lounges"><strong>Salas verificadas</strong>${verifiedLounges.map(lounge => `<p><b>${escapeHtml(lounge.name)}</b> · ${escapeHtml(lounge.terminal)}<br><span>${escapeHtml(lounge.eligibility)}</span>${lounge.networks?.length ? `<br>Rede confirmada: ${escapeHtml(lounge.networks.join(', '))}` : ''}<br><a href="${escapeHtml(lounge.officialSource)}" target="_blank" rel="noopener noreferrer">Fonte da sala</a></p>`).join('')}</div>` : '<p>Salas VIP ainda não verificadas para este aeroporto.</p>'}
      ${guide.fastTrack ? `<p><strong>Fast Track:</strong> ${escapeHtml(guide.fastTrack)}</p>` : ''}
      ${guide.connectionNotes ? `<p><strong>Conexões:</strong> ${escapeHtml(guide.connectionNotes)}</p>` : ''}`;
  }
  const networks = [...new Set(guide.lounges.filter(isVerified).flatMap(lounge => lounge.networks || []))];
  return `<details class="miles-airport" data-airport-code="${escapeHtml(guide.iata)}"><summary><span class="miles-airport__code">${escapeHtml(guide.iata)}</span><span class="miles-airport__identity"><strong>${escapeHtml(city)}</strong><small>${escapeHtml(guide.terminals.join(', '))} · ${guide.lounges.filter(isVerified).length} ${guide.lounges.filter(isVerified).length === 1 ? 'sala verificada' : 'salas verificadas'}${networks.length ? ` · ${escapeHtml(networks.join(', '))}` : ''}</small></span><span class="miles-airport__more" aria-hidden="true">+</span></summary>
    <div class="miles-airport__body"><h4>${escapeHtml(airport?.name || heading)}</h4>${facts}${trustLine(guide)}</div></details>`;
}

function renderAirports() {
  return `${sectionHeading('Na prática', 'Aeroportos e seus benefícios', 'Encontre o aeroporto e abra os detalhes. Salas e serviços só aparecem como informação atual depois de verificados.')}
    <div id="miles-route-context" class="miles-route-context" hidden></div>
    <label class="miles-search-label" for="miles-airport-search">Buscar aeroporto por código IATA (3 letras), cidade ou nome</label>
    <input class="miles-search" id="miles-airport-search" type="search" placeholder="Ex.: GRU, Lisboa, Miami" autocomplete="off">
    <div class="miles-airport-results" id="miles-airport-results" aria-live="polite"></div>
    <button class="miles-text-button" id="miles-airports-more" type="button" aria-expanded="false">Ver todos os aeroportos <span aria-hidden="true">→</span></button>`;
}

const RENDERERS = { overview: renderOverview, cards: renderCards, lounges: renderLounges, upgrades: renderUpgrades, airports: renderAirports };

export class MilesEngine {
  constructor({ tabsElement, contentElement, airportRepository }) {
    this.tabsElement = tabsElement;
    this.contentElement = contentElement;
    this.airportRepository = airportRepository;
    this.activeTab = 'overview';
    this.airportQuery = '';
    this.selectedAirportCode = null;
    this.showAllAirports = false;
    this.routeContext = null;
    this.loungeQuery = '';
    this.loungeAirport = null;
    this.onTabClick = event => {
      const tab = event.target.closest('[data-miles-tab]');
      if (tab) this.selectTab(tab.dataset.milesTab);
    };
    this.onTabKeydown = event => {
      const tab = event.target.closest('[data-miles-tab]');
      if (!tab) return;
      const keys = MILES_TABS.map(item => item.key);
      const current = keys.indexOf(tab.dataset.milesTab);
      let next = current;
      if (event.key === 'ArrowRight') next = (current + 1) % keys.length;
      else if (event.key === 'ArrowLeft') next = (current - 1 + keys.length) % keys.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = keys.length - 1;
      else return;
      event.preventDefault();
      this.selectTab(keys[next], true);
    };
    this.onContentClick = event => {
      const destination = event.target.closest('[data-miles-go]');
      if (destination) this.selectTab(destination.dataset.milesGo, true);
      const focus = event.target.closest('[data-miles-focus]');
      if (focus) this.contentElement.querySelector(`#${focus.dataset.milesFocus}`)?.focus();
      const loungeAirport = event.target.closest('[data-lounge-airport]');
      if (loungeAirport) {
        this.loungeAirport = this.findAirport(loungeAirport.dataset.loungeAirport);
        this.loungeQuery = this.loungeAirport?.iata || '';
        this.contentElement.querySelector('#miles-lounge-search').value = this.loungeQuery;
        this.updateLoungeTerminals();
        this.renderLoungeChoices();
        this.renderLoungeResults();
      }
      const routeAirport = event.target.closest('[data-miles-airport-code]');
      if (routeAirport) this.showAirport(routeAirport.dataset.milesAirportCode, routeAirport.dataset.milesAirportTab || 'airports');
      if (event.target.closest('[data-miles-clear-lounge-filter]')) {
        this.contentElement.querySelector('#miles-lounge-network').value = 'all';
        this.contentElement.querySelector('#miles-lounge-terminal').value = 'all';
        this.renderLoungeResults();
      }
      const upgrade = event.target.closest('[data-upgrade-method]');
      if (upgrade) this.selectUpgrade(upgrade.dataset.upgradeMethod);
      if (event.target.closest('#miles-airports-more')) {
        this.showAllAirports = !this.showAllAirports;
        this.renderAirportResults();
      }
    };
    this.onContentInput = event => {
      if (event.target.id === 'miles-airport-search') {
        this.airportQuery = event.target.value.trim();
        this.selectedAirportCode = null;
        this.renderAirportResults();
      } else if (event.target.id === 'miles-lounge-search') {
        this.loungeQuery = event.target.value.trim();
        this.loungeAirport = null;
        this.updateLoungeTerminals();
        this.renderLoungeChoices();
        this.renderLoungeResults();
      }
    };
    this.onContentChange = event => {
      if (event.target.id === 'miles-lounge-network' || event.target.id === 'miles-lounge-terminal') this.renderLoungeResults();
      if (event.target.id === 'miles-compare-first' || event.target.id === 'miles-compare-second') this.renderCardComparison();
    };
    this.onContentSubmit = event => {
      if (event.target.id === 'miles-redemption-form') { event.preventDefault(); this.renderRedemption(); }
      if (event.target.id === 'miles-card-form') { event.preventDefault(); this.renderCardMatch(); }
    };
  }

  mount() {
    this.tabsElement.innerHTML = MILES_TABS.map(tab => `<button class="miles-tab" id="miles-tab-${tab.key}" type="button" role="tab" data-miles-tab="${tab.key}" aria-controls="miles-panel-${tab.key}" aria-selected="false" tabindex="-1">${escapeHtml(tab.label)}</button>`).join('');
    this.contentElement.innerHTML = MILES_TABS.map(tab => `<section class="miles-panel" id="miles-panel-${tab.key}" role="tabpanel" aria-labelledby="miles-tab-${tab.key}" tabindex="0" hidden>${RENDERERS[tab.key]()}</section>`).join('');
    this.tabsElement.addEventListener('click', this.onTabClick);
    this.tabsElement.addEventListener('keydown', this.onTabKeydown);
    this.contentElement.addEventListener('click', this.onContentClick);
    this.contentElement.addEventListener('input', this.onContentInput);
    this.contentElement.addEventListener('change', this.onContentChange);
    this.contentElement.addEventListener('submit', this.onContentSubmit);
    this.selectTab('overview');
    this.renderAirportResults();
    this.renderCardComparison();
  }

  selectTab(key, focus = false) {
    if (!MILES_TABS.some(tab => tab.key === key)) return;
    this.activeTab = key;
    for (const tab of this.tabsElement.querySelectorAll('[data-miles-tab]')) {
      const active = tab.dataset.milesTab === key;
      tab.classList.toggle('miles-tab--active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    }
    for (const panel of this.contentElement.querySelectorAll('.miles-panel')) {
      panel.hidden = panel.id !== `miles-panel-${key}`;
    }
    this.contentElement.closest('.miles-hub')?.scrollTo({ top: 0, behavior: 'auto' });
    if (key === 'lounges' || key === 'airports') this.airportRepository.loadAll().then(() => {
      if (this.activeTab === 'lounges') this.renderLoungeChoices();
      if (this.activeTab === 'airports') this.renderAirportResults();
    }).catch(() => {});
  }

  findAirport(code) {
    const normalized = String(code ?? '').trim().toUpperCase();
    return [this.routeContext?.origin, this.routeContext?.destination, ...this.airportRepository.coreAirports]
      .find(airport => airport?.iata === normalized) || this.airportRepository.search(normalized, 1).find(airport => airport.iata === normalized) || null;
  }

  hasAirportGuide(code) {
    return AIRPORT_GUIDES.some(guide => guide.iata === code && isVerified(guide));
  }

  hasVerifiedLounges(code) {
    return findVerifiedLounges(AIRPORT_GUIDES, code).length > 0;
  }

  setRouteContext(origin, destination) {
    this.routeContext = origin && destination ? { origin, destination } : null;
    this.renderRouteContext();
    this.renderAirportResults();
  }

  renderRouteContext() {
    const container = this.contentElement.querySelector('#miles-route-context');
    if (!container) return;
    const airports = [this.routeContext?.origin, this.routeContext?.destination].filter(airport => airport?.iata);
    container.hidden = !airports.length;
    container.innerHTML = airports.length ? `<strong>Na sua rota: ${escapeHtml(airports.map(airport => airport.iata).join(' → '))}</strong><div>${airports.map((airport, index) => `${this.hasAirportGuide(airport.iata) ? `<button type="button" data-miles-airport-code="${escapeHtml(airport.iata)}">Ver ${index ? 'destino' : 'origem'} · ${escapeHtml(airport.iata)}</button>` : ''}${this.hasVerifiedLounges(airport.iata) ? `<button type="button" data-miles-airport-code="${escapeHtml(airport.iata)}" data-miles-airport-tab="lounges">Salas · ${escapeHtml(airport.iata)}</button>` : ''}`).join('')}</div>${airports.some(airport => !this.hasAirportGuide(airport.iata)) ? '<p>Ainda não há guia verificado para todos os aeroportos desta rota.</p>' : ''}` : '';
  }

  showAirport(code, tab = 'airports') {
    const airport = this.findAirport(code);
    if (!airport) return;
    this.selectTab(tab);
    if (tab === 'lounges') {
      this.loungeAirport = airport;
      this.loungeQuery = airport.iata;
      this.contentElement.querySelector('#miles-lounge-search').value = airport.iata;
      this.contentElement.querySelector('#miles-lounge-network').value = 'all';
      this.updateLoungeTerminals();
      this.renderLoungeChoices();
      this.renderLoungeResults();
    } else {
      this.airportQuery = airport.iata;
      this.selectedAirportCode = airport.iata;
      this.contentElement.querySelector('#miles-airport-search').value = airport.iata;
      this.renderAirportResults();
    }
  }

  renderRedemption() {
    const form = this.contentElement.querySelector('#miles-redemption-form');
    const result = this.contentElement.querySelector('#miles-redemption-result');
    const values = new FormData(form);
    const calculation = evaluateRedemption(Object.fromEntries(values));
    result.innerHTML = calculation.error
      ? `<p class="miles-error">${escapeHtml(calculation.error)}</p>`
      : `<p><strong>Em dinheiro:</strong> ${money(calculation.fare)} pela passagem.</p><p><strong>Com pontos:</strong> ${calculation.used.toLocaleString('pt-BR')} pontos + ${money(calculation.taxes)} em taxas.</p><p>Os pontos substituem cerca de <strong>${money(calculation.replaced)}</strong> do preço em dinheiro. Isso equivale a <strong>${money(calculation.perThousand)} por 1.000 pontos</strong> nesta comparação.</p><small>Use esse valor para comparar outras opções da mesma viagem; ele não é uma nota de qualidade do resgate.</small>`;
  }

  renderCardMatch() {
    const values = new FormData(this.contentElement.querySelector('#miles-card-form'));
    const preferences = { trips: values.get('trips'), lounge: values.get('lounge'), abroad: values.get('abroad'), fee: values.get('fee'),
      values: [...new Set([values.get('primary'), values.get('secondary')].filter(Boolean))] };
    const { matches, similar } = cardMatches(CARD_OFFERS, preferences);
    const result = this.contentElement.querySelector('#miles-card-result');
    if (!matches.length) { result.innerHTML = '<p class="miles-empty">Ainda não há cartões verificados suficientes para comparar este perfil.</p>'; return; }
    if (matches[0].score === 0) {
      result.innerHTML = '<p>Os cartões verificados atualmente não diferenciam bem esse perfil. Veja as opções lado a lado; a anuidade e as condições podem ajudar na escolha.</p>';
      this.contentElement.querySelector('#miles-card-compare').open = true;
      return;
    }
    const displayed = matches.slice(0, 2);
    const feeNote = preferences.fee === 'avoid' && matches.every(match => annualFeeAmount(match.card) > 0)
      ? 'Nenhum cartão do catálogo geral tem anuidade zero incondicional; isenções dependem de regras. ' : '';
    result.innerHTML = `<p><strong>${similar ? 'Opções muito próximas neste catálogo; não há vencedor claro' : 'Mais alinhado entre os cartões verificados'}</strong></p>
      ${displayed.map((match, index) => `<article class="miles-result-card"><span class="eyebrow">${index ? 'Outra opção do catálogo' : 'Para considerar'}</span><h4>${escapeHtml(match.card.name)}</h4><strong>Por que combina?</strong>${match.reasons.length ? list(match.reasons) : '<p>Os dados atuais não diferenciam bem os cartões para essa preferência.</p>'}<strong>Vale observar</strong>${list(match.warnings.length ? match.warnings : ['Confira as condições no emissor.'])}${trustLine(match.card)}</article>`).join('')}
      <p class="miles-footnote">${feeNote}${preferences.values.includes('simple') ? 'Simplicidade não tem medida verificada neste catálogo; compare condições e custo antes de escolher. ' : ''}${preferences.fee === 'avoid' ? 'Confira se o benefício compensa a anuidade ou depende de isenção. ' : ''}Acesso a salas e convidados seguem as regras do emissor. Comparação limitada ao catálogo verificado do Traveling; confirme elegibilidade e condições no emissor.</p>`;
  }

  renderCardComparison() {
    const first = CARD_OFFERS.find(card => verifiedRecord(card) && card.id === this.contentElement.querySelector('#miles-compare-first')?.value);
    const second = CARD_OFFERS.find(card => verifiedRecord(card) && card.id === this.contentElement.querySelector('#miles-compare-second')?.value);
    const result = this.contentElement.querySelector('#miles-compare-result');
    if (!result) return;
    if (!first || !second || first.id === second.id) { result.innerHTML = '<p class="miles-empty">Escolha dois cartões diferentes.</p>'; return; }
    result.innerHTML = [first, second].map(card => `<article class="miles-result-card"><h4>${escapeHtml(card.name)}</h4><dl class="miles-facts">${[['Pontos', card.earning], ['Salas', card.loungeAccess], ['Programa', card.loyaltyProgram], ['Anuidade', card.annualFee], ['Viagem', card.travelBenefits]].filter(([, value]) => value).map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>${trustLine(card)}</article>`).join('');
  }

  renderLoungeChoices() {
    const container = this.contentElement.querySelector('#miles-lounge-airports');
    if (!container) return;
    const airports = this.loungeQuery ? rankAirportMatches([...new Map([
      ...this.airportRepository.search(this.loungeQuery, 50),
      ...this.airportRepository.coreAirports
    ].filter(airport => airport.iata).map(airport => [airport.iata, airport])).values()], this.loungeQuery).slice(0, 6) : [];
    container.innerHTML = airports.map(airport => `<button type="button" data-lounge-airport="${escapeHtml(airport.iata)}">${escapeHtml(airport.iata)} · ${escapeHtml(airport.city)} — ${escapeHtml(airport.name)}</button>`).join('');
  }

  updateLoungeTerminals() {
    const select = this.contentElement.querySelector('#miles-lounge-terminal');
    const label = this.contentElement.querySelector('#miles-lounge-terminal-label');
    const guide = AIRPORT_GUIDES.find(item => item.iata === this.loungeAirport?.iata && isVerified(item));
    const terminals = guide?.terminals || [];
    select.innerHTML = `<option value="all">Todos os terminais</option>${terminals.map(terminal => `<option value="${escapeHtml(terminal)}">${escapeHtml(terminal)}</option>`).join('')}`;
    select.hidden = label.hidden = terminals.length < 2;
  }

  renderLoungeResults() {
    const container = this.contentElement.querySelector('#miles-lounge-results');
    if (!container) return;
    const airport = this.loungeAirport;
    if (!airport) { container.innerHTML = '<p class="miles-empty">Selecione um aeroporto para ver as salas verificadas.</p>'; return; }
    const filter = this.contentElement.querySelector('#miles-lounge-network').value;
    const all = findVerifiedLounges(AIRPORT_GUIDES, airport.iata);
    const terminal = this.contentElement.querySelector('#miles-lounge-terminal').value;
    const matches = filterLoungesByTerminal(findVerifiedLounges(AIRPORT_GUIDES, airport.iata, filter), terminal);
    const title = `<h4>${escapeHtml(airport.iata)} · ${escapeHtml(airport.city)}</h4>`;
    if (!all.length) { container.innerHTML = `${title}<p class="miles-empty">O Traveling ainda não possui uma sala verificada para este aeroporto.</p>`; return; }
    const empty = `<p class="miles-empty">O Traveling não tem uma sala verificada para este filtro em ${escapeHtml(airport.iata)}. Isso não significa que não exista acesso neste aeroporto.</p><button class="miles-text-button" type="button" data-miles-clear-lounge-filter>Mostrar todas as salas verificadas em ${escapeHtml(airport.iata)}</button>`;
    container.innerHTML = `${title}${matches.length ? matches.map(lounge => `<details class="miles-detail"><summary><span><strong>${escapeHtml(lounge.name)}</strong><span class="miles-detail__summary">${escapeHtml(lounge.terminal)}</span></span><span class="miles-detail__chevron" aria-hidden="true">+</span></summary><div class="miles-detail__body"><p><strong>Acesso informado:</strong> ${escapeHtml(lounge.networks?.length ? lounge.networks.join(', ') : lounge.eligibility)}</p>${lounge.networks?.length ? `<p>${escapeHtml(lounge.eligibility)}</p>` : ''}${trustLine(lounge)}</div></details>`).join('') : empty}`;
  }

  selectUpgrade(method) {
    for (const button of this.contentElement.querySelectorAll('[data-upgrade-method]')) button.setAttribute('aria-pressed', String(button.dataset.upgradeMethod === method));
    const selected = method === 'unsure' ? null : (method === 'advance' ? 'advance' : method);
    for (const card of this.contentElement.querySelectorAll('[data-upgrade-card]')) card.querySelector('details').open = card.dataset.upgradeCard === selected;
    const response = this.contentElement.querySelector('#miles-upgrade-response');
    response.innerHTML = method === 'unsure' ? `<div class="miles-soft-note"><strong>Compare os caminhos</strong>${list(UPGRADE_METHODS.map(item => `${item.title}: ${item.summary}`))}</div>` : method === 'advance' ? '<p class="miles-section-copy">Veja também “Oferta no check-in” abaixo: é outra forma de pagar, perto da partida.</p>' : '';
  }

  renderAirportResults() {
    const container = this.contentElement.querySelector('#miles-airport-results');
    const more = this.contentElement.querySelector('#miles-airports-more');
    if (!container || !more) return;
    const query = normalize(this.airportQuery);
    const airportByCode = new Map([...this.airportRepository.coreAirports, this.routeContext?.origin, this.routeContext?.destination].filter(Boolean).map(airport => [airport.iata, airport]));
    const matches = query ? rankAirportMatches([...new Map([
      ...this.airportRepository.search(this.airportQuery, 50),
      ...[...airportByCode.values()].filter(airport => normalize([airport.iata, airport.name, airport.city, airport.country].join(' ')).includes(query))
    ].filter(airport => airport.iata).map(airport => [airport.iata, airport])).values()], this.airportQuery) : AIRPORT_GUIDES.map(guide => airportByCode.get(guide.iata)).filter(Boolean);
    const visible = query ? matches.slice(0, 15) : this.showAllAirports ? matches : matches.slice(0, 3);
    container.innerHTML = visible.length ? visible.map(airport => {
      const guide = AIRPORT_GUIDES.find(item => item.iata === airport.iata);
      return guide ? renderAirport(guide, airport) : `<details class="miles-airport" data-airport-code="${escapeHtml(airport.iata)}"><summary><span class="miles-airport__code">${escapeHtml(airport.iata)}</span><span class="miles-airport__identity"><strong>${escapeHtml(airport.city)}</strong><small>${escapeHtml(airport.name)}</small></span><span class="miles-airport__more" aria-hidden="true">+</span></summary><div class="miles-airport__body"><p>O Traveling ainda não possui benefícios ou salas verificados para este aeroporto.</p></div></details>`;
    }).join('') : '<p class="miles-empty">Não encontramos esse aeroporto. Tente o código de três letras, a cidade ou parte do nome.</p>';
    if (this.selectedAirportCode) [...container.querySelectorAll('[data-airport-code]')]
      .find(item => item.dataset.airportCode === this.selectedAirportCode)?.setAttribute('open', '');
    more.hidden = Boolean(query) || matches.length <= 3;
    more.setAttribute('aria-expanded', String(this.showAllAirports));
    more.innerHTML = `${this.showAllAirports ? 'Mostrar menos' : `Ver todos os ${matches.length} aeroportos`} <span aria-hidden="true">${this.showAllAirports ? '↑' : '→'}</span>`;
  }

  destroy() {
    this.tabsElement.removeEventListener('click', this.onTabClick);
    this.tabsElement.removeEventListener('keydown', this.onTabKeydown);
    this.contentElement.removeEventListener('click', this.onContentClick);
    this.contentElement.removeEventListener('input', this.onContentInput);
    this.contentElement.removeEventListener('change', this.onContentChange);
    this.contentElement.removeEventListener('submit', this.onContentSubmit);
  }
}
