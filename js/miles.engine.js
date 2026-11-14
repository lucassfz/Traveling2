// Milhas: três abas curtas. Conversor (pontos → milhas → reais e "vale a pena
// usar milhas?"), Cartões (escolha por toque) e Salas VIP (busca por aeroporto).
// Tudo calcula enquanto a pessoa digita ou toca; nada é enviado para fora.
import { AIRPORT_GUIDES, CARD_OFFERS, MILES_TABS } from './miles.data.js';
import { provenanceLabel } from './provenance.js';
import { escapeHtml } from './core/html.js';
import { cardMatches, filterLoungesByTerminal, findVerifiedLounges, loungeNetworks, parseBrazilianNumber, rankAirportMatches, verifiedRecord } from './miles.tools.js';
import { AWARD_PROGRAMS, MILHEIRO_REFERENCE_DATE } from './planner/planner.estimates.js';

const money = (value, cents = false) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(value);
const number = value => Math.round(value).toLocaleString('pt-BR');

const RATIOS = Object.freeze([[1, '1 : 1'], [2, '2 : 1'], [3, '3 : 1']]);
const BONUSES = Object.freeze([0, 30, 50, 80, 100]);
const CARD_PRIORITIES = Object.freeze({
  points: 'Acumular pontos',
  lounges: 'Salas VIP',
  international: 'Viagens internacionais',
  nofee: 'Sem anuidade'
});

function trustLine(item) {
  const common = { tag: 'span', className: 'miles-trust' };
  if (!verifiedRecord(item)) return provenanceLabel('unverified', { ...common, detail: 'dados específicos ainda não confirmados' });
  return provenanceLabel('verified', { ...common, date: item.verifiedAt, dateLabel: 'em', source: item.officialSource, sourceText: 'Fonte oficial' });
}

function chips(name, entries, selected) {
  return `<div class="miles-chips" role="group">${entries.map(([value, label]) => `<button type="button" class="miles-chip" data-${name}="${escapeHtml(String(value))}" aria-pressed="${String(value) === String(selected)}">${escapeHtml(label)}</button>`).join('')}</div>`;
}

// Converte "80.000", "80000" ou "80 mil" em número inteiro positivo; null se inválido.
function readWhole(value) {
  const raw = String(value ?? '').trim().toLowerCase().replace(/\s*mil$/, '000').replace(/\s/g, '');
  if (!raw) return null;
  const parsed = parseBrazilianNumber(raw, { whole: true }) ?? parseBrazilianNumber(raw);
  return parsed !== null && parsed > 0 ? Math.round(parsed) : null;
}

