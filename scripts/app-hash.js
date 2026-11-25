// Hash das fontes e do resultado da compilação da interface (src/ → app/).
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

async function hashFiles(root, files) {
  const hash = createHash('sha256');
  for (const file of files) {
    // Finais de linha não contam (checkout em Windows ou Linux dá o mesmo hash).
    const text = (await readFile(path.join(root, file), 'utf8')).replaceAll('\r\n', '\n');
    hash.update(`${file}\n${text}\n`);
  }
  return hash.digest('hex');
}

// Ordem por código de caractere: igual em qualquer sistema.
const list = async (root, directory) => (await readdir(path.join(root, directory), { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile())
  .map(entry => path.relative(root, path.join(entry.parentPath, entry.name)).replaceAll('\\', '/'))
  .sort();

/** Fontes: src/, versões das dependências e o próprio script de build. */
export async function sourceHash(root) {
  return hashFiles(root, [...await list(root, 'src'), 'package-lock.json', 'scripts/build-app.js']);
}

export async function outputHash(root) {
  return hashFiles(root, (await list(root, 'app')).filter(file => file !== 'app/build.json'));
}
