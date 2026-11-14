import { AirportRepository } from './airports.repository.js';
import { createCityCard } from './city.card.js';
import { STORAGE_KEYS, readJsonStorage, readStorage, writeJsonStorage, writeStorage } from './core/storage.js';
import { escapeHtml } from './core/html.js';
import {
  CONTINENT_LABELS,
  COUNTRIES,
  searchCountries
} from './countries.dataset.js';
import { getCountryMedia } from './media.service.js';
import { flagImageUrl, isVisaFreeForBrazil } from './country.exploration.js';
import { SplashEngine } from './splash.engine.js';
import { StarfieldEngine } from './starfield.engine.js';
import { brasiliaTimezoneNote } from './timezone.br.js';
import { provenanceLabel } from './provenance.js';
import { loadFxSnapshot, localPerBrl, resolveCurrencyRate } from './fx.service.js';
import { createFlightsTab } from './drawer/flights.tab.js';
import { createRegionsSection } from './drawer/regions.section.js';
import { historyCatalogIfLoaded, loadHistoryCatalog } from './history.loader.js';
import { createTripStore } from './planner/trip.store.js';
import { createTrip } from './planner/trip.model.js';
import { loadCities } from './geo/cities.js';

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
  searchToggle: document.getElementById('search-toggle'),
  tooltip: document.getElementById('country-tooltip'),
  panel: document.getElementById('country-panel'),
  panelClose: document.getElementById('country-panel-close'),
  visitButton: document.getElementById('visit-button'),
  countryFlag: document.getElementById('country-flag'),
  countryRegion: document.getElementById('country-region'),
  countryName: document.getElementById('country-name'),
  countryExploreButton: document.getElementById('country-explore-button'),
  countryPlanButton: document.getElementById('country-plan-button'),
  countryExploreStatus: document.getElementById('country-explore-status'),
  tabButtons: [...document.querySelectorAll('.country-tabs__button')],
  tabPanels: [...document.querySelectorAll('[data-tab-panel]')],
  media: document.getElementById('country-media'),
  basics: document.getElementById('country-basics'),
  regions: document.getElementById('country-regions'),
  currencyConverter: document.getElementById('currency-converter'),
  monthChart: document.getElementById('month-chart'),
  bestTime: document.getElementById('best-time-copy'),
  foods: document.getElementById('food-content'),
  etiquette: document.getElementById('etiquette-content'),
  vibe: document.getElementById('vibe-content'),
  historyCopy: document.getElementById('country-history'),
  flightPreviewPanel: document.getElementById('flight-preview-panel'),
  flightPreviewClose: document.getElementById('flight-preview-close'),
  flightPreviewTitle: document.getElementById('flight-preview-title'),
  flightPreviewCodes: document.getElementById('flight-preview-codes'),
  flightPreviewDetails: document.getElementById('flight-preview-details'),
  flightPreviewAirports: document.getElementById('flight-preview-airports'),
  milesLauncher: document.getElementById('miles-launcher'),
  milesHub: document.getElementById('miles-hub'),
  milesClose: document.getElementById('miles-close-button'),
  tripsLauncher: document.getElementById('trips-launcher'),
  tripsCount: document.getElementById('trips-count'),
  plannerPanel: document.getElementById('planner-panel'),
  plannerContent: document.getElementById('planner-content'),
  plannerClose: document.getElementById('planner-close-button'),
  milesTabs: document.getElementById('miles-tabs'),
  milesContent: document.getElementById('miles-content')
};

const state = {
  countryKey: null,
  continent: null,
  tab: 'overview',
  visited: new Set(readJsonStorage(STORAGE_KEYS.visited, [])),
  isVisaFreeBRFilterActive: false,
  // { rate, date, kind, label, source } de js/fx.service.js, ou null.
  brlPerUsd: null,
  fxSnapshot: null,
  // Cotações PTAX do dia pedidas pelo Planner (código → resultado de fx.service.js).
  liveRates: {},
  map: null,
  splash: null,
  starfield: null,
  milesEngine: null,
  planner: null,
  destinationAirport: null,
  originAirport: null,
  routePreviewActive: false,
  routeObscured: null,
  routeRequestId: 0,
  routeReturnFocus: null,
  exploreRouteCountryKey: null,
  exploreReturnTimer: null,
  discovery: null,
  mediaObserver: null
};

