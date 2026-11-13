// Atualiza data/fx-snapshot.json com o boletim de fechamento PTAX mais recente
// do Banco Central (taxas de compra e venda em reais para 156 moedas).
// Uso: `npm run build:fx` (precisa de rede). Revise e versione o arquivo gerado.
import { writeFile } from 'node:fs/promises';
import { PTAX_SOURCE_URL, parseClosingCsv } from '../js/fx.service.js';

const OUTPUT = new URL('../data/fx-snapshot.json', import.meta.url);
const pad = value => String(value).padStart(2, '0');
const fileUrl = date => `https://www4.bcb.gov.br/Download/fechamento/${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}.csv`;

// Fins de semana e feriados não têm boletim: volta até 10 dias.
let parsed = null;
let used = null;
const today = new Date();
for (let back = 0; back <= 10 && !parsed; back += 1) {
  const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - back));
  const url = fileUrl(day);
  const response = await fetch(url);
  if (!response.ok) continue;
  const text = await response.text();
  try {
    parsed = parseClosingCsv(text);
    used = url;
  } catch {
    // Arquivo vazio ou incompleto (ex.: boletim do dia ainda não publicado).
  }
}
if (!parsed) throw new Error('Nenhum boletim de fechamento encontrado nos últimos 10 dias.');

const rates = Object.fromEntries(Object.keys(parsed.rates).sort().map(code => [code, parsed.rates[code]]));
const snapshot = {
  source: 'Banco Central do Brasil — boletim de fechamento PTAX',
  sourceUrl: PTAX_SOURCE_URL,
  file: used,
  date: parsed.date,
  unit: 'BRL por 1 unidade da moeda (compra, venda)',
  rates
};
await writeFile(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`data/fx-snapshot.json: ${Object.keys(rates).length} moedas, boletim de ${parsed.date}`);