function readMoney(value) {
  const parsed = parseBrazilianNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

export class MilesEngine {
  constructor({ tabsElement, contentElement, airportRepository }) {
    this.tabsElement = tabsElement;
    this.contentElement = contentElement;
    this.airportRepository = airportRepository;
    this.activeTab = MILES_TABS[0].key;
    this.routeContext = null;
    this.loungeQuery = '';
    this.loungeAirport = null;
    // Estado do conversor.
    this.converter = { have: 'points', program: AWARD_PROGRAMS[0].id, ratio: 1, bonus: 0 };
    this.worth = { program: AWARD_PROGRAMS[0].id };
    this.cardPriority = 'points';

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
    this.onContentClick = event => this.#click(event);
    this.onContentInput = event => this.#input(event);
    this.onContentChange = event => {
      if (event.target.id === 'miles-lounge-network' || event.target.id === 'miles-lounge-terminal') this.renderLoungeResults();
    };
    this.onContentSubmit = event => event.preventDefault();
  }

  mount() {
    this.tabsElement.innerHTML = MILES_TABS.map(tab => `<button class="miles-tab" id="miles-tab-${tab.key}" type="button" role="tab" data-miles-tab="${tab.key}" aria-controls="miles-panel-${tab.key}" aria-selected="false" tabindex="-1">${escapeHtml(tab.label)}</button>`).join('');
    const renderers = { convert: () => this.#renderConverter(), cards: () => this.#renderCards(), lounges: () => this.#renderLounges() };
    this.contentElement.innerHTML = MILES_TABS.map(tab => `<section class="miles-panel" id="miles-panel-${tab.key}" role="tabpanel" aria-labelledby="miles-tab-${tab.key}" tabindex="0" hidden>${renderers[tab.key]()}</section>`).join('');
    this.tabsElement.addEventListener('click', this.onTabClick);
    this.tabsElement.addEventListener('keydown', this.onTabKeydown);
    this.contentElement.addEventListener('click', this.onContentClick);
    this.contentElement.addEventListener('input', this.onContentInput);
    this.contentElement.addEventListener('change', this.onContentChange);
    this.contentElement.addEventListener('submit', this.onContentSubmit);
    this.selectTab(this.activeTab);
    this.#updateConverter();
    this.#updateWorth();
    this.#updateCards();
  }

  // Aceita os nomes antigos ('overview', 'airports') usados pelo app.
  selectTab(key, focus = false) {
    const aliases = { overview: 'convert', airports: 'lounges', upgrades: 'convert' };
    const target = aliases[key] ?? key;
    if (!MILES_TABS.some(tab => tab.key === target)) return;
    this.activeTab = target;
    for (const tab of this.tabsElement.querySelectorAll('[data-miles-tab]')) {
      const active = tab.dataset.milesTab === target;
      tab.classList.toggle('miles-tab--active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focus) tab.focus();
    }
    for (const panel of this.contentElement.querySelectorAll('.miles-panel')) panel.hidden = panel.id !== `miles-panel-${target}`;
    this.contentElement.closest('.miles-hub')?.scrollTo({ top: 0, behavior: 'auto' });
    if (target === 'lounges') this.airportRepository.loadAll().then(() => {
      if (this.activeTab === 'lounges') this.renderLoungeChoices();
    }).catch(() => {});
  }

  // ---------- Conversor ----------

  #renderConverter() {
    const programs = AWARD_PROGRAMS.map(program => [program.id, program.name]);
    return `
      <div class="miles-block">
        <h3 class="miles-block__title">Conversor de milhas</h3>
        <p class="miles-block__lead">Transforme pontos do cartão em milhas e veja quanto elas valem em reais.</p>
        <span class="miles-field-label">Você tem</span>
        ${chips('have', [['points', 'Pontos do cartão'], ['miles', 'Milhas']], this.converter.have)}
        <label class="miles-field-label" for="miles-amount">Quantidade</label>
        <input class="miles-search miles-amount" id="miles-amount" inputmode="numeric" autocomplete="off" placeholder="Ex.: 50.000">
        <span class="miles-field-label">Programa de milhas</span>
        ${chips('program', programs, this.converter.program)}
        <div class="miles-transfer" ${this.converter.have === 'points' ? '' : 'hidden'}>
          <span class="miles-field-label">Paridade <small>pontos para 1 milha</small></span>
          ${chips('ratio', RATIOS, this.converter.ratio)}
          <span class="miles-field-label">Bônus da transferência</span>
          ${chips('bonus', BONUSES.map(value => [value, value ? `+${value}%` : 'Sem bônus']), this.converter.bonus)}
        </div>
        <div class="miles-convert-result" id="miles-convert-result" aria-live="polite"></div>
      </div>
      <div class="miles-block">
        <h3 class="miles-block__title">Vale a pena usar milhas?</h3>
        <p class="miles-block__lead">Compare a passagem em dinheiro com a mesma passagem em milhas.</p>
        <div class="miles-worth-grid">
          <label class="miles-field-label" for="miles-worth-cash">Preço em dinheiro (R$)<input class="miles-search" id="miles-worth-cash" inputmode="decimal" autocomplete="off" placeholder="4.200"></label>
          <label class="miles-field-label" for="miles-worth-miles">Milhas pedidas<input class="miles-search" id="miles-worth-miles" inputmode="numeric" autocomplete="off" placeholder="80.000"></label>
          <label class="miles-field-label" for="miles-worth-fees">Taxas (R$)<input class="miles-search" id="miles-worth-fees" inputmode="decimal" autocomplete="off" placeholder="350"></label>
        </div>
        <span class="miles-field-label">Programa</span>
        ${chips('worth-program', programs, this.worth.program)}
        <div class="miles-convert-result" id="miles-worth-result" aria-live="polite"></div>
      </div>
      <p class="miles-footnote">Milheiro de referência Traveling (${MILHEIRO_REFERENCE_DATE}): ${AWARD_PROGRAMS.map(program => `${escapeHtml(program.name)} ${money(program.milheiroBRL)}`).join(' · ')} por 1.000 milhas. É uma média de mercado, não cotação.</p>`;
  }

  #program(id) {
    return AWARD_PROGRAMS.find(program => program.id === id) ?? AWARD_PROGRAMS[0];
  }

  #updateConverter() {
    const slot = this.contentElement.querySelector('#miles-convert-result');
    if (!slot) return;
    const amount = readWhole(this.contentElement.querySelector('#miles-amount')?.value);
    const program = this.#program(this.converter.program);
    if (!amount) {
      slot.innerHTML = '<p class="miles-empty">Digite quantos pontos ou milhas você tem.</p>';
      return;
    }
    const miles = this.converter.have === 'points'
      ? Math.floor(amount / this.converter.ratio * (1 + this.converter.bonus / 100))
      : amount;
    const value = miles / 1000 * program.milheiroBRL;
    slot.innerHTML = `
      ${this.converter.have === 'points' ? `<p class="miles-convert-result__from">${number(amount)} pontos${this.converter.ratio > 1 ? ` ÷ ${this.converter.ratio}` : ''}${this.converter.bonus ? ` + ${this.converter.bonus}% de bônus` : ''}</p>` : ''}
      <strong class="miles-convert-result__big">${number(miles)} milhas <small>${escapeHtml(program.name)}</small></strong>
      <p class="miles-convert-result__value">valem cerca de <strong>${money(value)}</strong></p>
      ${provenanceLabel('estimate', { detail: `milheiro de referência de ${money(program.milheiroBRL)}; o valor real depende do resgate` })}`;
  }

  #updateWorth() {
    const slot = this.contentElement.querySelector('#miles-worth-result');
    if (!slot) return;
    const cash = readMoney(this.contentElement.querySelector('#miles-worth-cash')?.value);
    const miles = readWhole(this.contentElement.querySelector('#miles-worth-miles')?.value);
    const feesRaw = this.contentElement.querySelector('#miles-worth-fees')?.value;
    const fees = String(feesRaw ?? '').trim() ? readMoney(feesRaw) : 0;
    if (!cash || !miles || fees === null) {
      slot.innerHTML = '<p class="miles-empty">Preencha o preço e as milhas para ver o resultado.</p>';
      return;
    }
    if (fees >= cash) {
      slot.innerHTML = '<p class="miles-error">As taxas não podem ser maiores que o preço da passagem.</p>';
      return;
    }
    const program = this.#program(this.worth.program);
    const perThousand = (cash - fees) / miles * 1000;
    const milesCost = miles / 1000 * program.milheiroBRL + fees;
    const good = perThousand > program.milheiroBRL;
    slot.innerHTML = `
      <strong class="miles-verdict miles-verdict--${good ? 'good' : 'bad'}">${good ? 'Vale a pena usar milhas' : 'Melhor pagar em dinheiro'}</strong>
      <p>Cada 1.000 milhas rendem <strong>${money(perThousand, true)}</strong> nesta passagem. A referência da ${escapeHtml(program.name)} é ${money(program.milheiroBRL)}.</p>
      <p>Em milhas, a passagem custa o equivalente a <strong>${money(milesCost)}</strong> (milhas + taxas), contra <strong>${money(cash)}</strong> em dinheiro.</p>
      ${provenanceLabel('calculated', { detail: 'com os valores que você digitou e o milheiro de referência' })}`;
  }

  // ---------- Cartões ----------

  #renderCards() {
    return `
      <div class="miles-block">
        <h3 class="miles-block__title">Qual cartão combina com você?</h3>
        <p class="miles-block__lead">Toque no que é mais importante.</p>
        ${chips('card-priority', Object.entries(CARD_PRIORITIES), this.cardPriority)}
        <div id="miles-card-result" class="miles-card-list" aria-live="polite"></div>
      </div>
      <p class="miles-footnote">Benefícios e anuidades mudam. Confira as condições no emissor antes de pedir o cartão.</p>`;
  }

  #updateCards() {
    const slot = this.contentElement.querySelector('#miles-card-result');
    if (!slot) return;
    const priority = this.cardPriority;
    const preferences = priority === 'nofee'
      ? { values: ['simple'], fee: 'avoid', lounge: 'none', trips: '1-2', abroad: 'rare' }
      : { values: [priority], fee: 'conditional', lounge: priority === 'lounges' ? 'important' : 'none', trips: '3-5', abroad: priority === 'international' ? 'often' : 'sometimes' };
    const { matches } = cardMatches(CARD_OFFERS, preferences);
    const top = matches.slice(0, 3);
    slot.innerHTML = top.length ? top.map(({ card }) => `
      <article class="miles-card">
        <div class="miles-card__head"><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.issuer)}</small></div>
        <dl class="miles-facts">
          ${[['Pontos', card.earning], ['Salas VIP', card.loungeAccess], ['Anuidade', card.annualFee]].filter(([, value]) => value).map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
        </dl>
        ${trustLine(card)}
      </article>`).join('') : '<p class="miles-empty">Ainda não há cartões verificados para esta prioridade.</p>';
  }

  // ---------- Salas VIP ----------

  #renderLounges() {
    const networks = loungeNetworks(AIRPORT_GUIDES);
    const cardOnly = AIRPORT_GUIDES.some(guide => guide.lounges?.some(lounge => verifiedRecord(lounge) && !lounge.networks?.length));
    const known = AIRPORT_GUIDES.filter(guide => findVerifiedLounges(AIRPORT_GUIDES, guide.iata).length).map(guide => guide.iata);
    return `
      <div class="miles-block">
        <h3 class="miles-block__title">Salas VIP</h3>
        <p class="miles-block__lead">Escolha o aeroporto de embarque.</p>
        <div id="miles-route-context" class="miles-route-context" hidden></div>
        <div class="miles-chips" role="group" aria-label="Aeroportos com salas verificadas">${known.map(code => `<button type="button" class="miles-chip" data-lounge-airport="${escapeHtml(code)}">${escapeHtml(code)}</button>`).join('')}</div>
        <label class="miles-field-label" for="miles-lounge-search">Ou busque outro aeroporto</label>
        <input class="miles-search" id="miles-lounge-search" type="search" placeholder="GRU, Lisboa, JFK…" autocomplete="off">
        <div id="miles-lounge-airports" class="miles-airport-choices"></div>
        <label class="miles-field-label" for="miles-lounge-network">Como você acessa salas?</label>
        <select class="miles-search" id="miles-lounge-network"><option value="all">Mostrar todas</option>${networks.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')}${cardOnly ? '<option value="card">Outras formas</option>' : ''}</select>
        <label class="miles-field-label" id="miles-lounge-terminal-label" for="miles-lounge-terminal" hidden>Terminal</label>
        <select class="miles-search" id="miles-lounge-terminal" hidden><option value="all">Todos os terminais</option></select>
        <div id="miles-lounge-results" class="miles-airport-results" aria-live="polite"><p class="miles-empty">Escolha um aeroporto para ver as salas verificadas.</p></div>
      </div>`;
  }

  findAirport(code) {
    const normalized = String(code ?? '').trim().toUpperCase();
    return [this.routeContext?.origin, this.routeContext?.destination, ...this.airportRepository.coreAirports]
      .find(airport => airport?.iata === normalized) || this.airportRepository.search(normalized, 1).find(airport => airport.iata === normalized) || null;
  }

  hasVerifiedLounges(code) {
    return findVerifiedLounges(AIRPORT_GUIDES, code).length > 0;
  }

  // Usado pela aba Voos: o hub tem algo a mostrar para este aeroporto (salas verificadas).
  hasAirportGuide(code) {
    return this.hasVerifiedLounges(code);
  }

  setRouteContext(origin, destination) {
    this.routeContext = origin && destination ? { origin, destination } : null;
    const container = this.contentElement.querySelector('#miles-route-context');
    if (!container) return;
    const airports = [this.routeContext?.origin, this.routeContext?.destination].filter(airport => airport?.iata && this.hasVerifiedLounges(airport.iata));
    container.hidden = !airports.length;
    container.innerHTML = airports.length ? `<strong>Na sua rota</strong><div>${airports.map(airport => `<button type="button" data-lounge-airport="${escapeHtml(airport.iata)}">Salas em ${escapeHtml(airport.iata)}</button>`).join('')}</div>` : '';
  }

  // Abre as salas de um aeroporto (usado pela rota no globo).
  showAirport(code) {
    const airport = this.findAirport(code);
    this.selectTab('lounges');
    if (airport) this.#chooseLoungeAirport(airport);
  }

  #chooseLoungeAirport(airport) {
    this.loungeAirport = airport;
    this.loungeQuery = airport?.iata || '';
    this.contentElement.querySelector('#miles-lounge-search').value = this.loungeQuery;
    this.contentElement.querySelector('#miles-lounge-network').value = 'all';
    for (const chip of this.contentElement.querySelectorAll('.miles-chip[data-lounge-airport]')) chip.setAttribute('aria-pressed', String(chip.dataset.loungeAirport === airport?.iata));
    this.updateLoungeTerminals();
    this.renderLoungeChoices();
    this.renderLoungeResults();
  }

  renderLoungeChoices() {
    const container = this.contentElement.querySelector('#miles-lounge-airports');
    if (!container) return;
    if (this.loungeAirport || !this.loungeQuery) { container.innerHTML = ''; return; }
    const airports = rankAirportMatches([...new Map([
      ...this.airportRepository.search(this.loungeQuery, 50),
      ...this.airportRepository.coreAirports
    ].filter(airport => airport.iata).map(airport => [airport.iata, airport])).values()], this.loungeQuery).slice(0, 6);
    container.innerHTML = airports.map(airport => `<button type="button" data-lounge-airport="${escapeHtml(airport.iata)}">${escapeHtml(airport.iata)} · ${escapeHtml(airport.city)} — ${escapeHtml(airport.name)}</button>`).join('');
  }

  updateLoungeTerminals() {
    const select = this.contentElement.querySelector('#miles-lounge-terminal');
    const label = this.contentElement.querySelector('#miles-lounge-terminal-label');
    const guide = AIRPORT_GUIDES.find(item => item.iata === this.loungeAirport?.iata && verifiedRecord(item));
    const terminals = guide?.terminals || [];
    select.innerHTML = `<option value="all">Todos os terminais</option>${terminals.map(terminal => `<option value="${escapeHtml(terminal)}">${escapeHtml(terminal)}</option>`).join('')}`;
    select.hidden = label.hidden = terminals.length < 2;
  }

  renderLoungeResults() {
    const container = this.contentElement.querySelector('#miles-lounge-results');
    if (!container) return;
    const airport = this.loungeAirport;
    if (!airport) { container.innerHTML = '<p class="miles-empty">Escolha um aeroporto para ver as salas verificadas.</p>'; return; }
    const filter = this.contentElement.querySelector('#miles-lounge-network').value;
    const terminal = this.contentElement.querySelector('#miles-lounge-terminal').value;
    const all = findVerifiedLounges(AIRPORT_GUIDES, airport.iata);
    const matches = filterLoungesByTerminal(findVerifiedLounges(AIRPORT_GUIDES, airport.iata, filter), terminal);
    const title = `<h4>${escapeHtml(airport.iata)} · ${escapeHtml(airport.city)}</h4>`;
    if (!all.length) { container.innerHTML = `${title}<p class="miles-empty">Ainda não há sala verificada para este aeroporto.</p>`; return; }
    container.innerHTML = `${title}${matches.length ? matches.map(lounge => `
      <article class="miles-card">
        <div class="miles-card__head"><strong>${escapeHtml(lounge.name)}</strong><small>${escapeHtml(lounge.terminal)}</small></div>
        <p>${escapeHtml(lounge.eligibility)}</p>
        ${trustLine(lounge)}
      </article>`).join('') : `<p class="miles-empty">Nenhuma sala verificada com este filtro.</p><button class="miles-text-button" type="button" data-miles-clear-lounge-filter>Mostrar todas as salas de ${escapeHtml(airport.iata)}</button>`}`;
  }

  // ---------- Eventos ----------

  #click(event) {
    const button = event.target.closest('button');
    if (!button || !this.contentElement.contains(button)) return;
    const data = button.dataset;
    if (data.have) { this.converter.have = data.have; this.contentElement.querySelector('.miles-transfer').hidden = data.have !== 'points'; }
    if (data.program) this.converter.program = data.program;
    if (data.ratio) this.converter.ratio = Number(data.ratio);
    if (data.bonus) this.converter.bonus = Number(data.bonus);
    if (data.worthProgram) this.worth.program = data.worthProgram;
    if (data.cardPriority) { this.cardPriority = data.cardPriority; this.#updateCards(); }
    if (data.have || data.program || data.ratio || data.bonus || data.worthProgram || data.cardPriority) {
      const key = Object.keys(data)[0];
      for (const chip of button.parentElement.querySelectorAll('.miles-chip')) chip.setAttribute('aria-pressed', String(chip === button));
      if (key !== 'cardPriority') { this.#updateConverter(); this.#updateWorth(); }
      return;
    }
    if (data.loungeAirport) {
      const airport = this.findAirport(data.loungeAirport);
      if (airport) this.#chooseLoungeAirport(airport);
      return;
    }
    if ('milesClearLoungeFilter' in data) {
      this.contentElement.querySelector('#miles-lounge-network').value = 'all';
      this.contentElement.querySelector('#miles-lounge-terminal').value = 'all';
      this.renderLoungeResults();
    }
  }

  #input(event) {
    const id = event.target.id;
    if (id === 'miles-amount') this.#updateConverter();
    else if (id.startsWith('miles-worth-')) this.#updateWorth();
    else if (id === 'miles-lounge-search') {
      this.loungeQuery = event.target.value.trim();
      this.loungeAirport = null;
      for (const chip of this.contentElement.querySelectorAll('.miles-chip[data-lounge-airport]')) chip.setAttribute('aria-pressed', 'false');
      this.updateLoungeTerminals();
      this.renderLoungeChoices();
      this.renderLoungeResults();
    }
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
