// Câmbio oficial do Banco Central do Brasil.
// 1. Ao vivo: PTAX do dólar pela API Olinda do BCB (aceita chamadas do navegador).
// 2. Reserva: data/fx-snapshot.json, gerado por scripts/build-fx.js a partir do
//    boletim de fechamento PTAX (156 moedas). Sempre com data visível.
// Nenhuma taxa fixa no código: sem dado, a interface diz que o câmbio está indisponível.

export const PTAX_SOURCE_URL = 'https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes';
const PTAX_API = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/';
const SNAPSHOT_URL = new URL('../data/fx-snapshot.json', import.meta.url);
const SESSION_KEY = 'traveling.fx.ptax-usd';
const PTAX_LOOKBACK_DAYS = 7;
// Moedas com PTAX diária na API Olinda; as demais só existem no boletim de fechamento.
export const PTAX_CURRENCIES = Object.freeze(['AUD', 'CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'JPY', 'NOK', 'SEK', 'USD']);

const pad = value => String(value).padStart(2, '0');
const isoDate = date => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const ptaxDate = date => `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}-${date.getUTCFullYear()}`;

export function ptaxUsdUrl(now = new Date()) {
  return ptaxUrl('USD', now);
}

export function ptaxUrl(code, now = new Date()) {
  if (!PTAX_CURRENCIES.includes(code)) throw new Error(`Moeda sem PTAX diária: ${code}`);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end.getTime() - PTAX_LOOKBACK_DAYS * 86_400_000);
  return `${PTAX_API}CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)`
    + `?@moeda='${code}'&@dataInicial='${ptaxDate(start)}'&@dataFinalCotacao='${ptaxDate(end)}'`
    + '&$format=json&$select=cotacaoCompra,cotacaoVenda,dataHoraCotacao,tipoBoletim';
}

// Resposta da API Olinda → último boletim de *Fechamento* (a PTAX oficial do dia).
// Boletins de abertura e intermediários são ignorados.
export function parsePtaxResponse(json) {
  const closings = (Array.isArray(json?.value) ? json.value : [])
    .filter(item => item?.tipoBoletim === 'Fechamento'
      && Number.isFinite(item.cotacaoVenda) && item.cotacaoVenda > 0
      && /^\d{4}-\d{2}-\d{2}/.test(String(item.dataHoraCotacao ?? '')))
    .sort((a, b) => String(a.dataHoraCotacao).localeCompare(String(b.dataHoraCotacao)));
  const latest = closings.at(-1);
  if (!latest) return null;
  return {
    buy: Number(latest.cotacaoCompra),
    sell: Number(latest.cotacaoVenda),
    date: String(latest.dataHoraCotacao).slice(0, 10)
  };
}

// Boletim de fechamento (CSV sem cabeçalho):
// data;código;tipo;moeda;taxa compra;taxa venda;paridade compra;paridade venda
// Taxas em reais por 1 unidade da moeda, com vírgula decimal.
export function parseClosingCsv(text) {
  const rates = {};
  let date = null;
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const cells = line.trim().split(';');
    if (cells.length < 6) continue;
    const day = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(cells[0]);
    const code = cells[3];
    const buy = Number(cells[4].replace(',', '.'));
    const sell = Number(cells[5].replace(',', '.'));
    if (!day || !/^[A-Z]{3}$/.test(code) || !(buy > 0) || !(sell > 0)) continue;
    const rowDate = `${day[3]}-${day[2]}-${day[1]}`;
    if (date && rowDate !== date) throw new Error(`Boletim com datas misturadas: ${date} e ${rowDate}`);
    date = rowDate;
    rates[code] = { buy, sell };
  }
  if (!date || !rates.USD) throw new Error('Boletim de fechamento sem cotação do dólar.');
  return { date, rates };
}

// Moeda local por 1 real, usando a taxa de venda (custo de comprar a moeda).
export function localPerBrl(snapshot, code) {
  const sell = snapshot?.rates?.[code]?.sell;
  return Number.isFinite(sell) && sell > 0 ? 1 / sell : null;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

const sessionKey = code => code === 'USD' ? SESSION_KEY : `traveling.fx.ptax-${code.toLowerCase()}`;

function readSession(code) {
  try {
    const value = JSON.parse(sessionStorage.getItem(sessionKey(code)));
    return Number.isFinite(value?.sell) && value?.date ? value : null;
  } catch {
    return null;
  }
}

function writeSession(code, value) {
  try {
    sessionStorage.setItem(sessionKey(code), JSON.stringify(value));
  } catch {
    // Sem armazenamento: só perde o cache da sessão.
  }
}

let snapshotPromise = null;
export function loadFxSnapshot() {
  snapshotPromise ??= (async () => {
    if (SNAPSHOT_URL.protocol === 'file:') {
      const { readFile } = await import('node:fs/promises');
      return JSON.parse(await readFile(SNAPSHOT_URL, 'utf8'));
    }
    const response = await fetchWithTimeout(SNAPSHOT_URL, 8000);
    if (!response.ok) throw new Error(`Falha ao carregar câmbio de referência (${response.status}).`);
    return response.json();
  })().catch(error => {
    snapshotPromise = null;
    throw error;
  });
  return snapshotPromise;
}

/**
 * Cotação do dólar em reais para estimativas.
 * @returns {Promise<{ rate: number, date: string, kind: 'live' | 'verified', label: string, source: string } | null>}
 */
export function resolveUsdRate(options) {
  return resolveCurrencyRate('USD', options);
}

/**
 * Reais por 1 unidade de `code` (taxa de venda). Moeda com PTAX diária: cotação
 * do dia pela API Olinda; demais moedas, ou falha da API: boletim de fechamento
 * versionado. Mesmo formato de resolveUsdRate, com `code`.
 * @returns {Promise<{ code: string, rate: number, date: string, kind: 'live' | 'verified', label: string, source: string } | null>}
 */
export async function resolveCurrencyRate(code, { now = new Date(), timeoutMs = 6000 } = {}) {
  if (!/^[A-Z]{3}$/.test(String(code ?? ''))) return null;
  if (PTAX_CURRENCIES.includes(code)) {
    const cached = readSession(code);
    if (cached && cached.checkedOn === isoDate(now)) return ptaxResult(code, cached);
    try {
      const response = await fetchWithTimeout(ptaxUrl(code, now), timeoutMs);
      if (response.ok) {
        const parsed = parsePtaxResponse(await response.json());
        if (parsed) {
          writeSession(code, { ...parsed, checkedOn: isoDate(now) });
          return ptaxResult(code, parsed);
        }
      }
    } catch {
      // Segue para o boletim versionado.
    }
  }
  try {
    const snapshot = await loadFxSnapshot();
    const rate = snapshot?.rates?.[code];
    if (Number.isFinite(rate?.sell) && rate.sell > 0 && snapshot.date) {
      return { code, rate: rate.sell, date: snapshot.date, kind: 'verified', label: 'Câmbio de referência (BCB, fechamento)', source: snapshot.sourceUrl || PTAX_SOURCE_URL };
    }
  } catch {
    // Sem nenhuma fonte: quem chama mostra "câmbio indisponível".
  }
  return null;
}

function ptaxResult(code, value) {
  return { code, rate: value.sell, date: value.date, kind: 'live', label: 'Cotação PTAX (BCB)', source: PTAX_SOURCE_URL };
}
