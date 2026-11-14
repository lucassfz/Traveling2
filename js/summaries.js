// Resumos curtos (data/summaries.pt.json): abertura do artigo da Wikipédia em
// português, ligada por identificador (código ISO do país, Wikidata do lugar,
// ISO 3166-2 do estado, id do município em data/geo). Carregado uma vez, só
// quando um painel precisa dele. Sem arquivo ou sem rede, as telas seguem sem resumo.
import { escapeHtml } from './core/html.js';

const URL_SUMMARIES = new URL('../data/summaries.pt.json', import.meta.url);
let promise = null;
let loaded = null;

export function loadSummaries() {
  promise ??= fetch(URL_SUMMARIES)
    .then(response => (response.ok ? response.json() : null))
    .then(data => { loaded = data; return data; })
    .catch(() => { promise = null; return null; });
  return promise;
}

export function summariesIfLoaded() {
  return loaded;
}

/** Resumo pronto ou null. kind: countries | landmarks | divisions | places. */
export function summaryFor(kind, id) {
  return loaded?.[kind]?.[id] ?? null;
}

// Texto + crédito, sempre com link para o artigo e a licença.
export function summaryHtml(entry, { className = 'summary' } = {}) {
  if (!entry?.text) return '';
  return `
    <p class="${className}">${escapeHtml(entry.text)}
      <a class="summary__source" href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer">Wikipédia</a>
    </p>`;
}

// Foto de um estado ou cidade (imagem principal do artigo), com autor e licença.
export function summaryImageHtml(entry, alt) {
  const image = entry?.image;
  if (!image) return '';
  return `
    <figure class="geo-photo">
      <img src="${escapeHtml(image.url)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">
      <figcaption><a href="${escapeHtml(image.sourcePage)}" target="_blank" rel="noopener noreferrer">${escapeHtml(image.author)} · ${escapeHtml(image.license)}</a></figcaption>
    </figure>`;
}
