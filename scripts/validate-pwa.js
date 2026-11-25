// App instalável e modo offline: manifesto, ícones e service worker ligados.
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './');
for (const icon of manifest.icons) assert.ok((await stat(new URL(icon.src, root))).size > 1000, `ícone ${icon.src}`);
assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable' && icon.sizes === '512x512'), 'ícone maskable 512');
const html = await readFile(new URL('index.html', root), 'utf8');
assert.ok(html.includes('<link rel="manifest" href="manifest.webmanifest">'), 'index.html liga o manifesto');
const sw = await readFile(new URL('sw.js', root), 'utf8');
assert.ok(/fetch\(request\)\.then/.test(sw), 'rede primeiro (nunca prende numa versão antiga)');
assert.ok(!sw.includes('workers.dev'), 'não guarda as chamadas de preço');
const app = await readFile(new URL('src/main.jsx', root), 'utf8');
assert.ok(app.includes("navigator.serviceWorker.register('sw.js')"), 'app registra o service worker');
console.log(`PWA: manifesto, ${manifest.icons.length} ícones e service worker (rede primeiro) verificados.`);
