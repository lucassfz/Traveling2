// Auditoria offline: nenhuma credencial no repositório e actions dos workflows
// fixadas pelo hash do commit. O site é público (GitHub
// Pages) e chaves de fornecedores existem SOMENTE como Secrets do backend
// (docs/PHASE-3.1-TRAVEL-INTEGRATION-ARCHITECTURE.md §10.1).
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Pasta opcional (testes negativos); padrão: a raiz do projeto.
const ROOT = process.argv[2] ?? fileURLToPath(new URL('..', import.meta.url));
const SKIP_DIRS = new Set(['.git', 'node_modules', '.wrangler', '.claude']);
const TEXT_EXTENSIONS = /\.(js|mjs|cjs|json|md|toml|ya?ml|html|css|txt|sh|env|ini|cfg)$/i;
const MAX_BYTES = 2_500_000;

// Formatos conhecidos de credenciais. O próprio texto destas regras não casa com
// elas (exigem o sufixo longo), então este arquivo não acusa a si mesmo.
const PATTERNS = [
  ['token Duffel', /duffel_(?:live|test)_[A-Za-z0-9_-]{16,}/],
  ['chave Stripe', /\b[sr]k_(?:live|test)_[A-Za-z0-9]{16,}/],
  ['chave AWS', /\bAKIA[0-9A-Z]{16}\b/],
  ['token GitHub', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['chave privada', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['cabeçalho Bearer com token', /Bearer\s+[A-Za-z0-9_\-.=]{30,}/],
  ['atribuição de segredo', /\b(?:api[_-]?key|secret|token|password|passwd|client[_-]?secret)\b["']?\s*[:=]\s*["'][A-Za-z0-9_\-.+/=]{24,}["']/i]
];

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(join(directory, entry.name));
    } else yield join(directory, entry.name);
  }
}

const problems = [];
let scanned = 0;
for await (const path of walk(ROOT)) {
  const name = relative(ROOT, path).replace(/\\/g, '/');
  if (/(^|\/)\.env(\.|$)/.test(name) && !name.endsWith('.env.example')) {
    problems.push(`${name}: arquivo .env não pode ser versionado`);
    continue;
  }
  if (!TEXT_EXTENSIONS.test(name) || (await stat(path)).size > MAX_BYTES) continue;
  // O token do Cloudflare Web Analytics é público (vai no HTML para todo
  // visitante) e só identifica o site no painel; não é credencial.
  const text = (await readFile(path, 'utf8')).replace(/data-cf-beacon=(['"])\{[^}]*\}\1/g, 'data-cf-beacon');
  scanned += 1;
  // Workflows: actions de terceiros fixadas pelo hash do commit. Uma tag (@v5)
  // pode ser movida para outro código, que rodaria com as permissões do workflow
  // (inclusive escrita no repositório). O Dependabot mantém os hashes em dia.
  if (/^\.github\/workflows\/.+\.ya?ml$/.test(name)) {
    for (const match of text.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)) {
      const [action, ref = ''] = match[1].split('@');
      if (!action.startsWith('./') && !/^[0-9a-f]{40}$/.test(ref)) {
        problems.push(`${name}:${text.slice(0, match.index).split('\n').length}: ${match[1]} não está fixada pelo hash do commit`);
      }
    }
  }
  for (const [label, pattern] of PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      const line = text.slice(0, match.index).split('\n').length;
      problems.push(`${name}:${line}: possível ${label}`);
    }
  }
}

for (const problem of problems) console.error(`ERRO ${problem}`);
console.log(`Segredos: ${scanned} arquivos de texto verificados; problemas: ${problems.length}.`);
if (problems.length) process.exitCode = 1;
