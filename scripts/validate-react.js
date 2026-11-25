// Auditoria offline da interface React: app/ compilada em dia com src/, sem HTML
// cru (toda string passa pelo escape do React) e sem imports quebrados para js/.
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { outputHash, sourceHash } from './app-hash.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

const build = JSON.parse(await readFile(path.join(ROOT, 'app/build.json'), 'utf8'));
if (build.source !== await sourceHash(ROOT)) problems.push('app/ desatualizada em relação a src/: rode npm run build');
if (build.output !== await outputHash(ROOT)) problems.push('app/ editada à mão ou incompleta: rode npm run build');

const RAW_HTML = [/dangerouslySetInnerHTML/, /\.innerHTML\s*=/, /insertAdjacentHTML/, /document\.write/];
const files = (await readdir(path.join(ROOT, 'src'), { recursive: true })).map(file => file.replaceAll('\\', '/')).filter(file => /\.jsx?$/.test(file));
for (const file of files) {
  const source = await readFile(path.join(ROOT, 'src', file), 'utf8');
  for (const pattern of RAW_HTML) if (pattern.test(source)) problems.push(`src/${file}: HTML cru não é permitido (${pattern.source})`);
  for (const [, specifier] of source.matchAll(/(?:from\s+|import\()\s*'(\.[^']+)'/g)) {
    await access(path.resolve(ROOT, 'src', path.dirname(file), specifier)).catch(() => problems.push(`src/${file}: import inexistente ${specifier}`));
  }
  // Teclado: clique só em elementos que recebem foco (button, a, summary, input…).
  for (const [tag, name] of source.matchAll(/<(div|span|li|p|section|article|img)\b[^>]*\sonClick=/g)) {
    if (!/role="(option|presentation)"/.test(tag) && !/className="planner-dialog"/.test(tag)) problems.push(`src/${file}: <${name} onClick> não funciona pelo teclado; use <button>`);
  }
  if (/tabIndex=\{[1-9]/.test(source)) problems.push(`src/${file}: tabIndex positivo muda a ordem natural do Tab`);
}

const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
assert.match(html, /<div id="root">\s*<\/div>/, 'index.html precisa do contêiner do React');
assert.match(html, /<script type="module" src="app\/main\.js\?v=/, 'index.html carrega app/main.js');

for (const problem of problems) console.error(`ERRO ${problem}`);
console.log(`React: ${files.length} arquivos em src/, app/ ${problems.length ? 'com problemas' : 'em dia'}; problemas: ${problems.length}.`);
if (problems.length) process.exitCode = 1;