const airportRepository = new AirportRepository();
const tripStore = createTripStore({ countries: COUNTRIES });
const {
  resolveDestinationAirport,
  primeDestinationAirport,
  updateFlightPreviewAvailability,
  closeFlightPreview,
  openFlightPreview,
  exploreDestination,
  openMilesForRoute,
  fetchExchangeRate,
} = createFlightsTab({ elements, state, airportRepository, countries: COUNTRIES, setMilesOpen, ensureMilesEngine });

// Estados e cidades (só países com data/geo/<ISO2>.json).
// "Ver no globo" destaca a mesma cidade da camada de cidades do globo (procurada
// pelo nome dentro do estado); "Planejar" leva essa cidade para o Planner.
async function matchGlobeCity(country, place, division) {
  if (!country?.alpha2) return null;
  const cities = await loadCities(country.alpha2).catch(() => []);
  const same = city => city.name.localeCompare(place.name, 'pt-BR', { sensitivity: 'base' }) === 0;
  return cities.find(city => same(city) && city.region && division?.name
    && city.region.localeCompare(division.name, 'pt-BR', { sensitivity: 'base' }) === 0)
    ?? (cities.filter(same).length === 1 ? cities.find(same) : null);
}

const regionsSection = createRegionsSection({
  root: elements.regions,
  getMap: () => state.map,
  onWorld: () => resetToGlobe(),
  onPlace: async (place, division) => {
    const countryKey = state.countryKey;
    const city = await matchGlobeCity(COUNTRIES[countryKey], place, division);
    if (state.countryKey !== countryKey) return;
    // Sem par no globo, a câmera vai ao ponto do IBGE/GeoNames, sem destaque.
    if (city) state.map?.selectCity(city);
    else state.map?.flyTo(place.lat, place.lng, 1.7);
  },
  onPlan: async (place, division) => {
    const countryKey = state.countryKey;
    const city = await matchGlobeCity(COUNTRIES[countryKey], place, division);
    planTrip(countryKey, { city });
  }
});

