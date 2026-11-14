// Painel do Planner v0. Carregado sob demanda pelo app. Mostra a viagem ativa:
// destino, datas, viajantes, origem, orçamento e gastos por categoria.
// Tudo é salvo no navegador pelo trip.store; nenhum dado sai do aparelho.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { parseBrazilianNumber } from '../miles.tools.js';
import {
  BUDGET_CATEGORIES, LINE_STATUSES, MAX_LINES, MAX_TRAVELERS,
  addLine, removeLine, tripDays, tripTotals, updateLine, updateTrip
} from './trip.model.js';

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function formatBRL(value, { cents = false } = {}) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(value ?? 0);
}

// Valor digitado ("1.234,56", "1234.5", "R$ 800") → número, ou null.
export function parseMoneyInput(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return parseBrazilianNumber(raw);
}

function moneyInputValue(value) {
  return value === null || value === undefined ? '' : String(value).replace('.', ',');
}

export class PlannerUI {
  /**
   * @param {object} options
   * @param {HTMLElement} options.element   Contêiner do conteúdo do painel.
   * @param {object} options.store          createTripStore().
   * @param {object} options.countries      COUNTRIES.
   * @param {(countryKey: string, tab?: string) => void} options.onShowCountry
   * @param {object[]} [options.sections]   Seções extras: { id, render(trip, ui), bind?(root, trip, ui) }.
   */
  constructor({ element, store, countries, onShowCountry, sections = [] }) {
    Object.assign(this, { element, store, countries, onShowCountry, sections });
    this.confirmingDelete = false;
    this.handleChange = event => this.#change(event);
    this.handleClick = event => this.#click(event);
    element.addEventListener('change', this.handleChange);
    element.addEventListener('click', this.handleClick);
    this.unsubscribe = store.subscribe(() => this.#refreshSummary());
  }

  get trip() {
    return this.store.active();
  }

  render() {
    const trip = this.trip;
    this.confirmingDelete = false;
    if (!trip) {
      this.element.innerHTML = `
        <div class="planner-empty">
          <p><strong>Nenhuma viagem planejada ainda.</strong></p>
          <p>Abra um país no globo ou na busca e toque em “Planejar viagem”. A viagem fica salva neste navegador.</p>
        </div>`;
      return;
    }
    const country = this.countries[trip.countryKey];
    this.element.innerHTML = `
      ${this.#tripSwitcher(trip)}
      <section class="planner-destination" aria-label="Destino">
        <span class="planner-destination__flag" aria-hidden="true">${escapeHtml(country?.flag || '🌍')}</span>
        <div>
          <span class="eyebrow">${escapeHtml(country?.region || 'Destino')}</span>
          <h3 class="planner-destination__name">${escapeHtml(country?.namePt || trip.countryKey)}</h3>
        </div>
        <button class="secondary-button" type="button" data-planner-action="show-country">Ver país</button>
      </section>
      ${this.#basics(trip)}
      <section class="planner-section" aria-labelledby="planner-budget-title">
        <div class="planner-section__head">
          <h3 class="planner-section__title" id="planner-budget-title">Orçamento</h3>
        </div>
        <div class="planner-summary" id="planner-summary">${this.#summary(trip)}</div>
        <div class="planner-lines" id="planner-lines">${this.#lines(trip)}</div>
        <div class="planner-line-actions">
          <button class="secondary-button" type="button" data-planner-action="add-line" ${trip.lines.length >= MAX_LINES ? 'disabled' : ''}>＋ Adicionar gasto</button>
        </div>
        <p class="planner-hint">Use <strong>Cotação</strong> para preços que você encontrou e <strong>Pago</strong> para o que já foi pago.</p>
      </section>
      ${this.sections.map(section => section.render(trip, this)).join('')}
      <footer class="planner-footer">
        ${this.store.persistent
          ? '<p class="planner-saved">Salvo neste navegador. Limpar os dados do navegador apaga as viagens.</p>'
          : '<p class="planner-saved planner-saved--warning" role="status">Este navegador não permite salvar. A viagem fica disponível só até fechar a página.</p>'}
        <div class="planner-delete" id="planner-delete">${this.#deleteControls()}</div>
      </footer>`;
    for (const section of this.sections) section.bind?.(this.element, trip, this);
  }

  destroy() {
    this.element.removeEventListener('change', this.handleChange);
    this.element.removeEventListener('click', this.handleClick);
    this.unsubscribe?.();
  }

  // Atualiza resumo e seções (ex.: checklist marcado no painel do país).
  refresh() {
    this.#refreshSummary();
  }

  // Grava a viagem ativa com as mudanças informadas.
  update(changes) {
    const trip = this.trip;
    if (!trip) return null;
    return this.store.save(updateTrip(trip, changes));
  }

  addLine(line) {
    const trip = this.trip;
    if (!trip) return null;
    const saved = this.store.save(addLine(trip, line));
    this.#rerenderLines();
    return saved;
  }

  #tripSwitcher(trip) {
    const trips = this.store.trips;
    if (trips.length < 2) return '';
    return `
      <label class="form-field planner-switcher" for="planner-trip-select">
        <span class="form-field__label">Viagem</span>
        <select class="form-field__control" id="planner-trip-select" data-planner-field="active-trip">
          ${trips.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === trip.id ? 'selected' : ''}>${escapeHtml(this.countries[item.countryKey]?.namePt || item.countryKey)}${item.startDate ? ` · ${escapeHtml(item.startDate.split('-').reverse().join('/'))}` : ''}</option>`).join('')}
        </select>
      </label>`;
  }

  #basics(trip) {
    const days = tripDays(trip);
    const month = trip.startDate ? MONTH_NAMES[Number(trip.startDate.slice(5, 7)) - 1] : null;
    return `
      <section class="planner-section" aria-labelledby="planner-basics-title">
        <div class="planner-section__head">
          <h3 class="planner-section__title" id="planner-basics-title">Dados da viagem</h3>
          <span class="planner-section__meta" id="planner-days">${days ? `${days} ${days === 1 ? 'dia' : 'dias'}${month ? ` · ${month}` : ''}` : 'Defina as datas'}</span>
        </div>
        <div class="form-grid">
          <label class="form-field" for="planner-start"><span class="form-field__label">Ida</span>
            <input class="form-field__control" id="planner-start" type="date" value="${escapeHtml(trip.startDate || '')}" data-planner-field="startDate"></label>
          <label class="form-field" for="planner-end"><span class="form-field__label">Volta</span>
            <input class="form-field__control" id="planner-end" type="date" value="${escapeHtml(trip.endDate || '')}" min="${escapeHtml(trip.startDate || '')}" data-planner-field="endDate"></label>
          <label class="form-field" for="planner-travelers"><span class="form-field__label">Viajantes</span>
            <input class="form-field__control" id="planner-travelers" type="number" min="1" max="${MAX_TRAVELERS}" step="1" inputmode="numeric" value="${trip.travelers}" data-planner-field="travelers"></label>
          <label class="form-field" for="planner-origin"><span class="form-field__label">Origem (IATA)</span>
            <input class="form-field__control" id="planner-origin" type="text" maxlength="4" autocomplete="off" value="${escapeHtml(trip.origin)}" data-planner-field="origin"></label>
          <label class="form-field form-field--wide" for="planner-budget"><span class="form-field__label">Orçamento total (R$), opcional</span>
            <input class="form-field__control" id="planner-budget" type="text" inputmode="decimal" autocomplete="off" placeholder="Ex.: 25.000" value="${escapeHtml(moneyInputValue(trip.budgetBRL))}" data-planner-field="budgetBRL"></label>
        </div>
      </section>`;
  }

  #summary(trip) {
    const totals = tripTotals(trip);
    const ratio = totals.budget ? Math.min(1, totals.total / totals.budget) : 0;
    return `
      <div class="planner-summary__grid">
        <div><span class="planner-summary__label">Planejado</span><strong class="planner-summary__value">${formatBRL(totals.total)}</strong></div>
        <div><span class="planner-summary__label">Por pessoa</span><strong class="planner-summary__value">${formatBRL(totals.perPerson)}</strong></div>
        <div><span class="planner-summary__label">${totals.budget === null ? 'Orçamento' : totals.overBudget ? 'Acima do orçamento' : 'Disponível'}</span>
          <strong class="planner-summary__value ${totals.overBudget ? 'planner-summary__value--over' : ''}">${totals.budget === null ? '—' : formatBRL(Math.abs(totals.remaining))}</strong></div>
        <div><span class="planner-summary__label">Já pago</span><strong class="planner-summary__value">${formatBRL(totals.byStatus.paid)}</strong></div>
      </div>
      ${totals.budget !== null ? `
        <div class="planner-meter ${totals.overBudget ? 'planner-meter--over' : ''}" role="meter" aria-label="Uso do orçamento" aria-valuemin="0" aria-valuemax="${totals.budget}" aria-valuenow="${Math.min(totals.total, totals.budget)}">
          <span style="width:${(ratio * 100).toFixed(1)}%"></span>
        </div>` : ''}
      <p class="planner-summary__split">${Object.entries(LINE_STATUSES).map(([status, label]) => `${label}: ${formatBRL(totals.byStatus[status])}`).join(' · ')}</p>
      ${provenanceLabel('calculated', { detail: 'soma dos gastos desta viagem' })}`;
  }

  #lines(trip) {
    if (!trip.lines.length) return '<p class="planner-lines__empty">Nenhum gasto ainda. Adicione voos, hospedagem e o que mais fizer parte da viagem.</p>';
    return trip.lines.map((line, index) => `
      <div class="planner-line" data-line-id="${escapeHtml(line.id)}" role="group" aria-label="Gasto ${index + 1}">
        <select class="form-field__control planner-line__category" aria-label="Categoria do gasto ${index + 1}" data-line-field="category">
          ${BUDGET_CATEGORIES.map(category => `<option value="${category.id}" ${category.id === line.category ? 'selected' : ''}>${category.label}</option>`).join('')}
        </select>
        <input class="form-field__control planner-line__note" type="text" maxlength="120" aria-label="Descrição do gasto ${index + 1}" placeholder="Descrição" value="${escapeHtml(line.note)}" data-line-field="note">
        <input class="form-field__control planner-line__amount" type="text" inputmode="decimal" aria-label="Valor do gasto ${index + 1} em reais" value="${escapeHtml(moneyInputValue(line.amountBRL))}" data-line-field="amountBRL">
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

  #refreshSummary() {
    const trip = this.trip;
    const summary = this.element.querySelector('#planner-summary');
    if (!trip || !summary) return;
    summary.innerHTML = this.#summary(trip);
    const days = tripDays(trip);
    const month = trip.startDate ? MONTH_NAMES[Number(trip.startDate.slice(5, 7)) - 1] : null;
    const daysElement = this.element.querySelector('#planner-days');
    if (daysElement) daysElement.textContent = days ? `${days} ${days === 1 ? 'dia' : 'dias'}${month ? ` · ${month}` : ''}` : 'Defina as datas';
    const end = this.element.querySelector('#planner-end');
    if (end) end.min = trip.startDate || '';
    for (const section of this.sections) section.refresh?.(this.element, trip, this);
  }

  #rerenderLines(focusLineId = null, field = 'amountBRL') {
    const trip = this.trip;
    const container = this.element.querySelector('#planner-lines');
    if (!trip || !container) return;
    container.innerHTML = this.#lines(trip);
    const addButton = this.element.querySelector('[data-planner-action="add-line"]');
    if (addButton) addButton.disabled = trip.lines.length >= MAX_LINES;
    if (focusLineId) container.querySelector(`[data-line-id="${CSS.escape(focusLineId)}"] [data-line-field="${field}"]`)?.focus();
  }

  #change(event) {
    const target = event.target;
    const trip = this.trip;
    if (!trip) return;
    const field = target.dataset.plannerField;
    if (field === 'active-trip') {
      this.store.setActive(target.value);
      this.render();
      return;
    }
    if (field) {
      let value = target.value;
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
      // Mostra o valor como foi guardado (datas trocadas, viajantes limitados, código em maiúsculas).
      if (saved && field !== 'budgetBRL') {
        for (const input of this.element.querySelectorAll('[data-planner-field="startDate"], [data-planner-field="endDate"], [data-planner-field="travelers"], [data-planner-field="origin"]')) {
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
      value = parseMoneyInput(value);
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
    const button = event.target.closest('[data-planner-action]');
    if (!button || !this.element.contains(button)) return;
    const trip = this.trip;
    const action = button.dataset.plannerAction;
    if (action === 'show-country' && trip) this.onShowCountry?.(trip.countryKey);
    if (action === 'add-line' && trip) {
      const saved = this.store.save(addLine(trip, { category: 'other', amountBRL: 0, status: 'estimate' }));
      this.#rerenderLines(saved.lines.at(-1)?.id, 'category');
    }
    if (action === 'remove-line' && trip) {
      const row = button.closest('[data-line-id]');
      this.store.save(removeLine(trip, row.dataset.lineId));
      this.#rerenderLines();
      this.element.querySelector('[data-planner-action="add-line"]')?.focus();
    }
    if (action === 'delete' || action === 'delete-cancel') {
      this.confirmingDelete = action === 'delete';
      this.element.querySelector('#planner-delete').innerHTML = this.#deleteControls();
      this.element.querySelector(this.confirmingDelete ? '.planner-delete__confirm' : '[data-planner-action="delete"]')?.focus();
    }
    if (action === 'delete-confirm' && trip) {
      this.store.remove(trip.id);
      this.render();
    }
  }
}
