// Teste de fumaça no navegador: abre o site num Chrome sem janela e confere o
// que os verificadores de dados não enxergam.
//   1. o globo carrega sem erros de JavaScript;
//   2. o link #/BR abre o Brasil;
//   3. todo ponto do Brasil desenhado no globo escolhe uma cidade (a área
//      clicável das cidades, que já regrediu uma vez);
//   4. uma página de país (paises/japao/) abre com título e link para o globo.
//
//   node scripts/smoke-browser.js        (CHROME_PATH=... para outro Chrome)
//
// Sem dependências: servidor estático e Chrome DevTools Protocol pelo
// WebSocket do Node (22+). O three.js vem da CDN, então precisa de rede.
import http from 'node:http';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8790;
const DEBUG_PORT = 9340;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml' };

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); console.log(`${ok ? 'ok  ' : 'FALHA'} ${message}`); };

const server = http.createServer(async (request, response) => {
  let file = path.join(ROOT, decodeURIComponent(new URL(request.url, 'http://x').pathname));
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end();
  }
}).listen(PORT);

async function chromePath() {
  for (const candidate of [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']) {
    if (!candidate) continue;
    try { await stat(candidate); return candidate; } catch { /* próximo */ }
  }
  return null;
}

const executable = await chromePath();
if (!executable) {
  console.error('Chrome não encontrado (defina CHROME_PATH).');
  server.close();
  process.exit(1);
}
const profile = await mkdtemp(path.join(tmpdir(), 'traveling-smoke-'));
const chrome = spawn(executable, [
  '--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`, '--window-size=1400,900',
  '--no-sandbox', '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank'
], { stdio: 'ignore' });

let socketUrl = null;
for (let attempt = 0; attempt < 100 && !socketUrl; attempt += 1) {
  await sleep(200);
  try {
    const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
    socketUrl = targets.find(target => target.type === 'page')?.webSocketDebuggerUrl ?? null;
  } catch { /* ainda subindo */ }
}
const socket = new WebSocket(socketUrl);
await new Promise(resolve => socket.addEventListener('open', resolve));
let nextId = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value ?? arg.description).join(' '));
});
const send = (method, params = {}) => new Promise(resolve => { const id = ++nextId; pending.set(id, resolve); socket.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
const waitFor = async (expression, timeout = 30000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return true;
    await sleep(250);
  }
  return false;
};

try {
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });

  // 1. Globo carregado, sem erros.
  check(await waitFor("document.getElementById('globe')?.classList.contains('globe--ready')"), 'globo carregado');
  check(!(await evaluate("document.getElementById('globe-fallback')?.classList.contains('globe__fallback--visible')")), 'sem a mensagem de falha do 3D');

  // Guarda a instância do globo (o app não a expõe) para os testes de clique.
  await evaluate(`import('/js/map.engine.js').then(({ MapEngine }) => {
    for (const name of ['pickPlace', 'pickCountry', 'invalidate', 'flyTo', 'selectCity']) {
      const original = MapEngine.prototype[name];
      MapEngine.prototype[name] = function (...args) { window.__smokeMap = this; return original.apply(this, args); };
    }
    return true;
  })`);

  // 2. Link de país.
  await evaluate("location.hash = '#/BR'");
  check(await waitFor("document.getElementById('country-name')?.textContent === 'Brasil'", 10000), 'link #/BR abre o Brasil');
  await sleep(4500);

  // 3. Área clicável: todo ponto do Brasil no globo escolhe uma cidade.
  const coverage = await evaluate(`(() => {
    const map = window.__smokeMap;
    if (!map) return null;
    const rect = map.renderer.domElement.getBoundingClientRect();
    let inside = 0, missing = 0;
    for (let y = rect.top + 4; y < rect.bottom; y += 18) {
      for (let x = rect.left + 4; x < rect.right; x += 18) {
        if (map.pickCountry(x, y) !== 'Brazil') continue;
        inside += 1;
        if (map.pickPlace(x, y)?.kind !== 'city') missing += 1;
      }
    }
    return { inside, missing };
  })()`);
  check(coverage && coverage.inside > 200, `Brasil visível no globo (${coverage?.inside ?? 0} pontos testados)`);
  check(coverage && coverage.missing === 0, `todo ponto do Brasil escolhe uma cidade (${coverage?.missing ?? '?'} sem cidade)`);

  // 4. Página de país.
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/paises/japao/` });
  check(await waitFor("document.querySelector('h1')?.textContent === 'Japão'", 10000), 'página do Japão abre');
  check(await evaluate("Boolean(document.querySelector('a.cta[href=\"../../#/JP\"]'))"), 'página do Japão leva ao globo');

  check(errors.length === 0, `sem erros de JavaScript${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);
} finally {
  socket.close();
  chrome.kill();
  server.close();
  await sleep(300);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

if (failures.length) {
  console.error(`\nTeste no navegador: ${failures.length} falha(s).`);
  process.exit(1);
}
console.log('\nTeste no navegador: tudo certo.');
process.exit(0);
