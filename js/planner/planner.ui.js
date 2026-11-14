// Planner: planejamento de viagem em seis etapas (destino, datas, voo,
// orçamento, preparação e resumo). Carregado sob demanda pelo app. Tudo é
// salvo no navegador pelo trip.store; nenhum dado sai do aparelho.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { parseBrazilianNumber } from '../miles.tools.js';
import { flagImageUrl } from '../country.exploration.js';
import {
  BUDGET_CATEGORIES, LINE_STATUSES, MAX_LINES, MAX_TRAVELERS, PLANNER_STEPS,
  addLine, removeLine, tripDays, tripMonth, tripProgress, tripTotals, updateLine, updateTrip
} from './trip.model.js';

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const CABIN_LABELS = { economy: 'Econômica', premium: 'Premium Economy', business: 'Executiva' };
const CATEGORY_LABELS = Object.fromEntries(BUDGET_CATEGORIES.map(category => [category.id, category.label]));
const QUICK_CATEGORIES = ['lodging', 'food', 'transport', 'activities', 'insurance'];

const STEP_LEADS = {
  destination: 'Escolha o país da viagem. Você pode trocar depois.',
  dates: 'Datas, número de viajantes e o aeroporto de saída. Eles alimentam as estimativas das próximas etapas.',
  flight: 'Estime a passagem, registre o preço que você encontrar e veja se compensa usar milhas.',
  budget: 'Defina um teto e some hospedagem, alimentação, passeios e o resto.',
  prep: 'Documentos, regras de entrada e o checklist do destino.',
  summary: 'Tudo o que você planejou, num só lugar.'
};

export function formatBRL(value, { cents = false } = {}) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(value ?? 0);
}

// Valor digitado ("1.234,56", "1234.5", "R$ 800") → número, ou null.
export function parseMoneyInput(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return parseBrazilianNumber(raw);
}

// Valor guardado → texto do campo no formato brasileiro ("25.760", "7.200,5").
const MONEY_INPUT = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
function moneyInputValue(value) {
  return value === null || value === undefined ? '' : MONEY_INPUT.format(value);
}

