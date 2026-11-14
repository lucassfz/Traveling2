import { escapeHtml } from './core/html.js';

// Etiqueta única para dizer de onde vem cada número exibido: dado verificado em
// fonte oficial, dado ao vivo, estimativa do próprio Traveling ou cálculo feito
// com valores digitados pelo usuário. Sempre texto + cor (nunca só cor).

export const PROVENANCE_KINDS = Object.freeze({
  verified: 'Verificado',
  live: 'Ao vivo',
  estimate: 'Estimativa Traveling',
  calculated: 'Calculado com seus valores',
  unverified: 'Pendente de verificação'
});

export function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

// 'AAAA-MM' → "set. de 2026"; 'AAAA-MM-DD' → "21/08/2026". Outros formatos
// voltam como texto, para nunca esconder a data que a fonte informou.
export function formatProvenanceDate(value) {
  const text = String(value ?? '').trim();
  let match = /^(\d{4})-(\d{2})$/.exec(text);
  if (match) {
    const month = Number(match[2]);
    if (month < 1 || month > 12) return text;
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(Number(match[1]), month - 1, 1)));
  }
  match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return text;
}

/**
 * Markup de uma etiqueta de procedência.
 * @param {keyof PROVENANCE_KINDS} kind
 * @param {object} [options]
 * @param {string} [options.label]      Texto do tipo (padrão por `kind`).
 * @param {string} [options.date]       Data da verificação/consulta.
 * @param {string} [options.dateLabel]  Prefixo da data, ex. "revisado em".
 * @param {string} [options.detail]     Complemento curto.
 * @param {string} [options.source]     URL https da fonte; outras são ignoradas.
 * @param {string} [options.sourceText] Texto do link (padrão "Fonte").
 * @param {string} [options.tag]        'p' ou 'span'.
 * @param {string} [options.className]  Classes extras.
 */
export function provenanceLabel(kind, options = {}) {
  if (!Object.hasOwn(PROVENANCE_KINDS, kind)) throw new Error(`Tipo de procedência desconhecido: ${kind}`);
  const { label = PROVENANCE_KINDS[kind], date, dateLabel, detail, source, sourceText = 'Fonte', tag = 'p', className = '' } = options;
  const element = tag === 'span' ? 'span' : 'p';
  const parts = [];
  if (date) parts.push(`${dateLabel ? `${escapeHtml(dateLabel)} ` : ''}${escapeHtml(formatProvenanceDate(date))}`);
  if (detail) parts.push(escapeHtml(detail));
  const url = source ? safeHttpsUrl(source) : null;
  if (url) parts.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceText)}</a>`);
  const classes = ['provenance', `provenance--${kind}`, ...String(className).split(/\s+/).filter(Boolean)].map(escapeHtml).join(' ');
  return `<${element} class="${classes}"><span class="provenance__kind">${escapeHtml(label)}</span>${parts.map(part => `<span class="provenance__part">${part}</span>`).join('')}</${element}>`;
}
