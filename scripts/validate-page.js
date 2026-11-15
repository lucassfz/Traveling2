// Auditoria offline de index.html: carregamento de módulos e versões.
//
// Regra principal (erro real de novembro/2026): um <link rel="modulepreload">
// que aparece ANTES do import map não pode apontar para um módulo que importa
// "three" pelo nome (ex.: examples/jsm/controls/OrbitControls.js). O navegador
// resolve esse import antes de conhecer o import map, a resolução falha, a falha
// fica em cache e o globo 3D não carrega.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Caminho opcional (testes negativos); padrão: index.html do projeto.
const html = await readFile(process.argv[2] ?? new URL('../index.html', import.meta.url), 'utf8');
const problems = [];

const importMapMatch = /<script\s+type="importmap">([\s\S]*?)<\/script>/.exec(html);
assert.ok(importMapMatch, 'index.html precisa de um import map');
const importMapIndex = importMapMatch.index;
const imports = JSON.parse(importMapMatch[1]).imports ?? {};
assert.ok(imports.three, 'import map sem "three"');

// Módulos sem imports por nome (seguros antes do import map).
const SAFE_BEFORE_IMPORT_MAP = [
  /\/three@[\d.]+\/build\/three\.module(\.min)?\.js$/,
  /\/topojson-client@[\d.]+\/\+esm$/
];

const preloads = [...html.matchAll(/<link\s+rel="modulepreload"\s+href="([^"]+)"[^>]*>/g)];
for (const preload of preloads) {
  const href = preload[1];
  if (preload.index < importMapIndex && !SAFE_BEFORE_IMPORT_MAP.some(pattern => pattern.test(href))) {
    problems.push(`modulepreload antes do import map pode quebrar a resolução de "three": ${href}`);
  }
  if (/\/three@[\d.]+\/build\/three\.module/.test(href) && href !== imports.three) {
    problems.push(`modulepreload de three (${href}) difere do import map (${imports.three}): o navegador baixaria duas cópias`);
  }
}

// Versões fixas nos endereços de CDN (nada de "@latest" ou faixa).
for (const [, url] of html.matchAll(/(?:href|src)="(https:\/\/cdn\.jsdelivr\.net\/npm\/[^"]+)"/g)) {
  if (!/@\d+\.\d+\.\d+/.test(url)) problems.push(`versão não fixada na CDN: ${url}`);
}
for (const url of Object.values(imports)) {
  if (url.includes('cdn.jsdelivr.net') && !/@\d+\.\d+\.\d+/.test(url)) problems.push(`versão não fixada no import map: ${url}`);
}

// styles.css e js/app.js com o mesmo ?v= (evita misturar versões em cache).
const styleVersion = /styles\.css\?v=([\w.-]+)/.exec(html)?.[1];
const appVersion = /js\/app\.js\?v=([\w.-]+)/.exec(html)?.[1];
if (!styleVersion || !appVersion) problems.push('styles.css e js/app.js precisam de ?v= (cache do GitHub Pages)');
else if (styleVersion !== appVersion) problems.push(`?v= diferentes: styles.css=${styleVersion}, app.js=${appVersion}`);

for (const problem of problems) console.error(`ERRO ${problem}`);
console.log(`Página: ${preloads.length} preloads de módulo, import map com ${Object.keys(imports).length} entradas, versão ${appVersion}; problemas: ${problems.length}.`);
if (problems.length) process.exitCode = 1;
