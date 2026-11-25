// Regressões de segurança, offline: cada caso aqui já foi uma falha encontrada em
// auditoria (novembro/2026) ou uma garantia que não pode se perder.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { COUNTRIES } from '../js/countries.dataset.js';
import { MAX_TRIPS, normalizeStore } from '../js/planner/trip.model.js';
import { createTripStore } from '../js/planner/trip.store.js';
import { createSavedStore, normalizeSavedEntry } from '../js/saved.store.js';
import { safeHttpsUrl } from '../js/provenance.js';
import { parseHash } from '../js/share.link.js';
import { safeOffer } from '../js/api/prices.client.js';
import { createApp, clientKey } from '../backend/src/index.js';
import { RateLimiter } from '../backend/src/reliability.js';
import { validateCheapestQuery } from '../backend/src/validate.js';
import { createDuffelFlights } from '../backend/src/providers/duffel.flights.js';

// ---------- Dados de fora (links, importação, armazenamento) ----------
// Nomes herdados de Object não são países: já passaram por "país válido".
for (const key of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
  assert.equal(normalizeStore({ trips: [{ countryKey: key }] }, { countries: COUNTRIES }).trips.length, 0, `viagem para ${key}`);
  assert.equal(normalizeSavedEntry({ id: `country:${key}`, type: 'country', countryKey: key, name: 'x' }, { countries: COUNTRIES }), null, `salvo ${key}`);
}
const legacy = createSavedStore({ countries: COUNTRIES, read: key => (key === 'traveling.wishlist' ? ['constructor', 'Japan'] : null), write: () => true });
assert.deepEqual(legacy.items.map(item => item.countryKey), ['Japan'], 'lista antiga filtrada');

// JSON malicioso não polui protótipos nem guarda URLs perigosas.
const hostile = JSON.parse('{"__proto__":{"polluted":1},"trips":[{"countryKey":"Japan","__proto__":{"polluted":1},"checklist":{"__proto__":true,"Japan:0:0":true},"lines":[{"amountBRL":1,"source":{"kind":"provider-offer","provider":"mock","offerId":"o","dataSource":"test","fetchedAt":"2026-11-15T12:00:00Z","url":"javascript:alert(1)"}}]}]}');
const [trip] = normalizeStore(hostile, { countries: COUNTRIES }).trips;
assert.equal({}.polluted, undefined, 'protótipo intacto');
assert.deepEqual(Object.keys(trip.checklist), ['Japan:0:0']);
assert.equal(trip.lines[0].source.url, undefined, 'javascript: descartado');
assert.equal(normalizeSavedEntry({ id: 'country:Japan', type: 'country', countryKey: 'Japan', name: 'x', image: 'https://evil.test/a.png' }, { countries: COUNTRIES }).image, undefined, 'imagem só da Wikimedia');
for (const url of ['javascript:alert(1)', 'data:text/html,x', 'http://a.test', '//a.test', ' javascript:alert(1)']) assert.equal(safeHttpsUrl(url), null, url);
for (const hash of ['#/PT/../x', '#/pt', '#/PT/c1e9', '#/PT?x', '#/<script>']) assert.equal(parseHash(hash), null, hash);

// Importar (arquivo ou link) tem teto.
const store = createTripStore({ countries: COUNTRIES, read: () => null, write: () => true });
assert.equal(store.importData({ trips: Array.from({ length: 5000 }, (_, i) => ({ id: `t_${String(i).padStart(6, '0')}`, countryKey: 'Japan' })) }), MAX_TRIPS);
assert.equal(store.importData({ trips: [{ countryKey: 'Portugal' }] }), 0, 'cheio: nada entra');

// Preço vindo da rede: formato conferido e só links do parceiro.
const offer = { price: { amount: "100.00" }, url: "https://www.aviasales.com/search/x" };
assert.equal(safeOffer(offer), offer);
for (const bad of [null, { ...offer, url: "javascript:alert(1)" }, { ...offer, url: "https://www.aviasales.com.evil.test/" }, { ...offer, price: { amount: "<b>" } }, { ...offer, price: { amount: "-1" } }]) assert.equal(safeOffer(bad), null);

// ---------- Interface ----------
const src = await Promise.all((await readdir(new URL('../src/', import.meta.url), { recursive: true })).filter(file => /\.jsx?$/.test(file))
  .map(async file => [file.replaceAll('\\', '/'), await readFile(new URL(`../src/${file.replaceAll('\\', '/')}`, import.meta.url), 'utf8')]));
