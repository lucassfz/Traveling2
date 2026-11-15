// Gera uma página estática por país (paises/<slug>/index.html) e o índice
// paises/index.html, e atualiza sitemap.xml. Para que servem:
//   - prévia própria ao compartilhar o link (WhatsApp, Instagram, X): título,
//     descrição e foto do país;
//   - o Google indexar cada país (o globo é uma página só, em JavaScript).
// Cada página tem o essencial em texto e o botão "Abrir no globo 3D" (#/ISO2).
//
//   npm run build:pages
//
// Sem dependências; usa os mesmos dados do site (js/countries.dataset.js e
// data/summaries.pt.json). scripts/validate-country-pages.js confere se os
// arquivos estão em dia com os dados.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { COUNTRIES, CONTINENT_LABELS } from '../js/countries.dataset.js';
import { COUNTRY_PAGES_DIR, countrySlug } from '../js/country.slug.js';
import { PARTNERS, klookUrl } from '../js/planner/partners.section.js';

// Endereço público do site. Ao trocar de domínio, mude aqui e rode o gerador.
export const SITE_URL = 'https://lucassfz.github.io/Traveling2/';
// Backend de preços (o mesmo da meta traveling-prices do index.html).
export const PRICES_API = 'https://traveling-api.travelingorgsenac.workers.dev/api/v1';

// Preço visto recentemente, buscado quando a página abre (preço muda todo dia,
// não pode ficar fixo no HTML). Ida e volta saindo de São Paulo no próximo mês.
// Sem resposta, a seção continua escondida.
const PRICE_SCRIPT = `<script>
  (function () {
    var box = document.getElementById('price');
    if (!box || !window.fetch) return;
    var now = new Date();
    var next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    var month = next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0');
    var names = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    var url = box.dataset.api + '/flights/cheapest?origin=GRU&destination=' + box.dataset.airport + '&departure=' + month + '&return=' + month;
    fetch(url).then(function (response) { return response.ok ? response.json() : null; }).then(function (body) {
      var offer = body && body.offers && body.offers[0];
      if (!offer || String(offer.url).indexOf('https://www.aviasales.com/') !== 0) return;
      var price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(offer.price.amount));
      var seen = offer.foundOn ? offer.foundOn.split('-').reverse().slice(0, 2).join('/') : '';
      box.querySelector('[data-price]').textContent = price;
      box.querySelector('[data-when]').textContent = 'Ida e volta em ' + names[next.getMonth()] + ', por pessoa' + (offer.transfers === 0 ? ', voo direto' : '') + '.';
      box.querySelector('[data-seen]').textContent = 'Preço visto ' + (seen ? 'em ' + seen + ' ' : 'recentemente ') + 'por outros viajantes; pode ter mudado.';
      box.querySelector('a').href = offer.url;
      box.hidden = false;
    }).catch(function () {});
  })();
  </script>`;
export const PAGES_UPDATED = '2026-11-15';

