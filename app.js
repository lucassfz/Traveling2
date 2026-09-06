import { AirportRepository } from './airports.repository.js';
import {
  CONTINENT_LABELS,
  COUNTRIES,
  searchCountries
} from './countries.dataset.js';
import { MilesEngine } from './miles.engine.js';
import { getCountryMedia } from './media.service.js';
import { SplashEngine } from './splash.engine.js';
import { StarfieldEngine } from './starfield.engine.js';
import {
  estimateFlightPricing,
  formatDistance,
  formatMiles,
  formatMoney
} from './pricing.engine.js';

const MONTHS = Object.freeze(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']);
const elements = {
  splash: document.getElementById('splash-screen'),
  globeStage: document.getElementById('globe-stage'),
  starfield: document.getElementById('starfield-canvas'),
  globeStatus: document.getElementById('globe-status'),
  globeFallback: document.getElementById('globe-fallback'),
  homeButton: document.getElementById('home-button'),
  themeButton: document.getElementById('theme-button'),
  visitedCount: document.getElementById('visited-count'),
  visaFreeFilter: document.getElementById('visa-free-filter'),
  visaFreeCount: document.getElementById('visa-free-count'),
  search: document.getElementById('country-search'),
  searchInput: document.getElementById('country-search-input'),
  searchResults: document.getElementById('country-search-results'),
  continentButtons: [...document.querySelectorAll('[data-continent]')],
  navigationTrail: document.getElementById('navigation-trail'),
  tooltip: document.getElementById('country-tooltip'),
  panel: document.getElementById('country-panel'),
  panelClose: document.getElementById('country-panel-close'),
  path: document.getElementById('country-path'),
  visitButton: document.getElementById('visit-button'),
  countryFlag: document.getElementById('country-flag'),
  countryRegion: document.getElementById('country-region'),
  countryName: document.getElementById('country-name'),
  dataBadge: document.getElementById('country-data-badge'),
  tabButtons: [...document.querySelectorAll('.country-tabs__button')],
  tabPanels: [...document.querySelectorAll('[data-tab-panel]')],
  media: document.getElementById('country-media'),
  basics: document.getElementById('country-basics'),
  currencyConverter: document.getElementById('currency-converter'),
  monthChart: document.getElementById('month-chart'),
  bestTime: document.getElementById('best-time-copy'),
  entry: document.getElementById('entry-content'),
  foods: document.getElementById('food-content'),
  etiquette: document.getElementById('etiquette-content'),
  vibe: document.getElementById('vibe-content'),
  originInput: document.getElementById('origin-airport-input'),
  airportSuggestions: document.getElementById('airport-suggestions'),
  cabinSelect: document.getElementById('cabin-select'),
  monthSelect: document.getElementById('travel-month-select'),
  routeOriginCode: document.getElementById('route-origin-code'),
  routeOriginCity: document.getElementById('route-origin-city'),
  routeDestinationCode: document.getElementById('route-destination-code'),
  routeDestinationCity: document.getElementById('route-destination-city'),
  routeButton: document.getElementById('calculate-route-button'),
  routeResult: document.getElementById('route-result'),
  checklist: document.getElementById('checklist-content'),
  checklistComplete: document.getElementById('checklist-complete-button'),
  checklistClear: document.getElementById('checklist-clear-button'),
  milesLauncher: document.getElementById('miles-launcher'),
  milesHub: document.getElementById('miles-hub'),
  milesClose: document.getElementById('miles-close-button'),
  milesFilters: document.getElementById('miles-filters'),
  milesFlashcards: document.getElementById('miles-flashcards')
};

function readJsonStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const state = {
  countryKey: null,
  continent: null,
  tab: 'overview',
  visited: new Set(readJsonStorage('traveling.visited', [])),
  checklist: readJsonStorage('traveling.checklist', {}),
  history: [],
  isVisaFreeBRFilterActive: false,
  brlPerUsd: 5,
  map: null,
  splash: null,
  starfield: null,
  milesEngine: null,
  destinationAirport: null
};

const airportRepository = new AirportRepository();
const destinationAirportCache = new Map();

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function stripHtml(value) {
  const holder = document.createElement('div');
  holder.innerHTML = String(value ?? '');
  return holder.textContent ?? '';
}

function savePersistentState() {
  localStorage.setItem('traveling.visited', JSON.stringify([...state.visited]));
  localStorage.setItem('traveling.checklist', JSON.stringify(state.checklist));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('traveling.theme', theme);
  const isDark = theme === 'dark';
  elements.themeButton.textContent = isDark ? '☀️' : '🌙';
  elements.themeButton.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
  state.map?.setTheme();
  state.starfield?.setTheme(theme);
}

function initializeTheme() {
  setTheme(localStorage.getItem('traveling.theme') || 'dark');
}

function renderVisitedCount() {
  elements.visitedCount.textContent = String(state.visited.size);
  state.map?.setVisitedCountries?.(state.visited);
}

function isVisaFreeForBrazil(country) {
  return country?.visaPolicyBR?.eligibility === 'visa-free';
}

function getVisaFreeBrazilCountryKeys() {
  return Object.entries(COUNTRIES)
    .filter(([, country]) => isVisaFreeForBrazil(country))
    .map(([countryKey]) => countryKey);
}

function renderVisaFreeFilter() {
  const eligibleCountries = getVisaFreeBrazilCountryKeys();
  elements.visaFreeCount.textContent = String(eligibleCountries.length);
  elements.visaFreeFilter.classList.toggle('visa-filter--active', state.isVisaFreeBRFilterActive);
  elements.visaFreeFilter.setAttribute('aria-pressed', String(state.isVisaFreeBRFilterActive));
  elements.visaFreeFilter.setAttribute(
    'aria-label',
    state.isVisaFreeBRFilterActive
      ? `Ocultar filtro de ${eligibleCountries.length} destinos isentos de visto para brasileiros`
      : `Mostrar ${eligibleCountries.length} destinos isentos de visto para brasileiros`
  );
  state.map?.setVisaFreeFilter(state.isVisaFreeBRFilterActive, eligibleCountries);
}

function setSearchOpen(open) {
  elements.searchResults.classList.toggle('search__results--open', open);
}

function renderSearchResults(query) {
  if (query.trim().length < 2) {
    elements.searchResults.innerHTML = '';
    setSearchOpen(false);
    return;
  }
  const matches = searchCountries(query, 8);
  if (!matches.length) {
    elements.searchResults.innerHTML = '';
    setSearchOpen(false);
    return;
  }
  elements.searchResults.innerHTML = matches.map(countryKey => {
    const country = COUNTRIES[countryKey];
    return `
      <button class="search__option" type="button" role="option" data-country-key="${escapeHtml(countryKey)}">
        <span class="search__option-flag">${escapeHtml(country.flag)}</span>
        <span>${escapeHtml(country.namePt)}</span>
        <span class="search__option-region">${escapeHtml(CONTINENT_LABELS[country.continent] || country.region)}</span>
      </button>
    `;
  }).join('');
  setSearchOpen(true);
}

function renderContinentState() {
  for (const button of elements.continentButtons) {
    button.classList.toggle('continent-nav__button--active', button.dataset.continent === state.continent);
  }
}

function addHistory(entry) {
  const key = `${entry.type}:${entry.key}`;
  state.history = state.history.filter(item => `${item.type}:${item.key}` !== key);
  state.history.push(entry);
  if (state.history.length > 7) state.history.shift();
  renderHistory();
}

function renderHistory() {
  elements.navigationTrail.innerHTML = state.history.map((entry, index) => `
    <button
      class="navigation-trail__button ${index === state.history.length - 1 ? 'navigation-trail__button--active' : ''}"
      type="button"
      data-history-index="${index}"
      aria-label="${escapeHtml(entry.label)}"
      title="${escapeHtml(entry.label)}"
    ></button>
  `).join('');
}

function switchTab(tabName) {
  state.tab = tabName;
  for (const button of elements.tabButtons) {
    const active = button.dataset.tab === tabName;
    button.classList.toggle('country-tabs__button--active', active);
    button.setAttribute('aria-selected', String(active));
  }
  for (const panel of elements.tabPanels) {
    panel.classList.toggle('country-tab--active', panel.dataset.tabPanel === tabName);
  }
  if (tabName === 'flights') {
    airportRepository.loadAll().then(() => updateAirportSuggestions(elements.originInput.value)).catch(() => {});
  }
}

function renderMedia(countryKey, country) {
  elements.media.innerHTML = '<div class="media-empty">Carregando mídia…</div>';
  getCountryMedia(countryKey, country).then(media => {
    if (state.countryKey !== countryKey) return;
    if (!media.length) {
      elements.media.innerHTML = '<div class="media-empty">Mídia em curadoria para este destino.</div>';
      return;
    }
    elements.media.innerHTML = media.map(item => `
      <figure class="media-card">
        <img class="media-card__image" src="${escapeHtml(item.url)}" alt="${escapeHtml(item.city)}" loading="lazy" decoding="async">
        <figcaption class="media-card__city">${escapeHtml(item.city)}</figcaption>
      </figure>
    `).join('');
  });
}

function renderBasics(country) {
  const cards = [
    ['Capital', country.capital || '—'],
    ['Moeda', country.currency || '—'],
    ['Idioma', country.lang || '—'],
    ['Fuso', country.timezoneLabel || '—'],
    ['Voltagem', country.voltage || 'Confirmar'],
    ['Código', country.alpha2 || '—']
  ];
  elements.basics.innerHTML = cards.map(([label, value]) => `
    <article class="info-card">
      <div class="info-card__label">${escapeHtml(label)}</div>
      <div class="info-card__value">${escapeHtml(value)}</div>
    </article>
  `).join('');
}

function formatConverterAmount(amount, currencyCode, currencySymbol) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: safeAmount >= 100 ? 0 : 2
    }).format(safeAmount);
  } catch {
    return `${currencySymbol || ''} ${safeAmount.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`.trim();
  }
}

