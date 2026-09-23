// Identidade geográfica (Wikidata) separada do arquivo editorial (Wikimedia Commons).
// Arquivos, autores e licenças conferidos em 2026-09. Países sem mídia aqui não
// recebem imagens genéricas nem os antigos candidatos Unsplash.
const commons = (file, hash, author, license) => ({
  url: `https://upload.wikimedia.org/wikipedia/commons/thumb/${hash}/${encodeURIComponent(file.replaceAll(' ', '_'))}/960px-${encodeURIComponent(file.replaceAll(' ', '_'))}`,
  source: 'Wikimedia Commons',
  sourcePage: `https://commons.wikimedia.org/wiki/File:${file.replaceAll(' ', '_')}`,
  author, license, verified: true, verifiedAt: '2026-09'
});

// Special:FilePath resolve o nome exato de um arquivo do Commons para um
// thumbnail de até 960 px. Cada título abaixo foi conferido na página do
// arquivo, inclusive assunto, crédito e licença; não há fallback fotográfico.
const commonsFile = (file, author, license) => ({
  url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replaceAll(' ', '_'))}?width=960`,
  source: 'Wikimedia Commons',
  sourcePage: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replaceAll(' ', '_'))}`,
  author, license, verified: true, verifiedAt: '2026-09'
});

