// Conversão para reais no Planner. Funções puras: a interface passa as cotações
// já carregadas (boletim de fechamento do BCB e PTAX do dia, de fx.service.js).
//
// Regra contra conversão dupla: o valor original (na moeda digitada) é a única
// fonte. O valor em reais é sempre recalculado a partir dele, nunca a partir de
// outro valor em reais já convertido.

export const BASE_CURRENCY = 'BRL';

const isCode = value => /^[A-Z]{3}$/.test(String(value ?? ''));
const validRate = entry => Number.isFinite(entry?.rate) && entry.rate > 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(entry?.date ?? ''));

/**
 * Tabela de cotações (reais por 1 unidade da moeda, taxa de venda).
 * A cotação ao vivo (PTAX) vale quando não é mais antiga que o boletim.
 * @param {object} [options]
 * @param {{ date: string, rates: Record<string, { sell: number }>, sourceUrl?: string } | null} [options.snapshot]
 * @param {Record<string, { rate: number, date: string, kind?: string, label?: string, source?: string } | null>} [options.live]
 * @returns {Record<string, { rate: number, date: string, kind: string, label: string, source: string | null }>}
 */
export function rateTable({ snapshot = null, live = {} } = {}) {
  const table = {};
  if (snapshot?.rates && /^\d{4}-\d{2}-\d{2}$/.test(String(snapshot.date ?? ''))) {
    for (const [code, value] of Object.entries(snapshot.rates)) {
      if (isCode(code) && Number.isFinite(value?.sell) && value.sell > 0) {
        table[code] = { rate: value.sell, date: snapshot.date, kind: 'verified', label: 'Câmbio de referência (BCB, fechamento)', source: snapshot.sourceUrl ?? null };
      }
    }
  }
  for (const [code, value] of Object.entries(live ?? {})) {
    if (!isCode(code) || !validRate(value)) continue;
    if (table[code] && value.date < table[code].date) continue;
    table[code] = { rate: value.rate, date: value.date, kind: value.kind || 'live', label: value.label || 'Cotação PTAX (BCB)', source: value.source ?? null };
  }
  return table;
}

/** Cotação de uma moeda na tabela; real vale 1. null quando não há cotação. */
export function rateFor(code, table) {
  if (code === BASE_CURRENCY) return { rate: 1, date: null, kind: 'calculated', label: 'Real', source: null };
  const entry = table?.[code];
  return validRate(entry) ? entry : null;
}

/**
 * Valor numa moeda → reais, com a cotação usada.
 * @returns {{ amountBRL: number, rate: number, date: string | null } | null}
 */
export function convertToBRL(amount, code, table) {
  if (!Number.isFinite(amount) || amount < 0) return null;
  const entry = rateFor(code, table);
  if (!entry) return null;
  return { amountBRL: Math.round(amount * entry.rate * 100) / 100, rate: entry.rate, date: entry.date };
}

/**
 * Moedas oferecidas num gasto: real, a moeda do destino, dólar e euro, nesta
 * ordem e sem repetição. Só entram moedas com cotação (ou a já usada na linha).
 */
export function currencyChoices(destinationCode, table, current = null) {
  const wanted = [BASE_CURRENCY, destinationCode, 'USD', 'EUR', current];
  return [...new Set(wanted.filter(code => isCode(code) && (code === BASE_CURRENCY || code === current || rateFor(code, table))))];
}