function converterInputValue(value) {
  const source = String(value ?? '').trim();
  const normalized = source.includes(',') && source.includes('.')
    ? source.replace(/\./g, '').replace(',', '.')
    : source.replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function updateCurrencyConverter() {
  const card = elements.currencyConverter.querySelector('.currency-converter-card');
  if (!card) return;
  const input = card.querySelector('[data-currency-input]');
  const output = card.querySelector('[data-currency-output]');
  const rate = Number(card.dataset.rate);
  if (!input || !output || !Number.isFinite(rate)) return;
  const localAmount = converterInputValue(input.value) * rate;
  output.textContent = formatConverterAmount(localAmount, card.dataset.currencyCode, card.dataset.currencySymbol);
}

function renderCurrencyConverter(country) {
  const converter = country.currencyConverter;
  if (!converter || !Number.isFinite(converter.brlExchangeRate)) {
    elements.currencyConverter.innerHTML = '';
    return;
  }
  const rate = converter.brlExchangeRate;
  elements.currencyConverter.innerHTML = `
    <section class="currency-converter-card" data-rate="${escapeHtml(rate)}" data-currency-code="${escapeHtml(converter.targetCode || 'USD')}" data-currency-symbol="${escapeHtml(converter.targetSymbol || '')}">
      <header class="currency-converter-card__header">
        <div>
          <h2 class="currency-converter-card__title">Conversor de referência</h2>
          <p class="currency-converter-card__rate">1 BRL = ${escapeHtml(formatConverterAmount(rate, converter.targetCode, converter.targetSymbol))}</p>
        </div>
        <span class="currency-converter-card__badge">BRL ↔ ${escapeHtml(converter.targetCode || 'local')}</span>
      </header>
      <div class="currency-converter-card__fields">
        <label class="currency-converter-card__field">
          <span>Valor em BRL</span>
          <input class="currency-converter-card__input" data-currency-input type="text" inputmode="decimal" value="100" aria-label="Valor em reais">
        </label>
        <span class="currency-converter-card__arrow" aria-hidden="true">→</span>
        <div class="currency-converter-card__field">
          <span>Estimativa local</span>
          <output class="currency-converter-card__output" data-currency-output></output>
        </div>
      </div>
      <p class="currency-converter-card__note">Taxa de referência de ${escapeHtml(converter.rateAsOf)}; não inclui spread, IOF ou tarifas. <a href="${escapeHtml(converter.source)}" target="_blank" rel="noreferrer">Ver fonte</a></p>
    </section>
  `;
  updateCurrencyConverter();
}

function renderMonths(country) {
  const values = country.months?.length === 12 ? country.months : Array(12).fill(1);
  elements.monthChart.innerHTML = values.map((score, index) => `
    <div class="month-chart__month" title="${escapeHtml(MONTHS[index])}">
      <div class="month-chart__bar ${score === 2 ? 'month-chart__bar--great' : score === 1 ? 'month-chart__bar--good' : ''}"></div>
      <span>${escapeHtml(MONTHS[index][0])}</span>
    </div>
  `).join('');
  elements.bestTime.textContent = country.bestTime || 'Consulte clima e sazonalidade antes da reserva.';
}

function entryTone(country) {
  if (country.borderStatus === 'closed') return 'detail-card--danger';
  if (country.borderStatus === 'warn' || country.visa === 'req') return 'detail-card--warning';
  if (country.borderStatus === 'open' && country.visa === 'free') return 'detail-card--success';
  return '';
}

function renderEntry(country) {
  const items = [
    ['Fronteiras', country.borderNote || 'Confirmar regras atuais'],
    ['Visto', stripHtml(country.visaText) || 'Confirmar em fonte consular oficial'],
    ['Passaporte', country.passport || 'Confirmar validade mínima exigida'],
    ['Saúde e vacinas', country.vaccines || 'Confirmar requisitos sanitários']
  ];
  if (country.entryDeclaration) items.push(['Formulários', country.entryDeclaration]);
  if (country.conflict?.text) items.unshift(['Segurança', country.conflict.text]);
  const tone = entryTone(country);
  elements.entry.innerHTML = items.map(([label, value]) => `
    <article class="detail-card ${tone}">
      <div class="detail-card__label">${escapeHtml(label)}</div>
      <div class="detail-card__value">${escapeHtml(value)}</div>
    </article>
  `).join('');
}

function renderCulture(country) {
  elements.foods.innerHTML = (country.foods ?? []).map(item => `
    <article class="culture-row">
      <div class="culture-row__icon" aria-hidden="true">${escapeHtml(item.e || '🍽️')}</div>
      <div>
        <h3 class="culture-row__title">${escapeHtml(item.name)}</h3>
        <p class="culture-row__copy">${escapeHtml(item.desc)}</p>
      </div>
    </article>
  `).join('');

  elements.etiquette.innerHTML = (country.etiquette ?? []).map(item => `
    <article class="culture-row">
      <div class="culture-row__icon" aria-hidden="true">${escapeHtml(item.e || '•')}</div>
      <p class="culture-row__copy">${escapeHtml(item.t)}</p>
    </article>
  `).join('');

  elements.vibe.innerHTML = (country.vibe ?? []).map(value => `<span class="tag">${escapeHtml(value)}</span>`).join('');
}

function checklistKey(countryKey, groupIndex, itemIndex) {
  return `${countryKey}:${groupIndex}:${itemIndex}`;
}

function renderChecklist(countryKey, country) {
  elements.checklist.innerHTML = (country.checklist ?? []).map((group, groupIndex) => `
    <section class="checklist__group">
      <h3 class="checklist__title">${escapeHtml(group.group)}</h3>
      ${(group.items ?? []).map((item, itemIndex) => {
        const key = checklistKey(countryKey, groupIndex, itemIndex);
        const complete = Boolean(state.checklist[key]);
        return `
          <button class="checklist__item ${complete ? 'checklist__item--complete' : ''}" type="button" data-checklist-key="${escapeHtml(key)}">
            <span class="checklist__box">${complete ? '✓' : ''}</span>
            <span aria-hidden="true">${escapeHtml(item.icon || '•')}</span>
            <span class="checklist__label">${escapeHtml(item.label)}</span>
          </button>
        `;
      }).join('')}
    </section>
  `).join('');
}

async function resolveDestinationAirport(countryKey) {
  if (destinationAirportCache.has(countryKey)) return destinationAirportCache.get(countryKey);
  const country = COUNTRIES[countryKey];
  let airport = null;
  if (country.airport && country.airport !== '—') airport = await airportRepository.resolve(country.airport);
  if (!airport && country.latlng) airport = await airportRepository.findNearest(country.latlng[0], country.latlng[1]);
  destinationAirportCache.set(countryKey, airport);
  return airport;
}

async function primeDestinationAirport(countryKey) {
  const country = COUNTRIES[countryKey];
  elements.routeDestinationCode.textContent = country.airport && country.airport !== '—' ? country.airport : '…';
  elements.routeDestinationCity.textContent = country.airportCity || country.capital || country.namePt;
  state.destinationAirport = null;
  try {
    const airport = await resolveDestinationAirport(countryKey);
    if (state.countryKey !== countryKey || !airport) return;
    state.destinationAirport = airport;
    elements.routeDestinationCode.textContent = airport.iata || airport.icao || '—';
    elements.routeDestinationCity.textContent = airport.city || airport.name;
  } catch {
    if (state.countryKey === countryKey) elements.routeDestinationCode.textContent = country.airport || '—';
  }
}

function renderCountry(countryKey) {
  const country = COUNTRIES[countryKey];
  if (!country) return;
  state.countryKey = countryKey;
  state.continent = country.continent;
  elements.countryFlag.textContent = country.flag;
  elements.countryRegion.textContent = country.region || CONTINENT_LABELS[country.continent];
  elements.countryName.textContent = country.namePt;
  elements.path.textContent = `Mundo › ${country.region || CONTINENT_LABELS[country.continent]} › ${country.namePt}`;
  elements.dataBadge.textContent = country.dataLevel === 'curated' ? 'Conteúdo curado' : country.dataLevel === 'regional' ? 'Cobertura regional' : 'Dados essenciais';
  elements.dataBadge.classList.toggle('data-badge--curated', country.dataLevel === 'curated');
  elements.visitButton.classList.toggle('visit-button--active', state.visited.has(countryKey));
  elements.visitButton.textContent = state.visited.has(countryKey) ? '✓ Visitado' : 'Marcar visitado';

  renderMedia(countryKey, country);
  renderBasics(country);
  renderCurrencyConverter(country);
  renderMonths(country);
  renderEntry(country);
  renderCulture(country);
  renderChecklist(countryKey, country);
  primeDestinationAirport(countryKey);
  elements.routeResult.innerHTML = '';
  elements.panel.classList.add('country-panel--open');
  switchTab('overview');
  renderContinentState();
}

function selectCountry(countryKey, { recordHistory = true } = {}) {
  const country = COUNTRIES[countryKey];
  if (!country) return;
  state.map?.selectCountry(countryKey);
  renderCountry(countryKey);
  if (recordHistory) addHistory({ type: 'country', key: countryKey, label: country.namePt });
}

function closeCountryPanel() {
  elements.panel.classList.remove('country-panel--open');
  state.map?.clearSelection();
  state.countryKey = null;
}

function selectContinent(continent, { recordHistory = true } = {}) {
  state.continent = continent;
  state.countryKey = null;
  elements.panel.classList.remove('country-panel--open');
  state.map?.clearSelection();
  state.map?.setContinent(continent);
  renderContinentState();
  if (recordHistory) addHistory({ type: 'continent', key: continent, label: CONTINENT_LABELS[continent] || continent });
}

function home() {
  state.countryKey = null;
  state.continent = null;
  state.history = [];
  elements.panel.classList.remove('country-panel--open');
  state.map?.home();
  renderContinentState();
  renderHistory();
}

function toggleVisited() {
  if (!state.countryKey) return;
  if (state.visited.has(state.countryKey)) state.visited.delete(state.countryKey);
  else state.visited.add(state.countryKey);
  savePersistentState();
  renderVisitedCount();
  elements.visitButton.classList.toggle('visit-button--active', state.visited.has(state.countryKey));
  elements.visitButton.textContent = state.visited.has(state.countryKey) ? '✓ Visitado' : 'Marcar visitado';
  elements.visitButton.classList.remove('button--pulse');
  requestAnimationFrame(() => elements.visitButton.classList.add('button--pulse'));
  setTimeout(() => elements.visitButton.classList.remove('button--pulse'), 340);
}

function updateChecklistItem(button) {
  const key = button.dataset.checklistKey;
  if (!key) return;
  state.checklist[key] = !state.checklist[key];
  button.classList.toggle('checklist__item--complete', state.checklist[key]);
  button.querySelector('.checklist__box').textContent = state.checklist[key] ? '✓' : '';
  savePersistentState();
}

function setAllChecklistItems(complete) {
  if (!state.countryKey) return;
  for (const button of elements.checklist.querySelectorAll('[data-checklist-key]')) {
    state.checklist[button.dataset.checklistKey] = complete;
  }
  savePersistentState();
  renderChecklist(state.countryKey, COUNTRIES[state.countryKey]);
}

function populateMonthSelect() {
  elements.monthSelect.innerHTML = MONTHS.map((month, index) => `<option value="${index}">${month}</option>`).join('');
  elements.monthSelect.value = String(new Date().getMonth());
}

function updateAirportSuggestions(query = '') {
  const matches = query.trim() ? airportRepository.search(query, 12) : airportRepository.coreAirports.slice(0, 12);
  elements.airportSuggestions.innerHTML = matches.map(airport => {
    const code = airport.iata || airport.icao;
    const label = `${code} — ${airport.city}, ${airport.country}`;
    return `<option value="${escapeHtml(code)}">${escapeHtml(label)}</option>`;
  }).join('');
}

async function calculateRoute() {
  if (!state.countryKey) return;
  const originCode = elements.originInput.value.trim().toUpperCase();
  if (!originCode) {
    elements.routeResult.innerHTML = '<div class="route-error">Digite um código IATA ou ICAO de origem.</div>';
    return;
  }

  elements.routeButton.disabled = true;
  elements.routeButton.textContent = 'Calculando…';
  elements.routeResult.innerHTML = '';

  try {
    const origin = await airportRepository.resolve(originCode);
    if (!origin) throw new Error('Aeroporto não encontrado. Verifique o código IATA/ICAO ou sua conexão para carregar a base global.');
    const destination = state.destinationAirport || await resolveDestinationAirport(state.countryKey);
    if (!destination) throw new Error('Não foi possível determinar um aeroporto de destino para este país.');

    state.destinationAirport = destination;
    elements.routeOriginCode.textContent = origin.iata || origin.icao;
    elements.routeOriginCity.textContent = origin.city || origin.name;
    elements.routeDestinationCode.textContent = destination.iata || destination.icao;
    elements.routeDestinationCity.textContent = destination.city || destination.name;

    const estimate = estimateFlightPricing({
      origin,
      destination,
      cabin: elements.cabinSelect.value,
      month: Number(elements.monthSelect.value),
      brlPerUsd: state.brlPerUsd
    });

    elements.routeResult.innerHTML = `
      <div class="route-result__summary">
        <article class="route-result__card">
          <div class="route-result__label">Distância</div>
          <div class="route-result__value">${escapeHtml(formatDistance(estimate.distanceKm))}</div>
        </article>
        <article class="route-result__card">
          <div class="route-result__label">Tarifa estimada</div>
          <div class="route-result__value">${escapeHtml(formatMoney(estimate.cash.brl.low))}–${escapeHtml(formatMoney(estimate.cash.brl.high))}</div>
        </article>
        <article class="route-result__card">
          <div class="route-result__label">Cabine</div>
          <div class="route-result__value route-result__value--accent">${escapeHtml(estimate.cabin)}</div>
        </article>
      </div>
      <div class="route-result__programs">
        ${Object.entries(estimate.awards).map(([program, range]) => `
          <article class="route-result__card">
            <div class="route-result__label">${escapeHtml(program)}</div>
            <div class="route-result__value">${escapeHtml(formatMiles(range.low))}–${escapeHtml(formatMiles(range.high))}</div>
          </article>
        `).join('')}
      </div>
      <p class="route-result__disclaimer">${escapeHtml(estimate.disclaimer)}</p>
    `;
  } catch (error) {
    elements.routeResult.innerHTML = `<div class="route-error">${escapeHtml(error.message)}</div>`;
  } finally {
    elements.routeButton.disabled = false;
    elements.routeButton.textContent = 'Calcular rota';
  }
}

async function fetchExchangeRate() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    if (Number.isFinite(data?.rates?.BRL)) state.brlPerUsd = Number(data.rates.BRL);
  } catch {
    // The pricing engine intentionally keeps a conservative fallback when offline.
  }
}

