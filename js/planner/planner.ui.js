// Planner: planejamento de viagem em seis etapas (destino, quando e com quem,
// voo, estilo, preparação e resumo). Tudo é escolhido com botões: não há
// campos de texto além da busca de país. Carregado sob demanda pelo app e salvo
// no navegador pelo trip.store; nenhum dado sai do aparelho.
import { escapeHtml } from '../core/html.js';
import { flagImageUrl } from '../country.exploration.js';
import {
  FLIGHT_PREFERENCES, INTERESTS, LOCAL_TRANSPORT, LODGING_LEVELS, MAX_TRAVELERS, ORIGIN_AIRPORTS, PAY_OPTIONS,
  PLANNER_STEPS, TRAVEL_GROUPS, TRAVEL_STYLES, TRIP_DURATIONS,
  tripDays, tripMonth, tripProgress, updateTrip
} from './trip.model.js';
import { parseBrazilianNumber } from '../miles.tools.js';
import { formatBRL } from './money.js';

export { formatBRL };

// Valor digitado ("1.234,56", "1234.5", "R$ 800") → número, ou null.
export function parseMoneyInput(value) {
  const raw = String(value ?? '').trim();
  return raw ? parseBrazilianNumber(raw) : null;
}

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const CABIN_LABELS = { economy: 'Econômica', premium: 'Premium Economy', business: 'Executiva' };
const POPULAR = ['Portugal', 'Argentina', 'Chile', 'France', 'Italy', 'Spain', 'United States', 'Japan', 'Mexico', 'Uruguay', 'Peru', 'United Kingdom'];

// Texto curto de apoio em cada opção.
const HINTS = {
  group: { solo: 'Só você', couple: 'Duas pessoas', family: 'Com crianças ou parentes', friends: 'Turma de amigos' },
  payWith: { cash: 'Cartão ou Pix', miles: 'LATAM Pass, Smiles, Azul', undecided: 'Mostramos as duas opções' },
  flightPreference: { direct: 'Menos conexões e tempo', cheapest: 'Aceito escalas longas' },
  cabin: { economy: 'A mais comum', premium: 'Mais espaço', business: 'Assento-cama em voos longos' },
  style: { economic: 'Gastar pouco', balanced: 'Bom custo-benefício', comfort: 'Mais conforto' },
  lodging: { hostel: 'Quarto compartilhado', simple: 'Quarto privativo', comfort: 'Hotel 3–4★', superior: 'Hotel 4–5★' },
  transport: { public: 'Metrô, ônibus, trem', car: 'Liberdade para rodar', tours: 'Tudo organizado', mixed: 'Depende do dia' }
};
const SHORT_LODGING = { hostel: 'Albergue', simple: 'Simples', comfort: 'Conforto', superior: 'Superior' };

const STEP_LEADS = {
  destination: 'Escolha o país da viagem. Você pode trocar depois.',
  dates: 'Toque nas opções. Não precisa ter datas exatas agora.',
  flight: 'Escolha como prefere voar. A estimativa abaixo acompanha suas escolhas.',
  budget: 'Escolha o jeito de viajar. Dá para mudar quando quiser.',
  prep: 'Documentos, regras de entrada e o checklist do destino.',
  summary: 'Tudo o que você escolheu, num só lugar.'
};