for (const [file, source] of src) {
  // Endereço vindo de dados só por <ExternalLink>, que exige https.
  for (const [tag] of source.matchAll(/<a\b[^>]*\bhref=\{[^}]*\}[^>]*>/g)) {
    assert.ok(/href=\{(href|page|location\.href)\}/.test(tag), `src/${file}: href dinâmico fora de <ExternalLink>: ${tag}`);
  }
  for (const [tag] of source.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.ok(/rel=/.test(tag), `src/${file}: target="_blank" sem rel`);
  assert.ok(!/\beval\(|new Function\(/.test(source), `src/${file}: eval`);
}

// ---------- Backend ----------
const env = { ALLOWED_ORIGINS: 'https://site.test', FLIGHT_PROVIDERS: 'mock', HOTEL_PROVIDERS: 'mock', TRAVELPAYOUTS_TOKEN: 'token' };
const app = createApp({ log() {} });
const call = (path, options = {}) => app.fetch(new Request(`https://api.test/api/v1${path}`, { ...options, headers: { origin: 'https://site.test', 'cf-connecting-ip': '203.0.113.9', ...options.headers } }), env);

// Corpo sem content-length: para no limite, sem ler tudo para a memória.
let read = 0;
const endless = new ReadableStream({ pull(controller) { read += 4096; if (read > 50_000_000) controller.close(); else controller.enqueue(new Uint8Array(4096).fill(97)); } });
const big = await call('/flights/search', { method: 'POST', body: endless, duplex: 'half' });
assert.equal(big.status, 413);
assert.ok(read < 100_000, `leu ${read} bytes antes de recusar`);

for (const [name, value] of [['x-content-type-options', 'nosniff'], ['cache-control', 'no-store'], ['referrer-policy', 'no-referrer']]) assert.equal(big.headers.get(name), value, name);
assert.match(big.headers.get('content-security-policy'), /default-src 'none'/);
const other = await call('/flights/search', { method: 'POST', body: '{}', headers: { origin: 'https://evil.test' } });
assert.equal(other.status, 403);
assert.equal(other.headers.get('access-control-allow-origin'), null, 'sem CORS para outras origens');
for (const origin of ['null', 'https://site.test.evil.test', 'https://SITE.test', 'http://site.test']) assert.equal((await call('/flights/search', { method: 'POST', body: '{}', headers: { origin } })).status, 403, origin);

// Preços: só consulta válida chega ao fornecedor (cada uma gasta cota paga).
const now = new Date('2026-11-25T12:00:00Z');
const base = { origin: 'GRU', destination: 'LIS', departure: '2026-12', returnDate: '2026-12' };
validateCheapestQuery(base, { now });
validateCheapestQuery({ ...base, departure: '2026-11', returnDate: null }, { now });
validateCheapestQuery({ ...base, destination: 'FRU', departure: '2027-04-02', returnDate: '2027-04-10' }, { now });
for (const bad of [{ origin: 'ZZZ' }, { origin: 'G/U' }, { destination: 'GRU' }, { departure: '9999-99' }, { departure: '0000-00' }, { departure: '2026-13' }, { departure: '2020-01' }, { departure: '2029-01' }, { departure: '' }, { departure: '2027-06', returnDate: '2027-01' }, { returnDate: '2026-12-40' }]) {
  assert.throws(() => validateCheapestQuery({ ...base, ...bad }, { now }), error => error.status === 400, JSON.stringify(bad));
}

// Limite por cliente: cabeçalho forjável não conta, e a memória tem teto.
assert.equal(clientKey(new Request('https://x.test', { headers: { 'x-forwarded-for': '198.51.100.1' } })), 'unknown');
const limiter = new RateLimiter({ limit: 10, windowMs: 86_400_000 });
for (let i = 0; i < 20_000; i += 1) limiter.hit(`cliente${i}`, 1e12);
assert.ok(limiter.windows.size <= 5001, `${limiter.windows.size} clientes em memória`);
for (let i = 0; i < 10; i += 1) limiter.hit('abusivo', 1e12);
assert.equal(limiter.hit('abusivo', 1e12).allowed, false, 'continua limitando');

// Pedido que o fornecedor não atende não abre o disjuntor para os outros.
const duffel = createDuffelFlights({ DUFFEL_TOKEN: 'duffel_test_x' }, { fetchImpl: () => assert.fail('não chama') });
await assert.rejects(duffel.searchFlights({ passengers: { adults: 1, children: 1, infants: 0 } }), error => error.unsupported === true);

// ---------- Workflows: nada de código de terceiros com permissão de escrita ----------
for (const file of await readdir(new URL('../.github/workflows/', import.meta.url))) {
  const text = await readFile(new URL(`../.github/workflows/${file}`, import.meta.url), 'utf8');
  assert.match(text, /^permissions:/m, `${file}: permissões declaradas`);
  assert.ok(!/pull_request_target/.test(text), `${file}: pull_request_target roda código de fora com segredos`);
  assert.ok(!/run:[^\n]*\$\{\{\s*github\.(event|head_ref)/.test(text), `${file}: dado do evento direto no shell`);
  for (const [line] of text.matchAll(/npm (ci|install|i)\b[^\n]*/g)) assert.match(line, /--ignore-scripts/, `${file}: ${line}`);
  if (!/contents: write/.test(text)) assert.match(text, /persist-credentials: false/, `${file}: token do checkout não fica no disco`);
}
console.log('Segurança: entradas, links, interface, backend, limites e workflows verificados.');
