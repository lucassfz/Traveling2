// Seção "Preparação" do planejador: progresso do checklist do país (o mesmo
// salvo pelo painel do país) e resumo das regras de entrada com fonte e data.
import { escapeHtml } from '../core/html.js';
import { provenanceLabel } from '../provenance.js';
import { checklistGroups, checklistProgress } from '../checklist.engine.js';
import { entryPresentation } from '../entry.presentation.js';
import { tripMonth } from './trip.model.js';

const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/**
 * @param {object} deps
 * @param {object} deps.countries
 * @param {() => object} deps.getChecklist  Estado salvo do checklist (chave → concluído).
 * @param {(countryKey: string, tab: string) => void} deps.onOpenCountryTab
 */
export function createPrepSection({ countries, getChecklist, onOpenCountryTab }) {
  function checklistHtml(trip) {
    const country = countries[trip.countryKey];
    const month = tripMonth(trip);
    const groups = checklistGroups(trip.countryKey, country, month ?? new Date().getMonth());
    const { done, total } = checklistProgress(groups, getChecklist());
    const ratio = total ? done / total : 0;
    return `
      <div class="planner-prep__row">
        <div>
          <strong>${done} de ${total} ${total === 1 ? 'item' : 'itens'} do checklist</strong>
          <span class="planner-hint">${month === null ? 'Defina a data de ida para incluir dicas da época.' : `Inclui dicas para ${MONTH_NAMES[month]}, mês da ida.`}</span>
        </div>
        <button class="secondary-button" type="button" data-prep-action="checklist">Abrir checklist</button>
      </div>
      <div class="planner-meter" role="progressbar" aria-label="Checklist da viagem" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
        <span style="width:${(ratio * 100).toFixed(1)}%"></span>
      </div>`;
  }

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
        <button class="secondary-button" type="button" data-prep-action="entry">Ver regras de entrada</button>
      </div>
      ${domestic ? ''
        : official && entry.verifiedAt
          ? provenanceLabel('verified', { date: entry.verifiedAt, dateLabel: 'em', source: official, sourceText: 'Fonte oficial', detail: 'confirme antes de comprar a passagem' })
          : provenanceLabel('unverified', { detail: 'regra ainda sem fonte oficial verificada; confirme no consulado' })}`;
  }

  return {
    id: 'prep',
    render(trip) {
      return `
        <section class="planner-section" id="planner-prep" aria-labelledby="planner-prep-title">
          <div class="planner-section__head">
            <h3 class="planner-section__title" id="planner-prep-title">Preparação</h3>
          </div>
          <div class="planner-subsection" id="planner-prep-checklist">${checklistHtml(trip)}</div>
          <div class="planner-subsection" id="planner-prep-entry">${entryHtml(trip)}</div>
        </section>`;
    },
    bind(root, _trip, ui) {
      root.querySelector('#planner-prep')?.addEventListener('click', event => {
        const button = event.target.closest('[data-prep-action]');
        const trip = ui.trip;
        if (button && trip) onOpenCountryTab(trip.countryKey, button.dataset.prepAction);
      });
    },
    refresh(root, trip) {
      const checklist = root.querySelector('#planner-prep-checklist');
      if (checklist) checklist.innerHTML = checklistHtml(trip);
    }
  };
}