const ROOT = new URL('../', import.meta.url);
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const plain = value => String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const httpsUrl = value => (/^https:\/\/[^\s"'<>]+$/.test(value ?? '') ? value : null);
const brDate = iso => (/^\d{4}-\d{2}$/.test(iso ?? '') ? `${iso.slice(5, 7)}/${iso.slice(0, 4)}` : null);
const clip = (text, max) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);

function bestMonths(country) {
  const months = Array.isArray(country.months) ? country.months : [];
  return months.map((value, index) => (value === 2 ? MONTHS[index] : null)).filter(Boolean);
}

function visaInfo(country) {
  const policy = country.visaPolicyBR ?? {};
  const detail = plain(policy.detail || country.visaText);
  const source = httpsUrl(policy.source);
  const verified = brDate(policy.verifiedOn);
  return { detail, source, verified, domestic: policy.eligibility === 'domestic' };
}

// Frase curta da regra de entrada para a descrição (o detalhe vai na página).
const VISA_SHORT = {
  'visa-free': 'sem visto para brasileiros',
  evisa: 'visto eletrônico para brasileiros',
  'visa-on-arrival': 'visto na chegada para brasileiros',
  authorization: 'autorização eletrônica para brasileiros',
  'visa-required': 'exige visto de brasileiros',
  domestic: 'destino nacional',
  unknown: 'regras de entrada para brasileiros'
};

export function pageDescription(country) {
  const visa = VISA_SHORT[country.visaPolicyBR?.eligibility] ?? VISA_SHORT.unknown;
  return clip(`${country.namePt}: ${visa}, capital ${country.capital}, moeda ${country.currency}, melhor época e o que ver. Guia de viagem no globo 3D do Traveling.`, 158);
}

const STYLE = `
    :root { color-scheme: dark; --bg: #05070c; --surface: #0d121c; --text: #e8edf3; --muted: #9aa8b8; --accent: #7cc9f5; --border: rgba(255, 255, 255, .1); --cta: #e8edf3; --cta-text: #05070c; }
    @media (prefers-color-scheme: light) { :root:not([data-theme='dark']) { color-scheme: light; --bg: #eef1f3; --surface: #ffffff; --text: #0b1220; --muted: #5f6f82; --accent: #0a6fa8; --border: #d3dbe1; --cta: #0b1220; --cta-text: #ffffff; } }
    [data-theme='light'] { color-scheme: light; --bg: #eef1f3; --surface: #ffffff; --text: #0b1220; --muted: #5f6f82; --accent: #0a6fa8; --border: #d3dbe1; --cta: #0b1220; --cta-text: #ffffff; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; }
    main { max-width: 760px; margin: 0 auto; padding: 24px 16px 64px; }
    a { color: var(--accent); }
    .back { display: inline-block; margin-bottom: 20px; font-size: .9rem; text-decoration: none; }
    .identity { display: flex; gap: 14px; align-items: center; margin-bottom: 8px; }
    .identity img { width: 56px; height: 42px; border-radius: 6px; object-fit: cover; border: 1px solid var(--border); }
    .eyebrow { color: var(--muted); font-size: .75rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font: 600 2.2rem/1.15 'Playfair Display', Georgia, serif; }
    h2 { margin: 32px 0 10px; font-size: 1.15rem; }
    .cta { display: inline-flex; align-items: center; min-height: 48px; margin: 18px 0 8px; padding: 0 22px; border-radius: 999px; background: var(--cta); color: var(--cta-text); font-weight: 600; text-decoration: none; }
    .lead { font-size: 1.05rem; }
    .muted, small { color: var(--muted); }
    .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; margin: 20px 0 0; overflow: hidden; border: 1px solid var(--border); border-radius: 14px; background: var(--border); }
    .facts div { padding: 12px 14px; background: var(--surface); }
    .facts dt { color: var(--muted); font-size: .78rem; }
    .facts dd { margin: 2px 0 0; font-weight: 600; }
    .note { padding: 14px 16px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); }
    .places { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; padding: 0; list-style: none; }
    .places li { overflow: hidden; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); }
    .places img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: var(--border); }
    .places div { padding: 10px 12px 12px; }
    .places strong { display: block; }
    .foods { padding-left: 18px; }
    .price { margin-top: 28px; padding: 4px 18px 8px; border: 1px solid var(--border); border-radius: 16px; background: var(--surface); }
    .price h2 { margin-top: 16px; }
    .price__value { font-size: 1.8rem; }
    .partners { display: grid; gap: 8px; padding: 0; list-style: none; }
    .partners a { display: block; padding: 12px 14px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); text-decoration: none; font-weight: 600; }
    .list { columns: 2 180px; padding-left: 18px; }
    footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--border); color: var(--muted); font-size: .85rem; }`;

const THEME_SCRIPT = `<script>
    try {
      var savedTheme = localStorage.getItem('traveling.theme');
      if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
    } catch (error) { /* armazenamento bloqueado */ }
  </script>`;

function head({ title, description, url, image, imageAlt, jsonLd }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(url)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Traveling">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll('<', '\\u003c')}</script>
  ${THEME_SCRIPT}
  <style>${STYLE}
  </style>
</head>`;
}

export function countryPage(country, summary) {
  const slug = countrySlug(country.namePt);
  const url = `${SITE_URL}${COUNTRY_PAGES_DIR}/${slug}/`;
  const globe = `../../#/${country.alpha2}`;
  const visa = visaInfo(country);
  const landmarks = (country.landmarks ?? []).filter(item => httpsUrl(item.media?.url)).slice(0, 4);
  const cover = landmarks[0];
  const image = cover ? cover.media.url : `${SITE_URL}og-image.png`;
  const imageAlt = cover ? `${cover.name}, ${country.namePt}` : 'Globo 3D do Traveling';
  const title = `${country.namePt}: guia de viagem para brasileiros | Traveling`;
  const description = pageDescription(country);
  const months = bestMonths(country);
  const foods = (Array.isArray(country.foods) ? country.foods : []).slice(0, 4);
  const flag = `https://flagcdn.com/w80/${country.alpha2.toLowerCase()}.png`;
  const summaryUrl = httpsUrl(summary?.url);
  const facts = [
    ['Capital', country.capital],
    ['Moeda', country.currency],
    ['Idioma', country.lang],
    ['Fuso horário', country.timezoneLabel],
    ['Tomada', country.voltage],
    ['Aeroporto principal', country.airport ? `${country.airport}${country.airportCity ? ` · ${country.airportCity}` : ''}` : null]
  ].filter(([, value]) => value);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: country.namePt,
    description,
    url,
    image,
    containedInPlace: { '@type': 'Place', name: CONTINENT_LABELS[country.continent] ?? country.region }
  };

  return `${head({ title, description, url, image, imageAlt, jsonLd })}
<body>
  <main>
    <a class="back" href="../../">← Traveling: explore o mundo</a>
    <div class="identity">
      <img src="${flag}" alt="" width="56" height="42">
      <div>
        <div class="eyebrow">${escapeHtml(CONTINENT_LABELS[country.continent] ?? country.region)}</div>
        <h1>${escapeHtml(country.namePt)}</h1>
      </div>
    </div>
    <a class="cta" href="${globe}">Abrir ${escapeHtml(country.namePt)} no globo 3D</a>
    <p class="muted"><small>No globo: cidades, estados, voos, milhas e um planejador de viagem passo a passo.</small></p>
${summary?.text ? `
    <p class="lead">${escapeHtml(summary.text)}${summaryUrl ? ` <small><a href="${escapeHtml(summaryUrl)}" rel="noopener">Wikipédia</a> (CC BY-SA)</small>` : ''}</p>` : ''}

    <dl class="facts">
${facts.map(([label, value]) => `      <div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('\n')}
    </dl>

    <h2>Visto para brasileiros</h2>
    <p class="note">${escapeHtml(visa.detail)}${visa.domestic ? '' : `<br><small>${visa.source ? `Fonte oficial: <a href="${escapeHtml(visa.source)}" rel="noopener">${escapeHtml(new URL(visa.source).hostname)}</a>${visa.verified ? `, conferida em ${visa.verified}` : ''}. ` : ''}Regras mudam: confirme antes de comprar a passagem.</small>`}</p>
