// Auditoria offline de index.html: carregamento de módulos e versões.
//
// Regra principal (erro real de novembro/2026): um <link rel="modulepreload">
// que aparece ANTES do import map não pode apontar para um módulo que importa
// "three" pelo nome (ex.: examples/jsm/controls/OrbitControls.js). O navegador
// resolve esse import antes de conhecer o import map, a resolução falha, a falha
// fica em cache e o globo 3D não carrega.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { CSP_DIRECTIVES, HAND_WRITTEN_PAGES, cspFor, inlineScripts, scriptHash } from './csp.js';
import { PRICES_API } from './build-country-pages.js';

const ROOT = new URL('../', import.meta.url);

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
  /^js\/vendor\/topojson-client\.js$/
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

// --- Segurança: Content-Security-Policy e SRI -------------------------------
// A política em si (scripts/csp.js) não pode abrir brecha para scripts.
const scriptSrc = CSP_DIRECTIVES['script-src'];
for (const unsafe of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'http:', 'data:']) {
  if (scriptSrc.includes(unsafe)) problems.push(`CSP script-src não pode ter ${unsafe}`);
}
for (const name of ['default-src', 'script-src', 'object-src', 'base-uri']) if (!CSP_DIRECTIVES[name]) problems.push(`CSP sem ${name}`);
if (CSP_DIRECTIVES['object-src'].join(' ') !== "'none'") problems.push("CSP object-src deve ser 'none'");
// Backends ligados pelas metas e pelas páginas de país precisam estar em connect-src.
for (const url of [...[...html.matchAll(/<meta\s+name="traveling-(?:api|prices)"\s+content="([^"]+)"/g)].map(match => match[1]), PRICES_API]) {
  if (!CSP_DIRECTIVES['connect-src'].includes(new URL(url).origin)) problems.push(`CSP connect-src sem ${new URL(url).origin}`);
}
// Toda página do site tem a política em dia: antes do primeiro <script> e com o
// sha256 de cada script inline (senão o navegador bloqueia o script).
const pages = process.argv[2] ? [[process.argv[2], html]] : await Promise.all((await readdir(ROOT, { recursive: true }))
  .map(file => file.replaceAll('\\', '/'))
  .filter(file => file.endsWith('.html') && !/^(\.git|node_modules|\.wrangler|docs)\//.test(file))
  .map(async file => [file, await readFile(new URL(file, ROOT), 'utf8')]));
let inlineCount = 0;
for (const [file, page] of pages) {
  const fix = HAND_WRITTEN_PAGES.includes(file) ? 'npm run build:csp' : 'npm run build:pages';
  const meta = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/.exec(page);
  if (!meta) { problems.push(`${file}: sem Content-Security-Policy (rode ${fix})`); continue; }
  if (page.includes('<script') && meta.index > page.indexOf('<script')) problems.push(`${file}: a CSP precisa vir antes do primeiro <script>`);
  const scripts = inlineScripts(page);
  inlineCount += scripts.length;
  if (meta[1] === cspFor(page)) continue;
  const stale = scripts.filter(script => !meta[1].includes(scriptHash(script.content)));
  problems.push(`${file}: CSP fora de dia${stale.length ? ` (${stale.length} script inline sem hash)` : ''}: rode ${fix}`);
}

// SRI: todo arquivo da CDN carregado pela página tem integrity, e o mesmo hash
// aparece onde o arquivo é referenciado de novo.
const sri = new Map();
const requireSri = (url, integrity, where) => {
  if (!/^sha384-[A-Za-z0-9+/]{64}$/.test(integrity ?? '')) return problems.push(`${where}: ${url} sem integrity sha384`);
  if (sri.has(url) && sri.get(url) !== integrity) problems.push(`${where}: integrity de ${url} difere da declarada antes`);
  sri.set(url, integrity);
};
for (const match of html.matchAll(/<link\s+rel="(?:modulepreload|preload)"\s+href="(https:\/\/cdn\.jsdelivr\.net\/[^"]+)"([^>]*)>/g)) {
  requireSri(match[1], /integrity="([^"]+)"/.exec(match[2])?.[1], 'preload');
}
const importMap = JSON.parse(importMapMatch[1]);
for (const url of Object.values(imports).filter(url => !url.endsWith('/'))) requireSri(url, importMap.integrity?.[url], 'import map');
// Imports por prefixo do import map (ex.: 'three/addons/controls/OrbitControls.js').
const jsFiles = (await readdir(new URL('../js/', import.meta.url), { recursive: true })).filter(file => file.endsWith('.js'));
for (const file of jsFiles) {
  const source = await readFile(new URL(`../js/${file.replaceAll('\\', '/')}`, import.meta.url), 'utf8');
  for (const [, specifier] of source.matchAll(/(?:from\s+|import\()\s*'([^'./][^']*)'/g)) {
    const prefix = Object.keys(imports).find(key => key.endsWith('/') && specifier.startsWith(key));
    if (prefix) requireSri(imports[prefix] + specifier.slice(prefix.length), importMap.integrity?.[imports[prefix] + specifier.slice(prefix.length)], `import map (js/${file})`);
  }
}
const engine = await readFile(new URL('../js/map.engine.js', import.meta.url), 'utf8');
const atlasUrl = /WORLD_ATLAS_URL = '([^']+)'/.exec(engine)?.[1];
const atlasIntegrity = /WORLD_ATLAS_INTEGRITY = '([^']+)'/.exec(engine)?.[1];
requireSri(atlasUrl, atlasIntegrity, 'js/map.engine.js');
if (!/fetchJsonWithTimeout\(WORLD_ATLAS_URL, \d+, WORLD_ATLAS_INTEGRITY\)/.test(engine)) problems.push('js/map.engine.js precisa passar WORLD_ATLAS_INTEGRITY ao baixar o mapa-múndi');
// Endereços gerados na hora pelo jsDelivr (/+esm) mudam de conteúdo e não aceitam SRI.
if (/cdn\.jsdelivr\.net[^'"\s]*\/\+esm/.test(html + engine)) problems.push('/+esm do jsDelivr não aceita SRI: use uma cópia em js/vendor/');

for (const problem of problems) console.error(`ERRO ${problem}`);
console.log(`Página: ${preloads.length} preloads de módulo, import map com ${Object.keys(imports).length} entradas, versão ${appVersion}; CSP em ${pages.length} páginas (${inlineCount} scripts inline por hash); ${sri.size} arquivos da CDN com SRI; problemas: ${problems.length}.`);
if (problems.length) process.exitCode = 1;
