import { BUDGETS, CLIMATES, DISCOVERY_MONTHS, INTERESTS, TRIP_REFERENCE } from './destination.profiles.js';
import { formatTripRange, noMatchAdvice, rankDestinations } from './destination.discovery.js';
import { flagImageUrl } from './country.exploration.js';
import { provenanceLabel } from './provenance.js';
import { haversineKm } from './geospatial.js';
import { loadCities, topCities } from './geo/cities.js';

// Descobrir: um único painel. As preferências ficam no topo, em botões, e a
// lista de destinos que combinam se atualiza a cada toque. Tocar num destino
// destaca o país no globo e abre as ações (explorar, rota, planejar).
// País, globo e voo continuam com o app.

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const MAX_RESULTS = 12;
const SEASON_LABELS = ['Evitar', 'Aceitável', 'Boa', 'Ideal'];
const BUDGET_SHORT = { 5000: 'Até 5 mil', 8000: 'Até 8 mil', 12000: 'Até 12 mil', 18000: 'Até 18 mil', above: '18 mil+', any: 'Tanto faz' };
const MAX_INTERESTS = 2;

// Sem interesse escolhido: melhor resultado de cada país entre todos os interesses.
function rankWithoutInterests(countries, preferences) {
  const best = new Map();
  for (const interest of Object.keys(INTERESTS)) {
    for (const match of rankDestinations(countries, { ...preferences, interests: [interest] })) {
      const current = best.get(match.countryKey);
      if (!current || match.score > current.score) best.set(match.countryKey, match);
    }
  }
  return [...best.values()].sort((a, b) => Number(b.tier === 'strong') - Number(a.tier === 'strong') || b.score - a.score || a.countryKey.localeCompare(b.countryKey, 'en'));
}

export class DiscoveryUI {
  /**
   * @param {(code: string) => Promise<object|null>} [resolveAirport] Aeroporto (lat/lng) do roteiro, para achar as cidades da região.
   * @param {(city: object) => void} [onCity] Destaca a cidade escolhida no globo.
   */
  constructor({ element, trigger, countries, onHighlight, onExplore, onRoute, onPlan, onClose, resolveAirport = async () => null, onCity = () => {} }) {
    Object.assign(this, { element, trigger, countries, onHighlight, onExplore, onRoute, onPlan, onClose, resolveAirport, onCity });
    this.regionCities = new Map(); // id do perfil → cidades da região (ou 'error')
    this.city = null;
    this.preferences = { interests: [], climate: 'any', budget: 'any', month: new Date().getMonth(), visaFree: false };
    // `step` e `index` são lidos pelo app (rota do destino atual).
    this.step = 'result';
    this.matches = [];
    this.index = -1;
    this.version = 0;
    this.handleClick = event => this.click(event);
    element.addEventListener('click', this.handleClick);
  }

  get isOpen() { return !this.element.hidden; }

  open() {
    this.element.hidden = false;
    this.element.inert = false;
    this.trigger.setAttribute('aria-expanded', 'true');
    this.#compute();
    this.render();
    if (this.matches[this.index]) this.onHighlight(this.matches[this.index]);
  }

  close(restoreFocus = false) {
    if (!this.isOpen) return;
    this.version += 1;
    this.element.hidden = true;
    this.element.inert = true;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.onClose?.();
    if (restoreFocus) this.trigger.focus({ preventScroll: true });
  }