${country.passport && !visa.domestic ? `    <p><strong>Passaporte:</strong> ${escapeHtml(plain(country.passport))}</p>\n` : ''}${country.vaccines ? `    <p><strong>Saúde:</strong> ${escapeHtml(plain(country.vaccines))}</p>\n` : ''}
    <h2>Melhor época</h2>
    <p>${escapeHtml(plain(country.bestTime))}</p>
${months.length ? `    <p class="muted">Meses mais indicados: ${escapeHtml(months.join(', '))}.</p>\n` : ''}${landmarks.length ? `
    <h2>O que ver</h2>
    <ul class="places">
${landmarks.map(item => `      <li>
        <img src="${escapeHtml(item.media.url)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">
        <div><strong>${escapeHtml(item.name)}</strong>${item.city ? `<small>${escapeHtml(item.city)}</small>` : ''}
          <br><small>Foto: ${httpsUrl(item.media.sourcePage) ? `<a href="${escapeHtml(item.media.sourcePage)}" rel="noopener">${escapeHtml(item.media.author ?? 'Wikimedia Commons')}</a>` : escapeHtml(item.media.author ?? 'Wikimedia Commons')}${item.media.license ? ` · ${escapeHtml(item.media.license)}` : ''}</small></div>
      </li>`).join('\n')}
    </ul>
` : ''}${foods.length ? `
    <h2>Para provar</h2>
    <ul class="foods">
${foods.map(food => `      <li><strong>${escapeHtml(food.name)}</strong>${food.desc ? `: ${escapeHtml(plain(food.desc))}` : ''}</li>`).join('\n')}
    </ul>
` : ''}
${country.airport && country.airport !== 'GRU' ? `    <section class="price" id="price" data-api="${PRICES_API}" data-airport="${escapeHtml(country.airport)}" hidden>
      <h2>Passagens: São Paulo → ${escapeHtml(country.namePt)}</h2>
      <p><span class="muted">a partir de</span> <strong class="price__value" data-price></strong></p>
      <p class="muted" data-when></p>
      <p><small data-seen></small></p>
      <p><a class="cta" href="${escapeHtml(PARTNERS.aviasales.home)}" rel="noopener sponsored">Ver esse preço no Aviasales ↗</a></p>
    </section>
    ${PRICE_SCRIPT}
` : ''}    <h2>Planeje com parceiros</h2>
    <ul class="partners">
      <li><a href="${escapeHtml(PARTNERS.aviasales.home)}" rel="noopener sponsored">Comparar passagens no Aviasales ↗</a></li>
      <li><a href="${escapeHtml(klookUrl(country.namePt))}" rel="noopener sponsored">Passeios em ${escapeHtml(country.namePt)} no Klook ↗</a></li>
      <li><a href="${escapeHtml(PARTNERS.yesim.home)}" rel="noopener sponsored">Internet no destino: eSIM no Yesim ↗</a></li>
    </ul>
    <p class="muted"><small>Links de parceiro: o Traveling pode receber comissão, sem custo extra para você. <a href="../../parceiros.html">Saiba mais</a></small></p>

    <a class="cta" href="${globe}">Ver ${escapeHtml(country.namePt)} no globo e planejar a viagem</a>

    <footer>
      Informações editoriais do Traveling, revisadas em fontes públicas; preços e regras mudam. Atualizado em ${PAGES_UPDATED.split('-').reverse().join('/')}.
      <br><a href="../">Todos os países</a> · <a href="../../parceiros.html">Parceiros</a> · <a href="../../privacidade.html">Privacidade</a>
    </footer>
  </main>
