// Confere as páginas de país (paises/) e o sitemap: em dia com os dados (o
// gerador produz exatamente o que está no disco), uma por país, com prévia de
// compartilhamento completa e link para o globo.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { buildAll, SITE_URL } from './build-country-pages.js';
import { COUNTRIES } from '../js/countries.dataset.js';
import { countrySlug } from '../js/country.slug.js';

const root = new URL('../', import.meta.url);
const files = await buildAll();
for (const [path, content] of Object.entries(files)) {
  let disk = null;
  try { disk = await readFile(new URL(path, root), 'utf8'); } catch { /* falta */ }
  assert.equal(disk, content, `${path} desatualizado: rode npm run build:pages`);
}
const dirs = (await readdir(new URL('paises/', root), { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name);
const countries = Object.values(COUNTRIES);
assert.equal(dirs.length, countries.length, 'uma página por país, sem sobras');
for (const country of countries) {
  const html = files[`paises/${countrySlug(country.namePt)}/index.html`];
  assert.ok(html, `${country.namePt}: sem página`);
  for (const tag of ['og:title', 'og:description', 'og:image', 'og:url']) assert.match(html, new RegExp(`property="${tag}" content="[^"]+"`), `${country.namePt}: ${tag}`);
  assert.match(html, /property="og:image" content="https:\/\//, `${country.namePt}: imagem https`);
  assert.ok(html.includes(`href="../../#/${country.alpha2}"`), `${country.namePt}: link para o globo`);
  assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}paises/${countrySlug(country.namePt)}/">`), `${country.namePt}: canonical`);
  // Único script externo permitido: as estatísticas sem cookies da Cloudflare.
  const scripts = html.match(/<script[^>]*src="[^"]*"/g) ?? [];
  assert.ok(scripts.every(tag => tag.includes('src="https://static.cloudflareinsights.com/beacon.min.js"')), `${country.namePt}: script externo fora da lista`);
}
const sitemap = files['sitemap.xml'];
assert.equal((sitemap.match(/<loc>/g) ?? []).length, countries.length + 4, 'sitemap: início, índice, países, parceiros e privacidade');
console.log(`Páginas de país: ${countries.length} páginas, índice e sitemap em dia com os dados.`);
