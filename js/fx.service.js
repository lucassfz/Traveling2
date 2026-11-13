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

const pad = value => String(value).padStart(2, '0');
const isoDate = date => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const ptaxDate = date => `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}-${date.getUTCFullYear()}`;

export function ptaxUsdUrl(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(end.getTime() - PTAX_LOOKBACK_DAYS * 86_400_000);
  return `${PTAX_API}CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)`
    + `?@moeda='USD'&@dataInicial='${ptaxDate(start)}'&@dataFinalCotacao='${ptaxDate(end)}'`
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

function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return Number.isFinite(value?.sell) && value?.date ? value : null;
  } catch {
    return null;
  }
}

function writeSession(value) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
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
export async function resolveUsdRate({ now = new Date(), timeoutMs = 6000 } = {}) {
  const cached = readSession();
  if (cached && cached.checkedOn === isoDate(now)) return ptaxResult(cached);
  try {
    const response = await fetchWithTimeout(ptaxUsdUrl(now), timeoutMs);
    if (response.ok) {
      const parsed = parsePtaxResponse(await response.json());
      if (parsed) {
        writeSession({ ...parsed, checkedOn: isoDate(now) });
        return ptaxResult(parsed);
      }
    }
  } catch {
    // Segue para o boletim versionado.
  }
  try {
    const snapshot = await loadFxSnapshot();
    const usd = snapshot?.rates?.USD;
    if (Number.isFinite(usd?.sell) && snapshot.date) {
      return { rate: usd.sell, date: snapshot.date, kind: 'verified', label: 'Câmbio de referência (BCB, fechamento)', source: snapshot.sourceUrl || PTAX_SOURCE_URL };
    }
  } catch {
    // Sem nenhuma fonte: quem chama mostra "câmbio indisponível".
  }
  return null;
}

function ptaxResult(value) {
  return { rate: value.sell, date: value.date, kind: 'live', label: 'Cotação PTAX (BCB)', source: PTAX_SOURCE_URL };
}