</body>
</html>
`;
}

export function indexPage(countries) {
  const url = `${SITE_URL}${COUNTRY_PAGES_DIR}/`;
  const title = 'Guias de viagem de 196 países para brasileiros | Traveling';
  const description = 'Visto para brasileiros, melhor época, moeda e o que ver em 196 países. Escolha um destino e explore no globo 3D do Traveling.';
  const byContinent = new Map();
  for (const country of countries) {
    const label = CONTINENT_LABELS[country.continent] ?? country.region;
    if (!byContinent.has(label)) byContinent.set(label, []);
    byContinent.get(label).push(country);
  }
  const groups = [...byContinent].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  return `${head({ title, description, url, image: `${SITE_URL}og-image.png`, imageAlt: 'Globo 3D do Traveling', jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url } })}
<body>
  <main>
    <a class="back" href="../">← Traveling: explore o mundo</a>
    <h1>Guias de viagem</h1>
    <p class="lead">${escapeHtml(description)}</p>
    <a class="cta" href="../">Abrir o globo 3D</a>
${groups.map(([label, list]) => `
    <h2>${escapeHtml(label)}</h2>
    <ul class="list">
${list.sort((a, b) => a.namePt.localeCompare(b.namePt, 'pt-BR')).map(country => `      <li><a href="${countrySlug(country.namePt)}/">${escapeHtml(country.namePt)}</a></li>`).join('\n')}
    </ul>`).join('\n')}

    <footer>
      Atualizado em ${PAGES_UPDATED.split('-').reverse().join('/')}. <a href="../parceiros.html">Parceiros</a> · <a href="../privacidade.html">Privacidade</a>
    </footer>
  </main>
</body>
</html>
`;
}

export function sitemap(countries) {
  const entry = (path, changefreq, priority) => `  <url><loc>${SITE_URL}${path}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
    entry('', 'weekly', '1.0'),
    entry(`${COUNTRY_PAGES_DIR}/`, 'monthly', '0.8'),
    ...countries.map(country => entry(`${COUNTRY_PAGES_DIR}/${countrySlug(country.namePt)}/`, 'monthly', '0.7')),
    entry('parceiros.html', 'monthly', '0.3'),
    entry('privacidade.html', 'monthly', '0.3')
  ].join('\n')}
</urlset>
`;
}

/** Todos os arquivos gerados: { caminho relativo à raiz: conteúdo }. */
export async function buildAll() {
  const summaries = JSON.parse(await readFile(new URL('data/summaries.pt.json', ROOT), 'utf8'));
  const countries = Object.values(COUNTRIES).filter(country => country.alpha2 && country.namePt)
    .sort((a, b) => a.namePt.localeCompare(b.namePt, 'pt-BR'));
  const files = { [`${COUNTRY_PAGES_DIR}/index.html`]: indexPage(countries), 'sitemap.xml': sitemap(countries) };
  for (const country of countries) {
    files[`${COUNTRY_PAGES_DIR}/${countrySlug(country.namePt)}/index.html`] = countryPage(country, summaries.countries?.[country.alpha2]);
  }
  return files;
}

async function main() {
  const files = await buildAll();
  await rm(new URL(`${COUNTRY_PAGES_DIR}/`, ROOT), { recursive: true, force: true });
  for (const [path, content] of Object.entries(files)) {
    const target = new URL(path, ROOT);
    await mkdir(new URL('./', target), { recursive: true });
    await writeFile(target, content);
  }
  const pages = (await readdir(new URL(`${COUNTRY_PAGES_DIR}/`, ROOT))).filter(name => !name.endsWith('.html')).length;
  console.log(`${pages} páginas de país, índice e sitemap gerados.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
