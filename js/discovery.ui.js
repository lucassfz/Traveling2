import { BUDGETS, CLIMATES, DISCOVERY_MONTHS, INTERESTS, TRIP_REFERENCE } from './destination.profiles.js';
import { formatTripRange, nextDiscoveryIndex, noMatchAdvice, rankDestinations } from './destination.discovery.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// Owns only this compact panel. Country details, globe and flight remain in app.
export class DiscoveryUI {
  constructor({ element, trigger, countries, onHighlight, onExplore, onRoute, onClose }) {
    Object.assign(this, { element, trigger, countries, onHighlight, onExplore, onRoute, onClose });
    this.preferences = { interests: [], climate: 'any', budget: 'any', month: new Date().getMonth(), visaFree: false };
    this.step = 1;
    this.matches = [];
    this.index = 0;
    this.version = 0;
    this.handleClick = event => this.click(event);
    this.handleChange = event => {
      if (event.target.id === 'discovery-budget') this.preferences.budget = event.target.value;
      if (event.target.id === 'discovery-visa') this.preferences.visaFree = event.target.checked;
    };
    element.addEventListener('click', this.handleClick);
    element.addEventListener('change', this.handleChange);
  }

  get isOpen() { return !this.element.hidden; }

  open() {
    this.element.hidden = false;
    this.element.inert = false;
    this.trigger.setAttribute('aria-expanded', 'true');
    if (this.step === 'loading') this.step = 3;
    this.render();
    if (this.step === 'result' && this.matches.length) this.onHighlight(this.matches[this.index]);
  }

  close(restoreFocus = false) {
    if (!this.isOpen) return;
    this.version += 1;
    clearTimeout(this.timer);
    this.element.hidden = true;
    this.element.inert = true;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.onClose?.();
    if (restoreFocus) this.trigger.focus({ preventScroll: true });
  }

  render(focus = true) {
    let body;
    let title = 'Para onde você deveria ir?';
    if (this.step === 1) body = `
      <p>Conte um pouco sobre a viagem. O que você procura?</p>
      <div class="discovery-options" role="group" aria-label="Interesses da viagem">${Object.entries(INTERESTS).map(([id, label]) => `<button type="button" data-interest="${id}" aria-pressed="${this.preferences.interests.includes(id)}" ${this.preferences.interests.length === 2 && !this.preferences.interests.includes(id) ? 'disabled' : ''}>${label}</button>`).join('')}</div>
      <small>Escolha 1 ou 2, na ordem de preferência. Toque novamente para remover.</small>
      <button class="primary-button" data-action="next" ${this.preferences.interests.length ? '' : 'disabled'}>Continuar</button>`;
    else if (this.step === 2) body = `
      <p>Qual clima combina com você?</p>
      <div class="discovery-options" role="group" aria-label="Clima da viagem">${Object.entries(CLIMATES).map(([id, label]) => `<button type="button" data-climate="${id}" aria-pressed="${this.preferences.climate === id}">${label}</button>`).join('')}</div>
      <label class="form-field" for="discovery-budget"><span>Quanto pretende gastar?</span><select class="form-field__control" id="discovery-budget">${BUDGETS.map(band => `<option value="${band.id}" ${this.preferences.budget === band.id ? 'selected' : ''}>${band.label}</option>`).join('')}</select></label>
      <details><summary>O que entra nessa estimativa?</summary><p>${escape(TRIP_REFERENCE)}</p></details>
      <div class="discovery-nav"><button class="secondary-button" data-action="back">Voltar</button><button class="primary-button" data-action="next">Continuar</button></div>`;
    else if (this.step === 3) body = `
      <p>Quando pretende viajar?</p>
      <div class="discovery-months" role="group" aria-label="Mês da descoberta">${DISCOVERY_MONTHS.map((month, index) => `<button type="button" data-month="${index}" aria-pressed="${this.preferences.month === index}">${month}</button>`).join('')}</div>
      <label class="discovery-check"><input type="checkbox" id="discovery-visa" ${this.preferences.visaFree ? 'checked' : ''}> 🛂 Priorizar destinos sem visto</label>
      <small>É uma preferência, não uma restrição. eVisa, visto na chegada e autorização eletrônica não recebem esse bônus.</small>
      <div class="discovery-nav"><button class="secondary-button" data-action="back">Voltar</button><button class="primary-button" data-action="find">Encontrar meu destino</button></div>`;
    else if (this.step === 'loading') body = '<p role="status" class="discovery-loading">✦ Encontrando boas combinações…</p>';
    else if (!this.matches.length) {
      title = 'Vamos ajustar a viagem?';
      body = `<p role="status">Não encontramos uma combinação forte com todos esses filtros.</p><p>${escape(noMatchAdvice(this.countries, this.preferences))}</p><small>A busca considera apenas os roteiros com perfil editorial disponível, não todos os países do mundo.</small><button class="primary-button" data-action="edit">Editar preferências</button>`;
    } else {
      const match = this.matches[this.index];
      title = `${match.country.flag} ${match.country.namePt}`;
      body = `<p class="discovery-region">${escape(match.profile.region)} · ${DISCOVERY_MONTHS[this.preferences.month]}</p>
        <small>${escape(match.matchSummary)}</small>
        <strong class="discovery-price">${formatTripRange(match.range)} <small>/ pessoa · 7 dias</small></strong>
        <small>Faixa de planejamento, não cotação. Saída de GRU; conexões podem ser necessárias.</small>
        <ul class="discovery-reasons">${match.reasons.slice(0, 2).map(reason => `<li>${escape(reason)}</li>`).join('')}</ul>
        <small>${escape(match.reasons[3])}</small>
        <details><summary>Temporada, entrada e cuidados</summary><p>${escape(match.reasons[2])}</p>${match.reasons.slice(4).map(reason => `<p>${escape(reason)}</p>`).join('')}<p>${escape(match.profile.note)}</p><p>${escape(TRIP_REFERENCE)}</p></details>
        <div class="discovery-result-actions">
          <button class="primary-button" data-action="explore">Explorar ${escape(match.country.namePt)}</button>
          <button class="secondary-button" data-action="route">✈ Ver rota saindo de GRU</button>
          <button class="discovery-text-button" data-action="another" ${this.matches.length < 2 ? 'disabled' : ''}>↻ Mostrar outro destino</button>
        </div>
        <p class="discovery-feedback" role="status"></p>
        <button class="discovery-text-button" data-action="edit">Editar preferências</button>`;
    }
    this.element.innerHTML = `<div class="discovery-header"><span class="eyebrow">${typeof this.step === 'number' ? `Sua viagem · ${this.step} de 3` : 'Sua próxima viagem'}</span><button class="icon-button" aria-label="Fechar descoberta" data-action="close">✕</button></div><h2 id="discovery-title" tabindex="-1">${escape(title)}</h2>${body}`;
    if (focus) this.element.querySelector('h2').focus({ preventScroll: true });
  }

