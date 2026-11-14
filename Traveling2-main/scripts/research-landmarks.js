// Pesquisa assistida, sem alterações de dados: resultados precisam de revisão
// editorial do arquivo e da localização antes de entrar em landmarks.media.js.
const candidates = [
  ['Spain', 'Sagrada Família'], ['United Kingdom', 'Elizabeth Tower'],
  ['Germany', 'Brandenburg Gate'], ['Netherlands', 'Rijksmuseum'],
  ['Switzerland', 'Matterhorn'], ['Austria', 'Schönbrunn Palace'],
  ['Greece', 'Parthenon'], ['Ireland', 'Trinity College Dublin'],
  ['Belgium', 'Grand-Place'], ['Czech Rep.', 'Charles Bridge'],
  ['Hungary', 'Hungarian Parliament Building'], ['Croatia', 'Walls of Dubrovnik'],
  ['Denmark', 'Nyhavn'], ['Sweden', 'Vasa Museum'],
  ['Norway', 'Oslo Opera House'], ['Finland', 'Helsinki Cathedral'],
  ['Poland', 'Royal Castle, Warsaw']
];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const plain = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
async function request(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': 'TravelingEditorialAudit/1.0 (local research)' } });
    if (response.ok) return response.json();
    if (response.status !== 429) throw Error(`${response.status} ${url}`);
    await delay(1500 * (attempt + 1));
  }
  throw Error(`Rate limit: ${url}`);
}

for (const [country, query] of candidates.slice(0, Number(process.argv[2]) || candidates.length)) {
  try {
    const search = await request(`https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&search=${encodeURIComponent(query)}&format=json&origin=*`);
    const hit = search.search?.[0];
    if (!hit) { console.log(JSON.stringify({ country, query, issue: 'not found' })); continue; }
    const entity = await request(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${hit.id}&props=claims&format=json&origin=*`);
    const claims = entity.entities[hit.id].claims;
    const image = claims.P18?.[0]?.mainsnak?.datavalue?.value;
    const point = claims.P625?.[0]?.mainsnak?.datavalue?.value;
    let media = null;
    if (image) {
      const info = await request(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(`File:${image}`)}&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=960&format=json&origin=*`);
      const file = Object.values(info.query.pages)[0].imageinfo?.[0];
      if (file) media = { image, url: file.thumburl, page: file.descriptionurl, author: plain(file.extmetadata?.Artist?.value), license: plain(file.extmetadata?.LicenseShortName?.value) };
    }
    console.log(JSON.stringify({ country, query, id: hit.id, label: hit.label, description: hit.description, coordinates: point && [point.latitude, point.longitude], media }));
  } catch (error) { console.log(JSON.stringify({ country, query, issue: error.message })); }
  await delay(450);
}
