// Teste de segurança no navegador: tenta as entradas que um atacante controla (link,
// armazenamento, resposta de rede, iframe) e confere que nada executa.
//
//   npm run test:security        (CHROME_PATH=... para outro Chrome)
import http from 'node:http';
import { openChrome, sleep } from './chrome.js';

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); console.log(`${ok ? 'ok  ' : 'FALHA'} ${message}`); };
const page = await openChrome();
const { send, evaluate, waitFor } = page;

const ready = "document.querySelector('#globe.globe--ready')";
const XSS = '<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>';
const pwned = () => evaluate('window.__xss === 1 || Boolean(document.querySelector("img[src=x]"))');
const encode = payload => Buffer.from(JSON.stringify(payload)).toString('base64url');
const trips = () => evaluate("(JSON.parse(localStorage.getItem('traveling.trips') || '{}').trips || []).length");
async function load(hash = '') {
  await page.goto(hash);
  await waitFor(ready);
}

try {
  // ---------- Links ----------
  await load(`#/viagem/${encode({ countryKey: 'Japan', city: { id: 'JP-1', name: XSS, lat: 1, lng: 1, region: XSS }, travelers: 2 })}`);
  check(await waitFor("document.querySelector('#wizard-title')", 8000), 'link de viagem abre a confirmação');
  check(await trips() === 0, 'link de viagem não grava nada sem confirmar');
  check(!await pwned(), 'nome de cidade com HTML no link não executa');
  await evaluate("document.querySelector('[data-planner-action=draft-create]').click()");
  await sleep(500);
  check(await trips() === 1, 'confirmar grava a viagem');
  check(!await pwned(), 'viagem gravada com HTML no nome não executa');
  for (const key of ['constructor', '__proto__', 'toString']) {
    await load(`#/viagem/${encode({ countryKey: key })}`);
    await sleep(400);
    check(!await evaluate("document.querySelector('[data-hub=planner]').classList.contains('miles-hub--open')") && await trips() === 1, `link com país "${key}" é ignorado`);
  }
  for (const hash of ['#/viagem/%%%', '#/viagem/AAAA', `#/viagem/${'A'.repeat(5000)}`, '#/PT/c99999999999999', '#/ZZ', `#/${encodeURIComponent(XSS)}`]) {
    await load(hash);
    check(await evaluate(`Boolean(${ready})`) && !await pwned(), `hash inválido não quebra: ${hash.slice(0, 28)}`);
  }

  // ---------- Armazenamento adulterado ----------
  await evaluate(`localStorage.clear();
    localStorage.setItem('traveling.saved', JSON.stringify({ items: [{ id: 'country:Japan', type: 'country', countryKey: 'Japan', name: ${JSON.stringify(XSS)}, context: ${JSON.stringify(XSS)}, image: 'javascript:alert(1)' }] }));
    localStorage.setItem('traveling.trips', JSON.stringify({ version: 2, trips: [{ countryKey: 'Japan', lines: 'x', checklist: [], interests: {}, city: 5 }, null, 7, { countryKey: 'constructor' }] }));
    localStorage.setItem('traveling.visited', '{"a":1}'); localStorage.setItem('traveling.a11y', '[]'); localStorage.setItem('traveling.theme', ${JSON.stringify(XSS)}); localStorage.setItem('traveling.tour', 'done');`);
  await load();
  check(await evaluate(`Boolean(${ready})`), 'armazenamento adulterado não impede o site de abrir');
  await evaluate("document.getElementById('saved-launcher').click()");
  check(await waitFor("document.querySelector('.saved-item')", 4000) && !await pwned(), 'destino salvo com HTML não executa');
  await evaluate("document.getElementById('trips-launcher').click()");
  check(await waitFor("document.querySelector('#planner-content').textContent.length > 20", 5000), 'viagem adulterada não derruba o planejador');
  await evaluate('localStorage.clear()');

  // ---------- Respostas de rede hostis ----------
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/flights/cheapest*' }] });
  const hostile = Buffer.from(JSON.stringify({ offers: [{ price: { amount: XSS }, url: 'javascript:window.__xss=1', departureAt: '2026-12-01', foundOn: XSS, origin: XSS, destination: XSS, transfers: 0 }] })).toString('base64');
  page.on('Fetch.requestPaused', ({ requestId }) => send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'content-type', value: 'application/json' }, { name: 'access-control-allow-origin', value: '*' }], body: hostile }));
  await load('#/PT');
  await waitFor("document.querySelector('#country-partners')", 6000);
  await sleep(2500);
  check(!await evaluate("[...document.querySelectorAll('a')].some(a => /^(javascript|data):/i.test(a.getAttribute('href') || ''))") && !await pwned(), 'preço hostil: nenhum link javascript: e nada executa');
  await send('Fetch.disable');

  // ---------- CSP ----------
  const blocked = async (script, message) => {
    await evaluate(`window.__xss = 0; ${script}`);
    await sleep(1200);
    check(await evaluate('window.__xss !== 1'), message);
  };
  await blocked("{ const s = document.createElement('script'); s.textContent = 'window.__xss=1'; document.head.append(s); }", 'CSP bloqueia script inline');
  await blocked("{ const d = document.createElement('div'); d.innerHTML = '<img src=x onerror=\"window.__xss=1\">'; document.body.append(d); }", 'CSP bloqueia atributo onerror');
  await blocked("{ const a = document.createElement('a'); a.href = 'javascript:window.__xss=1'; document.body.append(a); a.click(); }", 'CSP bloqueia javascript:');
  await blocked("setTimeout(() => { try { setTimeout('window.__xss=1', 0); } catch {} try { (0, eval)('window.__xss=1'); } catch {} try { new Function('window.__xss=1')(); } catch {} }, 100)", 'CSP bloqueia eval');
  const loads = url => evaluate(`new Promise(done => { const s = document.createElement('script'); s.src = ${JSON.stringify(url)}; s.onload = () => done(true); s.onerror = () => done(false); document.head.append(s); setTimeout(() => done(false), 6000); })`);
  check(!await loads('https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'), 'CSP bloqueia outro pacote da jsDelivr');
  check(!await loads('https://unpkg.com/lodash@4.17.21/lodash.min.js'), 'CSP bloqueia outras CDNs');
  check(!await evaluate("fetch('https://example.com/', { mode: 'no-cors' }).then(() => true, () => false)"), 'CSP bloqueia envio de dados para outros sites');
  check(!await evaluate(`new Promise(done => { const s = document.createElement('script'); s.integrity = 'sha384-${'A'.repeat(64)}'; s.crossOrigin = ''; s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js'; s.onload = () => done(true); s.onerror = () => done(false); document.head.append(s); setTimeout(() => done(false), 6000); })`), 'SRI recusa arquivo com hash errado');

  // ---------- Clickjacking ----------
  const frame = http.createServer((_request, response) => { response.writeHead(200, { 'content-type': 'text/html' }); response.end(`<iframe src="${page.base}" style="width:1000px;height:700px"></iframe>`); });
  await new Promise(resolve => frame.listen(0, '127.0.0.1', resolve));
  // localhost × 127.0.0.1: origens diferentes.
  await send('Page.navigate', { url: `http://localhost:${frame.address().port}/` });
  await sleep(4000);
  // Outra origem = outro processo: anexa ao alvo do iframe e olha lá dentro.
  const { result: { targetInfos } } = await send('Target.getTargets');
  const target = targetInfos.find(item => item.type === 'iframe' && item.url.startsWith(page.base));
  let inside = 'iframe não encontrado';
  if (target) {
    const { result: { sessionId } } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    const { result: value } = await send('Runtime.evaluate', { expression: "document.querySelector('#root a[target=_top]') && !document.querySelector('.app-header') ? 'ok' : document.getElementById('root').innerHTML.slice(0, 80)", returnByValue: true }, sessionId);
    inside = value?.result?.value ?? 'sem resposta';
  }
  check(inside === 'ok', `dentro de iframe de outro site a interface não monta${inside === 'ok' ? '' : ` (${inside})`}`);
  frame.close();
} catch (error) {
  failures.push(String(error.stack ?? error));
  console.error(error);
} finally {
  await page.close();
}
console.log(failures.length ? `\nSegurança: ${failures.length} falha(s).` : '\nSegurança: nenhuma tentativa executou.');
process.exit(failures.length ? 1 : 0);