export const LANDMARK_MEDIA = Object.freeze({
  'Antigua & Barbuda': [{ name: 'Nelson’s Dockyard', city: 'English Harbour', countryCode: 'AG', wikidataId: 'Q1435206', coordinates: [17.008333, -61.764444], media: commonsFile("Nelson's Dockyard.jpg", 'David Stanley', 'CC BY 2.0') }],
  Argentina: [{ name: 'Obelisco de Buenos Aires', city: 'Buenos Aires', countryCode: 'AR', wikidataId: 'Q831389', coordinates: [-34.60376, -58.38162], media: commonsFile('ObeliscoBA2015.jpg', 'Sebastianalmaraz', 'CC BY-SA 4.0') }],
  Bahamas: [{ name: 'Queen’s Staircase', city: 'Nassau', countryCode: 'BS', wikidataId: 'Q43079731', coordinates: [25.073837, -77.337818], media: commonsFile("Queen's staircase, Nassau, Bahamas.jpg", 'Jerrye and Roy Klotz', 'CC BY-SA 3.0') }],
  Barbados: [{ name: 'Parliament Buildings', city: 'Bridgetown', countryCode: 'BB', wikidataId: 'Q7138905', coordinates: [13.096986, -59.613919], media: commonsFile('Bridgetown barbados parliament building.jpg', 'regani', 'Domínio público') }],
  Belize: [{ name: 'Great Blue Hole', city: 'Lighthouse Reef', countryCode: 'BZ', wikidataId: 'Q86486', coordinates: [17.31556, -87.53444], media: commonsFile('Great Blue Hole.jpg', 'U.S. Geological Survey', 'Domínio público') }],
  Bolivia: [{ name: 'Salar de Uyuni', city: 'Região de Uyuni, Potosí', countryCode: 'BO', wikidataId: 'Q76122', coordinates: [-20.33333, -67.7], media: commonsFile('Salar Uyuni au01.jpg', 'Anouchka Unel', 'Free Art License') }],
  Brazil: [
    { name: 'Cristo Redentor', city: 'Rio de Janeiro', countryCode: 'BR', wikidataId: 'Q79961', coordinates: [-22.951916, -43.210464], media: commons('Christ the Redeemer.jpg', '2/26', 'Laszlo Ilyes', 'CC BY 2.0') },
    { name: 'Pão de Açúcar', city: 'Rio de Janeiro', countryCode: 'BR', wikidataId: 'Q210722', coordinates: [-22.949444, -43.156667], media: commons('Sugarloaf mountain in Rio de Janeiro.jpg', '5/5f', 'Helder Ribeiro', 'CC BY-SA 2.0') },
    { name: 'Cataratas do Iguaçu', city: 'Foz do Iguaçu', countryCode: 'BR', wikidataId: 'Q36332', coordinates: [-25.695278, -54.436667], media: commons('Iguaçu Falls (15744362918).jpg', '4/4d', 'Arian Zwegers', 'CC BY 2.0') }
  ],
  Canada: [{ name: 'CN Tower', city: 'Toronto', countryCode: 'CA', wikidataId: 'Q134883', coordinates: [43.642753, -79.387147], media: commonsFile('CN Tower from Puente de Luz, Toronto, Ontario, 2025-08-25 01.jpg', 'Chris Woodrich', 'CC BY-SA 4.0') }],
  Chile: [{ name: 'Torres del Paine', city: 'Parque Nacional Torres del Paine', countryCode: 'CL', wikidataId: 'Q901646', coordinates: [-50.983056, -72.966389], media: commonsFile('Torres del Paine, Laguna Azul 09.jpg', 'LBM1948', 'CC BY-SA 4.0') }],
  Colombia: [{ name: 'Castillo de San Felipe de Barajas', city: 'Cartagena', countryCode: 'CO', wikidataId: 'Q91110', coordinates: [10.42222, -75.53806], media: commonsFile('Panorama Castillo San Felipe de Barajas CTG 11 2019 2864.jpg', 'Mario Roberto Durán Ortiz', 'CC BY-SA 4.0') }],
  'Costa Rica': [{ name: 'Teatro Nacional de Costa Rica', city: 'San José', countryCode: 'CR', wikidataId: 'Q1138822', coordinates: [9.933169, -84.076969], media: commonsFile('Teatro Nacional CRI 07 2019 8963.jpg', 'Mario Roberto Durán Ortiz', 'CC BY-SA 4.0') }],
  Cuba: [{ name: 'El Capitolio', city: 'Havana', countryCode: 'CU', wikidataId: 'Q1352908', coordinates: [23.13528, -82.35944], media: commonsFile('Capitolio full.jpg', 'Yomangani', 'Domínio público') }],
  Dominica: [{ name: 'Fort Shirley', city: 'Portsmouth / Cabrits', countryCode: 'DM', wikidataId: 'Q65123003', coordinates: [15.5834, -61.4734], media: commonsFile('Fort Shirley, Portsmouth, Domininca.JPG', 'Leahtaylor 9', 'CC BY-SA 3.0') }],
  'Dominican Rep.': [{ name: 'Fortaleza Ozama', city: 'Santo Domingo', countryCode: 'DO', wikidataId: 'Q2516819', coordinates: [18.4732, -69.88171], media: commonsFile('Fortaleza Ozama RD 11 2017 6493.jpg', 'Mario Roberto Durán Ortiz', 'CC BY-SA 4.0') }],
  Ecuador: [{ name: 'Ciudad Mitad del Mundo', city: 'San Antonio de Pichincha', countryCode: 'EC', wikidataId: 'Q1806478', coordinates: [-0.002222, -78.455833], media: commonsFile('Mitad del Mundo 01.jpg', 'Kaldari', 'CC0') }],
  'El Salvador': [{ name: 'Monumento al Divino Salvador del Mundo', city: 'San Salvador', countryCode: 'SV', wikidataId: 'Q4352971', coordinates: [13.701256, -89.224456], media: commonsFile('Monumento al Divino Salvador del Mundo - Plaza Salvador del Mundo.JPG', 'Oskpal777', 'CC BY-SA 3.0') }],
  Grenada: [{ name: 'Fort George', city: 'St. George’s', countryCode: 'GD', wikidataId: 'Q65129375', coordinates: [12.049167, -61.753889], media: commonsFile('St Georges Grenada Fort - panoramio.jpg', 'cwi.aida', 'CC BY-SA 3.0') }],
  Guatemala: [{ name: 'Arco de Santa Catalina', city: 'Antigua Guatemala', countryCode: 'GT', wikidataId: 'Q7419266', coordinates: [14.559611, -90.734139], media: commonsFile('GT056-Antigua ArchHorz.jpeg', 'ZackClark', 'Domínio público') }],
  Guyana: [{ name: 'Cataratas Kaieteur', city: 'Parque Nacional Kaieteur', countryCode: 'GY', wikidataId: 'Q38120', coordinates: [5.178111, -59.482278], media: commonsFile('GuyanaKaieteurFalls2004.jpg', 'Sorenriise', 'CC BY-SA 3.0') }],
  Haiti: [{ name: 'Citadelle Laferrière', city: 'Milot', countryCode: 'HT', wikidataId: 'Q206194', coordinates: [19.573611, -72.243889], media: commonsFile('Citadelle Laferrière Aerial View.jpg', 'SPC Gibran Torres / U.S. Army', 'Domínio público') }],
  Honduras: [{ name: 'Sítio arqueológico de Copán', city: 'Copán Ruinas', countryCode: 'HN', wikidataId: 'Q214827', coordinates: [14.837964, -89.142442], media: commonsFile('Copán Stela B.jpg', 'Nosferattus', 'CC0') }],
  Jamaica: [{ name: 'Dunn’s River Falls', city: 'Ocho Rios', countryCode: 'JM', wikidataId: 'Q1266226', coordinates: [18.415833, -77.138056], media: commonsFile('Dunns River Falls climb.JPG', 'Breakyunit', 'CC BY-SA 3.0') }],
  Mexico: [{ name: 'Palácio de Bellas Artes', city: 'Cidade do México', countryCode: 'MX', wikidataId: 'Q1139081', coordinates: [19.435278, -99.141389], media: commonsFile('Atardecer En Bellas Artes Vertical (128312121).jpeg', 'Octavio Alonso Maya Castro', 'CC BY-SA 3.0') }],
  Nicaragua: [{ name: 'Catedral de León', city: 'León', countryCode: 'NI', wikidataId: 'Q48605', coordinates: [12.434997, -86.878097], media: commonsFile('Nicaragua 2017-03-13 (32976253324).jpg', 'Guillaume Baviere', 'CC BY-SA 2.0') }],
  Panama: [{ name: 'Eclusas de Miraflores', city: 'Cidade do Panamá', countryCode: 'PA', wikidataId: 'Q6872559', coordinates: [8.997076, -79.591869], media: commonsFile("Panorama of Miraflores Locks - From Visitor's Center (02).jpg", 'Adam Jones', 'CC BY-SA 2.0') }],
  Paraguay: [{ name: 'Palácio de López', city: 'Assunção', countryCode: 'PY', wikidataId: 'Q3298842', coordinates: [-25.277636, -57.637569], media: commonsFile('Palacio de los López.jpg', 'globevisions', 'CC BY 2.0') }],
  Peru: [{ name: 'Machu Picchu', city: 'Machu Picchu Pueblo', countryCode: 'PE', wikidataId: 'Q676203', coordinates: [-13.163333, -72.545556], media: commons('Peru Machu Picchu.jpg', '3/3a', 'Entropy1963', 'Domínio público') }],
  'St. Kitts & Nevis': [{ name: 'Brimstone Hill Fortress', city: 'Saint Kitts', countryCode: 'KN', wikidataId: 'Q200521', coordinates: [17.347, -62.836], media: commonsFile('BrimstoneHill01.jpg', 'Ukexpat', 'CC BY-SA 3.0') }],
  'St. Lucia': [{ name: 'Gros Piton', city: 'Soufrière', countryCode: 'LC', wikidataId: 'Q1321979', coordinates: [13.8, -61.066667], media: commonsFile('GrosPiton.JPG', 'Jayen466', 'Domínio público') }],
  'St. Vincent & Grenadines': [{ name: 'Fort Charlotte', city: 'Kingstown', countryCode: 'VC', wikidataId: 'Q28448431', coordinates: [13.157889, -61.242111], media: commonsFile('Entrance to Fort Charlotte, Kingstown, St. Vincent.jpg', 'giggel', 'CC BY 3.0') }],
  Suriname: [{ name: 'Catedral de São Pedro e São Paulo', city: 'Paramaribo', countryCode: 'SR', wikidataId: 'Q2736107', coordinates: [5.828681, -55.154092], media: commonsFile('Saints Peter and Paul Cathedral Paramaribo.jpg', 'Davidsoe / Rabanus Flavus', 'CC BY-SA 4.0') }],
  'Trinidad & Tobago': [{ name: 'Queen’s Royal College', city: 'Port of Spain', countryCode: 'TT', wikidataId: 'Q7270097', coordinates: [10.6687, -61.5193], media: commonsFile("TnT PoS M7-1 Queen's Royal College.jpg", 'Grueslayer', 'CC BY-SA 4.0') }],
  'United States of America': [{ name: 'Estátua da Liberdade', city: 'Nova York', countryCode: 'US', wikidataId: 'Q9202', coordinates: [40.689209, -74.044425], media: commons('Statue of Liberty, statue, Liberty Island, New York.jpg', 'f/fd', 'Christian David', 'CC BY-SA 4.0') }],
  Uruguay: [{ name: 'Casapueblo', city: 'Punta Ballena', countryCode: 'UY', wikidataId: 'Q377792', coordinates: [-34.908869, -55.044906], media: commonsFile('Casapueblo.JPG', 'Talkingheads', 'CC BY-SA 3.0') }],
  Venezuela: [{ name: 'Salto Ángel', city: 'Parque Nacional Canaima', countryCode: 'VE', wikidataId: 'Q80299', coordinates: [5.970056, -62.536222], media: commonsFile('SaltoAngel4.jpg', 'Paulo Capiotti', 'CC BY-SA 2.0') }],
  'Fr. Guiana': [{ name: 'Fort Cépérou', city: 'Caiena', countryCode: 'GF', wikidataId: 'Q30739005', coordinates: [4.93763, -52.33663], media: commonsFile('Cayenne Fort Cépérou 2013.jpg', 'Cayambe', 'CC BY-SA 3.0') }],
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
