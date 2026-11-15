// Gera backend/src/airports.generated.js: os códigos IATA de data/airports.json
// numa string compacta (3 letras cada), para o backend validar origem e destino
// com a mesma base que o site usa. Rodar sempre que data/airports.json mudar:
//
//   npm run build:backend-airports
//
// scripts/validate-backend.js confere que o arquivo gerado está em dia.
import { readFile, writeFile } from 'node:fs/promises';

const SOURCE = new URL('../data/airports.json', import.meta.url);
const OUTPUT = new URL('../backend/src/airports.generated.js', import.meta.url);

export async function iataCodes() {
  const data = JSON.parse(await readFile(SOURCE, 'utf8'));
  return [...new Set(data.airports.map(row => row[0]).filter(code => /^[A-Z]{3}$/.test(code)))].sort();
}

export function renderModule(codes) {
  return `// Gerado por scripts/build-backend-airports.js a partir de data/airports.json. Não editar.
// ${codes.length} códigos IATA, 3 letras cada, em ordem alfabética.
export const IATA_CODES = '${codes.join('')}';
`;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('build-backend-airports.js')) {
  const codes = await iataCodes();
  await writeFile(OUTPUT, renderModule(codes));
  console.log(`backend/src/airports.generated.js: ${codes.length} códigos IATA.`);
}
