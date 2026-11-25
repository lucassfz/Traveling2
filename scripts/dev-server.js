// Servidor local do site com recarga automática, compatível com a
// Content-Security-Policy (o recarregamento do Live Server é um script inline
// injetado, que a CSP bloqueia). Sem dependências.
//
//   npm run dev              # http://127.0.0.1:5500/
//
// - Salvou um arquivo do site: as abas abertas recarregam sozinhas. Mudou src/
//   (React): recompila app/ antes de recarregar (precisa de npm ci uma vez).
// - A recarga vem de /__dev/reload.js, um arquivo do próprio servidor (a CSP
//   aceita 'self'); nada disso existe no site publicado.
// - Só aqui, a CSP também aceita o backend local (npm run dev:backend, porta
//   8787), para testar com <meta name="traveling-api" content="http://localhost:8787/api/v1">.
//
// Variáveis: PORT (padrão 5500, uma das origens liberadas no backend).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp, buildErrors } from './build-app.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 5500);
const HOST = '127.0.0.1';
const LOCAL_BACKEND = 'http://localhost:8787 http://127.0.0.1:8787';
const IGNORED = /^(\.git|node_modules|\.wrangler|\.claude)([\\/]|$)/;
const GENERATED = /^app([\\/]|$)/; // recarrega pelo fim da compilação, não por cada arquivo
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8'
};

const RELOAD_SCRIPT = `// Recarga automática do npm run dev (não existe no site publicado).
(() => {
  const source = new EventSource('/__dev/events');
  source.addEventListener('reload', () => location.reload());
})();
`;

const clients = new Set();

function devHtml(html) {
  return html
    .replace(/(<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*connect-src [^;"]*)/, `$1 ${LOCAL_BACKEND}`)
    .replace(/<\/body>/i, '  <script src="/__dev/reload.js"></script>\n</body>');
}

async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const target = path.resolve(ROOT, `.${decoded}`);
  // Nada fora da pasta do projeto (ex.: /../../arquivo).
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null;
  if (IGNORED.test(path.relative(ROOT, target))) return null;
  const info = await stat(target).catch(() => null);
  if (info?.isDirectory()) return (await stat(path.join(target, 'index.html')).catch(() => null)) ? path.join(target, 'index.html') : null;
  return info?.isFile() ? target : null;
}

const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, `http://${HOST}`);
  if (pathname === '/__dev/reload.js') {
    response.writeHead(200, { 'content-type': TYPES['.js'], 'cache-control': 'no-store' });
    return response.end(RELOAD_SCRIPT);
  }
  if (pathname === '/__dev/events') {
    response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
    response.write(': conectado\n\n');
    clients.add(response);
    request.on('close', () => clients.delete(response));
    return;
  }
  let file = null;
  try { file = await resolveFile(pathname); } catch { /* endereço malformado */ }
  if (!file) {
    const notFound = await readFile(path.join(ROOT, '404.html'), 'utf8').catch(() => 'Não encontrado');
    response.writeHead(404, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' });
    return response.end(devHtml(notFound));
  }
  const type = TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  const body = await readFile(file);
  response.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
  response.end(type.startsWith('text/html') ? devHtml(body.toString('utf8')) : body);
});

const reload = () => { for (const client of clients) client.write('event: reload\ndata: {}\n\n'); };

// Compila a interface; com erro, mostra no terminal e mantém a versão anterior.
let building = false;
let again = false;
async function compile() {
  if (building) { again = true; return; }
  building = true;
  try {
    const { kb } = await buildApp();
    console.log(`app/ compilada (${kb} KB)`);
  } catch (error) {
    for (const line of buildErrors(error)) console.error(line);
  }
  building = false;
  if (again) { again = false; await compile(); }
}

// Salvou um arquivo: avisa as abas (agrupa salvamentos seguidos).
let timer = null;
let sourceChanged = false;
watch(ROOT, { recursive: true }, (_event, name) => {
  if (!name || IGNORED.test(name) || GENERATED.test(name)) return;
  if (/^src[\\/]/.test(name)) sourceChanged = true;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    if (sourceChanged) { sourceChanged = false; await compile(); }
    reload();
  }, 120);
});

await compile();
server.listen(PORT, HOST, () => {
  console.log(`Traveling em http://${HOST}:${PORT}/ (recarrega ao salvar; Ctrl+C para parar)`);
});
