// Identidade geográfica (Wikidata) separada do arquivo editorial (Wikimedia Commons).
// Arquivos, autores e licenças conferidos em 2026-09. Países sem mídia aqui não
// recebem imagens genéricas nem os antigos candidatos Unsplash.
const commons = (file, hash, author, license) => ({
  url: `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash}/${encodeURIComponent(file.replaceAll(' ', '_'))}/960px-${encodeURIComponent(file.replaceAll(' ', '_'))}`,
  source: 'Wikimedia Commons',
  sourcePage: `https://commons.wikimedia.org/wiki/File:${file.replaceAll(' ', '_')}`,
  author, license, verified: true, verifiedAt: '2026-09'
});

export const LANDMARK_MEDIA = Object.freeze({
  Brazil: [
    { name: 'Cristo Redentor', city: 'Rio de Janeiro', countryCode: 'BR', wikidataId: 'Q79961', coordinates: [-22.951916, -43.210464], media: commons('Christ the Redeemer.jpg', '2/26', 'Laszlo Ilyes', 'CC BY 2.0') },
    { name: 'Pão de Açúcar', city: 'Rio de Janeiro', countryCode: 'BR', wikidataId: 'Q210722', coordinates: [-22.949444, -43.156667], media: commons('Sugarloaf mountain in Rio de Janeiro.jpg', '5/5f', 'Helder Ribeiro', 'CC BY-SA 2.0') },
    { name: 'Cataratas do Iguaçu', city: 'Foz do Iguaçu', countryCode: 'BR', wikidataId: 'Q36332', coordinates: [-25.695278, -54.436667], media: commons('Iguaçu Falls (15744362918).jpg', '4/4d', 'Arian Zwegers', 'CC BY 2.0') }
  ],
  Peru: [{ name: 'Machu Picchu', city: 'Machu Picchu Pueblo', countryCode: 'PE', wikidataId: 'Q676203', coordinates: [-13.163333, -72.545556], media: commons('Peru Machu Picchu.jpg', '3/3a', 'Entropy1963', 'Domínio público') }],
  'United States of America': [{ name: 'Estátua da Liberdade', city: 'Nova York', countryCode: 'US', wikidataId: 'Q9202', coordinates: [40.689209, -74.044425], media: commons('Statue of Liberty, statue, Liberty Island, New York.jpg', 'f/fd', 'Christian David', 'CC BY-SA 4.0') }],
  France: [{ name: 'Torre Eiffel', city: 'Paris', countryCode: 'FR', wikidataId: 'Q243', coordinates: [48.858296, 2.294479], media: commons('Eiffel Tower Paris.jpg', 'e/e9', 'Adam Andrzejewski', 'CC BY 3.0') }],
  Portugal: [{ name: 'Torre de Belém', city: 'Lisboa', countryCode: 'PT', wikidataId: 'Q215003', coordinates: [38.691389, -9.215833], media: commons('Belem Tower, Lisbon (8038516018).jpg', '0/06', 'Glyn Lowe', 'CC BY 2.0') }],
  Italy: [{ name: 'Coliseu', city: 'Roma', countryCode: 'IT', wikidataId: 'Q10285', coordinates: [41.890278, 12.492222], media: commons('Colosseum - Rome.jpg', '3/32', 'Mattia Masala', 'CC0') }],
  Spain: [{ name: 'Sagrada Família', city: 'Barcelona', countryCode: 'ES', wikidataId: 'Q48435', coordinates: [41.40369, 2.17433], media: commons('SF maig 2026.jpg', '7/78', 'Canaan', 'CC BY-SA 4.0') }],
  'United Kingdom': [{ name: 'Elizabeth Tower', city: 'Londres', countryCode: 'GB', wikidataId: 'Q41225', coordinates: [51.50067, -0.12457], media: commons('Elizabeth Tower and the north front of the Palace of Westminster, London.jpg', '0/05', 'Christian David', 'CC BY-SA 4.0') }],
  Germany: [{ name: 'Portão de Brandemburgo', city: 'Berlim', countryCode: 'DE', wikidataId: 'Q82425', coordinates: [52.516272, 13.377722], media: commons('Brandenburger Tor morgens.jpg', 'b/b1', 'Thomas Wolf', 'CC BY-SA 3.0') }],
  Austria: [{ name: 'Palácio de Schönbrunn', city: 'Viena', countryCode: 'AT', wikidataId: 'Q131330', coordinates: [48.18479, 16.31227], media: commons('Schloss Schönbrunn Wien 2014 (Zuschnitt 2).jpg', '4/41', 'Thomas Wolf', 'CC BY-SA 3.0 de') }],
  Greece: [{ name: 'Partenon', city: 'Atenas', countryCode: 'GR', wikidataId: 'Q10288', coordinates: [37.971527, 23.726601], media: commons('The Parthenon in Athens.jpg', 'd/da', 'Steve Swayne', 'CC BY 2.0') }],
  Ireland: [{ name: 'Trinity College Dublin', city: 'Dublin', countryCode: 'IE', wikidataId: 'Q258464', coordinates: [53.3444, -6.2577], media: commons('ImeldaCasey TrinityatNight.jpg', 'f/f7', 'Imelda Casey', 'CC BY-SA 4.0') }],
  Sweden: [{ name: 'Museu Vasa', city: 'Estocolmo', countryCode: 'SE', wikidataId: 'Q901371', coordinates: [59.32807, 18.09139], media: commons('Vasa Museum building view from the sea (3).jpg', '9/9c', 'Hanay', 'CC BY-SA 3.0') }],
  Netherlands: [{ name: 'Rijksmuseum', city: 'Amsterdã', countryCode: 'NL', wikidataId: 'Q190804', coordinates: [52.36, 4.885278], media: commons('Rijksmuseum in Amsterdam.jpg', '1/1b', 'Marco Almbauer', 'CC BY-SA 3.0') }],
  Belgium: [{ name: 'Grand-Place', city: 'Bruxelas', countryCode: 'BE', wikidataId: 'Q215429', coordinates: [50.846708, 4.352538], media: commons('Grand-Place, Brussels - panorama, June 2018.jpg', '2/26', 'Celuici', 'CC BY-SA 4.0') }],
  'Czech Rep.': [{ name: 'Ponte Carlos', city: 'Praga', countryCode: 'CZ', wikidataId: 'Q204871', coordinates: [50.086389, 14.411944], media: commons('Prag, Karlsbrücke -- 2019 -- 6699.jpg', '9/9c', 'Dietmar Rabich', 'CC BY-SA 4.0') }],
  Hungary: [{ name: 'Parlamento Húngaro', city: 'Budapeste', countryCode: 'HU', wikidataId: 'Q11819', coordinates: [47.506944, 19.045556], media: commons('Budapest-Parliament-0001.jpg', 'd/d0', 'Godot13 / MathKnight', 'CC BY-SA 4.0') }],
  Norway: [{ name: 'Ópera de Oslo', city: 'Oslo', countryCode: 'NO', wikidataId: 'Q43280', coordinates: [59.906944, 10.753611], media: commons('Full Opera by night.jpg', '1/10', 'Rafał Konieczny', 'CC BY-SA 4.0') }],
  Finland: [{ name: 'Catedral de Helsinque', city: 'Helsinque', countryCode: 'FI', wikidataId: 'Q738015', coordinates: [60.170388, 24.952124], media: commons('Lutheran Cathedral Helsinki.jpg', '2/27', 'Hans Hillewaert', 'CC BY-SA 3.0') }],
  Poland: [{ name: 'Castelo Real de Varsóvia', city: 'Varsóvia', countryCode: 'PL', wikidataId: 'Q756098', coordinates: [52.247778, 21.014167], media: commons('Warszawa-Zamek Królewski.jpg', '5/5c', 'Marcin Białek', 'CC BY-SA 3.0') }],
  Switzerland: [{ name: 'Matterhorn', city: 'Zermatt', countryCode: 'CH', wikidataId: 'Q1374', coordinates: [45.976389, 7.658611], media: commons('Matterhorn Suisse.jpg', '1/1c', 'Madalinclr', 'CC BY-SA 4.0') }],
  Croatia: [{ name: 'Muralhas de Dubrovnik', city: 'Dubrovnik', countryCode: 'HR', wikidataId: 'Q931733', coordinates: [42.64, 18.108], media: commons('Walls of Dubrovnik.jpg', '2/2b', 'László Szalai', 'CC BY-SA 3.0') }],
  Denmark: [{ name: 'Nyhavn', city: 'Copenhague', countryCode: 'DK', wikidataId: 'Q943946', coordinates: [55.67987, 12.59041], media: commons('Nyhavn Copenhagen 2.jpg', '8/8a', 'kallerna', 'CC BY-SA 4.0') }]
});
