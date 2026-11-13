// Auditoria offline do câmbio (js/fx.service.js e data/fx-snapshot.json).
import assert from 'node:assert/strict';
import { COUNTRIES } from '../js/countries.dataset.js';
import { localPerBrl, loadFxSnapshot, parseClosingCsv, parsePtaxResponse, ptaxUsdUrl } from '../js/fx.service.js';

// PTAX: só o último boletim de Fechamento conta, mesmo com intermediários depois.
const ptax = parsePtaxResponse({ value: [
  { cotacaoCompra: 5.60, cotacaoVenda: 5.61, dataHoraCotacao: '2026-11-11 13:09:02.1', tipoBoletim: 'Fechamento' },
  { cotacaoCompra: 5.70, cotacaoVenda: 5.71, dataHoraCotacao: '2026-11-12 10:02:16.3', tipoBoletim: 'Abertura' },
  { cotacaoCompra: 5.6137, cotacaoVenda: 5.6143, dataHoraCotacao: '2026-11-12 13:05:24.9', tipoBoletim: 'Fechamento' },
  { cotacaoCompra: 5.80, cotacaoVenda: 5.81, dataHoraCotacao: '2026-11-13 11:09:10.3', tipoBoletim: 'Intermediário' }
] });
assert.deepEqual(ptax, { buy: 5.6137, sell: 5.6143, date: '2026-11-12' });
assert.equal(parsePtaxResponse({ value: [] }), null, 'sem boletim de fechamento');
assert.equal(parsePtaxResponse(null), null);
assert.equal(parsePtaxResponse({ value: [{ cotacaoVenda: -1, dataHoraCotacao: '2026-11-12 13:00', tipoBoletim: 'Fechamento' }] }), null);

// Janela de 7 dias cobre fim de semana e feriado; formato de data da API é MM-DD-AAAA.
const url = ptaxUsdUrl(new Date(Date.UTC(2026, 10, 15)));
assert.ok(url.includes("@dataInicial='11-08-2026'") && url.includes("@dataFinalCotacao='11-15-2026'"), url);
assert.ok(url.startsWith('https://olinda.bcb.gov.br/'));

// Boletim de fechamento (CSV).
const csv = '12/11/2026;040;A;CRC;0,01226000;0,01262000;444,82;458,00\r\n12/11/2026;220;A;USD;5,61370000;5,61430000;1,00;1,00\r\n\r\n';
assert.deepEqual(parseClosingCsv(csv), { date: '2026-11-12', rates: { CRC: { buy: 0.01226, sell: 0.01262 }, USD: { buy: 5.6137, sell: 5.6143 } } });
assert.throws(() => parseClosingCsv('12/11/2026;040;A;CRC;0,01;0,01;1;1'), /dólar/);
assert.throws(() => parseClosingCsv(`${csv}13/11/2026;470;A;JPY;0,035;0,035;1;1`), /misturadas/);

// Arquivo versionado.
const snapshot = await loadFxSnapshot();
assert.match(snapshot.date, /^\d{4}-\d{2}-\d{2}$/);
assert.ok(snapshot.file?.startsWith('https://www4.bcb.gov.br/Download/fechamento/'), 'origem do boletim');
for (const [code, rate] of Object.entries(snapshot.rates)) {
  assert.match(code, /^[A-Z]{3}$/);
  assert.ok(rate.buy > 0 && rate.sell > 0 && rate.sell >= rate.buy, `${code}: compra/venda`);
}
assert.ok(snapshot.rates.USD.sell > 1 && snapshot.rates.USD.sell < 20, 'USD plausível');

// Toda moeda usada pelo conversor precisa existir no boletim.
const converterCodes = new Set(Object.values(COUNTRIES).map(country => country.currencyConverter?.targetCode).filter(Boolean));
for (const code of converterCodes) assert.ok(localPerBrl(snapshot, code) > 0, `conversor: ${code} ausente no boletim`);
assert.equal(localPerBrl(snapshot, 'XXX'), null);

const ageDays = Math.round((Date.now() - Date.parse(`${snapshot.date}T00:00:00Z`)) / 86_400_000);
if (ageDays > 45) console.warn(`Aviso: boletim versionado tem ${ageDays} dias; rode npm run build:fx.`);
console.log(`Câmbio: ${Object.keys(snapshot.rates).length} moedas (boletim de ${snapshot.date}), ${converterCodes.size} moedas do conversor cobertas.`);
