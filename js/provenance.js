// Etiqueta única para dizer de onde vem cada número exibido: dado verificado em
// fonte oficial, dado ao vivo, estimativa do próprio Traveling ou cálculo feito
// com valores digitados pelo usuário. Sempre texto + cor (nunca só cor).

export const PROVENANCE_KINDS = Object.freeze({
  verified: 'Verificado',
  live: 'Ao vivo',
  estimate: 'Estimativa Traveling',
  // Busca de preços (fase 3.3): preço em cache de parceiro e dados do modo de teste.
  cached: 'Preço visto recentemente',
  test: 'Dados de teste',
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
 * Partes de uma etiqueta de procedência, prontas para <Provenance> (React).
 * @param {keyof PROVENANCE_KINDS} kind
 * @param {object} [options]
 * @param {string} [options.label]      Texto do tipo (padrão por `kind`).
 * @param {string} [options.date]       Data da verificação/consulta.
 * @param {string} [options.dateLabel]  Prefixo da data, ex. "revisado em".
 * @param {string} [options.detail]     Complemento curto.
 * @param {string} [options.source]     URL https da fonte; outras são ignoradas.
 * @param {string} [options.sourceText] Texto do link (padrão "Fonte").
 * @returns {{ kind: string, label: string, parts: { text: string, href?: string }[] }}
 */
export function provenanceParts(kind, { label = PROVENANCE_KINDS[kind], date, dateLabel, detail, source, sourceText = 'Fonte' } = {}) {
  if (!Object.hasOwn(PROVENANCE_KINDS, kind)) throw new Error(`Tipo de procedência desconhecido: ${kind}`);
  const parts = [];
  if (date) parts.push({ text: `${dateLabel ? `${dateLabel} ` : ''}${formatProvenanceDate(date)}` });
  if (detail) parts.push({ text: String(detail) });
  const href = source ? safeHttpsUrl(source) : null;
  if (href) parts.push({ text: sourceText, href });
  return { kind, label, parts };
}