  #compute() {
    const previous = this.matches[this.index]?.countryKey;
    const prefs = this.preferences;
    this.matches = (prefs.interests.length ? rankDestinations(this.countries, prefs) : rankWithoutInterests(this.countries, prefs)).slice(0, MAX_RESULTS);
    this.index = this.matches.findIndex(match => match.countryKey === previous);
  }

  #chips(kind, entries, isOn, { disabled = () => false } = {}) {
    return entries.map(([value, label]) => `<button type="button" class="discovery-chip" data-${kind}="${escape(value)}" aria-pressed="${isOn(value)}" ${disabled(value) ? 'disabled' : ''}>${escape(label)}</button>`).join('');
  }

  #filters() {
    const prefs = this.preferences;
    return `
      <div class="discovery-filters">
        <div class="discovery-filter">
          <span class="discovery-filter__label">O que você quer? <small>até ${MAX_INTERESTS}</small></span>
          <div class="discovery-chips" role="group" aria-label="Interesses">${this.#chips('interest', Object.entries(INTERESTS), id => prefs.interests.includes(id),
            { disabled: id => prefs.interests.length >= MAX_INTERESTS && !prefs.interests.includes(id) })}</div>
        </div>
        <div class="discovery-filter">
          <span class="discovery-filter__label">Quando?</span>
          <div class="discovery-chips discovery-chips--months" role="group" aria-label="Mês">${this.#chips('month', DISCOVERY_MONTHS.map((label, index) => [index, label]), index => prefs.month === Number(index))}</div>
        </div>
        <div class="discovery-filter">
          <span class="discovery-filter__label">Clima</span>
          <div class="discovery-chips" role="group" aria-label="Clima">${this.#chips('climate', Object.entries(CLIMATES), id => prefs.climate === id)}</div>
        </div>
        <div class="discovery-filter">
          <span class="discovery-filter__label">Orçamento por pessoa <small>7 dias, com passagem</small></span>
          <div class="discovery-chips" role="group" aria-label="Orçamento">${this.#chips('budget', BUDGETS.filter(band => band.id !== 'above').map(band => [band.id, BUDGET_SHORT[band.id] ?? band.label]), id => prefs.budget === id)}</div>
        </div>
        <button type="button" class="discovery-chip discovery-chip--toggle" data-action="visa" aria-pressed="${prefs.visaFree}">🛂 Priorizar sem visto</button>
      </div>`;
  }

  #seasonBar(profile) {
    return `<span class="discovery-season" aria-label="Melhores meses">${profile.seasonSuitability.map((value, month) => `<i class="discovery-season__m discovery-season__m--${value}${month === this.preferences.month ? ' discovery-season__m--now' : ''}" title="${DISCOVERY_MONTHS[month]}: ${SEASON_LABELS[value]}"></i>`).join('')}</span>`;
  }

  #card(match, index) {
    const open = index === this.index;
    const flag = flagImageUrl(match.country.alpha2);
    return `
      <li class="discovery-card ${open ? 'discovery-card--open' : ''}">
        <button type="button" class="discovery-card__head" data-pick="${index}" aria-expanded="${open}">
          ${flag ? `<img class="discovery-card__flag" src="${flag}" alt="" width="40" height="30" loading="lazy" decoding="async">` : `<span class="discovery-card__flag">${escape(match.country.flag || '')}</span>`}
          <span class="discovery-card__body">
            <strong>${escape(match.country.namePt)}</strong>
            <small>${escape(match.profile.region)}</small>
          </span>
          <span class="discovery-card__side">
            <span class="discovery-badge discovery-badge--${match.tier}">${match.tier === 'strong' ? 'Combina muito' : 'Boa opção'}</span>
            <strong>${formatTripRange(match.range)}</strong>
          </span>
        </button>
        ${open ? `
          <div class="discovery-card__detail">
            <div class="discovery-card__season">${this.#seasonBar(match.profile)}<small>${SEASON_LABELS[match.profile.seasonSuitability[this.preferences.month]]} época em ${DISCOVERY_MONTHS[this.preferences.month]}</small></div>
            <ul class="discovery-reasons">${match.reasons.slice(0, 2).map(reason => `<li>${escape(reason)}</li>`).join('')}</ul>
            <p class="discovery-note">${escape(match.profile.note)}</p>
            <div class="discovery-cities" data-cities-for="${escape(match.profile.id)}">${this.#citiesHtml(match)}</div>
            <div class="discovery-result-actions">
              <button class="primary-button" type="button" data-action="explore">Explorar ${escape(match.country.namePt)}</button>
              <button class="secondary-button" type="button" data-action="route">✈ Ver rota</button>
              ${this.onPlan ? `<button class="secondary-button" type="button" data-action="plan">＋ Planejar${this.city ? ` ${escape(this.city.name)}` : ''}</button>` : ''}
            </div>
            <p class="discovery-feedback" role="status"></p>
          </div>` : ''}
      </li>`;
  }

  #results() {
    if (!this.matches.length) {
      return `<div class="discovery-empty" role="status"><strong>Nenhum destino com essa combinação.</strong><p>${escape(noMatchAdvice(this.countries, { ...this.preferences, interests: this.preferences.interests.length ? this.preferences.interests : ['cultura'] }))}</p></div>`;
    }
    const strong = this.matches.filter(match => match.tier === 'strong').length;
    return `
      <div class="discovery-results__head">
        <strong>${this.matches.length} ${this.matches.length === 1 ? 'destino' : 'destinos'} para ${DISCOVERY_MONTHS[this.preferences.month]}</strong>
        <button type="button" class="discovery-text-button" data-action="surprise">🎲 Surpreenda-me</button>
      </div>
      ${strong ? '' : '<small>Nenhuma combinação perfeita; estas são as melhores com ressalvas.</small>'}
      <ul class="discovery-list">${this.matches.map((match, index) => this.#card(match, index)).join('')}</ul>
      ${provenanceLabel('estimate', { detail: 'faixa por pessoa, 7 dias, saindo de GRU; não é cotação' })}
      <details class="discovery-about"><summary>O que entra no preço?</summary><p>${escape(TRIP_REFERENCE)}</p></details>`;
  }

  render(focus = true) {
    const scroll = this.element.scrollTop;
    this.element.innerHTML = `
      <div class="discovery-header">
        <div><span class="eyebrow">Descobrir</span><h2 id="discovery-title" tabindex="-1">Para onde ir?</h2></div>
        <button class="icon-button" type="button" aria-label="Fechar descoberta" data-action="close">✕</button>
      </div>
      ${this.#filters()}
      <section class="discovery-results" aria-live="polite" aria-label="Destinos sugeridos">${this.#results()}</section>`;
    if (focus) {
      this.element.scrollTop = 0;
      this.element.querySelector('h2').focus({ preventScroll: true });
    } else this.element.scrollTop = scroll;
  }

  // Cidades da região do roteiro: até 250 km do aeroporto de entrada, maiores
  // primeiro; sem aeroporto conhecido, as maiores do país.
  #regionCities(match) {
    const key = match.profile.id;
    if (!this.regionCities.has(key)) {
      this.regionCities.set(key, null);
      Promise.all([loadCities(match.country.alpha2), this.resolveAirport(match.profile.airport).catch(() => null)])
        .then(([cities, airport]) => {
          const near = airport ? cities
            .map(city => ({ city, km: haversineKm(airport.lat, airport.lng, city.lat, city.lng) }))
            .filter(item => item.km <= 250)
            .sort((a, b) => b.city.population - a.city.population)
            .map(item => item.city) : [];
          this.regionCities.set(key, (near.length >= 3 ? near : topCities(cities, 8)).slice(0, 8));
        })
        .catch(() => this.regionCities.set(key, 'error'))
        .finally(() => {
          const slot = this.element.querySelector(`[data-cities-for="${CSS.escape(key)}"]`);
          if (slot) slot.innerHTML = this.#citiesHtml(match);
        });
    }
    return this.regionCities.get(key);
  }

  #citiesHtml(match) {
    const cities = this.#regionCities(match);
    if (cities === 'error') return '';
    if (!cities) return '<small>Carregando cidades…</small>';
    if (!cities.length) return '';
    return `<span class="discovery-filter__label">Cidades da região</span>
      <div class="discovery-chips">${cities.map(city => `<button type="button" class="discovery-chip" data-city="${escape(city.id)}" aria-pressed="${city.id === this.city?.id}">${escape(city.name)}</button>`).join('')}</div>`;
  }

  #select(index) {
    if (index !== this.index) this.city = null;
    this.index = index;
    this.render(false);
    const match = this.matches[index];
    if (!match) return;
    this.onHighlight(match);
    this.element.querySelector('.discovery-card--open')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async click(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled || !this.element.contains(button)) return;
    const { interest, climate, month, budget, pick, action, city: cityId } = button.dataset;
    if (cityId) {
      const match = this.matches[this.index];
      const list = match ? this.regionCities.get(match.profile.id) : null;
      const city = Array.isArray(list) ? list.find(item => item.id === cityId) : null;
      this.city = city && city.id !== this.city?.id ? city : null;
      this.render(false);
      if (this.city) this.onCity(this.city);
      else if (match) this.onHighlight(match);
      return;
    }
    const prefs = this.preferences;
    if (interest || climate || month !== undefined || budget || action === 'visa') {
      if (interest) prefs.interests = prefs.interests.includes(interest) ? prefs.interests.filter(value => value !== interest) : [...prefs.interests, interest].slice(0, MAX_INTERESTS);
      if (climate) prefs.climate = climate;
      if (month !== undefined) prefs.month = Number(month);
      if (budget) prefs.budget = budget;
      if (action === 'visa') prefs.visaFree = !prefs.visaFree;
      this.version += 1;
      this.#compute();
      this.render(false);
      const selector = interest ? `[data-interest="${interest}"]` : climate ? `[data-climate="${climate}"]` : month !== undefined ? `[data-month="${month}"]` : budget ? `[data-budget="${budget}"]` : '[data-action="visa"]';
      this.element.querySelector(selector)?.focus({ preventScroll: true });
      return;
    }
    if (pick !== undefined) {
      const index = Number(pick);
      if (index === this.index) { this.index = -1; this.render(false); return; }
      this.#select(index);
      return;
    }
    if (action === 'close') { this.close(true); return; }
    if (action === 'surprise' && this.matches.length) {
      const options = this.matches.map((_, index) => index).filter(index => index !== this.index);
      this.#select(options[Math.floor(Math.random() * options.length)] ?? 0);
      return;
    }
    const match = this.matches[this.index];
    if (!match) return;
    if (action === 'explore') { this.onExplore(match, prefs); return; }
    if (action === 'plan' && this.onPlan) {
      const budgetCeiling = BUDGETS.find(band => band.id === prefs.budget)?.ceiling ?? Infinity;
      this.onPlan(match, { ...prefs, budgetCeiling, city: this.city });
      return;
    }
    if (action === 'route') {
      const version = this.version;
      const feedback = this.element.querySelector('.discovery-feedback');
      const controls = [...this.element.querySelectorAll('.discovery-result-actions button')];
      controls.forEach(control => { control.disabled = true; });
      feedback.textContent = 'Preparando rota no globo…';
      try {
        const opened = await this.onRoute(match, button);
        if (this.isOpen && version === this.version) feedback.textContent = opened ? '' : 'Rota indisponível agora. Aguarde o globo ou tente novamente.';
      } catch {
        if (this.isOpen && version === this.version) feedback.textContent = 'Não foi possível carregar o aeroporto. Tente novamente com conexão.';
      } finally {
        controls.forEach(control => { if (control.isConnected) control.disabled = false; });
      }
    }
  }

  destroy() {
    this.close();
    this.element.removeEventListener('click', this.handleClick);
  }
}
