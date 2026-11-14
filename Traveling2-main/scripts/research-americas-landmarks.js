// Pesquisa editorial somente leitura. Revise identidade, país e assunto da foto
// antes de copiar qualquer candidato para o catálogo de mídia.
const candidates = [
  ['Antigua & Barbuda', 'Nelson\'s Dockyard'], ['Argentina', 'Obelisk of Buenos Aires'],
  ['Bahamas', "Queen's Staircase"], ['Barbados', 'Parliament Buildings, Barbados'],
  ['Belize', 'Great Blue Hole'], ['Bolivia', 'Salar de Uyuni'],
  ['Canada', 'CN Tower'], ['Chile', 'Torres del Paine National Park'],
  ['Colombia', 'Castillo San Felipe de Barajas'], ['Costa Rica', 'National Theatre of Costa Rica'],
  ['Cuba', 'El Capitolio'], ['Dominica', 'Fort Shirley (Dominica)'],
  ['Dominican Rep.', 'Fortaleza Ozama'], ['Ecuador', 'Ciudad Mitad del Mundo'],
  ['El Salvador', 'Monumento al Divino Salvador del Mundo'], ['Grenada', 'Fort George, Grenada'],
  ['Guatemala', 'Santa Catalina Arch'], ['Guyana', 'Kaieteur Falls'],
  ['Haiti', 'Citadelle Laferrière'], ['Honduras', 'Copán'],
  ['Jamaica', "Dunn's River Falls"], ['Mexico', 'Palacio de Bellas Artes'],
  ['Nicaragua', 'León Cathedral, Nicaragua'], ['Panama', 'Miraflores Locks'],
  ['Paraguay', 'Palacio de los López'], ['St. Kitts & Nevis', 'Brimstone Hill Fortress National Park'],
  ['St. Lucia', 'Gros Piton'], ['St. Vincent & Grenadines', 'Fort Charlotte, Saint Vincent'],
  ['Suriname', 'Saint Peter and Paul Cathedral, Paramaribo'],
  ['Trinidad & Tobago', "Queen's Royal College"], ['Uruguay', 'Casapueblo'],
  ['Venezuela', 'Angel Falls'], ['Fr. Guiana', 'Fort Cépérou']
];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const plain = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
const titles = {
  'Parliament Buildings, Barbados': 'Parliament_Buildings_(Barbados)',
  'Ciudad Mitad del Mundo': 'Ciudad_Mitad_del_Mundo',
  'Fort George, Grenada': 'Fort_George,_Grenada',
  'Fort Charlotte, Saint Vincent': 'Fort_Charlotte,_Saint_Vincent',
  'Saint Peter and Paul Cathedral, Paramaribo': 'Saint_Peter_and_Paul_Cathedral,_Paramaribo',
  "Queen's Royal College": "Queen's_Royal_College"
};
// Evita páginas homônimas ou de desambiguação na pesquisa automática.
const knownEntityIds = {
  'Fort Shirley (Dominica)': 'Q65123003',
  'León Cathedral, Nicaragua': 'Q48605',
  'Gros Piton': 'Q1321979'
};
async function request(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': 'TravelingEditorialAudit/1.0 (local research)' } });
    if (response.ok) return response.json();
    if (![429, 502, 503].includes(response.status)) throw Error(`${response.status} ${url}`);
    await delay(1000 * (attempt + 1));
  }
  throw Error(`Rate limit: ${url}`);
}
for (const [country, query] of candidates) {
  const result = { country, query };
  try {
    const title = titles[query] || query.replaceAll(' ', '_');
    if (knownEntityIds[query]) {
      result.id = knownEntityIds[query];
    } else {
      const page = await fetch(`https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`);
      const html = page.ok ? await page.text() : '';
      result.id = html.match(/Special:EntityPage\/(Q\d+)/)?.[1];
      if (!result.id) throw Error(`Wikipedia page/identity missing (${page.status})`);
    }
    const entity = await request(`https://www.wikidata.org/wiki/Special:EntityData/${result.id}.json`);
    const claims = entity.entities?.[result.id]?.claims;
    result.label = entity.entities?.[result.id]?.labels?.en?.value;
    result.description = entity.entities?.[result.id]?.descriptions?.en?.value;
    result.file = claims.P18?.[0]?.mainsnak?.datavalue?.value;
    const point = claims.P625?.[0]?.mainsnak?.datavalue?.value;
    result.coordinates = point && [point.latitude, point.longitude];
    result.countryId = claims.P17?.[0]?.mainsnak?.datavalue?.value?.id;
    if (result.file) {
      const path = encodeURIComponent(result.file.replaceAll(' ', '_'));
      const file = await request(`https://commons.wikimedia.org/w/rest.php/v1/file/File:${path}`);
      const response = await fetch(`https://commons.wikimedia.org/w/rest.php/v1/page/File:${path}/html`);
      const fileHtml = response.ok ? await response.text() : '';
      const author = fileHtml.match(/"Author":\{"wt":"([^"]+)/)?.[1] ?? file.latest?.user?.name ?? '';
      const license = fileHtml.match(/licensetpl_short">([^<]+)/)?.[1] ?? '';
      const description = fileHtml.match(/"Description":\{"wt":"([^"]+)/)?.[1] ?? '';
      result.media = {
        url: (file.thumbnail?.url || file.preferred?.url || '').split('?')[0],
        sourcePage: `https://commons.wikimedia.org/wiki/File:${path}`,
        author: plain(author.replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, '$2')),
        license: plain(license), description: plain(description).slice(0, 220)
      };
    }
  } catch (error) { result.issue = error.message; }
  console.log(JSON.stringify(result));
  await delay(150);
}
