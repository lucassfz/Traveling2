// Chrome sem janela para os testes de navegador: servidor estático da raiz do
// projeto e Chrome DevTools Protocol pelo WebSocket do Node (22+). Sem dependências.
import http from 'node:http';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
const CANDIDATES = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium-browser', '/usr/bin/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function staticServer() {
  return new Promise(resolve => {
    const server = http.createServer(async (request, response) => {
      let file = path.join(ROOT, decodeURIComponent(new URL(request.url, 'http://x').pathname));
      try {
        if (file !== ROOT && !file.startsWith(ROOT + path.sep)) throw new Error('fora da raiz');
        if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
        const body = await readFile(file);
        response.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
        response.end(body);
      } catch {
        response.writeHead(404);
        response.end();
      }
    }).listen(0, '127.0.0.1', () => resolve(server));
  });
}

/** @returns {Promise<object>} página controlada: send, evaluate, waitFor, goto, errors, close. */
export async function openChrome({ width = 1400, height = 900 } = {}) {
  let executable = null;
  for (const candidate of CANDIDATES.filter(Boolean)) if (!executable && await stat(candidate).catch(() => null)) executable = candidate;
  if (!executable) throw new Error('Chrome não encontrado (defina CHROME_PATH).');
  const server = await staticServer();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const profile = await mkdtemp(path.join(tmpdir(), 'traveling-chrome-'));
  const chrome = spawn(executable, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, `--window-size=${width},${height}`,
    '--no-sandbox', '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank'
  ], { stdio: 'ignore' });

  // O Chrome escolhe a porta de depuração e a grava no perfil.
  let socketUrl = null;
  for (let attempt = 0; attempt < 150 && !socketUrl; attempt += 1) {
    await sleep(200);
    try {
      const [port] = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n');
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      socketUrl = targets.find(target => target.type === 'page')?.webSocketDebuggerUrl ?? null;
    } catch { /* ainda subindo */ }
  }
  if (!socketUrl) throw new Error('O Chrome não respondeu.');
  const socket = new WebSocket(socketUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve));
  let nextId = 0;
  const pending = new Map();
  const listeners = new Map(); // evento do protocolo → função
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
    listeners.get(message.method)?.(message.params);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value ?? arg.description).join(' '));
    // CSP bloqueando algo ou SRI recusando um arquivo da CDN só aparecem no log do navegador.
    const entry = message.method === 'Log.entryAdded' ? message.params.entry : null;
    if (entry?.level === 'error' && (entry.source === 'security' || /Content Security Policy|integrity/i.test(entry.text))) errors.push(`${entry.text} ${entry.url ?? ''}`.trim());
  });
  // sessionId: comandos para um alvo anexado (ex.: iframe de outra origem, que é outro processo).
  const send = (method, params = {}, sessionId = undefined) => new Promise(resolve => { const id = ++nextId; pending.set(id, resolve); socket.send(JSON.stringify({ id, method, params, sessionId })); });
  const evaluate = async expression => {
    const { result } = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result?.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result?.result?.value;
  };
  const waitFor = async (expression, timeout = 30000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await evaluate(`Boolean(${expression})`).catch(() => false)) return true;
      await sleep(150);
    }
    return false;
  };
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');

  return {
    send, evaluate, waitFor, errors, base,
    on: (method, listener) => listeners.set(method, listener),
    // about:blank antes: trocar só o #hash não recarregaria a página.
    async goto(url) {
      await send('Page.navigate', { url: 'about:blank' });
      await sleep(150);
      await send('Page.navigate', { url: base + url });
    },
    async close() {
      socket.close();
      chrome.kill();
      server.close();
      await sleep(300);
      await rm(profile, { recursive: true, force: true }).catch(() => {});
    }
  };
}
