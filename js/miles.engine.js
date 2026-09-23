import {
  AIRLINE_UPGRADE_EXAMPLES,
  AIRPORT_GUIDES,
  CARD_OFFERS,
  CARD_PROFILES,
  LEARNING_PATHS,
  LOUNGE_TYPES,
  MILES_TABS,
  UPGRADE_METHODS
} from './miles.data.js';

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
  const match = /^(\d{4})-(\d{2})$/.exec(item?.verifiedAt ?? '');
  return Boolean(item?.status === 'verified' && match && Number(match[2]) >= 1 && Number(match[2]) <= 12 && officialUrl(item.officialSource));
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
  return `${sectionHeading('Comece por aqui', 'Milhas que fazem sentido para sua viagem', 'Pontos e milhas são ferramentas para pagar melhor e viajar com mais conforto. Primeiro entenda de onde vêm, depois compare o uso.')}
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
    ['Bandeira', card.network], ['Programa', card.loyaltyProgram], ['Anuidade', card.annualFee],
    ['Isenção', card.feeWaiver], ['Convidados', card.guests], ['Viagem', card.travelBenefits]
  ].filter(([, value]) => value);
  return `<details class="miles-detail miles-card-record"><summary><span class="miles-card-record__intro"><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.issuer)}</small><span>${escapeHtml(card.earning)}</span><span>${escapeHtml(card.loungeAccess)}</span><em>${escapeHtml(card.idealFor)}</em></span><span class="miles-detail__chevron" aria-hidden="true">+</span></summary><div class="miles-detail__body"><div class="miles-tags">${(card.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div><dl class="miles-facts">${facts.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>${trustLine(card)}</div></details>`;
}

function renderCards() {
  return `${sectionHeading('Escolha pelo uso', 'Cartões em destaque por perfil', 'Não existe um cartão melhor para todas as pessoas. Compare seu gasto, renda, anuidade, banco, companhia preferida e frequência de viagem.')}
    <div class="miles-detail-list">${CARD_PROFILES.map(profile => {
      const cards = CARD_OFFERS.filter(card => card.profile === profile.id);
      const body = cards.map(renderCardRecord).join('');
      return detailRow(profile.label, `${cards.length} ${cards.length === 1 ? 'cartão pesquisado' : 'cartões pesquisados'}`, body);
    }).join('')}</div>
    <p class="miles-footnote">A pontuação anunciada sozinha não revela o custo real do cartão. Confira também regras para isenção e validade dos pontos.</p>`;
}

function renderLounges() {
  return `${sectionHeading('Acesso sem surpresa', 'Como entrar em uma sala VIP?', 'O benefício só funciona quando as quatro partes da sua viagem são compatíveis.')}
    <ol class="miles-journey" aria-label="Caminho para acessar uma sala VIP"><li>Cartão elegível</li><li>Rede parceira</li><li>Aeroporto</li><li>Sala compatível</li></ol>
    <p class="miles-section-copy">A mesma rede pode oferecer regras diferentes conforme cartão e emissor. O logotipo não garante entrada gratuita ou ilimitada.</p>
    <div class="miles-detail-list">${LOUNGE_TYPES.map(type => detailRow(type.name, 'Acesso, visitas e condições', `<p>${escapeHtml(type.explanation)}</p>${trustLine(type)}`)).join('')}</div>
    ${detailRow('Antes de sair de casa', 'Confira as condições do seu acesso', list([
      'Categoria do cartão, emissor e eventual gasto mínimo exigido.',
      'Quantidade de visitas, política de convidados e possíveis cobranças.',
      'Aeroporto, terminal, horário e contrato atual da sala com a rede.'
    ]))}
    <button class="miles-text-button" type="button" data-miles-go="airports">Explorar aeroportos <span aria-hidden="true">→</span></button>`;
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
    <div class="miles-detail-list">${UPGRADE_METHODS.map(method => detailRow(method.title, method.summary, `<p>${escapeHtml(method.detail)}</p>`)).join('')}</div>
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
  return `<details class="miles-airport"><summary><span class="miles-airport__code">${escapeHtml(guide.iata)}</span><span class="miles-airport__identity"><strong>${escapeHtml(city)}</strong><small>${escapeHtml(guide.terminals.join(', '))} · ${guide.lounges.filter(isVerified).length} ${guide.lounges.filter(isVerified).length === 1 ? 'sala verificada' : 'salas verificadas'}${networks.length ? ` · ${escapeHtml(networks.join(', '))}` : ''}</small></span><span class="miles-airport__more" aria-hidden="true">+</span></summary>
    <div class="miles-airport__body"><h4>${escapeHtml(airport?.name || heading)}</h4>${facts}${trustLine(guide)}</div></details>`;
}

function renderAirports() {
  return `${sectionHeading('Na prática', 'Aeroportos e seus benefícios', 'Encontre o aeroporto e abra os detalhes. Salas e serviços só aparecem como informação atual depois de verificados.')}
    <p class="miles-connection">Aeroporto <span>→</span> terminal <span>→</span> companhia <span>→</span> sala VIP <span>→</span> conexão <span>→</span> benefícios</p>
    <label class="miles-search-label" for="miles-airport-search">Buscar aeroporto por código ou cidade</label>
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
    this.showAllAirports = false;
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
      if (event.target.closest('#miles-airports-more')) {
        this.showAllAirports = !this.showAllAirports;
        this.renderAirportResults();
      }
    };
    this.onContentInput = event => {
      if (event.target.id !== 'miles-airport-search') return;
      this.airportQuery = event.target.value.trim();
      this.renderAirportResults();
    };
  }

  mount() {
    this.tabsElement.innerHTML = MILES_TABS.map(tab => `<button class="miles-tab" id="miles-tab-${tab.key}" type="button" role="tab" data-miles-tab="${tab.key}" aria-controls="miles-panel-${tab.key}" aria-selected="false" tabindex="-1">${escapeHtml(tab.label)}</button>`).join('');
    this.contentElement.innerHTML = MILES_TABS.map(tab => `<section class="miles-panel" id="miles-panel-${tab.key}" role="tabpanel" aria-labelledby="miles-tab-${tab.key}" tabindex="0" hidden>${RENDERERS[tab.key]()}</section>`).join('');
    this.tabsElement.addEventListener('click', this.onTabClick);
    this.tabsElement.addEventListener('keydown', this.onTabKeydown);
    this.contentElement.addEventListener('click', this.onContentClick);
    this.contentElement.addEventListener('input', this.onContentInput);
    this.selectTab('overview');
    this.renderAirportResults();
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
  }

  renderAirportResults() {
    const container = this.contentElement.querySelector('#miles-airport-results');
    const more = this.contentElement.querySelector('#miles-airports-more');
    if (!container || !more) return;
    const query = normalize(this.airportQuery);
    const airportByCode = new Map(this.airportRepository.coreAirports.map(airport => [airport.iata, airport]));
    const matches = AIRPORT_GUIDES.filter(guide => {
      const airport = airportByCode.get(guide.iata);
      return !query || normalize([guide.iata, airport?.name, airport?.city, airport?.country].join(' ')).includes(query);
    });
    const visible = query || this.showAllAirports ? matches : matches.slice(0, 3);
    container.innerHTML = visible.length ? visible.map(guide => renderAirport(guide, airportByCode.get(guide.iata))).join('') : '<p class="miles-empty">Nenhum aeroporto encontrado nesta seleção.</p>';
    more.hidden = Boolean(query) || matches.length <= 3;
    more.setAttribute('aria-expanded', String(this.showAllAirports));
    more.innerHTML = `${this.showAllAirports ? 'Mostrar menos' : `Ver todos os ${matches.length} aeroportos`} <span aria-hidden="true">${this.showAllAirports ? '↑' : '→'}</span>`;
  }

  destroy() {
    this.tabsElement.removeEventListener('click', this.onTabClick);
    this.tabsElement.removeEventListener('keydown', this.onTabKeydown);
    this.contentElement.removeEventListener('click', this.onContentClick);
    this.contentElement.removeEventListener('input', this.onContentInput);
  }
}