  async click(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    const { interest, climate, month, action } = button.dataset;
    if (interest || climate || month !== undefined) {
      if (interest) {
        const selected = this.preferences.interests;
        this.preferences.interests = selected.includes(interest) ? selected.filter(value => value !== interest) : [...selected, interest].slice(0, 2);
      }
      if (climate) this.preferences.climate = climate;
      if (month !== undefined) this.preferences.month = Number(month);
      this.render(false);
      const selector = interest ? `[data-interest="${interest}"]` : climate ? `[data-climate="${climate}"]` : `[data-month="${month}"]`;
      this.element.querySelector(selector)?.focus({ preventScroll: true });
      return;
    }
    if (action === 'close') { this.close(true); return; }
    if (action === 'next') this.step += 1;
    if (action === 'back') this.step -= 1;
    if (action === 'edit') this.step = 1;
    if (action === 'find') {
      this.matches = rankDestinations(this.countries, this.preferences);
      this.index = 0;
      this.step = 'loading';
      this.render();
      const version = ++this.version;
      const finish = () => {
        if (!this.isOpen || version !== this.version) return;
        this.step = 'result';
        this.render();
        if (this.matches.length) this.onHighlight(this.matches[0]);
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
      else this.timer = setTimeout(finish, 850);
      return;
    }
    if (action === 'another') {
      this.index = nextDiscoveryIndex(this.matches, this.index);
      this.onHighlight(this.matches[this.index]);
    }
    if (action === 'explore') { this.onExplore(this.matches[this.index], this.preferences); return; }
    if (action === 'route') {
      const version = this.version;
      const feedback = this.element.querySelector('.discovery-feedback');
      const controls = [...this.element.querySelectorAll('.discovery-result-actions button')];
      controls.forEach(control => { control.disabled = true; });
      feedback.textContent = 'Preparando rota no globo…';
      try {
        const opened = await this.onRoute(this.matches[this.index], button);
        if (this.isOpen && version === this.version) feedback.textContent = opened ? '' : 'Rota indisponível agora. Aguarde o globo ou tente novamente.';
      } catch {
        if (this.isOpen && version === this.version) feedback.textContent = 'Não foi possível carregar o aeroporto. Tente novamente com conexão.';
      } finally {
        controls.forEach(control => { control.disabled = control.dataset.action === 'another' && this.matches.length < 2; });
      }
      return;
    }
    this.version += 1;
    this.render();
  }

  destroy() {
    this.close();
    clearTimeout(this.timer);
    this.element.removeEventListener('click', this.handleClick);
    this.element.removeEventListener('change', this.handleChange);
  }
}
