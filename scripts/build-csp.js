// Atualiza a Content-Security-Policy das páginas escritas à mão (os hashes dos
// scripts inline mudam a cada edição). As páginas geradas (paises/, cidades/,
// 404.html) recebem a política pelo npm run build:pages.
//   npm run build:csp
import { readFile, writeFile } from 'node:fs/promises';
import { HAND_WRITTEN_PAGES, withCsp } from './csp.js';

let changed = 0;
for (const page of HAND_WRITTEN_PAGES) {
  const url = new URL(`../${page}`, import.meta.url);
  const html = await readFile(url, 'utf8');
  const next = withCsp(html);
  if (next !== html) {
    await writeFile(url, next);
    changed += 1;
    console.log(`CSP atualizada: ${page}`);
  }
}
console.log(`CSP: ${HAND_WRITTEN_PAGES.length} páginas conferidas, ${changed} atualizadas.`);
