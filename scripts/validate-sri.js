// Auditoria online: os hashes SRI de index.html e js/map.engine.js batem com os
// arquivos servidos hoje pela CDN. Se um hash estiver errado, o navegador recusa
// o arquivo e o globo 3D não carrega; esta auditoria pega isso antes do deploy.
// Somente leitura. Precisa de rede.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const engine = await readFile(new URL('../js/map.engine.js', import.meta.url), 'utf8');

const expected = new Map();
for (const match of html.matchAll(/<link\s+rel="(?:modulepreload|preload)"\s+href="(https:\/\/[^"]+)"[^>]*\bintegrity="([^"]+)"/g)) expected.set(match[1], match[2]);
const importMap = JSON.parse(/<script\s+type="importmap">([\s\S]*?)<\/script>/.exec(html)[1]);
for (const [url, integrity] of Object.entries(importMap.integrity ?? {})) expected.set(url, integrity);
const atlasUrl = /WORLD_ATLAS_URL = '([^']+)'/.exec(engine)?.[1];
const atlasIntegrity = /WORLD_ATLAS_INTEGRITY = '([^']+)'/.exec(engine)?.[1];
if (atlasUrl && atlasIntegrity) expected.set(atlasUrl, atlasIntegrity);

const problems = [];
for (const [url, integrity] of expected) {
  const [algorithm] = integrity.split('-');
  const response = await fetch(url);
  if (!response.ok) {
    problems.push(`${url}: HTTP ${response.status}`);
    continue;
  }
  const actual = `${algorithm}-${createHash(algorithm).update(Buffer.from(await response.arrayBuffer())).digest('base64')}`;
  if (actual !== integrity) problems.push(`${url}: integrity declarada ${integrity}, CDN serve ${actual}`);
}

for (const problem of problems) console.error(`ERRO ${problem}`);
console.log(`SRI: ${expected.size} arquivos da CDN conferidos; problemas: ${problems.length}.`);
if (problems.length) process.exitCode = 1;
