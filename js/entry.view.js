// Regras de entrada para passaporte brasileiro, com fonte e data de verificação.
// Antes ficava na aba "Entrada" do painel do país; agora aparece na etapa
// Preparação de cada viagem do Planner. Os dados vêm de entry.presentation.js.
import { escapeHtml } from './core/html.js';
import { entryPresentation } from './entry.presentation.js';

export function entryDetailsHtml(country) {
  const view = entryPresentation(country);
  const preparation = view.preparation.length
    ? `<ul class="entry-list">${view.preparation.map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`).join('')}</ul>`
    : '<div class="detail-card__value">Confirme os documentos exigidos para seu roteiro antes da viagem.</div>';
  const notes = view.notes.length
    ? `<article class="detail-card"><div class="detail-card__label">Atenção</div><ul class="entry-list">${view.notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul></article>`
    : '';
  const verified = /^\d{4}-\d{2}$/.test(view.verifiedAt || '') ? `${view.verifiedAt.slice(5)}/${view.verifiedAt.slice(0, 4)}` : null;
  const sources = view.sources.map(([label, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`).join(' · ');
  return `
    <div class="stack entry-details">
      <article class="detail-card detail-card--${escapeHtml(view.status.tone)}">
        <div class="detail-card__label">Status de entrada</div>
        <div class="detail-card__value"><strong class="entry-status__title">${escapeHtml(view.status.title)}</strong><span>${escapeHtml(view.status.detail)}</span></div>
      </article>
      <article class="detail-card"><div class="detail-card__label">Permanência</div><div class="detail-card__value">${escapeHtml(view.stay)}</div></article>
      <article class="detail-card"><div class="detail-card__label">Antes de viajar</div>${preparation}</article>
      ${notes}
      ${verified || sources ? `<p class="entry-source">${verified ? `Verificado em ${escapeHtml(verified)}` : ''}${verified && sources ? ' · ' : ''}${sources}</p>` : ''}
      <p class="entry-reminder">Regras para passaporte brasileiro comum. Outras nacionalidades ou dupla cidadania têm regras próprias. Regras de entrada e saúde podem mudar: confirme-as antes de viajar.</p>
    </div>`;
}
