// Comparar destinos lado a lado (até 3 países salvos): visto, melhor época,
// custo estimado de 7 dias, moeda, idioma, fuso e tomada. O preço de passagem
// (visto recentemente) entra depois, quando o backend responde.
import { escapeHtml } from './core/html.js';
import { ideaEstimates } from './planner/ideas.js';
import { flagImageUrl } from './country.exploration.js';

export const MAX_COMPARE = 3;
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const VISA = {
  'visa-free': ['Sem visto', 'good'],
  domestic: ['Destino nacional', 'good'],
  evisa: ['Visto eletrônico', 'warn'],
  'visa-on-arrival': ['Visto na chegada', 'warn'],
  authorization: ['Autorização eletrônica', 'warn'],
  'visa-required': ['Exige visto', 'bad'],
  unknown: ['Confirmar regra', 'warn']
};
const brl = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
const plain = value => String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s*\([A-Z]{3}\)/, '').trim();

/** Linhas da comparação (pura). @param {object[]} countries Registros de COUNTRIES. */
export function compareRows(countries, { month = new Date().getMonth() } = {}) {
  const estimates = ideaEstimates(countries.map(country => country.key)).items;
  return [
    {
      id: 'visa', label: 'Visto (brasileiros)',
      cells: countries.map(country => {
        const [text, tone] = VISA[country.visaPolicyBR?.eligibility] ?? VISA.unknown;
        return { text, tone };
      })
    },
    {
      id: 'now', label: `Época em ${MONTHS[month]}`,
      cells: countries.map(country => {
        const value = Array.isArray(country.months) ? country.months[month] : null;
        return value === 2 ? { text: 'Ótima', tone: 'good' } : value === 1 ? { text: 'Boa', tone: 'warn' } : value === 0 ? { text: 'Evitar', tone: 'bad' } : { text: '—' };
      })
    },
    {
      id: 'best', label: 'Melhores meses',
      cells: countries.map(country => ({ text: (Array.isArray(country.months) ? country.months.map((value, index) => (value === 2 ? MONTHS[index] : null)).filter(Boolean) : []).join(', ') || '—' }))
    },
    {
      id: 'cost', label: '7 dias, por pessoa (estimativa)',
      cells: estimates.map(item => ({ text: item.range ? `${brl(item.range.min)} – ${brl(item.range.max)}` : 'Sem estimativa' }))
    },
    { id: 'flight', label: 'Passagem de São Paulo (vista recentemente)', cells: countries.map(() => ({ text: '…', pending: true })) },
    { id: 'currency', label: 'Moeda', cells: countries.map(country => ({ text: plain(country.currency) || '—' })) },
    { id: 'lang', label: 'Idioma', cells: countries.map(country => ({ text: plain(country.lang) || '—' })) },
    { id: 'time', label: 'Fuso', cells: countries.map(country => ({ text: plain(country.timezoneLabel) || '—' })) },
    { id: 'plug', label: 'Tomada', cells: countries.map(country => ({ text: plain(country.voltage) || '—' })) }
  ];
}

/** Tabela: países nas colunas (rola na horizontal no celular). */
export function compareHtml(countries, options) {
  const rows = compareRows(countries, options);
  const head = countries.map(country => {
    const flag = flagImageUrl(country.alpha2);
    return `<th scope="col">${flag ? `<img src="${flag}" alt="" width="28" height="21" loading="lazy">` : ''}<span>${escapeHtml(country.namePt)}</span></th>`;
  }).join('');
  return `
    <div class="compare-scroll">
      <table class="compare-table">
        <thead><tr><td></td>${head}</tr></thead>
        <tbody>
          ${rows.map(row => `<tr data-compare-row="${row.id}"><th scope="row">${escapeHtml(row.label)}</th>${row.cells.map((cell, index) => `<td data-compare-cell="${index}" class="${cell.tone ? `compare--${cell.tone}` : ''}">${escapeHtml(cell.text)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="planner-hint">Estimativas do Traveling e preços vistos recentemente por outros viajantes: confira antes de comprar. Visto: confirme na fonte oficial.</p>`;
}