function savePersistentState() {
  writeJsonStorage(STORAGE_KEYS.visited, [...state.visited]);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  writeStorage(STORAGE_KEYS.theme, theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#05070c' : '#f4f6f7');
  const isDark = theme === 'dark';
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

// Depois de escolher um país, a busca sai do caminho (e recolhe no celular).
function dismissSearch() {
  elements.searchInput.value = '';
  setSearchOpen(false);
  elements.searchInput.blur();
  document.body.classList.remove('search-open');
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
  if (tabName === 'history') ensureHistoryLoaded();
}

function ensureHistoryLoaded() {
  return loadHistoryCatalog().then(() => {
    if (state.countryKey) renderCountryHistory(state.countryKey, COUNTRIES[state.countryKey]);
  }).catch(() => {
    if (state.countryKey && !historyCatalogIfLoaded()) {
      elements.historyCopy.innerHTML = '<p class="body-copy">Não foi possível carregar o panorama histórico. Verifique a conexão e abra a aba novamente.</p>';
    }
  });
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
  // Só dados que ajudam a decidir a viagem; o fuso, com nota, ocupa a linha toda.
  const cards = [
    ['Capital', country.capital || '—'],
    ['Moeda', country.currency || '—'],
    ['Idioma', country.lang || '—'],
    ['Voltagem', country.voltage || 'Confirmar'],
    ['Fuso', country.timezoneLabel || '—', brasiliaTimezoneNote(country), true]
  ];
  elements.basics.innerHTML = cards.map(([label, value, note, wide]) => `
    <article class="info-card${wide ? ' info-card--wide' : ''}">
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

// A História vem de js/history.loader.js. Até carregar, a aba mostra um aviso;
// o carregamento começa quando a aba abre (ou antes, com o navegador ocioso).
function renderCountryHistory(countryKey, country) {
  const catalog = historyCatalogIfLoaded();
  if (!catalog) {
    elements.historyCopy.innerHTML = '<p class="body-copy">Carregando panorama histórico…</p>';
    if (state.tab === 'history') ensureHistoryLoaded();
    return;
  }
  const history = catalog[countryKey] ?? country.history;
  if (Array.isArray(history) && history.length) {
    elements.historyCopy.innerHTML = history.map(item => `
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
  const legacy = typeof history === 'string' && history.trim()
    ? history
    : 'Panorama histórico ainda em curadoria para este país.';
  elements.historyCopy.innerHTML = `<p class="body-copy">${escapeHtml(legacy)}</p>`;
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
  elements.visitButton.classList.toggle('visit-button--active', state.visited.has(countryKey));
  elements.visitButton.textContent = state.visited.has(countryKey) ? '✓ Visitado' : 'Marcar visitado';

  renderMedia(countryKey, country);
  renderBasics(country);
  regionsSection.show(country);
  renderCurrencyConverter(country);
  renderMonths(country);
  renderCulture(country);
  renderCountryHistory(countryKey, country);
  elements.countryExploreStatus.textContent = '';
  primeDestinationAirport(countryKey);
  elements.panel.classList.add('country-panel--open');
  elements.panel.removeAttribute('inert');
  switchTab('overview');
  renderContinentState();
}

// Cidade clicada no globo: cartão próprio; o painel do país fica como está.
let cityCard = null;
function selectCity(city) {
  if (!city) return;
  cityCard ??= createCityCard({
    root: document.getElementById('city-card'),
    countries: COUNTRIES,
    onShowCountry: countryKey => { state.map?.selectCity(null); selectCountry(countryKey); },
    onPlan: (countryKey, city) => planTrip(countryKey, { city }),
    onZoom: target => state.map?.flyTo(target.lat, target.lng, 1.1, 700),
    onClose: () => state.map?.selectCity(null)
  });
  state.map?.selectCity(city);
  cityCard.show(city);
}

// Fecha o cartão e tira o destaque da cidade no globo. O destaque também pode
// ter vindo de "Ver no globo" (Estados), sem cartão aberto: limpa sempre.
function closeCityCard() {
  state.map?.selectCity(null);
  if (!cityCard?.isOpen) return false;
  cityCard.hide();
  return true;
}

function selectCountry(countryKey) {
  const country = COUNTRIES[countryKey];
  if (!country) return;
  closeCityCard();
  closeFlightPreview(false);
  state.discovery?.close();
  if (elements.milesHub.classList.contains('miles-hub--open')) setMilesOpen(false);
  if (window.innerWidth < 1200 && isPlannerOpen()) setPlannerOpen(false);
  state.map?.selectCountry(countryKey);
  renderCountry(countryKey);
}

function discoverDestination() {
  setPlannerOpen(false);
  closeCountryPanel();
  setMilesOpen(false);
  ensureDiscovery().then(discovery => discovery.open()).catch(() => {});
}

function closeCountryPanel(restoreFocus = false) {
  closeFlightPreview(false);
  regionsSection.clear();
  elements.panel.classList.remove('country-panel--open');
  elements.panel.setAttribute('inert', '');
  clearMedia();
  state.map?.clearSelection();
  state.countryKey = null;
  if (restoreFocus) elements.searchInput.focus({ preventScroll: true });
}

function selectContinent(continent) {
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
}

function home() {
  closeCityCard();
  closeFlightPreview(false);
  state.discovery?.close();
  state.countryKey = null;
  state.continent = null;
  regionsSection.clear();
  elements.panel.classList.remove('country-panel--open');
  elements.panel.setAttribute('inert', '');
  clearMedia();
  state.map?.home();
  if (state.isVisaFreeBRFilterActive) {
    state.isVisaFreeBRFilterActive = false;
    renderVisaFreeFilter();
  }
  renderContinentState();
}

// X do país ou do Planner: volta à tela inicial, com o globo inteiro e nenhum
// painel, cartão ou seleção aberto. Viagens e dados salvos não mudam.
function resetToGlobe() {
  setPlannerOpen(false);
  setMilesOpen(false);
  home();
  elements.homeButton.focus({ preventScroll: true });
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
  if (open) {
    state.discovery?.close();
    setPlannerOpen(false);
    ensureMilesEngine().catch(() => {});
  }
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
  // Celular: a busca fica recolhida num ícone e abre sobre o cabeçalho.
  elements.searchToggle.addEventListener('click', () => {
    document.body.classList.add('search-open');
    elements.searchInput.focus();
  });
  elements.searchInput.addEventListener('blur', () => {
    setTimeout(() => {
      if (!elements.search.contains(document.activeElement)) document.body.classList.remove('search-open');
    }, 120);
  });
  // "/" ou Ctrl/Cmd+K focam a busca de qualquer lugar (exceto ao digitar).
  document.addEventListener('keydown', event => {
    const typing = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
    const shortcut = (event.key === '/' && !typing) || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey));
    if (!shortcut || document.body.classList.contains('route-mode')) return;
    event.preventDefault();
    document.body.classList.add('search-open');
    elements.searchInput.focus();
    elements.searchInput.select();
  });
  elements.searchInput.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setSearchOpen(false);
      elements.searchInput.blur();
    }
    if (event.key === 'Enter') {
      const [first] = searchCountries(elements.searchInput.value, 1);
      if (first) {
        dismissSearch();
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
    dismissSearch();
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

  elements.panelClose.addEventListener('click', resetToGlobe);
  elements.visitButton.addEventListener('click', toggleVisited);
  elements.countryExploreButton.addEventListener('click', exploreDestination);
  elements.countryPlanButton.addEventListener('click', () => planTrip(state.countryKey));
  elements.tripsLauncher.addEventListener('click', () => setPlannerOpen(!isPlannerOpen()));
  elements.plannerClose.addEventListener('click', resetToGlobe);
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

  elements.flightPreviewClose.addEventListener('click', () => closeFlightPreview(true, true));
  elements.flightPreviewAirports.addEventListener('click', () => openMilesForRoute(elements.flightPreviewAirports.dataset.airportCode));

  elements.milesLauncher.addEventListener('click', () => {
    const open = !elements.milesHub.classList.contains('miles-hub--open');
    setMilesOpen(open);
  });
  elements.milesClose.addEventListener('click', () => setMilesOpen(false, true));

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (closeCityCard()) return;
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
    } else if (isPlannerOpen()) {
      setPlannerOpen(false, true);
    } else if (elements.panel.classList.contains('country-panel--open')) closeCountryPanel(true);
  });
}

