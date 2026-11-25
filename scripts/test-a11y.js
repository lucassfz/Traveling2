// Teste de acessibilidade no navegador, como usa quem não enxerga a tela:
//   1. só com o teclado (eventos reais de Tab, setas, Enter e Esc): chega em tudo,
//      o foco nunca some, nem fica preso, e volta para onde estava ao fechar;
//   2. axe-core (WCAG 2.2 A e AA) em cada tela, nos temas escuro e claro.
//
//   npm run test:a11y        (CHROME_PATH=... para outro Chrome)
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { openChrome, sleep } from './chrome.js';

const axeSource = await readFile(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); console.log(`${ok ? 'ok  ' : 'FALHA'} ${message}`); };

const page = await openChrome();
const { send, evaluate, waitFor } = page;
// Vale só para o teste: o axe é injetado, e a CSP bloquearia (como deve).
await send('Page.setBypassCSP', { enabled: true });

const KEYS = { Tab: 9, Enter: 13, Escape: 27, ArrowDown: 40, ArrowUp: 38, ArrowLeft: 37, ArrowRight: 39, Home: 36, End: 35, ' ': 32 };
async function press(key, { shift = false } = {}) {
  const text = key === 'Enter' ? '\r' : key.length === 1 ? key : undefined;
  const event = { key, code: key, windowsVirtualKeyCode: KEYS[key] ?? key.toUpperCase().charCodeAt(0), modifiers: shift ? 8 : 0 };
  await send('Input.dispatchKeyEvent', { type: text ? 'keyDown' : 'rawKeyDown', ...event, text });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
  await sleep(40);
}
const type = async text => { for (const char of text) await send('Input.insertText', { text: char }); await sleep(250); };

