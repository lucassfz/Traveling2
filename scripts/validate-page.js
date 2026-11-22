// Auditoria offline de index.html: carregamento de módulos e versões.
//
// Regra principal (erro real de novembro/2026): um <link rel="modulepreload">
// que aparece ANTES do import map não pode apontar para um módulo que importa
// "three" pelo nome (ex.: examples/jsm/controls/OrbitControls.js). O navegador
// resolve esse import antes de conhecer o import map, a resolução falha, a falha
// fica em cache e o globo 3D não carrega.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

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
const csp = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html);
const directives = new Map((csp?.[1] ?? '').split(';').map(part => part.trim().split(/\s+/)).filter(([name]) => name).map(([name, ...values]) => [name, values]));
let inlineScripts = 0;
if (!csp) problems.push('index.html sem <meta http-equiv="Content-Security-Policy">');
else {
  if (csp.index > html.indexOf('<script')) problems.push('a CSP precisa vir antes do primeiro <script>');
  for (const name of ['default-src', 'script-src', 'object-src', 'base-uri']) {
    if (!directives.has(name)) problems.push(`CSP sem ${name}`);
  }
  const scriptSrc = directives.get('script-src') ?? [];
  for (const unsafe of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:']) {
    if (scriptSrc.includes(unsafe)) problems.push(`CSP script-src não pode ter ${unsafe}`);
  }
  if ((directives.get('object-src') ?? []).join(' ') !== "'none'") problems.push("CSP object-src deve ser 'none'");
  // Cada script inline executável precisa do seu sha256 na CSP (senão o navegador o bloqueia).
  for (const match of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attributes = match[1] ?? '';
    if (/\ssrc=/.test(attributes) || /type="application\/ld\+json"/.test(attributes)) continue;
    inlineScripts += 1;
    const hash = `'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`;
    if (!scriptSrc.includes(hash)) problems.push(`script inline ${attributes.trim() || '(clássico)'} na linha ${html.slice(0, match.index).split('\n').length} sem hash na CSP: troque o hash antigo por ${hash}`);
  }
  // Backends ligados pelas metas precisam estar em connect-src.
  const connectSrc = directives.get('connect-src') ?? [];
  for (const [, name, url] of html.matchAll(/<meta\s+name="(traveling-(?:api|prices))"\s+content="([^"]+)"/g)) {
    if (!connectSrc.includes(new URL(url).origin)) problems.push(`CSP connect-src sem ${new URL(url).origin} (meta ${name})`);
  }
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
console.log(`Página: ${preloads.length} preloads de módulo, import map com ${Object.keys(imports).length} entradas, versão ${appVersion}; CSP com ${inlineScripts} scripts inline por hash; ${sri.size} arquivos da CDN com SRI; problemas: ${problems.length}.`);
if (problems.length) process.exitCode = 1;
