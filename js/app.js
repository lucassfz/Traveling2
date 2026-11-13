import { AirportRepository } from './airports.repository.js';
import { STORAGE_KEYS, readJsonStorage, readStorage, writeJsonStorage, writeStorage } from './core/storage.js';
import { escapeHtml } from './core/html.js';
import {
  CONTINENT_LABELS,
  COUNTRIES,
  searchCountries
} from './countries.dataset.js';
import { MilesEngine } from './miles.engine.js';
import { getCountryMedia } from './media.service.js';
import { flagImageUrl, isVisaFreeForBrazil } from './country.exploration.js';
import { entryPresentation } from './entry.presentation.js';
import { discoveryCoverage } from './destination.discovery.js';
import { DiscoveryUI } from './discovery.ui.js';
import { checklistGroups, checklistProgress, hasSeasonalChecklist } from './checklist.engine.js';
import { SplashEngine } from './splash.engine.js';
import { StarfieldEngine } from './starfield.engine.js';
import { brasiliaTimezoneNote } from './timezone.br.js';
import { provenanceLabel } from './provenance.js';
import { loadFxSnapshot, localPerBrl } from './fx.service.js';
import { createFlightsTab } from './drawer/flights.tab.js';

const MONTHS = Object.freeze(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']);
const elements = {
  splash: document.getElementById('splash-screen'),
  globeStage: document.getElementById('globe-stage'),
  starfield: document.getElementById('starfield-canvas'),
  globeStatus: document.getElementById('globe-status'),
  globeFallback: document.getElementById('globe-fallback'),
  homeButton: document.getElementById('home-button'),
  themeButton: document.getElementById('theme-button'),
  discoverButton: document.getElementById('discover-button'),
  visitedCount: document.getElementById('visited-count'),
  visitedTotal: document.getElementById('visited-total'),
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
  countryExploreButton: document.getElementById('country-explore-button'),
  countryExploreStatus: document.getElementById('country-explore-status'),
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
  historyCopy: document.getElementById('country-history'),
  originInput: document.getElementById('origin-airport-input'),
  changeOriginButton: document.getElementById('change-origin-button'),
  airportSuggestions: document.getElementById('airport-suggestions'),
  cabinSelect: document.getElementById('cabin-select'),
  monthSelect: document.getElementById('travel-month-select'),
  routeOriginCode: document.getElementById('route-origin-code'),
  routeOriginCity: document.getElementById('route-origin-city'),
  routeDestinationCode: document.getElementById('route-destination-code'),
  routeDestinationCity: document.getElementById('route-destination-city'),
  routeDestinationNote: document.getElementById('route-destination-note'),
  flightPreviewButton: document.getElementById('flight-preview-button'),
  flightPreviewStatus: document.getElementById('flight-preview-status'),
  flightPreviewPanel: document.getElementById('flight-preview-panel'),
  flightPreviewClose: document.getElementById('flight-preview-close'),
  flightPreviewTitle: document.getElementById('flight-preview-title'),
  flightPreviewCodes: document.getElementById('flight-preview-codes'),
  flightPreviewDetails: document.getElementById('flight-preview-details'),
  routeButton: document.getElementById('calculate-route-button'),
  routeResult: document.getElementById('route-result'),
  routeAirportActions: document.getElementById('route-airport-actions'),
  flightPreviewAirports: document.getElementById('flight-preview-airports'),
  checklist: document.getElementById('checklist-content'),
  checklistProgressText: document.getElementById('checklist-progress-text'),
  checklistProgressMeter: document.getElementById('checklist-progress-meter'),
  checklistProgressFill: document.getElementById('checklist-progress-fill'),
  checklistMonthWrap: document.getElementById('checklist-month-wrap'),
  checklistMonthSelect: document.getElementById('checklist-month-select'),
  checklistComplete: document.getElementById('checklist-complete-button'),
  checklistClear: document.getElementById('checklist-clear-button'),
  milesLauncher: document.getElementById('miles-launcher'),
  milesHub: document.getElementById('miles-hub'),
  milesClose: document.getElementById('miles-close-button'),
  milesTabs: document.getElementById('miles-tabs'),
  milesContent: document.getElementById('miles-content')
};

const state = {
  countryKey: null,
  continent: null,
  tab: 'overview',
  visited: new Set(readJsonStorage(STORAGE_KEYS.visited, [])),
  checklist: readJsonStorage(STORAGE_KEYS.checklist, {}),
  history: [],
  historyActiveIndex: null,
  isVisaFreeBRFilterActive: false,
  // { rate, date, kind, label, source } de js/fx.service.js, ou null.
  brlPerUsd: null,
  fxSnapshot: null,
  map: null,
  splash: null,
  starfield: null,
  milesEngine: null,
  destinationAirport: null,
  originAirport: null,
  originRequestId: 0,
  routePreviewActive: false,
  routeObscured: null,
  routeRequestId: 0,
  routeReturnFocus: null,
  exploreRouteCountryKey: null,
  exploreReturnTimer: null,
  discovery: null,
  mediaObserver: null,
  visibleChecklistGroups: []
};

const airportRepository = new AirportRepository();
const discoveryKeys = discoveryCoverage(COUNTRIES).countryKeys;
const {
  resolveDestinationAirport,
  primeDestinationAirport,
  primeOriginAirport,
  updateFlightPreviewAvailability,
  closeFlightPreview,
  openFlightPreview,
  exploreDestination,
  updateAirportSuggestions,
  calculateRoute,
  openMilesForRoute,
  fetchExchangeRate,
} = createFlightsTab({ elements, state, airportRepository, countries: COUNTRIES, setMilesOpen });

function savePersistentState() {
  writeJsonStorage(STORAGE_KEYS.visited, [...state.visited]);
  writeJsonStorage(STORAGE_KEYS.checklist, state.checklist);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  writeStorage(STORAGE_KEYS.theme, theme);
  const isDark = theme === 'dark';
  elements.themeButton.textContent = isDark ? '☀️' : '🌙';
  elements.themeButton.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo escuro');
  state.map?.setTheme();
  state.starfield?.setTheme(theme);
}

function initializeTheme() {
  const saved = readStorage(STORAGE_KEYS.theme);
  setTheme(saved === 'light' || saved === 'dark' ? saved : 'dark');
}

function renderVisitedCount() {
  elements.visitedCount.textContent = String(state.visited.size);
  elements.visitedTotal.textContent = `/ ${Object.keys(COUNTRIES).length}`;
  state.map?.setVisitedCountries?.(state.visited);
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
  elements.visaFreeFilter.title = state.isVisaFreeBRFilterActive
    ? 'Desativar filtro de destinos sem visto prévio nem autorização eletrônica'
    : 'Mostrar destinos sem visto prévio nem autorização eletrônica';
  elements.visaFreeFilter.setAttribute(
    'aria-label',
    state.isVisaFreeBRFilterActive
      ? `Desativar filtro de ${eligibleCountries.length} destinos sem visto prévio nem autorização eletrônica para brasileiros`
      : `Mostrar ${eligibleCountries.length} destinos sem visto prévio nem autorização eletrônica para brasileiros`
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
  state.historyActiveIndex = state.history.length - 1;
  renderHistory();
}

function renderHistory() {
  elements.navigationTrail.innerHTML = state.history.length ? `<span class="navigation-trail__label">Recentes</span>${state.history.map((entry, index) => `
    <button
      class="navigation-trail__button ${index === state.historyActiveIndex ? 'navigation-trail__button--active' : ''}"
      type="button"
      data-history-index="${index}"
      aria-label="Ir para ${escapeHtml(entry.label)}"
      ${index === state.historyActiveIndex ? 'aria-current="location"' : ''}
      title="Ir para ${escapeHtml(entry.label)}"
    ></button>
  `).join('')}` : '';
}

function switchTab(tabName) {
  state.tab = tabName;
  for (const button of elements.tabButtons) {
    const active = button.dataset.tab === tabName;
    button.id = `country-tab-button-${button.dataset.tab}`;
    button.setAttribute('aria-controls', `tab-${button.dataset.tab}`);
    button.tabIndex = active ? 0 : -1;
    button.classList.toggle('country-tabs__button--active', active);
    button.setAttribute('aria-selected', String(active));
    // Em telas estreitas as abas rolam na horizontal: mantém a ativa visível.
    // Rola só a faixa de abas (scrollIntoView poderia rolar a página).
    if (active) {
      const list = button.parentElement;
      const tab = button.getBoundingClientRect();
      const bounds = list.getBoundingClientRect();
      if (tab.left < bounds.left) list.scrollLeft += tab.left - bounds.left;
      else if (tab.right > bounds.right) list.scrollLeft += tab.right - bounds.right;
    }
  }
  for (const panel of elements.tabPanels) {
    const active = panel.dataset.tabPanel === tabName;
    panel.classList.toggle('country-tab--active', active);
    panel.hidden = !active;
    panel.setAttribute('aria-labelledby', `country-tab-button-${panel.dataset.tabPanel}`);
  }
  if (tabName === 'flights') {
    airportRepository.loadAll().then(() => updateAirportSuggestions(elements.originInput.value)).catch(() => {});
  }
}

function clearMedia() {
  state.mediaObserver?.disconnect();
  state.mediaObserver = null;
  elements.media.replaceChildren();
}

function renderMedia(countryKey, country) {
  clearMedia();
  elements.media.innerHTML = '<div class="media-empty">Carregando mídia…</div>';
  getCountryMedia(countryKey, country).then(media => {
    if (state.countryKey !== countryKey) return;
    if (!media.length) {
      elements.media.innerHTML = '<div class="media-empty">Imagem ainda não disponível para este destino.</div>';
      return;
    }
    elements.media.innerHTML = media.map((item, index) => `
      <figure class="media-card ${index === 0 ? 'media-card--primary' : ''}" aria-busy="true">
        <div class="media-card__visual"><img class="media-card__image" ${index === 0 ? `src="${escapeHtml(item.url)}" loading="eager"` : `data-src="${escapeHtml(item.url)}" loading="lazy"`} alt="${escapeHtml(item.name)} em ${escapeHtml(item.city)}" decoding="async"></div>
        <figcaption class="media-card__city"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.city)}</span><a href="${escapeHtml(item.sourcePage)}" target="_blank" rel="noopener noreferrer" aria-label="Crédito da imagem de ${escapeHtml(item.name)}">${escapeHtml(item.author)} · ${escapeHtml(item.license)}</a></figcaption>
      </figure>
    `).join('');
    const deferred = [...elements.media.querySelectorAll('img[data-src]')];
    if (!deferred.length) return;
    if (!('IntersectionObserver' in window)) {
      for (const image of deferred) image.src = image.dataset.src;
      return;
    }
    state.mediaObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const image = entry.target;
        image.src = image.dataset.src;
        image.removeAttribute('data-src');
        state.mediaObserver?.unobserve(image);
      }
    }, { root: elements.panel.querySelector('.country-panel__content'), rootMargin: '120px 0px' });
    for (const image of deferred) state.mediaObserver.observe(image);
  });
}