function showTooltip(countryKey, clientX, clientY) {
  if (!countryKey) {
    elements.tooltip.classList.remove('country-tooltip--visible');
    return;
  }
  const country = COUNTRIES[countryKey];
  if (!country) return;
  const isVisited = state.visited.has(countryKey);
  const isVisaFree = isVisaFreeForBrazil(country);
  const badge = isVisited
    ? '<span class="country-tooltip__badge">Visitado</span>'
    : isVisaFree
      ? '<span class="country-tooltip__badge">Sem visto</span>'
      : '';
  elements.tooltip.innerHTML = `
    <span class="country-tooltip__flag" aria-hidden="true">${escapeHtml(country.flag)}</span>
    <span class="country-tooltip__content">
      <strong class="country-tooltip__name">${escapeHtml(country.namePt)}</strong>
      <span class="country-tooltip__meta">${escapeHtml(CONTINENT_LABELS[country.continent] || country.region || 'Mundo')}</span>
    </span>
    ${badge}
  `;
  elements.tooltip.style.setProperty('--tooltip-x', `${clientX + 14}px`);
  elements.tooltip.style.setProperty('--tooltip-y', `${clientY - 10}px`);
  elements.tooltip.classList.add('country-tooltip--visible');
}

function bindUiEvents() {
  elements.homeButton.addEventListener('click', home);
  elements.themeButton.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  elements.visaFreeFilter.addEventListener('click', () => {
    state.isVisaFreeBRFilterActive = !state.isVisaFreeBRFilterActive;
    renderVisaFreeFilter();
  });

  elements.currencyConverter.addEventListener('input', event => {
    if (event.target.matches('[data-currency-input]')) updateCurrencyConverter();
  });
  elements.currencyConverter.addEventListener('change', event => {
    if (event.target.matches('[data-currency-input]')) updateCurrencyConverter();
  });

  elements.searchInput.addEventListener('input', () => renderSearchResults(elements.searchInput.value));
  elements.searchInput.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setSearchOpen(false);
      elements.searchInput.blur();
    }
    if (event.key === 'Enter') {
      const [first] = searchCountries(elements.searchInput.value, 1);
      if (first) {
        elements.searchInput.value = '';
        setSearchOpen(false);
        selectCountry(first);
      }
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      elements.searchResults.querySelector('.search__option')?.focus();
    }
  });
  elements.searchResults.addEventListener('click', event => {
    const option = event.target.closest('[data-country-key]');
    if (!option) return;
    elements.searchInput.value = '';
    setSearchOpen(false);
    selectCountry(option.dataset.countryKey);
  });
  elements.searchResults.addEventListener('keydown', event => {
    const option = event.target.closest('.search__option');
    if (!option) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      option.nextElementSibling?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      (option.previousElementSibling || elements.searchInput).focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!elements.search.contains(event.target)) setSearchOpen(false);
  });

  for (const button of elements.continentButtons) {
    button.addEventListener('click', () => selectContinent(button.dataset.continent));
  }

  elements.navigationTrail.addEventListener('click', event => {
    const button = event.target.closest('[data-history-index]');
    if (!button) return;
    const entry = state.history[Number(button.dataset.historyIndex)];
    if (!entry) return;
    if (entry.type === 'country') selectCountry(entry.key, { recordHistory: false });
    else selectContinent(entry.key, { recordHistory: false });
  });

  elements.panelClose.addEventListener('click', closeCountryPanel);
  elements.visitButton.addEventListener('click', toggleVisited);
  for (const button of elements.tabButtons) button.addEventListener('click', () => switchTab(button.dataset.tab));

  elements.checklist.addEventListener('click', event => {
    const button = event.target.closest('[data-checklist-key]');
    if (button) updateChecklistItem(button);
  });
  elements.checklistComplete.addEventListener('click', () => setAllChecklistItems(true));
  elements.checklistClear.addEventListener('click', () => setAllChecklistItems(false));

  elements.originInput.addEventListener('input', () => updateAirportSuggestions(elements.originInput.value));
  elements.originInput.addEventListener('focus', () => {
    updateAirportSuggestions(elements.originInput.value);
    airportRepository.loadAll().then(() => updateAirportSuggestions(elements.originInput.value)).catch(() => {});
  });
  elements.routeButton.addEventListener('click', calculateRoute);

  elements.milesLauncher.addEventListener('click', () => {
    const open = !elements.milesHub.classList.contains('miles-hub--open');
    elements.milesHub.classList.toggle('miles-hub--open', open);
    elements.milesLauncher.setAttribute('aria-expanded', String(open));
  });
  elements.milesClose.addEventListener('click', () => {
    elements.milesHub.classList.remove('miles-hub--open');
    elements.milesLauncher.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (elements.milesHub.classList.contains('miles-hub--open')) {
      elements.milesHub.classList.remove('miles-hub--open');
      elements.milesLauncher.setAttribute('aria-expanded', 'false');
    } else if (elements.panel.classList.contains('country-panel--open')) closeCountryPanel();
  });
}