// "2027-04-02" → "2 abr 2027".
function shortDate(iso, { year = true } = {}) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}${year ? ` ${y}` : ''}`;
}

function dateRange(trip) {
  if (!trip.startDate) return 'Datas a definir';
  if (!trip.endDate) return `A partir de ${shortDate(trip.startDate)}`;
  const sameYear = trip.startDate.slice(0, 4) === trip.endDate.slice(0, 4);
  return `${shortDate(trip.startDate, { year: !sameYear })} – ${shortDate(trip.endDate)}`;
}

function people(count) {
  return `${count} ${count === 1 ? 'viajante' : 'viajantes'}`;
}

export class PlannerUI {
  /**
   * @param {object} options
   * @param {HTMLElement} options.element   Contêiner do conteúdo do painel.
   * @param {object} options.store          createTripStore().
   * @param {object} options.countries      COUNTRIES.
   * @param {(query: string, limit?: number) => string[]} options.searchCountries
   * @param {(countryKey: string, tab?: string) => void} options.onShowCountry
   * @param {() => void} [options.onDiscover]   Abre "Descobrir destino".
   * @param {() => string[]} [options.getIdeas] Países salvos para sugerir no destino.
   * @param {(countryKey: string) => object} options.createTrip
   * @param {object[]} [options.sections]   Seções por etapa: { id, step, render(trip, ui), bind?, refresh? }.
   */
  constructor({ element, store, countries, searchCountries, onShowCountry, onDiscover, getIdeas = () => [], createTrip, sections = [] }) {
    Object.assign(this, { element, store, countries, searchCountries, onShowCountry, onDiscover, getIdeas, createTrip, sections });
    this.view = store.trips.length ? 'trip' : 'home';
    this.flash = '';
    this.confirmingDelete = false;
    this.changingDestination = false;
    this.linesOptions = null;
    this.ideaRanges = null;
    this.handleChange = event => this.#change(event);
    this.handleClick = event => this.#click(event);
    this.handleInput = event => this.#input(event);
    this.handleKeydown = event => this.#keydown(event);
    element.addEventListener('change', this.handleChange);
    element.addEventListener('click', this.handleClick);
    element.addEventListener('input', this.handleInput);
    element.addEventListener('keydown', this.handleKeydown);
    this.unsubscribe = store.subscribe(() => this.#refreshLive());
  }

  get trip() {
    return this.store.active();
  }

  get step() {
    return this.trip?.step ?? 1;
  }

  // ---------- API usada pelo app e pelas seções ----------

  render() {
    this.confirmingDelete = false;
    const trip = this.trip;
    if (this.view === 'trip' && !trip) this.view = 'home';
    if (this.view === 'new') this.element.innerHTML = this.#newTripView();
    else if (this.view === 'trip') this.element.innerHTML = this.#wizard(trip);
    else this.element.innerHTML = this.store.trips.length ? this.#homeList() : this.#welcome();
    if (this.view === 'trip') for (const section of this.#stepSections()) section.bind?.(this.element, trip, this);
    if (this.view === 'new' || (this.view === 'trip' && this.step === 1)) this.#loadIdeaRanges();
  }

  // Abre uma viagem (opcionalmente numa etapa) no passo a passo.
  openTrip(id, { step = null } = {}) {
    this.store.setActive(id);
    if (step) this.store.save(updateTrip(this.trip, { step }));
    this.view = 'trip';
    this.flash = '';
    this.changingDestination = false;
  }

  refresh() {
    this.#refreshLive();
  }

  destroy() {
    this.element.removeEventListener('change', this.handleChange);
    this.element.removeEventListener('click', this.handleClick);
    this.element.removeEventListener('input', this.handleInput);
    this.element.removeEventListener('keydown', this.handleKeydown);
    this.unsubscribe?.();
  }

  update(changes) {
    const trip = this.trip;
    return trip ? this.store.save(updateTrip(trip, changes)) : null;
  }

  addLine(line) {
    const trip = this.trip;
    return trip ? this.store.save(addLine(trip, line)) : null;
  }

  /**
   * Lista editável de gastos de uma etapa.
   * @param {object} options { categories?: string[], exclude?: string[], title, empty, addLabel, addCategory, quick? }
   */
  linesBlock(trip, options) {
    this.linesOptions = options;
    const quick = options.quick
      ? `<div class="planner-chips" role="group" aria-label="Adicionar gasto">
          ${QUICK_CATEGORIES.map(id => `<button class="planner-chip" type="button" data-planner-action="add-line" data-category="${id}">＋ ${escapeHtml(CATEGORY_LABELS[id])}</button>`).join('')}
          <button class="planner-chip" type="button" data-planner-action="add-line" data-category="other">＋ Outro</button>
        </div>`
      : `<button class="planner-text-action" type="button" data-planner-action="add-line" data-category="${escapeHtml(options.addCategory)}">＋ ${escapeHtml(options.addLabel)}</button>`;
    return `
      <div class="planner-block">
        <div class="planner-block__head">
          <h4 class="planner-block-title">${escapeHtml(options.title)}</h4>
          <span class="planner-block__meta" data-live="lines-total"></span>
        </div>
        <div class="planner-lines" id="planner-lines">${this.#lines(trip)}</div>
        ${quick}
      </div>`;
  }

  // ---------- Telas ----------

  #welcome() {
    return `
      <div class="planner-welcome">
        <h3 class="planner-welcome__title">Planeje sua próxima viagem</h3>
        <p class="planner-welcome__lead">Em seis etapas curtas, do destino ao resumo final. Tudo fica salvo neste navegador.</p>
        <ol class="planner-welcome__steps">
          ${PLANNER_STEPS.map((step, index) => `<li><span>${index + 1}</span><div><strong>${escapeHtml(step.label)}</strong></div></li>`).join('')}
        </ol>
        <button class="primary-button planner-welcome__cta" type="button" data-planner-action="new">Começar a planejar</button>
      </div>`;
  }

  #homeList() {
    const cards = this.store.trips.map(trip => {
      const country = this.countries[trip.countryKey];
      const progress = tripProgress(trip);
      const totals = tripTotals(trip);
      return `
        <li>
          <button class="planner-trip-card" type="button" data-planner-open="${escapeHtml(trip.id)}">
            ${this.#flag(country, 'planner-trip-card__flag')}
            <span class="planner-trip-card__body">
              <strong>${escapeHtml(country?.namePt || trip.countryKey)}</strong>
              <small>${escapeHtml(dateRange(trip))} · ${escapeHtml(people(trip.travelers))}</small>
              <span class="planner-progress" aria-hidden="true"><span style="width:${(progress.completed / progress.total * 100).toFixed(0)}%"></span></span>
            </span>
            <span class="planner-trip-card__side">
              <strong>${totals.total ? formatBRL(totals.total) : '—'}</strong>
              <small>${progress.next ? `Etapa ${progress.next}: ${escapeHtml(PLANNER_STEPS[progress.next - 1].label)}` : 'Pronta ✓'}</small>
            </span>
          </button>
        </li>`;
    }).join('');
    return `
      <div class="planner-home">
        <div class="planner-home__head">
          <h3 class="planner-home__title">Suas viagens</h3>
          <button class="primary-button" type="button" data-planner-action="new">＋ Nova viagem</button>
        </div>
        <ul class="planner-trip-list">${cards}</ul>
        ${this.#savedNote()}
      </div>`;
  }

  #newTripView() {
    return `
      <div class="wizard">
        ${this.store.trips.length ? '<button class="planner-back" type="button" data-planner-action="home">← Suas viagens</button>' : ''}
        ${this.#stepper(null, 1)}
        <section class="wizard__step" aria-labelledby="wizard-title">
          <span class="eyebrow">Etapa 1 de ${PLANNER_STEPS.length}</span>
          <h3 class="wizard__title" id="wizard-title" tabindex="-1">${escapeHtml(PLANNER_STEPS[0].title)}</h3>
          <p class="wizard__lead">${escapeHtml(STEP_LEADS.destination)}</p>
          ${this.#destinationPicker()}
        </section>
      </div>`;
  }

  #wizard(trip) {
    const country = this.countries[trip.countryKey];
    const index = this.step - 1;
    const step = PLANNER_STEPS[index];
    const next = PLANNER_STEPS[index + 1];
    return `
      <div class="wizard">
        <button class="planner-back" type="button" data-planner-action="home">← Suas viagens</button>
        <div class="wizard__trip">
          ${this.#flag(country, 'wizard__flag')}
          <div>
            <strong class="wizard__trip-name">${escapeHtml(country?.namePt || trip.countryKey)}</strong>
            <small class="wizard__trip-meta" data-live="trip-meta">${this.#tripMeta(trip)}</small>
          </div>
        </div>
        <div data-live="stepper">${this.#stepper(trip, this.step)}</div>
        <section class="wizard__step" aria-labelledby="wizard-title">
          <span class="eyebrow">Etapa ${this.step} de ${PLANNER_STEPS.length}</span>
          <h3 class="wizard__title" id="wizard-title" tabindex="-1">${escapeHtml(step.id === 'summary' ? `${country?.namePt || 'Sua viagem'}` : step.title)}</h3>
          <p class="wizard__lead">${escapeHtml(STEP_LEADS[step.id])}</p>
          ${this.#stepBody(trip, step.id)}
        </section>
        <footer class="wizard__nav">
          ${this.step > 1 ? '<button class="secondary-button" type="button" data-planner-action="prev">Voltar</button>' : '<span></span>'}
          ${next
            ? `<button class="primary-button" type="button" data-planner-action="next">Continuar <span class="wizard__nav-next">· ${escapeHtml(next.label)}</span></button>`
            : '<button class="primary-button" type="button" data-planner-action="home">Concluir</button>'}
        </footer>
      </div>`;
  }

  #tripMeta(trip) {
    const days = tripDays(trip);
    return `${escapeHtml(dateRange(trip))}${days ? ` · ${days} ${days === 1 ? 'dia' : 'dias'}` : ''} · ${escapeHtml(people(trip.travelers))}`;
  }

  #stepper(trip, current) {
    const done = trip ? tripProgress(trip).done : PLANNER_STEPS.map(() => false);
    return `
      <ol class="stepper" aria-label="Etapas do planejamento">
        ${PLANNER_STEPS.map((step, index) => {
          const number = index + 1;
          const state = number === current ? 'current' : done[index] ? 'done' : 'todo';
          return `<li class="stepper__item stepper__item--${state}">
            <button type="button" class="stepper__button" data-planner-step="${number}" ${trip ? '' : 'disabled'} ${number === current ? 'aria-current="step"' : ''} aria-label="Etapa ${number}: ${escapeHtml(step.label)}${done[index] ? ' (concluída)' : ''}">
              <span class="stepper__dot">${done[index] && number !== current ? '✓' : number}</span>
              <span class="stepper__label">${escapeHtml(step.label)}</span>
            </button>
          </li>`;
        }).join('')}
      </ol>`;
  }

  #stepSections() {
    return this.sections.filter(section => section.step === this.step);
  }

  #stepBody(trip, stepId) {
    const sections = this.#stepSections().map(section => section.render(trip, this)).join('');
    if (stepId === 'destination') return this.#destinationStep(trip);
    if (stepId === 'dates') return this.#datesStep(trip);
    if (stepId === 'flight') return sections;
    if (stepId === 'budget') return this.#budgetStep(trip, sections);
    if (stepId === 'prep') return sections;
    return this.#summaryStep(trip);
  }

  // ---------- Etapa 1: destino ----------

  #destinationStep(trip) {
    const country = this.countries[trip.countryKey];
    if (this.changingDestination) {
      return `${this.#destinationPicker()}
        <button class="planner-text-action" type="button" data-planner-action="cancel-change">Manter ${escapeHtml(country?.namePt || '')}</button>`;
    }
    return `
      <div class="planner-destination-card">
        ${this.#flag(country, 'planner-destination-card__flag')}
        <div class="planner-destination-card__body">
          <span class="eyebrow">${escapeHtml(country?.region || 'Destino')}</span>
          <strong class="planner-destination-card__name">${escapeHtml(country?.namePt || trip.countryKey)}</strong>
          ${country?.capital ? `<small>Capital: ${escapeHtml(country.capital)}</small>` : ''}
        </div>
      </div>
      <div class="planner-actions">
        <button class="secondary-button" type="button" data-planner-action="show-country">Ver guia do país</button>
        <button class="secondary-button" type="button" data-planner-action="change-destination">Trocar destino</button>
      </div>`;
  }

  #destinationPicker() {
    return `
      <div class="planner-picker">
        <label class="sr-only" for="planner-destination-search">Buscar país</label>
        <input class="form-field__control planner-picker__input" id="planner-destination-search" type="search" placeholder="Buscar país, por exemplo Portugal" autocomplete="off" spellcheck="false" data-planner-search>
        <ul class="planner-picker__results" id="planner-destination-results" role="listbox" aria-label="Países encontrados"></ul>
      </div>
      <div data-live="ideas">${this.#ideas()}</div>
      ${this.onDiscover ? `
        <div class="planner-card planner-card--quiet planner-row">
          <div class="planner-row__grow"><strong class="planner-card__title">Ainda não sabe para onde?</strong>
            <p class="planner-hint">Responda três perguntas e receba sugestões de destino.</p></div>
          <button class="secondary-button" type="button" data-planner-action="discover">Descobrir destino</button>
        </div>` : ''}`;
  }

  #ideas() {
    const taken = new Set(this.store.trips.map(trip => trip.countryKey));
    const ideas = this.getIdeas().filter(key => this.countries[key] && !taken.has(key));
    if (!ideas.length) return '';
    return `
      <h4 class="planner-block-title">Da sua lista de desejos</h4>
      <div class="planner-ideas">
        ${ideas.map(key => {
          const country = this.countries[key];
          const range = this.ideaRanges?.get(key);
          return `<button class="planner-idea" type="button" data-planner-pick="${escapeHtml(key)}">
            ${this.#flag(country, 'planner-idea__flag')}
            <span><strong>${escapeHtml(country.namePt)}</strong><small>${range ? `${formatBRL(range.min)}–${formatBRL(range.max)} por pessoa` : escapeHtml(country.region || '')}</small></span>
          </button>`;
        }).join('')}
      </div>`;
  }

  // Faixas de custo das ideias (perfis revisados), carregadas sob demanda.
  #loadIdeaRanges() {
    if (this.ideaRanges || !this.getIdeas().length) return;
    import('./ideas.js').then(({ ideaEstimates }) => {
      const estimate = ideaEstimates(this.getIdeas());
      this.ideaRanges = new Map(estimate.items.filter(item => item.range).map(item => [item.countryKey, item.range]));
      const slot = this.element.querySelector('[data-live="ideas"]');
      if (slot) slot.innerHTML = this.#ideas();
    }).catch(() => { this.ideaRanges = new Map(); });
  }

  #renderSearch(query) {
    const list = this.element.querySelector('#planner-destination-results');
    if (!list) return;
    const keys = query.trim().length >= 2 ? this.searchCountries(query, 6) : [];
    list.innerHTML = keys.map(key => {
      const country = this.countries[key];
      return `<li><button class="planner-picker__option" type="button" role="option" data-planner-pick="${escapeHtml(key)}">
        ${this.#flag(country, 'planner-picker__flag')}<span>${escapeHtml(country.namePt)}</span><small>${escapeHtml(country.region || '')}</small>
      </button></li>`;
    }).join('') || (query.trim().length >= 2 ? '<li class="planner-picker__empty">Nenhum país encontrado.</li>' : '');
  }

  #pickDestination(countryKey) {
    if (!this.countries[countryKey]) return;
    const current = this.view === 'trip' ? this.trip : null;
    if (current && this.changingDestination) {
      // Troca de destino: sugestões do Traveling e a conferência de entrada valiam para o país antigo.
      const lines = current.lines.filter(line => line.source?.kind !== 'traveling-estimate');
      this.store.save(updateTrip(current, { countryKey, lines, entryReviewed: false, profileId: null, step: 2 }));
    } else {
      const existing = this.store.findByCountry(countryKey);
      if (existing) this.store.setActive(existing.id);
      else this.store.save(this.createTrip(countryKey));
    }
    this.view = 'trip';
    this.changingDestination = false;
    this.flash = '';
    this.render();
    this.#focusTitle();
  }

  // ---------- Etapa 2: datas e viajantes ----------

  #datesStep(trip) {
    const country = this.countries[trip.countryKey];
    return `
      <div class="form-grid">
        <label class="form-field" for="planner-start"><span class="form-field__label">Ida</span>
          <input class="form-field__control" id="planner-start" type="date" value="${escapeHtml(trip.startDate || '')}" data-planner-field="startDate"></label>
        <label class="form-field" for="planner-end"><span class="form-field__label">Volta</span>
          <input class="form-field__control" id="planner-end" type="date" value="${escapeHtml(trip.endDate || '')}" min="${escapeHtml(trip.startDate || '')}" data-planner-field="endDate"></label>
        <div class="form-field"><span class="form-field__label" id="planner-travelers-label">Viajantes</span>
          <div class="planner-counter" role="group" aria-labelledby="planner-travelers-label">
            <button class="icon-button" type="button" data-planner-action="travelers-dec" aria-label="Menos um viajante" ${trip.travelers <= 1 ? 'disabled' : ''}>−</button>
            <output data-live="travelers" aria-live="polite">${trip.travelers}</output>
            <button class="icon-button" type="button" data-planner-action="travelers-inc" aria-label="Mais um viajante" ${trip.travelers >= MAX_TRAVELERS ? 'disabled' : ''}>＋</button>
          </div></div>
        <label class="form-field" for="planner-origin"><span class="form-field__label">Saindo de (aeroporto)</span>
          <input class="form-field__control" id="planner-origin" type="text" maxlength="4" autocomplete="off" placeholder="GRU" value="${escapeHtml(trip.origin)}" data-planner-field="origin"></label>
      </div>
      <p class="planner-hint" data-live="days">${this.#daysHint(trip)}</p>
      <div class="planner-card">
        <div class="planner-block__head">
          <h4 class="planner-block-title">Melhor época em ${escapeHtml(country?.namePt || 'destino')}</h4>
          <span class="planner-legend"><i class="planner-legend__great"></i>Ótima <i class="planner-legend__good"></i>Boa</span>
        </div>
        <div data-live="months">${this.#monthStrip(trip)}</div>
        <p class="planner-hint">${escapeHtml(country?.bestTime || 'Consulte clima e sazonalidade antes de reservar.')}</p>
      </div>`;
  }

  #daysHint(trip) {
    const days = tripDays(trip);
    if (!trip.startDate || !trip.endDate) return 'Defina ida e volta para calcular a duração e os gastos no destino.';
    const month = MONTH_NAMES[tripMonth(trip)];
    const score = this.countries[trip.countryKey]?.months?.[tripMonth(trip)];
    const season = score === 2 ? ' É uma das melhores épocas para ir.' : score === 0 ? ' Atenção: não é considerada boa época para este destino.' : '';
    return `<strong>${days} ${days === 1 ? 'dia' : 'dias'}</strong> de viagem, com ida em ${month}.${season}`;
  }

  #monthStrip(trip) {
    const values = this.countries[trip.countryKey]?.months?.length === 12 ? this.countries[trip.countryKey].months : Array(12).fill(1);
    const selected = tripMonth(trip);
    return `<div class="planner-months">${values.map((score, index) => `
      <span class="planner-months__month ${index === selected ? 'planner-months__month--selected' : ''}" title="${MONTH_NAMES[index]}">
        <i class="planner-months__bar planner-months__bar--${score === 2 ? 'great' : score === 1 ? 'good' : 'low'}"></i>${MONTH_SHORT[index][0].toUpperCase()}
      </span>`).join('')}</div>`;
  }

  // ---------- Etapa 4: orçamento ----------

  #budgetStep(trip, sections) {
    return `
      <div class="planner-row planner-budget-input">
        <label class="form-field planner-row__grow" for="planner-budget"><span class="form-field__label">Quanto você quer gastar no total? (opcional)</span>
          <input class="form-field__control" id="planner-budget" type="text" inputmode="decimal" autocomplete="off" placeholder="Ex.: 25.000" value="${escapeHtml(moneyInputValue(trip.budgetBRL))}" data-planner-field="budgetBRL"></label>
      </div>
      <div class="planner-summary" data-live="summary">${this.#summary(trip)}</div>
      ${sections}
      ${this.linesBlock(trip, { exclude: ['flights'], title: 'Gastos da viagem', empty: 'Nenhum gasto ainda. Use os atalhos abaixo.', quick: true })}
      <p class="planner-hint"><strong>Cotação</strong>: preço que você encontrou · <strong>Pago</strong>: já pago · Passagens ficam na etapa Voo.</p>`;
  }

  #summary(trip) {
    const totals = tripTotals(trip);
    const ratio = totals.budget ? Math.min(1, totals.total / totals.budget) : 0;
    return `
      <div class="planner-summary__grid">
        <div><span class="planner-summary__label">Planejado</span><strong class="planner-summary__value">${formatBRL(totals.total)}</strong></div>
        <div><span class="planner-summary__label">Por pessoa</span><strong class="planner-summary__value">${formatBRL(totals.perPerson)}</strong></div>
        <div><span class="planner-summary__label">${totals.budget === null ? 'Orçamento' : totals.overBudget ? 'Acima do teto' : 'Disponível'}</span>
          <strong class="planner-summary__value ${totals.overBudget ? 'planner-summary__value--over' : ''}">${totals.budget === null ? '—' : formatBRL(Math.abs(totals.remaining))}</strong></div>
        <div><span class="planner-summary__label">Já pago</span><strong class="planner-summary__value">${formatBRL(totals.byStatus.paid)}</strong></div>
      </div>
      ${totals.budget !== null ? `
        <div class="planner-meter ${totals.overBudget ? 'planner-meter--over' : ''}" role="meter" aria-label="Uso do orçamento" aria-valuemin="0" aria-valuemax="${totals.budget}" aria-valuenow="${Math.min(totals.total, totals.budget)}">
          <span style="width:${(ratio * 100).toFixed(1)}%"></span>
        </div>` : ''}
      ${provenanceLabel('calculated', { detail: 'soma dos gastos desta viagem' })}`;
  }

  // ---------- Etapa 6: resumo ----------

  #summaryStep(trip) {
    const country = this.countries[trip.countryKey];
    const totals = tripTotals(trip);
    const progress = tripProgress(trip);
    const days = tripDays(trip);
    const categories = BUDGET_CATEGORIES.filter(category => totals.byCategory[category.id] > 0);
    const max = Math.max(1, ...categories.map(category => totals.byCategory[category.id]));
    const pending = PLANNER_STEPS.slice(0, -1).map((step, index) => ({ step, number: index + 1, done: progress.done[index] }));
    return `
      <div class="planner-recap">
        <dl class="planner-recap__facts">
          <div><dt>Datas</dt><dd>${escapeHtml(dateRange(trip))}</dd></div>
          <div><dt>Duração</dt><dd>${days ? `${days} ${days === 1 ? 'dia' : 'dias'}` : '—'}</dd></div>
          <div><dt>Viajantes</dt><dd>${trip.travelers}</dd></div>
          <div><dt>Voo</dt><dd>${escapeHtml(trip.origin)} → ${escapeHtml(country?.capital || country?.namePt || '')} · ${escapeHtml(CABIN_LABELS[trip.cabin])}</dd></div>
        </dl>
      </div>
      <div class="planner-card">
        <div class="planner-block__head">
          <h4 class="planner-block-title">Orçamento</h4>
          <strong class="planner-recap__total">${formatBRL(totals.total)}${trip.travelers > 1 ? ` <small>· ${formatBRL(totals.perPerson)} por pessoa</small>` : ''}</strong>
        </div>
        ${categories.length ? `<ul class="planner-bars">${categories.map(category => `
          <li><span>${escapeHtml(category.label)}</span><i><b style="width:${(totals.byCategory[category.id] / max * 100).toFixed(1)}%"></b></i><strong>${formatBRL(totals.byCategory[category.id])}</strong></li>`).join('')}</ul>`
          : '<p class="planner-hint">Nenhum gasto ainda.</p>'}
        ${totals.budget !== null ? `<p class="planner-hint">${totals.overBudget ? `<strong class="planner-summary__value--over">${formatBRL(-totals.remaining)} acima</strong> do teto de ${formatBRL(totals.budget)}.` : `${formatBRL(totals.remaining)} disponíveis do teto de ${formatBRL(totals.budget)}.`} Já pago: ${formatBRL(totals.byStatus.paid)}.</p>` : ''}
      </div>
      <div class="planner-card">
        <h4 class="planner-block-title">Andamento</h4>
        <ul class="planner-todo">
          ${pending.map(item => `<li class="${item.done ? 'planner-todo--done' : ''}">
            <span class="planner-todo__mark" aria-hidden="true">${item.done ? '✓' : ''}</span>
            <span>${escapeHtml(item.step.label)}</span>
            ${item.done ? '<small>Concluída</small>' : `<button class="planner-text-action" type="button" data-planner-step="${item.number}">Completar</button>`}
          </li>`).join('')}
        </ul>
      </div>
      <div class="planner-actions">
        <button class="secondary-button" type="button" data-planner-action="copy">Copiar resumo</button>
        <button class="secondary-button" type="button" data-planner-action="show-country">Ver guia do país</button>
      </div>
      <p class="planner-hint" data-planner-status role="status" aria-live="polite"></p>
      <div class="planner-footer">
        ${this.#savedNote()}
        <div class="planner-delete" id="planner-delete">${this.#deleteControls()}</div>
      </div>`;
  }

  #summaryText(trip) {
    const country = this.countries[trip.countryKey];
    const totals = tripTotals(trip);
    const days = tripDays(trip);
    const lines = [
      `Viagem para ${country?.namePt || trip.countryKey}`,
      `${dateRange(trip)}${days ? ` (${days} dias)` : ''} · ${people(trip.travelers)}`,
      `Voo: ${trip.origin} → ${country?.capital || country?.namePt || ''} · ${CABIN_LABELS[trip.cabin]}`,
      '',
      `Total planejado: ${formatBRL(totals.total)}${trip.travelers > 1 ? ` (${formatBRL(totals.perPerson)} por pessoa)` : ''}`,
      ...BUDGET_CATEGORIES.filter(category => totals.byCategory[category.id] > 0).map(category => `- ${category.label}: ${formatBRL(totals.byCategory[category.id])}`),
      totals.budget !== null ? `Teto: ${formatBRL(totals.budget)} · já pago: ${formatBRL(totals.byStatus.paid)}` : '',
      '',
      'Planejado no Traveling. Valores marcados como estimativa não são cotações.'
    ];
    return lines.filter((line, index, all) => line || all[index - 1]).join('\n').trim();
  }

  // ---------- Partes comuns ----------

  #flag(country, className) {
    const url = flagImageUrl(country?.alpha2);
    return url
      ? `<img class="${className}" src="${url}" alt="" width="40" height="30" loading="lazy" decoding="async">`
      : `<span class="${className} planner-flag-fallback" aria-hidden="true">${escapeHtml(country?.alpha2 || '🌍')}</span>`;
  }

  #savedNote() {
    return this.store.persistent
      ? '<p class="planner-saved">Salvo neste navegador. Limpar os dados do navegador apaga as viagens.</p>'
      : '<p class="planner-saved planner-saved--warning" role="status">Este navegador não permite salvar. As viagens ficam disponíveis só até fechar a página.</p>';
  }

  #visibleLines(trip) {
    const options = this.linesOptions ?? {};
    return trip.lines.filter(line => (!options.categories || options.categories.includes(line.category))
      && (!options.exclude || !options.exclude.includes(line.category)));
  }

  #lines(trip) {
    const options = this.linesOptions ?? {};
    const lines = this.#visibleLines(trip);
    if (!lines.length) return `<p class="planner-lines__empty">${escapeHtml(options.empty || 'Nenhum gasto ainda.')}</p>`;
    const fixedCategory = options.categories?.length === 1;
    const categories = BUDGET_CATEGORIES.filter(category => !options.exclude?.includes(category.id));
    return lines.map((line, index) => `
      <div class="planner-line ${fixedCategory ? 'planner-line--fixed' : ''}" data-line-id="${escapeHtml(line.id)}" role="group" aria-label="Gasto ${index + 1}">
        ${fixedCategory ? '' : `<select class="form-field__control planner-line__category" aria-label="Categoria do gasto ${index + 1}" data-line-field="category">
          ${categories.map(category => `<option value="${category.id}" ${category.id === line.category ? 'selected' : ''}>${category.label}</option>`).join('')}
        </select>`}
        <input class="form-field__control planner-line__note" type="text" maxlength="120" aria-label="Descrição do gasto ${index + 1}" placeholder="Descrição" value="${escapeHtml(line.note)}" data-line-field="note">
        <input class="form-field__control planner-line__amount" type="text" inputmode="decimal" aria-label="Valor do gasto ${index + 1} em reais" placeholder="R$ 0" value="${line.amountBRL ? escapeHtml(moneyInputValue(line.amountBRL)) : ''}" data-line-field="amountBRL">
        <select class="form-field__control planner-line__status" aria-label="Situação do gasto ${index + 1}" data-line-field="status">
          ${Object.entries(LINE_STATUSES).map(([status, label]) => `<option value="${status}" ${status === line.status ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <button class="icon-button planner-line__remove" type="button" aria-label="Remover gasto ${index + 1}" data-planner-action="remove-line">✕</button>
        ${line.source?.kind === 'traveling-estimate' ? provenanceLabel('estimate', { detail: line.source.detail || 'valor sugerido pelo Traveling', className: 'planner-line__source' }) : ''}
      </div>`).join('');
  }

  #deleteControls() {
    return this.confirmingDelete
      ? `<p role="alert">Excluir esta viagem e todos os gastos? Não dá para desfazer.</p>
         <div class="planner-delete__actions">
           <button class="secondary-button planner-delete__confirm" type="button" data-planner-action="delete-confirm">Excluir viagem</button>
           <button class="secondary-button" type="button" data-planner-action="delete-cancel">Cancelar</button>
         </div>`
      : '<button class="planner-text-button" type="button" data-planner-action="delete">Excluir viagem</button>';
  }

  // Atualiza o que depende dos dados sem redesenhar os campos (mantém o foco).
  #refreshLive() {
    const trip = this.trip;
    if (this.view !== 'trip' || !trip) return;
    const set = (name, html) => { const slot = this.element.querySelector(`[data-live="${name}"]`); if (slot) slot.innerHTML = html; };
    set('stepper', this.#stepper(trip, this.step));
    set('trip-meta', this.#tripMeta(trip));
    set('days', this.#daysHint(trip));
    set('months', this.#monthStrip(trip));
    set('summary', this.#summary(trip));
    set('travelers', String(trip.travelers));
    const visible = this.#visibleLines(trip);
    set('lines-total', visible.length ? formatBRL(visible.reduce((sum, line) => sum + line.amountBRL, 0)) : '');
    const end = this.element.querySelector('#planner-end');
    if (end) end.min = trip.startDate || '';
    const dec = this.element.querySelector('[data-planner-action="travelers-dec"]');
    const inc = this.element.querySelector('[data-planner-action="travelers-inc"]');
    if (dec) dec.disabled = trip.travelers <= 1;
    if (inc) inc.disabled = trip.travelers >= MAX_TRAVELERS;
    for (const section of this.#stepSections()) section.refresh?.(this.element, trip, this);
  }

  #rerenderLines(focusLineId = null, field = 'amountBRL') {
    const trip = this.trip;
    const container = this.element.querySelector('#planner-lines');
    if (!trip || !container) return;
    container.innerHTML = this.#lines(trip);
    this.#refreshLive();
    for (const button of this.element.querySelectorAll('[data-planner-action="add-line"]')) button.disabled = trip.lines.length >= MAX_LINES;
    if (focusLineId) container.querySelector(`[data-line-id="${CSS.escape(focusLineId)}"] [data-line-field="${field}"]`)?.focus();
  }

  #goTo(step) {
    const trip = this.trip;
    if (!trip) return;
    this.flash = '';
    this.changingDestination = false;
    this.store.save(updateTrip(trip, { step }));
    this.render();
    this.element.closest('.miles-hub')?.scrollTo({ top: 0 });
    this.#focusTitle();
  }

  #focusTitle() {
    this.element.querySelector('#wizard-title')?.focus({ preventScroll: true });
  }

  // ---------- Eventos ----------

  #input(event) {
    if (event.target.matches('[data-planner-search]')) this.#renderSearch(event.target.value);
  }

  #keydown(event) {
    if (event.target.matches('[data-planner-search]') && event.key === 'Enter') {
      event.preventDefault();
      const [first] = this.searchCountries(event.target.value, 1);
      if (first) this.#pickDestination(first);
    }
  }

  #change(event) {
    const target = event.target;
    const trip = this.trip;
    if (!trip || this.view !== 'trip') return;
    const field = target.dataset.plannerField;
    if (field) {
      let value = target.type === 'checkbox' ? target.checked : target.value;
      if (field === 'budgetBRL') {
        value = parseMoneyInput(value);
        if (value === null && target.value.trim()) {
          target.setCustomValidity('Digite um valor em reais, por exemplo 25.000');
          target.reportValidity();
          return;
        }
        target.setCustomValidity('');
      }
      const saved = this.update({ [field]: value });
      // Mostra o valor como foi guardado (datas trocadas, código em maiúsculas).
      if (saved) {
        for (const input of this.element.querySelectorAll('[data-planner-field="startDate"], [data-planner-field="endDate"], [data-planner-field="origin"]')) {
          input.value = saved[input.dataset.plannerField] ?? '';
        }
      }
      return;
    }
    const lineField = target.dataset.lineField;
    const row = target.closest('[data-line-id]');
    if (!lineField || !row) return;
    let value = target.value;
    if (lineField === 'amountBRL') {
      value = parseMoneyInput(value) ?? (target.value.trim() ? null : 0);
      if (value === null) {
        target.setCustomValidity('Digite um valor em reais, por exemplo 1.200,50');
        target.reportValidity();
        return;
      }
      target.setCustomValidity('');
    }
    this.store.save(updateLine(trip, row.dataset.lineId, { [lineField]: value }));
  }

  #click(event) {
    const pick = event.target.closest('[data-planner-pick]');
    if (pick) return this.#pickDestination(pick.dataset.plannerPick);
    const open = event.target.closest('[data-planner-open]');
    if (open) {
      this.openTrip(open.dataset.plannerOpen);
      this.render();
      return this.#focusTitle();
    }
    const stepButton = event.target.closest('[data-planner-step]');
    if (stepButton && !stepButton.disabled) return this.#goTo(Number(stepButton.dataset.plannerStep));
    const button = event.target.closest('[data-planner-action]');
    if (!button || !this.element.contains(button)) return;
    const trip = this.trip;
    const action = button.dataset.plannerAction;
    if (action === 'new') {
      this.view = 'new';
      this.render();
      this.element.querySelector('#planner-destination-search')?.focus();
    }
    if (action === 'home') {
      this.view = 'home';
      this.render();
    }
    if (action === 'discover') this.onDiscover?.();
    if (!trip) return;
    if (action === 'next') this.#goTo(Math.min(PLANNER_STEPS.length, this.step + 1));
    if (action === 'prev') this.#goTo(Math.max(1, this.step - 1));
    if (action === 'show-country') this.onShowCountry?.(trip.countryKey);
    if (action === 'change-destination' || action === 'cancel-change') {
      this.changingDestination = action === 'change-destination';
      this.render();
      if (this.changingDestination) this.element.querySelector('#planner-destination-search')?.focus();
    }
    if (action === 'travelers-inc' || action === 'travelers-dec') {
      this.update({ travelers: trip.travelers + (action === 'travelers-inc' ? 1 : -1) });
    }
    if (action === 'add-line') {
      const saved = this.store.save(addLine(trip, { category: button.dataset.category || 'other', amountBRL: 0, status: 'estimate' }));
      this.#rerenderLines(saved.lines.at(-1)?.id, 'note');
    }
    if (action === 'remove-line') {
      const row = button.closest('[data-line-id]');
      this.store.save(removeLine(trip, row.dataset.lineId));
      this.#rerenderLines();
    }
    if (action === 'copy') {
      const status = this.element.querySelector('[data-planner-status]');
      navigator.clipboard?.writeText(this.#summaryText(trip))
        .then(() => { if (status) status.textContent = 'Resumo copiado. Cole onde quiser compartilhar.'; })
        .catch(() => { if (status) status.textContent = 'Não foi possível copiar neste navegador.'; });
    }
    if (action === 'delete' || action === 'delete-cancel') {
      this.confirmingDelete = action === 'delete';
      this.element.querySelector('#planner-delete').innerHTML = this.#deleteControls();
      this.element.querySelector(this.confirmingDelete ? '.planner-delete__confirm' : '[data-planner-action="delete"]')?.focus();
    }
    if (action === 'delete-confirm') {
      this.store.remove(trip.id);
      this.view = 'home';
      this.render();
    }
  }
}