async function initializeMap() {
  try {
    const { MapEngine } = await import('./map.engine.js');
    state.map = new MapEngine(elements.globeStage, {
      onHover: showTooltip,
      onSelect: countryKey => selectCountry(countryKey),
      onCitySelect: city => selectCity(city),
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
    bindGlobeHelpers();
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

// Botões de zoom e a dica de uso (mostrada uma vez, some no primeiro gesto).
function bindGlobeHelpers() {
  const hint = document.getElementById('globe-hint');
  const dismissHint = () => {
    if (!hint || hint.hidden) return;
    hint.hidden = true;
    writeStorage(STORAGE_KEYS.globeHint, 'seen');
  };
  if (hint && readStorage(STORAGE_KEYS.globeHint) !== 'seen') {
    hint.hidden = false;
    for (const type of ['pointerdown', 'wheel']) elements.globeStage.addEventListener(type, dismissHint, { once: true, passive: true });
  }
  document.getElementById('zoom-in')?.addEventListener('click', () => { dismissHint(); state.map?.zoom(0.55); });
  document.getElementById('zoom-out')?.addEventListener('click', () => { dismissHint(); state.map?.zoom(1.8); });
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

// Cabeçalho em três regiões: as duas laterais recebem a largura da maior
// (marca ou ações), para a busca ficar no centro geométrico da tela.
function watchHeaderLayout() {
  const header = document.querySelector('.app-header');
  const sides = [elements.homeButton, document.querySelector('.app-header__actions')];
  if (!header || !('ResizeObserver' in window)) return;
  const sync = () => {
    const widest = Math.ceil(Math.max(...sides.map(side => side.scrollWidth)));
    header.style.setProperty('--header-side', `${widest}px`);
  };
  const observer = new ResizeObserver(sync);
  for (const side of sides) observer.observe(side);
  sync();
}

function markInterfaceReady() {
  window.__travelingBoot = window.__travelingBoot || {};
  window.__travelingBoot.interactive = true;
  requestAnimationFrame(() => state.splash?.play());
}

// Descoberta sob demanda: perfis e interface (~22 KB) só carregam no primeiro
// clique em "Descobrir destino" (ou com o navegador ocioso).
let discoveryPromise = null;
function ensureDiscovery() {
  discoveryPromise ??= import('./discovery.ui.js').then(({ DiscoveryUI }) => {
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
      onExplore: match => {
        selectCountry(match.countryKey);
        elements.countryName.focus({ preventScroll: true });
      },
      onRoute: (match, button) => openFlightPreview({
        countryKey: match.countryKey, airportCode: match.profile.airport, returnFocus: button,
        isCurrent: () => state.discovery.isOpen && state.discovery.step === 'result'
          && state.discovery.matches[state.discovery.index]?.profile.id === match.profile.id
      }),
      resolveAirport: code => airportRepository.resolve(code),
      onCity: city => state.map?.selectCity(city),
      onPlan: (match, preferences) => planTrip(match.countryKey, {
        profileId: match.profile.id,
        city: preferences.city ?? null,
        budgetBRL: Number.isFinite(preferences.budgetCeiling) ? preferences.budgetCeiling : null
      }),
      onClose: () => closeFlightPreview(false)
    });
    return state.discovery;
  }).catch(error => {
    discoveryPromise = null;
    throw error;
  });
  return discoveryPromise;
}

// Hub de Milhas sob demanda (~18 KB e ~775 elementos de DOM). Até carregar,
// um substituto guarda o contexto de rota e repassa as chamadas.
let milesEnginePromise = null;
let pendingMilesRoute = null;
const milesPlaceholder = Object.freeze({
  setRouteContext(origin, destination) { pendingMilesRoute = [origin, destination]; },
  hasAirportGuide: () => false,
  showAirport(code, tab) { ensureMilesEngine().then(engine => engine.showAirport(code, tab)).catch(() => {}); },
  selectTab(key, focus) { ensureMilesEngine().then(engine => engine.selectTab(key, focus)).catch(() => {}); },
  destroy() {}
});

function ensureMilesEngine() {
  milesEnginePromise ??= import('./miles.engine.js').then(({ MilesEngine }) => {
    const engine = new MilesEngine({
      tabsElement: elements.milesTabs,
      contentElement: elements.milesContent,
      airportRepository
    });
    engine.mount();
    if (pendingMilesRoute) engine.setRouteContext(...pendingMilesRoute);
    state.milesEngine = engine;
    return engine;
  }).catch(error => {
    milesEnginePromise = null;
    throw error;
  });
  return milesEnginePromise;
}

// Planejador (Planner v0). O armazenamento é carregado na abertura do app
// (para o contador do botão); a interface só quando o painel abre.
let plannerPromise = null;
// Cotações do Planner: boletim de fechamento + PTAX do dia (dólar e as moedas
// pedidas pelas viagens). Ao chegar uma cotação, o Planner recalcula o orçamento.
const plannerRateRequests = new Map();
function ensurePlannerRate(code) {
  if (!/^[A-Z]{3}$/.test(code ?? '') || code === 'BRL' || code === 'USD' || plannerRateRequests.has(code)) return;
  plannerRateRequests.set(code, resolveCurrencyRate(code).then(rate => {
    if (rate) state.liveRates[code] = rate;
    else plannerRateRequests.delete(code);
    state.planner?.refresh();
  }).catch(() => plannerRateRequests.delete(code)));
}

function ensurePlanner() {
  plannerPromise ??= Promise.all([
    import('./planner/planner.ui.js'),
    import('./planner/flight.section.js'),
    import('./planner/prep.section.js'),
    import('./planner/currency.js')
  ]).then(([{ PlannerUI }, { createFlightSections }, { createPrepSection }, { rateTable }]) => {
    const getRates = () => rateTable({ snapshot: state.fxSnapshot, live: { ...state.liveRates, ...(state.brlPerUsd ? { USD: state.brlPerUsd } : {}) } });
    state.planner = new PlannerUI({
      getRates,
      ensureRate: ensurePlannerRate,
      element: elements.plannerContent,
      store: tripStore,
      countries: COUNTRIES,
      searchCountries,
      onShowCountry: countryKey => showCountryFromPlanner(countryKey),
      onDiscover: discoverDestination,
      // Países salvos na antiga lista "Quero ir" viram sugestões de destino.
      getIdeas: () => readJsonStorage(STORAGE_KEYS.wishlist, []).filter(key => COUNTRIES[key]),
      // Começa na etapa 1: depois do país, a pessoa escolhe a cidade.
      createTrip: (countryKey, extra = {}) => createTrip({ countryKey, step: 1, ...extra }),
      sections: [
        ...createFlightSections({
          airportRepository, resolveDestinationAirport, getFx: () => state.brlPerUsd, getRates, countries: COUNTRIES,
          resolveCityAirport: (lat, lng) => airportRepository.findGateway(lat, lng)
        }),
        createPrepSection({ countries: COUNTRIES })
      ]
    });
    return state.planner;
  }).catch(error => {
    plannerPromise = null;
    throw error;
  });
  return plannerPromise;
}

// Do planejador para o guia do país. Em telas menores os dois painéis não
// cabem juntos, então o planejador fecha.
function showCountryFromPlanner(countryKey) {
  if (window.innerWidth < 1200) setPlannerOpen(false);
  selectCountry(countryKey);
}

function isPlannerOpen() {
  return elements.plannerPanel.classList.contains('miles-hub--open');
}

function setPlannerOpen(open, restoreFocus = false) {
  if (open === isPlannerOpen()) return;
  if (open) {
    state.discovery?.close();
    setMilesOpen(false);
    if (window.innerWidth < 1200 && elements.panel.classList.contains('country-panel--open')) closeCountryPanel();
  }
  elements.plannerPanel.classList.toggle('miles-hub--open', open);
  elements.plannerPanel.inert = !open;
  elements.tripsLauncher.setAttribute('aria-expanded', String(open));
  if (!open) state.planner?.dismissTransient();
  if (open) {
    elements.plannerClose.focus();
    ensurePlanner().then(planner => planner.render()).catch(() => {
      elements.plannerContent.innerHTML = '<p class="planner-empty">Não foi possível abrir o planejamento. Verifique a conexão e tente de novo.</p>';
    });
  } else if (restoreFocus) elements.tripsLauncher.focus();
}

// "Planejar viagem": abre o Planner com o destino (e a cidade, se houver)
// preenchidos. Nada é criado até a pessoa confirmar na tela do Planner; se já
// houver viagem para o país, ela aparece ali como opção.
function planTrip(countryKey, prefill = {}) {
  if (!countryKey || !COUNTRIES[countryKey]) return;
  const city = prefill.city ? { id: prefill.city.id, name: prefill.city.name, lat: prefill.city.lat, lng: prefill.city.lng, region: prefill.city.region } : null;
  ensurePlanner().then(planner => {
    planner.startDraft(countryKey, { city, profileId: prefill.profileId ?? null, budgetBRL: prefill.budgetBRL ?? null });
    if (isPlannerOpen()) planner.render();
    else setPlannerOpen(true);
    elements.plannerContent.querySelector('#wizard-title')?.focus({ preventScroll: true });
  }).catch(() => setPlannerOpen(true));
}

function renderTripsCount() {
  const count = tripStore.trips.length;
  elements.tripsCount.hidden = count === 0;
  elements.tripsCount.textContent = String(count);
  elements.tripsLauncher.setAttribute('aria-label', count ? `Viagens (${count} ${count === 1 ? 'salva' : 'salvas'})` : 'Viagens');
}

// Depois que a interface está pronta e o navegador fica ocioso, baixa (sem
// executar a interface) os módulos sob demanda, para abrirem sem espera.
function prefetchDeferredModules() {
  const run = () => {
    loadHistoryCatalog().catch(() => {});
    import('./miles.engine.js').catch(() => {});
    import('./discovery.ui.js').catch(() => {});
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 6000 });
  else window.setTimeout(run, 4000);
}

function initialize() {
  initializeTheme();
  elements.discoverButton.title = 'Encontrar um destino para sua viagem';
  elements.discoverButton.setAttribute('aria-controls', 'discovery-panel');
  elements.discoverButton.setAttribute('aria-expanded', 'false');
  state.splash = new SplashEngine(elements.splash);
  state.starfield = new StarfieldEngine(elements.starfield);
  renderVisaFreeFilter();
  renderVisitedCount();
  state.originAirport = airportRepository.coreAirports.find(airport => airport.iata === 'GRU');
  bindUiEvents();
  watchGlobeInset();
  watchHeaderLayout();
  state.milesEngine = milesPlaceholder;
  renderTripsCount();
  tripStore.subscribe(renderTripsCount);
  markInterfaceReady();
  prefetchDeferredModules();
  fetchExchangeRate().then(() => state.planner?.refresh()).catch(() => {});
  loadFxSnapshot().then(snapshot => {
    state.fxSnapshot = snapshot;
    if (state.countryKey) renderCurrencyConverter(COUNTRIES[state.countryKey]);
    state.planner?.refresh();
  }).catch(() => {});
  initializeMap();
  window.addEventListener('pagehide', () => {
    state.map?.destroy();
    state.splash?.destroy();
    state.starfield?.destroy();
    state.milesEngine?.destroy();
    state.discovery?.destroy();
    state.planner?.destroy();
  }, { once: true });
}

initialize();