function renderBasics(country) {
  const cards = [
    ['Capital', country.capital || '—'],
    ['Moeda', country.currency || '—'],
    ['Idioma', country.lang || '—'],
    ['Fuso', country.timezoneLabel || '—', brasiliaTimezoneNote(country)],
    ['Voltagem', country.voltage || 'Confirmar'],
    ['Código', country.alpha2 || '—']
  ];
  elements.basics.innerHTML = cards.map(([label, value, note]) => `
    <article class="info-card">
      <div class="info-card__value">${escapeHtml(value)}</div>
      ${note ? `<div class="info-card__note">${escapeHtml(note)}</div>` : ''}
      <div class="info-card__label">${escapeHtml(label)}</div>
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
  // Preferência: boletim de fechamento do BCB; a taxa editorial do dataset só
  // aparece se o boletim ainda não carregou ou não tem a moeda.
  const official = localPerBrl(state.fxSnapshot, converter?.targetCode);
  if (!converter || !(official || Number.isFinite(converter.brlExchangeRate))) {
    elements.currencyConverter.innerHTML = '';
    return;
  }
  const rate = official ?? converter.brlExchangeRate;
  const rateLabel = official
    ? provenanceLabel('verified', {
      label: 'Cotação de fechamento (BCB)',
      date: state.fxSnapshot.date,
      detail: 'taxa de venda; não inclui spread, IOF ou tarifas',
      source: state.fxSnapshot.sourceUrl,
      sourceText: 'Ver fonte',
      className: 'currency-converter-card__note'
    })
    : provenanceLabel('verified', {
      label: 'Taxa de referência',
      date: converter.rateAsOf,
      detail: 'não inclui spread, IOF ou tarifas',
      source: converter.source,
      sourceText: 'Ver fonte',
      className: 'currency-converter-card__note'
    });
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
      ${rateLabel}
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

function renderEntry(country) {
  const view = entryPresentation(country);
  const preparation = view.preparation.length
    ? `<ul class="entry-list">${view.preparation.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`).join('')}</ul>`
    : '<div class="detail-card__value">Confirme os documentos exigidos para seu roteiro antes da viagem.</div>';
  const notes = view.notes.length
    ? `<article class="detail-card"><div class="detail-card__label">Atenção</div><ul class="entry-list">${view.notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul></article>`
    : '';
  const verified = /^\d{4}-\d{2}$/.test(view.verifiedAt || '') ? `${view.verifiedAt.slice(5)}/${view.verifiedAt.slice(0, 4)}` : null;
  const sources = view.sources.map(([label, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`).join(' · ');
  elements.entry.innerHTML = `
    <article class="detail-card detail-card--${view.status.tone}">
      <div class="detail-card__label">Status de entrada</div>
      <div class="detail-card__value"><strong class="entry-status__title">${escapeHtml(view.status.title)}</strong><span>${escapeHtml(view.status.detail)}</span></div>
    </article>
    <article class="detail-card"><div class="detail-card__label">Permanência</div><div class="detail-card__value">${escapeHtml(view.stay)}</div></article>
    <article class="detail-card"><div class="detail-card__label">Antes de viajar</div>${preparation}</article>
    ${notes}
    ${verified || sources ? `<p class="entry-source">${verified ? `Verificado em ${escapeHtml(verified)}` : ''}${verified && sources ? ' · ' : ''}${sources}</p>` : ''}
  `;
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

function renderCountryHistory(country) {
  if (Array.isArray(country.history) && country.history.length) {
    elements.historyCopy.innerHTML = country.history.map(item => `
      <article class="history-item">
        <span class="history-item__icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
        <div>
          <h3 class="history-item__title">${escapeHtml(item.title)}</h3>
          <p class="history-item__text">${escapeHtml(item.text)}</p>
        </div>
      </article>
    `).join('');
    return;
  }
  const legacy = typeof country.history === 'string' && country.history.trim()
    ? country.history
    : 'Panorama histórico ainda em curadoria para este país.';
  elements.historyCopy.innerHTML = `<p class="body-copy">${escapeHtml(legacy)}</p>`;
}

function renderChecklist(countryKey, country) {
  const groups = checklistGroups(countryKey, country, Number(elements.monthSelect.value));
  state.visibleChecklistGroups = groups;
  elements.checklistMonthWrap.hidden = !hasSeasonalChecklist(country);
  elements.checklistMonthSelect.value = elements.monthSelect.value;
  elements.checklist.innerHTML = groups.map(group => `
    <section class="checklist__group">
      <h3 class="checklist__title">${escapeHtml(group.group)}</h3>
      ${group.items.map(item => {
        const complete = Boolean(state.checklist[item.key]);
        return `
          <button class="checklist__item ${complete ? 'checklist__item--complete' : ''}" type="button" aria-pressed="${complete}" data-checklist-key="${escapeHtml(item.key)}">
            <span class="checklist__box">${complete ? '✓' : ''}</span>
            <span aria-hidden="true">${escapeHtml(item.icon || '•')}</span>
            <span class="checklist__label">${escapeHtml(item.label)}</span>
          </button>
        `;
      }).join('')}
    </section>
  `).join('');
  updateChecklistProgress();
}

function updateChecklistProgress() {
  const { done, total } = checklistProgress(state.visibleChecklistGroups, state.checklist);
  elements.checklistProgressText.textContent = `${done} de ${total} ${total === 1 ? 'item' : 'itens'} concluídos`;
  elements.checklistProgressMeter.setAttribute('aria-valuenow', String(done));
  elements.checklistProgressMeter.setAttribute('aria-valuemax', String(total));
  elements.checklistProgressFill.style.width = `${total ? (done / total) * 100 : 0}%`;
}

function renderCountry(countryKey) {
  const country = COUNTRIES[countryKey];
  if (!country) return;
  state.countryKey = countryKey;
  state.continent = country.continent;
  const flagUrl = flagImageUrl(country.alpha2);
  elements.countryFlag.classList.toggle('country-panel__flag--nepal', country.alpha2 === 'NP');
  elements.countryFlag.setAttribute('aria-label', `${flagUrl ? 'Bandeira de' : 'Bandeira não disponível para'} ${country.namePt}`);
  elements.countryFlag.innerHTML = flagUrl
    ? `<img src="${flagUrl}" alt="" width="56" height="42" decoding="async">`
    : `<span class="country-panel__flag-fallback">${escapeHtml(country.alpha2 || '🌍')}</span>`;
  elements.countryRegion.textContent = country.region || CONTINENT_LABELS[country.continent];
  elements.countryName.textContent = country.namePt;
  elements.path.textContent = `Mundo › ${country.region || CONTINENT_LABELS[country.continent]} › ${country.namePt}`;
  elements.visitButton.classList.toggle('visit-button--active', state.visited.has(countryKey));
  elements.visitButton.textContent = state.visited.has(countryKey) ? '✓ Visitado' : 'Marcar visitado';

  renderMedia(countryKey, country);
  renderBasics(country);
  renderCurrencyConverter(country);
  renderMonths(country);
  renderEntry(country);
  renderCulture(country);
  renderCountryHistory(country);
  renderChecklist(countryKey, country);
  elements.countryExploreStatus.textContent = '';
  primeDestinationAirport(countryKey);
  elements.routeResult.innerHTML = '';
  elements.routeAirportActions.hidden = true;
  elements.panel.classList.add('country-panel--open');
  elements.panel.removeAttribute('inert');
  switchTab('overview');
  renderContinentState();
}

function selectCountry(countryKey, { recordHistory = true } = {}) {
  const country = COUNTRIES[countryKey];
  if (!country) return;
  closeFlightPreview(false);
  state.discovery?.close();
  if (elements.milesHub.classList.contains('miles-hub--open')) setMilesOpen(false);
  state.map?.selectCountry(countryKey);
  renderCountry(countryKey);
  if (recordHistory) addHistory({ type: 'country', key: countryKey, label: country.namePt });
}

function discoverDestination() {
  closeCountryPanel();
  setMilesOpen(false);
  state.discovery.open();
}

function closeCountryPanel(restoreFocus = false) {
  closeFlightPreview(false);
  elements.panel.classList.remove('country-panel--open');
  elements.panel.setAttribute('inert', '');
  clearMedia();
  state.map?.clearSelection();
  state.countryKey = null;
  state.historyActiveIndex = null;
  renderHistory();
  if (restoreFocus) elements.searchInput.focus({ preventScroll: true });
}

function selectContinent(continent, { recordHistory = true } = {}) {
  closeFlightPreview(false);
  state.discovery?.close();
  state.continent = continent;
  state.countryKey = null;
  elements.panel.classList.remove('country-panel--open');
  elements.panel.setAttribute('inert', '');
  clearMedia();
  state.map?.clearSelection();
  state.map?.setContinent(continent);
  renderContinentState();
  if (recordHistory) addHistory({ type: 'continent', key: continent, label: CONTINENT_LABELS[continent] || continent });
}

function home() {
  closeFlightPreview(false);
  state.discovery?.close();
  state.countryKey = null;
  state.continent = null;
  state.history = [];
  state.historyActiveIndex = null;
  elements.panel.classList.remove('country-panel--open');
  elements.panel.setAttribute('inert', '');
  clearMedia();
  state.map?.home();
  if (state.isVisaFreeBRFilterActive) {
    state.isVisaFreeBRFilterActive = false;
    renderVisaFreeFilter();
  }
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
  button.setAttribute('aria-pressed', String(Boolean(state.checklist[key])));
  button.querySelector('.checklist__box').textContent = state.checklist[key] ? '✓' : '';
  savePersistentState();
  updateChecklistProgress();
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
  const options = MONTHS.map((month, index) => `<option value="${index}">${month}</option>`).join('');
  elements.monthSelect.innerHTML = options;
  elements.checklistMonthSelect.innerHTML = options;
  elements.monthSelect.value = String(new Date().getMonth());
  elements.checklistMonthSelect.value = elements.monthSelect.value;
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

function setMilesOpen(open, restoreFocus = false) {
  if (open) state.discovery?.close();
  if (open && window.innerWidth < 1200 && elements.panel.classList.contains('country-panel--open')) closeCountryPanel();
  elements.milesHub.classList.toggle('miles-hub--open', open);
  elements.milesHub.inert = !open;
  elements.milesLauncher.setAttribute('aria-expanded', String(open));
  if (open) elements.milesClose.focus();
  else if (restoreFocus) elements.milesLauncher.focus();
}

function bindUiEvents() {
  window.matchMedia('(max-width: 1199px)').addEventListener('change', event => {
    if (event.matches && elements.milesHub.classList.contains('miles-hub--open') && elements.panel.classList.contains('country-panel--open')) closeCountryPanel();
  });
  elements.homeButton.addEventListener('click', home);
  elements.themeButton.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  elements.discoverButton.addEventListener('click', discoverDestination);
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
    const index = Number(button.dataset.historyIndex);
    const entry = state.history[index];
    if (!entry) return;
    state.historyActiveIndex = index;
    for (const dot of elements.navigationTrail.querySelectorAll('[data-history-index]')) {
      const active = Number(dot.dataset.historyIndex) === index;
      dot.classList.toggle('navigation-trail__button--active', active);
      if (active) dot.setAttribute('aria-current', 'location');
      else dot.removeAttribute('aria-current');
    }
    if (entry.type === 'country') selectCountry(entry.key, { recordHistory: false });
    else selectContinent(entry.key, { recordHistory: false });
  });

  elements.panelClose.addEventListener('click', () => closeCountryPanel(true));
  elements.visitButton.addEventListener('click', toggleVisited);
  elements.countryExploreButton.addEventListener('click', exploreDestination);
  for (const button of elements.tabButtons) button.addEventListener('click', () => switchTab(button.dataset.tab));
  elements.panel.querySelector('.country-tabs').addEventListener('keydown', event => {
    const current = elements.tabButtons.indexOf(event.target);
    if (current < 0) return;
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % elements.tabButtons.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + elements.tabButtons.length) % elements.tabButtons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = elements.tabButtons.length - 1;
    else return;
    event.preventDefault();
    switchTab(elements.tabButtons[next].dataset.tab);
    elements.tabButtons[next].focus();
  });
  elements.media.addEventListener('error', event => {
    if (event.target.tagName !== 'IMG') return;
    const card = event.target.closest('figure');
    card?.classList.add('media-card--failed');
    card?.setAttribute('aria-busy', 'false');
    event.target.remove();
  }, true);
  elements.media.addEventListener('load', event => {
    if (event.target.tagName !== 'IMG') return;
    const card = event.target.closest('figure');
    card?.classList.add('media-card--loaded');
    card?.setAttribute('aria-busy', 'false');
  }, true);
  elements.countryFlag.addEventListener('error', event => {
    if (event.target.tagName !== 'IMG') return;
    const country = COUNTRIES[state.countryKey];
    elements.countryFlag.setAttribute('aria-label', `Bandeira não disponível para ${country?.namePt || 'este país'}`);
    elements.countryFlag.innerHTML = `<span class="country-panel__flag-fallback">${escapeHtml(country?.alpha2 || '🌍')}</span>`;
  }, true);

  elements.checklist.addEventListener('click', event => {
    const button = event.target.closest('[data-checklist-key]');
    if (button) updateChecklistItem(button);
  });
  elements.checklistComplete.addEventListener('click', () => setAllChecklistItems(true));
  elements.checklistClear.addEventListener('click', () => setAllChecklistItems(false));
  elements.checklistMonthSelect.addEventListener('change', () => {
    elements.monthSelect.value = elements.checklistMonthSelect.value;
    if (state.countryKey) renderChecklist(state.countryKey, COUNTRIES[state.countryKey]);
  });
  elements.monthSelect.addEventListener('change', () => {
    elements.checklistMonthSelect.value = elements.monthSelect.value;
    if (state.countryKey && hasSeasonalChecklist(COUNTRIES[state.countryKey])) renderChecklist(state.countryKey, COUNTRIES[state.countryKey]);
  });

  elements.originInput.addEventListener('input', () => updateAirportSuggestions(elements.originInput.value));
  elements.originInput.addEventListener('input', primeOriginAirport);
  elements.changeOriginButton.addEventListener('click', () => {
    switchTab('flights');
    elements.originInput.focus();
    elements.originInput.select();
  });
  elements.originInput.addEventListener('focus', () => {
    updateAirportSuggestions(elements.originInput.value);
    airportRepository.loadAll().then(() => updateAirportSuggestions(elements.originInput.value)).catch(() => {});
  });
  elements.routeButton.addEventListener('click', calculateRoute);
  elements.flightPreviewButton.addEventListener('click', openFlightPreview);
  elements.flightPreviewClose.addEventListener('click', () => closeFlightPreview(true, true));
  elements.flightPreviewAirports.addEventListener('click', () => openMilesForRoute(elements.flightPreviewAirports.dataset.airportCode));
  elements.routeAirportActions.addEventListener('click', event => {
    const airport = event.target.closest('[data-route-airport]');
    if (airport) openMilesForRoute(airport.dataset.routeAirport);
    else if (event.target.closest('[data-route-redemption]')) openMilesForRoute();
  });

  elements.milesLauncher.addEventListener('click', () => {
    const open = !elements.milesHub.classList.contains('miles-hub--open');
    setMilesOpen(open);
  });
  elements.milesClose.addEventListener('click', () => setMilesOpen(false, true));

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (state.routePreviewActive) {
      closeFlightPreview(true, true);
      return;
    }
    if (state.discovery?.isOpen) {
      state.discovery.close(true);
      return;
    }
    if (elements.milesHub.classList.contains('miles-hub--open')) {
      setMilesOpen(false, true);
    } else if (elements.panel.classList.contains('country-panel--open')) closeCountryPanel(true);
  });
}

async function initializeMap() {
  try {
    const { MapEngine } = await import('./map.engine.js');
    state.map = new MapEngine(elements.globeStage, {
      onHover: showTooltip,
      onSelect: countryKey => selectCountry(countryKey),
      onRouteArrived: () => {
        const countryKey = state.exploreRouteCountryKey;
        if (!countryKey || countryKey !== state.countryKey || !state.routePreviewActive) return;
        state.exploreReturnTimer = setTimeout(() => {
          if (!state.routePreviewActive || state.exploreRouteCountryKey !== countryKey) return;
          closeFlightPreview(true);
          switchTab('overview');
          elements.countryName.focus({ preventScroll: true });
        }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 650 : 1100);
      },
      onProgress: message => { elements.globeStatus.lastElementChild.textContent = message; },
      onReady: () => {
        elements.globeStatus.classList.add('globe__status--hidden');
        updateFlightPreviewAvailability();
      }
    });
    state.map.setVisitedCountries?.(state.visited);
    syncGlobeInset();
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

// O painel do país cobre a lateral direita do globo; o motor desloca a
// projeção para que o país selecionado fique na área ainda visível.
function syncGlobeInset() {
  const open = elements.panel.classList.contains('country-panel--open');
  state.map?.setViewInset?.({ right: open ? elements.panel.getBoundingClientRect().width : 0 });
}

function watchGlobeInset() {
  new MutationObserver(syncGlobeInset).observe(elements.panel, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', syncGlobeInset);
}

function markInterfaceReady() {
  window.__travelingBoot = window.__travelingBoot || {};
  window.__travelingBoot.interactive = true;
  requestAnimationFrame(() => state.splash?.play());
}

function initialize() {
  initializeTheme();
  elements.discoverButton.disabled = discoveryKeys.length === 0;
  elements.discoverButton.title = discoveryKeys.length ? 'Encontrar um destino para sua viagem' : 'Nenhum perfil disponível';
  elements.discoverButton.setAttribute('aria-controls', 'discovery-panel');
  elements.discoverButton.setAttribute('aria-expanded', 'false');
  state.discovery = new DiscoveryUI({
    element: document.getElementById('discovery-panel'), trigger: elements.discoverButton, countries: COUNTRIES,
    onHighlight: match => {
      closeFlightPreview(false);
      state.countryKey = match.countryKey;
      state.continent = COUNTRIES[match.countryKey].continent;
      state.destinationAirport = null;
      state.map?.selectCountry(match.countryKey);
      renderContinentState();
    },
    onExplore: (match, preferences) => {
      elements.monthSelect.value = String(preferences.month);
      elements.checklistMonthSelect.value = String(preferences.month);
      selectCountry(match.countryKey);
      elements.countryName.focus({ preventScroll: true });
    },
    onRoute: (match, button) => openFlightPreview({
      countryKey: match.countryKey, airportCode: match.profile.airport, returnFocus: button,
      isCurrent: () => state.discovery.isOpen && state.discovery.step === 'result'
        && state.discovery.matches[state.discovery.index]?.profile.id === match.profile.id
    }),
    onClose: () => closeFlightPreview(false)
  });
  state.splash = new SplashEngine(elements.splash);
  state.starfield = new StarfieldEngine(elements.starfield);
  renderVisaFreeFilter();
  renderVisitedCount();
  populateMonthSelect();
  state.originAirport = airportRepository.coreAirports.find(airport => airport.iata === 'GRU');
  updateAirportSuggestions();
  bindUiEvents();
  watchGlobeInset();
  state.milesEngine = new MilesEngine({
    tabsElement: elements.milesTabs,
    contentElement: elements.milesContent,
    airportRepository
  });
  state.milesEngine.mount();
  markInterfaceReady();
  fetchExchangeRate();
  loadFxSnapshot().then(snapshot => {
    state.fxSnapshot = snapshot;
    if (state.countryKey) renderCurrencyConverter(COUNTRIES[state.countryKey]);
  }).catch(() => {});
  initializeMap();
  window.addEventListener('pagehide', () => {
    state.map?.destroy();
    state.splash?.destroy();
    state.starfield?.destroy();
    state.milesEngine?.destroy();
    state.discovery?.destroy();
  }, { once: true });
}

initialize();