// Elemento em foco: nome acessível aproximado, se está visível e com contorno.
const focused = () => evaluate(`(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { id: '', tag: 'BODY', name: '', visible: false, outline: false };
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const label = el.labels?.[0]?.textContent ?? '';
  return {
    id: el.id, tag: el.tagName, role: el.getAttribute('role') ?? '',
    name: (el.getAttribute('aria-label') ?? (document.getElementById(el.getAttribute('aria-labelledby') ?? '')?.textContent || label || el.textContent || el.title)).trim().slice(0, 60),
    visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && !el.closest('[inert], [hidden], [aria-hidden="true"]'),
    outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2 || style.boxShadow !== 'none'
  };
})()`);
const focusIs = async (expected, message) => {
  const test = !expected.startsWith('document.') ? `document.activeElement?.matches(${JSON.stringify(expected)})` : expected;
  const ok = await waitFor(test, 6000);
  const now = ok ? null : await focused();
  check(ok, ok ? message : `${message} (foco em ${now.tag}#${now.id} "${now.name}")`);
};
// Espera o elemento poder receber foco (fim da animação de abertura).
const focus = selector => waitFor(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el?.focus(); return el && document.activeElement === el; })()`, 8000);

/** Anda com Tab pela página inteira. @returns {Promise<object[]>} paradas, na ordem. */
async function walk(limit = 160) {
  const stops = [];
  for (let index = 0; index < limit; index += 1) {
    await press('Tab');
    const stop = await focused();
    if (stop.tag === 'BODY') break; // saiu da página: deu a volta
    stops.push(stop);
  }
  return stops;
}

async function load(hash = '') {
  await page.goto(hash);
  check(await waitFor("Boolean(document.querySelector('#globe.globe--ready'))"), `página carregada (${hash || 'início'})`);
  await waitFor("!document.getElementById('splash-screen')", 8000);
}

async function axe(name) {
  await evaluate(axeSource);
  await sleep(900); // animações de entrada (o axe mede contraste no estado final)
  const violations = await evaluate(`axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'], rules: { region: { enabled: false } } })
    .then(result => result.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => n.target.join(' ') + ' :: ' + (n.any[0]?.message ?? n.all[0]?.message ?? n.none[0]?.message ?? '')) })))`);
  check(violations.length === 0, `axe: ${name}${violations.length ? ` (${violations.length} tipos de problema)` : ''}`);
  for (const item of violations) console.log(`      ${item.impact} ${item.id}: ${item.help} [${item.nodes.length}]\n        ${item.nodes.slice(0, 4).join('\n        ')}`);
}

try {
  // ---------- Primeira visita ----------
  await load();
  await waitFor("document.querySelector('.tour')", 6000);
  check(await evaluate("Boolean(document.querySelector('.tour'))"), 'tour aparece na primeira visita');
  await axe('tour');
  await press('Escape');
  check(await waitFor("!document.querySelector('.tour')", 3000), 'Esc fecha o tour');

  // ---------- Início: volta completa pelo Tab ----------
  await load();
  const stops = await walk();
  const ids = stops.map(stop => stop.id);
  check(stops.length > 15 && stops.length < 160, `Tab percorre a página inteira e sai dela (${stops.length} paradas)`);
  check(stops.every(stop => stop.name || stop.role === 'application'), `toda parada tem nome: ${stops.filter(stop => !stop.name).map(stop => `${stop.tag}#${stop.id}`).join(', ') || 'sim'}`);
  check(stops.every(stop => stop.visible), `nenhuma parada escondida: ${stops.filter(stop => !stop.visible).map(stop => `${stop.tag}#${stop.id} ${stop.name}`).join(', ') || 'sim'}`);
  check(stops.every(stop => stop.outline), `foco sempre visível: ${stops.filter(stop => !stop.outline).map(stop => `${stop.tag}#${stop.id} ${stop.name}`).join(', ') || 'sim'}`);
  check(stops[0]?.name === 'Pular para a busca de países', 'a primeira parada é o atalho para a busca');
  for (const id of ['home-button', 'country-search-input', 'discover-button', 'trips-launcher', 'saved-launcher', 'miles-launcher', 'a11y-button', 'theme-button', 'globe-stage', 'zoom-in', 'zoom-out', 'places-launcher', 'visa-free-filter', 'season-filter']) check(ids.includes(id), `Tab chega em #${id}`);
  check(new Set(ids.filter(Boolean)).size === ids.filter(Boolean).length, 'nenhuma parada repetida');
  await axe('início (escuro)');

  // ---------- Busca (combobox) ----------
  await focus('#home-button');
  await press('/');
  await focusIs('#country-search-input', 'tecla / leva à busca');
  await type('portu');
  check(await waitFor("document.querySelector('#country-search-input')?.getAttribute('aria-expanded') === 'true'", 3000), 'digitar abre as sugestões');
  await press('ArrowDown');
  check(await evaluate(`(() => { const input = document.getElementById('country-search-input'); const option = document.getElementById(input.getAttribute('aria-activedescendant')); return option?.getAttribute('aria-selected') === 'true' && /Portugal/.test(option.textContent); })()`), 'seta marca a sugestão e o leitor de tela sabe qual é');
  await axe('busca aberta');
  await press('Enter');
  await focusIs('#country-name', 'Enter abre o guia e o foco vai para o nome do país');
  check(await evaluate("document.title.startsWith('Portugal')"), 'título da aba acompanha o país');

  // ---------- Guia do país ----------
  await waitFor("document.querySelector('#country-media img')", 8000);
  await axe('guia de Portugal');
  await focus('#country-tab-button-overview');
  await press('ArrowRight');
  await focusIs('#country-tab-button-culture', 'seta troca de aba');
  await axe('guia: Cultura');
  await press('End');
  await focusIs('#country-tab-button-history', 'End vai à última aba');
  await waitFor("document.querySelector('.history-item')", 8000);
  await axe('guia: História');
  await press('Home');
  const guide = await (async () => {
    await focus('#country-name');
    const list = [];
    for (let i = 0; i < 80; i += 1) { await press('Tab'); const stop = await focused(); if (!await evaluate("Boolean(document.activeElement?.closest('#country-panel'))")) break; list.push(stop); }
    return list;
  })();
  check(guide.length > 10 && guide.length < 80, `Tab percorre o guia e sai dele (${guide.length} paradas)`);
  check(guide.every(stop => stop.visible && stop.outline && stop.name), `guia: foco visível e com nome: ${guide.filter(stop => !(stop.visible && stop.outline && stop.name)).map(stop => `${stop.tag}#${stop.id} ${stop.name}`).join(', ') || 'sim'}`);

  // Cidade sem usar o globo.
  await focus('#country-city-search');
  await type('lis');
  await waitFor("[...document.querySelectorAll('#country-cities .geo-nav__chip')].some(el => /Lisboa/.test(el.textContent))", 5000);
  await press('Tab');
  await press('Enter');
  await focusIs('#city-card-title', 'cidade abre pela lista, com foco no nome');
  await axe('cartão da cidade');
  await press('Escape');
  await focusIs('#country-cities .geo-nav__chip', 'Esc fecha a cidade e o foco volta para ela na lista');
  await press('Escape');
  await focusIs('#country-search-input', 'Esc fecha o guia e o foco volta para a busca');

  // ---------- Lista de países ----------
  await load();
  await press('Tab');
  await press('Tab');
  await press('Enter');
  await focusIs('[data-hub="places"] .miles-hub__title', 'segundo atalho abre a lista de países');
  await axe('lista de países');
  await focus('#places-filter');
  await type('japao');
  check(await waitFor("document.querySelectorAll('.places__item').length === 1", 3000), 'filtro da lista ignora acentos');
  await focus('.places__item');
  await press('Enter');
  await focusIs('#country-name', 'país abre pela lista de países');
  await focus('#country-panel-close');
  await press('Enter');
  check(await waitFor("!document.querySelector('.country-panel--open')", 3000), 'X fecha o guia');
  await focusIs('document.activeElement !== document.body && !document.activeElement.closest("[inert]")', 'o foco não se perde ao fechar pelo X');

  // ---------- Globo pelo teclado ----------
  await load();
  await focus('#globe-stage');
  for (let i = 0; i < 3; i += 1) { await press('ArrowRight'); await sleep(350); }
  check(await waitFor("/^Centro: /.test(document.getElementById('globe-announcer').textContent)", 4000), 'setas giram o globo e o centro é anunciado');

  // ---------- Painéis ----------
  for (const [launcher, hub, name] of [['#miles-launcher', 'miles', 'Milhas'], ['#saved-launcher', 'saved', 'Salvos'], ['#trips-launcher', 'planner', 'Viagens']]) {
    await focus(launcher);
    await press('Enter');
    await focusIs(`[data-hub="${hub}"] .miles-hub__title`, `${name}: Enter abre e o foco vai para o título`);
    await waitFor(`!document.querySelector('[data-hub="${hub}"] .planner-empty')`, 6000);
    await axe(name);
    await press('Escape');
    await focusIs(launcher, `${name}: Esc fecha e o foco volta para o botão`);
  }
  await focus('#miles-launcher');
  await press('Enter');
  await waitFor("document.querySelector('#miles-tab-convert')", 5000);
  await focus('#miles-tab-convert');
  await press('ArrowRight');
  await focusIs('#miles-tab-cards', 'Milhas: seta troca de aba');
  await axe('Milhas: cartões');
  await press('ArrowRight');
  await axe('Milhas: salas VIP');
  await press('Escape');

  // ---------- Descobrir ----------
  await focus('#discover-button');
  await press('Enter');
  await focusIs('#discovery-title', 'Descobrir: foco no título');
  await waitFor("document.querySelector('.discovery-card__head')", 6000);
  await focus('.discovery-card__head');
  await press('Enter');
  check(await waitFor("document.querySelector('.discovery-card__head')?.getAttribute('aria-expanded') === 'true'", 3000), 'Descobrir: Enter abre o destino');
  await waitFor("document.querySelector('.discovery-cities .discovery-chip')", 6000);
  await axe('Descobrir');
  await press('Escape');
  await focusIs('#discover-button', 'Descobrir: Esc volta para o botão');

  // ---------- Planejador: viagem inteira só com o teclado ----------
  await load('#/JP');
  await waitFor("document.querySelector('#country-plan-button')", 6000);
  await focus('#country-plan-button');
  await press('Enter');
  await focusIs('#wizard-title', 'Planejar viagem: foco na confirmação');
  await axe('Planejador: confirmação');
  await focus('[data-planner-action="draft-create"]');
  await press('Enter');
  for (let step = 1; step <= 6; step += 1) {
    check(await waitFor(`document.querySelector('.stepper [aria-current="step"]')?.dataset.plannerStep === '${step}'`, 6000), `Planejador: etapa ${step} aberta`);
    await focusIs('#wizard-title', `Planejador: foco no título da etapa ${step}`);
    if (step === 3) await waitFor("document.querySelector('.planner-fare')", 10000);
    await axe(`Planejador: etapa ${step}`);
    if (step < 6) { await focus('[data-planner-action="next"]'); await press('Enter'); }
  }
  const plannerStops = await (async () => {
    await focus('#wizard-title');
    const list = [];
    for (let i = 0; i < 60; i += 1) { await press('Tab'); if (!await evaluate("Boolean(document.activeElement?.closest('#planner-panel'))")) break; list.push(await focused()); }
    return list;
  })();
  check(plannerStops.length > 5 && plannerStops.length < 60 && plannerStops.every(stop => stop.visible && stop.outline), 'Planejador: Tab percorre o resumo com foco visível');

  // Menu da viagem e exclusão.
  await focus('[data-planner-action="home"]');
  await press('Enter');
  await waitFor("document.querySelector('[data-planner-menu]')", 4000);
  await axe('Planejador: lista de viagens');
  await focus('[data-planner-menu]');
  await press('Enter');
  await focusIs('[role="menuitem"]', 'menu da viagem: foco na primeira opção');
  await press('ArrowUp');
  check((await focused()).name === 'Excluir', 'menu: seta para cima vai à última opção');
  await press('Enter');
  await waitFor("document.querySelector('[role=alertdialog]')", 3000);
  check((await focused()).name === 'Cancelar', 'excluir: foco em Cancelar');
  await press('Tab'); await press('Tab');
  check((await focused()).name === 'Cancelar', 'excluir: o Tab fica preso no diálogo');
  await axe('Planejador: excluir');
  await press('Escape');
  await focusIs('[data-planner-menu]', 'excluir: Esc cancela e o foco volta ao menu');

  // ---------- Acessibilidade e atalhos ----------
  await load();
  await focus('#a11y-button');
  await press('Enter');
  await focusIs('#a11y-title', 'Acessibilidade: foco no título');
  await axe('Acessibilidade');
  await press('Escape');
  await focusIs('#a11y-button', 'Acessibilidade: Esc volta para o botão');
  await press('?');
  check(await waitFor("document.querySelector('.help-dialog')?.open", 3000), 'tecla ? abre os atalhos');
  check(await evaluate("Boolean(document.activeElement?.closest('.help-dialog'))"), 'atalhos: foco dentro do diálogo');
  await axe('atalhos de teclado');
  await press('Escape');
  await focusIs('#a11y-button', 'atalhos: Esc devolve o foco');

  // ---------- Tema claro, alto contraste e celular ----------
  await evaluate("localStorage.setItem('traveling.theme', 'light')");
  await load('#/PT');
  await waitFor("document.querySelector('#country-media img')", 8000);
  await axe('guia (claro)');
  await focus('#country-plan-button');
  await press('Enter');
  await waitFor("document.querySelector('#wizard-title')", 6000);
  await axe('planejador (claro)');
  await load();
  await axe('início (claro)');
  await evaluate("localStorage.setItem('traveling.a11y', JSON.stringify({ text: 'xlarge', contrast: true }))");
  await load('#/PT');
  await waitFor("document.querySelector('#country-media img')", 8000);
  await axe('guia (claro, alto contraste, texto muito grande)');
  await evaluate("localStorage.removeItem('traveling.a11y')");
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await load();
  await axe('início (celular)');
  await load('#/PT');
  await waitFor("document.querySelector('#country-media img')", 8000);
  await axe('guia (celular)');

  // ---------- Páginas estáticas ----------
  for (const path of ['paises/', 'paises/japao/', 'cidades/lisboa-portugal/', 'privacidade.html', 'parceiros.html', '404.html']) {
    await page.goto(path);
    await waitFor("document.readyState === 'complete' && Boolean(document.querySelector('h1'))", 10000);
    await axe(path);
  }
  check(page.errors.length === 0, `sem erros no console${page.errors.length ? `: ${page.errors.slice(0, 3).join(' | ')}` : ''}`);
} catch (error) {
  failures.push(String(error.stack ?? error));
  console.error(error);
} finally {
  await page.close();
}

console.log(failures.length ? `\nAcessibilidade: ${failures.length} falha(s).` : '\nAcessibilidade: teclado e axe sem falhas.');
process.exit(failures.length ? 1 : 0);
