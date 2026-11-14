// Etapa "Preparação" do Planner: dona das regras de entrada e do checklist de
// cada viagem. O checklist é salvo dentro da viagem (trip.checklist), então
// marcar um item numa viagem não muda nenhuma outra, mesmo que seja do mesmo país.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { checklistGroups, checklistProgress } from '../checklist.engine.js';
import { entryPresentation } from '../entry.presentation.js';
import { entryDetailsHtml } from '../entry.view.js';
import { setChecklistItems, tripMonth } from './trip.model.js';

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/**
 * @param {object} deps
 * @param {object} deps.countries
 */
export function createPrepSection({ countries }) {
  const groupsFor = trip => checklistGroups(trip.countryKey, countries[trip.countryKey], tripMonth(trip) ?? new Date().getMonth());

  function entryHtml(trip) {
    const country = countries[trip.countryKey];
    const entry = entryPresentation(country);
    const official = entry.sources.find(([label]) => label === 'Fonte oficial de entrada')?.[1];
    const domestic = country.visaPolicyBR?.eligibility === 'domestic';
    return `
      <div class="planner-prep__row">
        <div>
          <strong class="planner-prep__status planner-prep__status--${escapeHtml(entry.status.tone)}">${escapeHtml(entry.status.title)}</strong>
          <span class="planner-hint">${escapeHtml(entry.status.detail)}</span>
        </div>
      </div>
      ${domestic ? ''
        : official && entry.verifiedAt
          ? provenanceLabel('verified', { date: entry.verifiedAt, dateLabel: 'em', source: official, sourceText: 'Fonte oficial', detail: 'confirme antes de comprar a passagem' })
          : provenanceLabel('unverified', { detail: 'regra ainda sem fonte oficial verificada; confirme no consulado' })}
      <details class="planner-prep__details">
        <summary>Ver regras completas</summary>
        ${entryDetailsHtml(country)}
      </details>`;
  }

  function progressHtml(trip, groups) {
    const { done, total } = checklistProgress(groups, trip.checklist);
    const month = tripMonth(trip);
    return `
      <div class="planner-prep__row">
        <div>
          <strong>${done} de ${total} ${total === 1 ? 'item concluído' : 'itens concluídos'}</strong>
          <span class="planner-hint">${month === null ? 'Defina o mês ou a data de ida para incluir dicas da época.' : `Inclui dicas para ${MONTH_NAMES[month]}, mês da ida.`}</span>
        </div>
      </div>
      <div class="planner-meter planner-meter--success" role="progressbar" aria-label="Checklist da viagem" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
        <span style="width:${(total ? done / total * 100 : 0).toFixed(1)}%"></span>
      </div>`;
  }

  function checklistHtml(trip) {
    const groups = groupsFor(trip);
    if (!groups.length) return '<p class="planner-hint">Ainda não há checklist para este destino.</p>';
    return `
      <div data-prep-progress>${progressHtml(trip, groups)}</div>
      <div class="checklist planner-checklist">
        ${groups.map(group => `
          <section class="checklist__group">
            <h5 class="checklist__title">${escapeHtml(group.group)}</h5>
            ${group.items.map(item => {
              const complete = Boolean(trip.checklist[item.key]);
              return `<button class="checklist__item ${complete ? 'checklist__item--complete' : ''}" type="button" aria-pressed="${complete}" data-prep-item="${escapeHtml(item.key)}">
                <span class="checklist__box" aria-hidden="true">${complete ? '✓' : ''}</span>
                <span aria-hidden="true">${escapeHtml(item.icon || '•')}</span>
                <span class="checklist__label">${escapeHtml(item.label)}</span>
              </button>`;
            }).join('')}
          </section>`).join('')}
      </div>
      <div class="checklist__actions">
        <button class="secondary-button" type="button" data-prep-all="true">Marcar tudo</button>
        <button class="secondary-button" type="button" data-prep-all="false">Limpar</button>
      </div>`;
  }

  return {
    id: 'prep',
    step: 5,
    render(trip) {
      return `
        <div id="planner-prep">
          <h4 class="planner-block-title">Documentos e entrada</h4>
          <div class="planner-card" id="planner-prep-entry">${entryHtml(trip)}</div>
          <label class="planner-confirm">
            <input type="checkbox" data-planner-field="entryReviewed" ${trip.entryReviewed ? 'checked' : ''}>
            <span><strong>Conferi as regras de entrada e meus documentos</strong>
            <span class="planner-hint">Passaporte válido, visto ou autorização eletrônica, vacinas e seguro, conforme a fonte oficial.</span></span>
          </label>
          <h4 class="planner-block-title">Checklist desta viagem</h4>
          <div class="planner-card" id="planner-prep-checklist">${checklistHtml(trip)}</div>
        </div>`;
    },
    bind(root, _trip, ui) {
      root.querySelector('#planner-prep-checklist')?.addEventListener('click', event => {
        const trip = ui.trip;
        if (!trip) return;
        const item = event.target.closest('[data-prep-item]');
        const all = event.target.closest('[data-prep-all]');
        if (item) {
          const key = item.dataset.prepItem;
          ui.store.save(setChecklistItems(trip, [key], !trip.checklist[key]));
        } else if (all) {
          const keys = groupsFor(trip).flatMap(group => group.items.map(entry => entry.key));
          ui.store.save(setChecklistItems(trip, keys, all.dataset.prepAll === 'true'));
        }
      });
    },
    // Atualiza marcações e progresso sem redesenhar (mantém o foco no item).
    refresh(root, trip) {
      const slot = root.querySelector('#planner-prep-checklist');
      if (!slot) return;
      const groups = groupsFor(trip);
      const buttons = [...slot.querySelectorAll('[data-prep-item]')];
      const keys = groups.flatMap(group => group.items.map(item => item.key));
      // Mês mudou e a lista de itens também: redesenha.
      if (buttons.length !== keys.length || buttons.some((button, index) => button.dataset.prepItem !== keys[index])) {
        slot.innerHTML = checklistHtml(trip);
        return;
      }
      for (const button of buttons) {
        const complete = Boolean(trip.checklist[button.dataset.prepItem]);
        button.classList.toggle('checklist__item--complete', complete);
        button.setAttribute('aria-pressed', String(complete));
        button.querySelector('.checklist__box').textContent = complete ? '✓' : '';
      }
      const progress = slot.querySelector('[data-prep-progress]');
      if (progress) progress.innerHTML = progressHtml(trip, groups);
    }
  };
}