async function initializeMap() {
  try {
    const { MapEngine } = await import('./map.engine.js');
    state.map = new MapEngine(elements.globeStage, {
      onHover: showTooltip,
      onSelect: countryKey => selectCountry(countryKey),
      onProgress: message => { elements.globeStatus.lastElementChild.textContent = message; },
      onReady: () => elements.globeStatus.classList.add('globe__status--hidden')
    });
    state.map.setVisitedCountries?.(state.visited);
    renderVisaFreeFilter();
    await state.map.init();
    elements.globeFallback.classList.remove('globe__fallback--visible');
  } catch (error) {
    console.error('Traveling map initialization failed:', error);
    elements.globeStatus.classList.add('globe__status--hidden');
    elements.globeFallback.classList.add('globe__fallback--visible');
    const detail = elements.globeFallback.querySelector('span');
    if (detail) detail.textContent = 'O mapa 3D não carregou. A busca, os guias, voos e o hub de milhas continuam disponíveis.';
  }
}

function markInterfaceReady() {
  window.__travelingBoot = window.__travelingBoot || {};
  window.__travelingBoot.interactive = true;
  requestAnimationFrame(() => state.splash?.play());
}

function initialize() {
  initializeTheme();
  state.splash = new SplashEngine(elements.splash);
  state.starfield = new StarfieldEngine(elements.starfield);
  renderVisaFreeFilter();
  renderVisitedCount();
  populateMonthSelect();
  updateAirportSuggestions();
  bindUiEvents();
  state.milesEngine = new MilesEngine({
    filtersElement: elements.milesFilters,
    gridElement: elements.milesFlashcards
  });
  state.milesEngine.mount();
  markInterfaceReady();
  fetchExchangeRate();
  initializeMap();
  window.addEventListener('pagehide', () => {
    state.map?.destroy();
    state.splash?.destroy();
    state.starfield?.destroy();
    state.milesEngine?.destroy();
  }, { once: true });
}

initialize();
