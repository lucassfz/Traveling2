// Teste de fumaça no navegador: abre o site num Chrome sem janela e confere o
// que os verificadores de dados não enxergam.
//   1. o globo carrega sem erros de JavaScript;
//   2. o link #/BR abre o Brasil;
//   3. todo ponto do Brasil desenhado no globo escolhe uma cidade (a área
//      clicável das cidades, que já regrediu uma vez);
//   4. uma página de país (paises/japao/) abre com título e link para o globo.
//
//   node scripts/smoke-browser.js        (CHROME_PATH=... para outro Chrome)
//
// Sem dependências: servidor estático e Chrome DevTools Protocol pelo
// WebSocket do Node (22+). O three.js vem da CDN, então precisa de rede.
import { openChrome, sleep } from './chrome.js';

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); console.log(`${ok ? 'ok  ' : 'FALHA'} ${message}`); };

const { send, evaluate, waitFor, errors, base, close } = await openChrome();

try {
  await send('Page.navigate', { url: `${base}` });

  // 1. Globo carregado, sem erros.
  check(await waitFor("document.getElementById('globe')?.classList.contains('globe--ready')"), 'globo carregado');
  check(!(await evaluate("document.getElementById('globe-fallback')?.classList.contains('globe__fallback--visible')")), 'sem a mensagem de falha do 3D');

  // Guarda a instância do globo (o app não a expõe) para os testes de clique.
  await evaluate(`import('/js/map.engine.js').then(({ MapEngine }) => {
    for (const name of ['pickPlace', 'pickCountry', 'invalidate', 'flyTo', 'selectCity']) {
      const original = MapEngine.prototype[name];
      MapEngine.prototype[name] = function (...args) { window.__smokeMap = this; return original.apply(this, args); };
    }
    return true;
  })`);

  // 2. Link de país.
  await evaluate("location.hash = '#/BR'");
  check(await waitFor("document.getElementById('country-name')?.textContent === 'Brasil'", 10000), 'link #/BR abre o Brasil');
  await sleep(4500);

  // 3. Área clicável: todo ponto do Brasil no globo escolhe uma cidade.
  const coverage = await evaluate(`(() => {
    const map = window.__smokeMap;
    if (!map) return null;
    const rect = map.renderer.domElement.getBoundingClientRect();
    let inside = 0, missing = 0;
    for (let y = rect.top + 4; y < rect.bottom; y += 18) {
      for (let x = rect.left + 4; x < rect.right; x += 18) {
        if (map.pickCountry(x, y) !== 'Brazil') continue;
        inside += 1;
        if (map.pickPlace(x, y)?.kind !== 'city') missing += 1;
      }
    }
    return { inside, missing };
  })()`);
  check(coverage && coverage.inside > 200, `Brasil visível no globo (${coverage?.inside ?? 0} pontos testados)`);
  check(coverage && coverage.missing === 0, `todo ponto do Brasil escolhe uma cidade (${coverage?.missing ?? '?'} sem cidade)`);

  // 4. Página de país.
  await send('Page.navigate', { url: `${base}paises/japao/` });
  check(await waitFor("document.querySelector('h1')?.textContent === 'Japão'", 10000), 'página do Japão abre');
  check(await evaluate("Boolean(document.querySelector('a.cta[href=\"../../#/JP\"]'))"), 'página do Japão leva ao globo');
  // Fotos (Wikimedia, com redirecionamento) e bandeira carregam: a CSP já
  // bloqueou miniaturas de thumb.wikimedia.org. loading="lazy" não carregaria
  // fora da tela, então força o carregamento.
  const images = await evaluate(`(async () => {
    const list = [...document.images];
    list.forEach(img => { img.loading = 'eager'; });
    await Promise.all(list.map(img => img.complete ? null : new Promise(done => { img.addEventListener('load', done); img.addEventListener('error', done); setTimeout(done, 15000); })));
    return { total: list.length, broken: list.filter(img => !img.naturalWidth).map(img => img.currentSrc || img.src) };
  })()`);
  check(images && images.total > 0 && images.broken.length === 0, `imagens da página do Japão carregam (${images?.total ?? 0} imagens${images?.broken.length ? `; falharam: ${images.broken.slice(0, 2).join(', ')}` : ''})`);
  // Páginas com outros scripts inline (capital, 404 com sugestões): a CSP não pode bloqueá-los.
  await send('Page.navigate', { url: `${base}cidades/lisboa-portugal/` });
  check(await waitFor("document.readyState === 'complete' && Boolean(document.querySelector('h1'))", 10000), 'página de Lisboa abre');
  await send('Page.navigate', { url: `${base}404.html` });
  check(await waitFor("document.readyState === 'complete' && Boolean(document.querySelector('h1'))", 10000), 'página 404 abre');

  check(errors.length === 0, `sem erros de JavaScript, CSP ou SRI${errors.length ? `: ${errors.slice(0, 3).join(' | ')}` : ''}`);

  // 5. A CSP está valendo: um script inline injetado (como faria um XSS) não roda.
  await send('Page.navigate', { url: `${base}` });
  await waitFor("document.readyState === 'complete'", 10000);
  check(await evaluate(`(() => {
    const script = document.createElement('script');
    script.textContent = 'window.__injected = true';
    document.head.append(script);
    return window.__injected !== true;
  })()`), 'CSP bloqueia script inline injetado');
} finally {
  await close();
}

if (failures.length) {
  console.error(`\nTeste no navegador: ${failures.length} falha(s).`);
  process.exit(1);
}
console.log('\nTeste no navegador: tudo certo.');
process.exit(0);