// "2027-04-02" → "2 abr 2027".
function shortDate(iso, { year = true } = {}) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}${year ? ` ${y}` : ''}`;
}

function whenLabel(trip) {
  if (trip.startDate && trip.endDate) {
    const sameYear = trip.startDate.slice(0, 4) === trip.endDate.slice(0, 4);
    return `${shortDate(trip.startDate, { year: !sameYear })} – ${shortDate(trip.endDate)}`;
  }
  const month = tripMonth(trip);
  const duration = TRIP_DURATIONS.find(item => item.days === trip.duration)?.label;
  if (month === null && !duration) return 'Quando: a definir';
  return [month === null ? null : `Em ${MONTH_NAMES[month]}`, duration?.toLowerCase()].filter(Boolean).join(' · ');
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
    this.showExactDates = false;
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
  }

  openTrip(id, { step = null } = {}) {
    this.store.setActive(id);
    if (step) this.store.save(updateTrip(this.trip, { step }));
    this.view = 'trip';
    this.flash = '';
    this.changingDestination = false;
  }

  // Chamado pelo app quando cotações ou o checklist mudam.
  refresh() {
    if (this.view === 'trip') this.#refreshLive();
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

  // ---------- Peças reutilizáveis ----------

  // Grupo de cartões de escolha única (ou múltipla, com `multi`).
  #choices(field, options, selected, { multi = false, hints = HINTS[field] ?? {}, columns = 2, label = '' } = {}) {
    const isOn = value => (multi ? selected.includes(value) : selected === value);
    return `
      <div class="choice-grid choice-grid--${columns}" role="group" ${label ? `aria-label="${escapeHtml(label)}"` : ''}>
        ${Object.entries(options).map(([value, text]) => `
          <button class="choice ${isOn(value) ? 'choice--on' : ''}" type="button" aria-pressed="${isOn(value)}"
            data-choice-field="${field}" data-choice-value="${escapeHtml(value)}" ${multi ? 'data-choice-multi' : ''}>
            <span class="choice__title">${escapeHtml(text)}</span>
            ${hints[value] ? `<span class="choice__hint">${escapeHtml(hints[value])}</span>` : ''}
          </button>`).join('')}
      </div>`;
  }

  #question(title, body, note = '') {
    return `<div class="planner-question"><h4 class="planner-question__title">${escapeHtml(title)}</h4>${note ? `<p class="planner-hint">${note}</p>` : ''}${body}</div>`;
  }

  // ---------- Telas ----------

  #welcome() {
    return `
      <div class="planner-welcome">
        <h3 class="planner-welcome__title">Planeje sua próxima viagem</h3>
        <p class="planner-welcome__lead">Seis etapas rápidas, só tocando nas opções. Tudo fica salvo neste navegador.</p>
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
      return `
        <li>
          <button class="planner-trip-card" type="button" data-planner-open="${escapeHtml(trip.id)}">
            ${this.#flag(country, 'planner-trip-card__flag')}
            <span class="planner-trip-card__body">
              <strong>${escapeHtml(country?.namePt || trip.countryKey)}</strong>
              <small>${escapeHtml(whenLabel(trip))} · ${escapeHtml(people(trip.travelers))}</small>
              <span class="planner-progress" aria-hidden="true"><span style="width:${(progress.completed / progress.total * 100).toFixed(0)}%"></span></span>
            </span>
            <span class="planner-trip-card__side">
              <strong>${trip.style ? escapeHtml(TRAVEL_STYLES[trip.style]) : '—'}</strong>
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
    const when = whenLabel(trip);
    return `${escapeHtml(when)}${days && trip.startDate ? ` · ${days} dias` : ''} · ${escapeHtml(people(trip.travelers))}`;
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
    if (stepId === 'flight') return this.#flightStep(trip, sections);
    if (stepId === 'budget') return this.#styleStep(trip);
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
    const taken = new Set(this.store.trips.map(trip => trip.countryKey));
    const ideas = this.getIdeas().filter(key => this.countries[key] && !taken.has(key));
    const popular = POPULAR.filter(key => this.countries[key] && !ideas.includes(key));
    const card = key => {
      const country = this.countries[key];
      return `<button class="planner-idea" type="button" data-planner-pick="${escapeHtml(key)}">
        ${this.#flag(country, 'planner-idea__flag')}
        <span><strong>${escapeHtml(country.namePt)}</strong><small>${escapeHtml(country.region || '')}</small></span>
      </button>`;
    };
    return `
      <div class="planner-picker">
        <label class="sr-only" for="planner-destination-search">Buscar país</label>
        <input class="form-field__control planner-picker__input" id="planner-destination-search" type="search" placeholder="Buscar país…" autocomplete="off" spellcheck="false" data-planner-search>
        <ul class="planner-picker__results" id="planner-destination-results" role="listbox" aria-label="Países encontrados"></ul>
      </div>
      ${ideas.length ? `<h4 class="planner-block-title">Da sua lista de desejos</h4><div class="planner-ideas">${ideas.map(card).join('')}</div>` : ''}
      <h4 class="planner-block-title">Destinos populares</h4>
      <div class="planner-ideas">${popular.map(card).join('')}</div>
      ${this.onDiscover ? `
        <div class="planner-card planner-card--quiet planner-row">
          <div class="planner-row__grow"><strong class="planner-card__title">Ainda não sabe para onde?</strong>
            <p class="planner-hint">Responda três perguntas e receba sugestões.</p></div>
          <button class="secondary-button" type="button" data-planner-action="discover">Descobrir destino</button>
        </div>` : ''}`;
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

  // ---------- Etapa 2: quando e com quem ----------

  #datesStep(trip) {
    const country = this.countries[trip.countryKey];
    const scores = country?.months?.length === 12 ? country.months : null;
    const selectedMonth = tripMonth(trip);
    const exact = this.showExactDates || Boolean(trip.startDate);
    const months = `
      <div class="month-grid" role="group" aria-label="Mês da viagem">
        ${MONTH_SHORT.map((label, index) => {
          const score = scores?.[index];
          const season = score === 2 ? 'great' : score === 1 ? 'good' : score === 0 ? 'low' : 'none';
          const on = selectedMonth === index;
          return `<button class="month-choice month-choice--${season} ${on ? 'choice--on' : ''}" type="button" aria-pressed="${on}"
            data-choice-field="month" data-choice-value="${index}" ${trip.startDate ? 'disabled' : ''}
            aria-label="${MONTH_NAMES[index]}${score === 2 ? ' (ótima época)' : score === 0 ? ' (época ruim)' : ''}">${label}</button>`;
        }).join('')}
      </div>
      ${scores ? '<p class="planner-legend"><i class="planner-legend__great"></i>Ótima época <i class="planner-legend__good"></i>Boa <i class="planner-legend__low"></i>Evitar</p>' : ''}`;
    const durations = Object.fromEntries(TRIP_DURATIONS.map(item => [item.days, item.label]));
    const airportOptions = ORIGIN_AIRPORTS.some(([code]) => code === trip.origin) ? ORIGIN_AIRPORTS : [[trip.origin, trip.origin], ...ORIGIN_AIRPORTS];
    return `
      ${this.#question('Em que mês?', months, escapeHtml(country?.bestTime || ''))}
      ${this.#question('Por quanto tempo?', this.#choices('duration', durations, trip.startDate ? null : String(trip.duration ?? ''), { columns: 4, hints: {} }))}
      <div class="planner-exact">
        <button class="planner-text-action" type="button" data-planner-action="toggle-dates" aria-expanded="${exact}">${exact ? 'Usar só mês e duração' : 'Tenho datas exatas'}</button>
        ${exact ? `<div class="form-grid">
          <label class="form-field" for="planner-start"><span class="form-field__label">Ida</span>
            <input class="form-field__control" id="planner-start" type="date" value="${escapeHtml(trip.startDate || '')}" data-planner-field="startDate"></label>
          <label class="form-field" for="planner-end"><span class="form-field__label">Volta</span>
            <input class="form-field__control" id="planner-end" type="date" value="${escapeHtml(trip.endDate || '')}" min="${escapeHtml(trip.startDate || '')}" data-planner-field="endDate"></label>
        </div>` : ''}
      </div>
      ${this.#question('Quem vai?', this.#choices('group', TRAVEL_GROUPS, trip.group, { columns: 4 }))}
      ${this.#question('Quantas pessoas?', `
        <div class="planner-counter" role="group" aria-label="Número de viajantes">
          <button class="icon-button" type="button" data-planner-action="travelers-dec" aria-label="Menos um viajante" ${trip.travelers <= 1 ? 'disabled' : ''}>−</button>
          <output data-live="travelers" aria-live="polite">${trip.travelers}</output>
          <button class="icon-button" type="button" data-planner-action="travelers-inc" aria-label="Mais um viajante" ${trip.travelers >= MAX_TRAVELERS ? 'disabled' : ''}>＋</button>
        </div>`)}
      ${this.#question('Saindo de onde?', `
        <label class="sr-only" for="planner-origin">Aeroporto de saída</label>
        <select class="form-field__control" id="planner-origin" data-planner-field="origin">
          ${airportOptions.map(([code, name]) => `<option value="${code}" ${code === trip.origin ? 'selected' : ''}>${escapeHtml(name)} (${code})</option>`).join('')}
        </select>`)}`;
  }

  // ---------- Etapa 3: voo ----------

  #flightStep(trip, sections) {
    return `
      ${this.#question('Como pretende pagar a passagem?', this.#choices('payWith', PAY_OPTIONS, trip.payWith, { columns: 3 }))}
      ${this.#question('Qual cabine?', this.#choices('cabin', CABIN_LABELS, trip.cabin, { columns: 3 }))}
      ${this.#question('O que pesa mais?', this.#choices('flightPreference', FLIGHT_PREFERENCES, trip.flightPreference))}
      ${sections}`;
  }

  // ---------- Etapa 4: estilo ----------

  #styleStep(trip) {
    return `
      ${this.#question('Qual o seu estilo de viagem?', this.#choices('style', TRAVEL_STYLES, trip.style, { columns: 3 }))}
      ${this.#question('Onde quer ficar?', this.#choices('lodging', SHORT_LODGING, trip.lodging, { columns: 2 }))}
      ${this.#question('Como vai se locomover lá?', this.#choices('transport', LOCAL_TRANSPORT, trip.transport))}
      ${this.#question('O que você mais quer fazer?', this.#choices('interests', INTERESTS, trip.interests, { multi: true, columns: 2, hints: {} }), 'Escolha quantos quiser.')}`;
  }

  // ---------- Etapa 6: resumo ----------

  #summaryStep(trip) {
    const country = this.countries[trip.countryKey];
    const progress = tripProgress(trip);
    const pending = PLANNER_STEPS.slice(0, -1).map((step, index) => ({ step, number: index + 1, done: progress.done[index] }));
    const facts = this.#facts(trip);
    return `
      <div class="planner-recap">
        <dl class="planner-recap__facts">
          ${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
        </dl>
      </div>
      ${trip.interests.length ? `<div class="planner-card"><h4 class="planner-block-title">Interesses</h4>
        <div class="planner-tags">${trip.interests.map(id => `<span class="planner-tag">${escapeHtml(INTERESTS[id])}</span>`).join('')}</div></div>` : ''}
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
        <button class="secondary-button" type="button" data-planner-action="show-country">Ver guia de ${escapeHtml(country?.namePt || 'destino')}</button>
      </div>
      <p class="planner-hint" data-planner-status role="status" aria-live="polite"></p>
      <div class="planner-footer">
        ${this.#savedNote()}
        <div class="planner-delete" id="planner-delete">${this.#deleteControls()}</div>
      </div>`;
  }

  #facts(trip) {
    const country = this.countries[trip.countryKey];
    const origin = ORIGIN_AIRPORTS.find(([code]) => code === trip.origin)?.[1] ?? trip.origin;
    return [
      ['Quando', whenLabel(trip)],
      ['Quem', `${trip.group ? `${TRAVEL_GROUPS[trip.group]} · ` : ''}${people(trip.travelers)}`],
      ['Voo', `${origin} → ${country?.capital || country?.namePt || ''} · ${CABIN_LABELS[trip.cabin]}`],
      ['Pagamento', trip.payWith ? PAY_OPTIONS[trip.payWith] : '—'],
      ['Estilo', trip.style ? TRAVEL_STYLES[trip.style] : '—'],
      ['Hospedagem', LODGING_LEVELS[trip.lodging]],
      ['Locomoção', trip.transport ? LOCAL_TRANSPORT[trip.transport] : '—']
    ];
  }

  #summaryText(trip) {
    const country = this.countries[trip.countryKey];
    return [
      `Viagem para ${country?.namePt || trip.countryKey}`,
      ...this.#facts(trip).map(([label, value]) => `${label}: ${value}`),
      trip.interests.length ? `Interesses: ${trip.interests.map(id => INTERESTS[id]).join(', ')}` : '',
      '',
      'Planejado no Traveling.'
    ].filter((line, index, all) => line || all[index - 1]).join('\n').trim();
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

  #deleteControls() {
    return this.confirmingDelete
      ? `<p role="alert">Excluir esta viagem? Não dá para desfazer.</p>
         <div class="planner-delete__actions">
           <button class="secondary-button planner-delete__confirm" type="button" data-planner-action="delete-confirm">Excluir viagem</button>
           <button class="secondary-button" type="button" data-planner-action="delete-cancel">Cancelar</button>
         </div>`
      : '<button class="planner-text-button" type="button" data-planner-action="delete">Excluir viagem</button>';
  }

  // Atualiza o que depende dos dados sem redesenhar a etapa (mantém o foco).
  #refreshLive() {
    const trip = this.trip;
    if (this.view !== 'trip' || !trip) return;
    const set = (name, html) => { const slot = this.element.querySelector(`[data-live="${name}"]`); if (slot) slot.innerHTML = html; };
    set('stepper', this.#stepper(trip, this.step));
    set('trip-meta', this.#tripMeta(trip));
    set('travelers', String(trip.travelers));
    for (const button of this.element.querySelectorAll('[data-choice-field]')) {
      const field = button.dataset.choiceField;
      const value = button.dataset.choiceValue;
      const current = trip[field];
      const on = Array.isArray(current) ? current.includes(value) : String(current ?? '') === value;
      button.classList.toggle('choice--on', on && !(field === 'duration' && trip.startDate));
      button.setAttribute('aria-pressed', String(on));
    }
    const dec = this.element.querySelector('[data-planner-action="travelers-dec"]');
    const inc = this.element.querySelector('[data-planner-action="travelers-inc"]');
    if (dec) dec.disabled = trip.travelers <= 1;
    if (inc) inc.disabled = trip.travelers >= MAX_TRAVELERS;
    const end = this.element.querySelector('#planner-end');
    if (end) end.min = trip.startDate || '';
    for (const section of this.#stepSections()) section.refresh?.(this.element, trip, this);
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
    const field = target.dataset.plannerField;
    if (!field || !this.trip || this.view !== 'trip') return;
    const saved = this.update({ [field]: target.value });
    // Mostra o valor como foi guardado (datas trocadas, código em maiúsculas).
    if (saved) {
      for (const input of this.element.querySelectorAll('[data-planner-field="startDate"], [data-planner-field="endDate"]')) {
        input.value = saved[input.dataset.plannerField] ?? '';
      }
      // Com datas exatas, mês e duração ficam desativados; sem elas, voltam.
      if (field === 'startDate' || field === 'endDate') {
        for (const button of this.element.querySelectorAll('[data-choice-field="month"]')) button.disabled = Boolean(saved.startDate);
      }
    }
  }

  #choose(button) {
    const trip = this.trip;
    const field = button.dataset.choiceField;
    const raw = button.dataset.choiceValue;
    if (!trip || !field) return;
    if (button.hasAttribute('data-choice-multi')) {
      const list = trip[field] ?? [];
      this.update({ [field]: list.includes(raw) ? list.filter(item => item !== raw) : [...list, raw] });
      return;
    }
    const value = field === 'month' || field === 'duration' ? Number(raw) : raw;
    // Tocar de novo na opção marcada desmarca (exceto as que sempre têm valor).
    const keep = field === 'cabin' || field === 'lodging';
    const next = !keep && trip[field] === value ? null : value;
    // Mês e duração substituem datas exatas.
    const extra = (field === 'month' || field === 'duration') ? { startDate: null, endDate: null } : {};
    this.update({ [field]: next, ...extra });
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
    const choiceButton = event.target.closest('[data-choice-field]');
    if (choiceButton && this.element.contains(choiceButton)) return this.#choose(choiceButton);
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
    if (action === 'toggle-dates') {
      const exact = this.showExactDates || Boolean(trip.startDate);
      this.showExactDates = !exact;
      if (exact) this.update({ startDate: null, endDate: null });
      this.render();
    }
    if (action === 'travelers-inc' || action === 'travelers-dec') {
      this.update({ travelers: trip.travelers + (action === 'travelers-inc' ? 1 : -1) });
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
