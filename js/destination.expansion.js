// Compact editorial seeds, not another country catalog. Airport, visa, bestTime,
// media and seasonal checklist remain owned by COUNTRIES. Climate is ALWAYS a
// named tourism region, never inferred from a continent or latitude alone.
// Row: country, region, gateway override, experience, Jan–Dec climate,
// optional Jan–Dec season (0 poor, 1 acceptable, 2 good, 3 ideal), cost, caveat.
export const EXPERIENCES = Object.freeze({
  urban: { cidade: 3, cultura: 3, gastronomia: 2, natureza: 1 },
  heritage: { cultura: 3, gastronomia: 2, cidade: 2, natureza: 2, aventura: 1 },
  coast: { praia: 3, natureza: 2, cultura: 2, gastronomia: 2, aventura: 1 },
  island: { praia: 3, natureza: 3, aventura: 2, cultura: 1, gastronomia: 1 },
  alpine: { natureza: 3, aventura: 3, cultura: 1, gastronomia: 1 },
  outdoors: { natureza: 3, aventura: 3, cultura: 2, gastronomia: 1 },
  foodNature: { natureza: 3, gastronomia: 3, cultura: 2, aventura: 2, cidade: 1 },
  safari: { natureza: 3, aventura: 2, cultura: 1 }
});

// GRU economy return + a local week, BRL, rounded editorial ranges (not quotes).
// Classes describe cost/logistics, NOT a continent/climate classification.
export const COST_PROFILES = Object.freeze({
  domestic: [[900, 2200], [2500, 4500]],
  nearby: [[1500, 3200], [3000, 5500]],
  uruguay: [[1200, 2800], [3000, 6000]],
  regional: [[2500, 4500], [3000, 5500]],
  connection: [[3500, 6000], [3500, 6000]],
  europeValue: [[4500, 7500], [3500, 6000]],
  europe: [[4500, 8000], [5000, 8500]],
  highCost: [[5500, 9000], [7500, 12000]],
  longValue: [[6500, 10000], [3000, 5500]],
  longCost: [[8000, 12500], [6000, 10000]],
  safari: [[5000, 8500], [8000, 13000]],
  remote: [[9000, 14000], [5500, 9500]],
  regulated: [[8000, 12000], [10000, 16000]]
});

export const EXPANSION_SEEDS = Object.freeze([
  // Americas: regional season overrides avoid the legacy generic/all-year curves.
  ['Uruguay', 'Montevidéu e Costa de Oro', null, 'coast', 'HHMMMMMMMMMH', '333221112223', 'uruguay', 'Praias no verão; fora dele, o foco é patrimônio e gastronomia. Não inclui hospedagem em Punta del Este.'],
  ['Paraguay', 'Assunção e Areguá', null, 'heritage', 'HHHHMMMMHHHH', '112233332211', 'nearby', 'Cultura, cerâmica e lago de Areguá; calor de verão limita caminhadas, não é um roteiro de praia.'],
  ['Bolivia', 'La Paz e Tiwanaku', 'LPB', 'heritage', 'MMMMMMMMMMMM', '111233333221', 'regional', 'Dias amenos em altitude e noites frias; aclimatação necessária, sem inferir clima tropical de Santa Cruz.'],
  ['Ecuador', 'Quito e arredores andinos', null, 'heritage', 'MMMMMMMMMMMM', '222223332222', 'connection', 'Centro histórico e paisagens andinas; altitude pede adaptação. Não inclui Galápagos.'],
  ['Belize', 'Caye Caulker e recifes próximos', null, 'island', 'HHHHHHHHHHHH', '333332110012', 'connection', 'Travessias marítimas e passeios básicos; setembro–outubro excluídos por tempestades.'],
  ['Costa Rica', 'La Fortuna e Arenal', null, 'outdoors', 'HHHHHHHHHHHH', '333322211123', 'connection', 'Floresta e termas; chuva não elimina toda a viagem, mas setembro–outubro exigem plano alternativo.'],
  ['Cuba', 'Havana e Viñales', null, 'heritage', 'HHHHHHHHHHHH', '333322110023', 'connection', 'Patrimônio e paisagem rural. Confirmar abastecimento, transportes e documentos; não anunciar isenção de visto.'],
  ['Dominican Rep.', 'Santo Domingo e litoral de Bayahibe', 'SDQ', 'coast', 'HHHHHHHHHHHH', '333322110023', 'connection', 'Hospedagem simples e patrimônio colonial; sem pacote all-inclusive. Temporada de furacões exige atenção.'],
  ['El Salvador', 'San Salvador e Ruta de las Flores', null, 'heritage', 'HHHHHHHHHHHH', '333321111123', 'connection', 'Povoados, vulcões e cafés; na chuva, trilhas dependem de condições locais.'],
  ['Guatemala', 'Antigua e lago Atitlán', null, 'heritage', 'MMMMMMMMMMMM', '333321110023', 'connection', 'Roteiro de altitude e cultura maia; setembro–outubro excluídos para deslocamentos rurais.'],
  ['Honduras', 'Roatán', 'RTB', 'island', 'HHHHHHHHHHHH', '223332211001', 'connection', 'Ilha caribenha, não clima do interior; outubro–novembro muito chuvosos.'],
  ['Nicaragua', 'Granada e vulcões próximos', null, 'heritage', 'HHHHHHHHHHHH', '333321111123', 'connection', 'Cidades coloniais e natureza; passeios vulcânicos dependem de acesso e clima.'],
  ['Panama', 'Cidade do Panamá e canal', null, 'urban', 'HHHHHHHHHHHH', '333322222123', 'connection', 'Cidade, canal e parques próximos; meses úmidos seguem viáveis com pausas cobertas.'],

  // Europe: urban 0s in the national summer chart become ACCEPTABLE winters,
  // not ideal winters. Alpine seasons are explicit and never imply summer hikes.
  ['Albania', 'Tirana e Berat', null, 'heritage', 'MMMMMHHHHMMM', null, 'europeValue', 'Patrimônio e colinas; inverno com chuva, sem prometer trilhas alpinas.'],
  ['Andorra', 'Andorra la Vella e vales dos Pireneus', null, 'alpine', 'CCCCMMMMMCCC', '333223332233', 'europe', 'Acesso terrestre via Barcelona incluído; inverno para neve, verão para caminhadas, passes de esqui à parte.'],
  ['Austria', 'Innsbruck e vales tiroleses', 'INN', 'alpine', 'CCCMMMMMMMCC', '333223332233', 'europe', 'Passeios nos vales e atividades adequadas à estação; trilhas altas não são caminhadas de inverno.'],
  ['Belgium', 'Bruxelas e Bruges', null, 'urban', 'CCCMMMMMMMCC', null, 'europe', 'Cidades, canais e gastronomia; chuva possível o ano inteiro.'],
  ['Bosnia and Herz.', 'Sarajevo e Mostar', null, 'heritage', 'CCCMMHHHMMCC', null, 'europeValue', 'Inverno frio com foco urbano; atividades de montanha precisam de guia e condições adequadas.'],
  ['Bulgaria', 'Sófia e mosteiro de Rila', null, 'heritage', 'CCCMMHHHMMCC', null, 'europeValue', 'Cultura e paisagens próximas, não a praia de verão do Mar Negro.'],
  ['Croatia', 'Split e costa dálmata', 'SPU', 'coast', 'MMMMMHHHHMMM', '112233332211', 'europe', 'Praia é sazonal; ferries e banho de mar não têm a mesma oferta no inverno.'],
  ['Cyprus', 'Larnaca e litoral sul', null, 'coast', 'MMMMHHHHHHMM', '112333223321', 'europe', 'Praias na estação quente; no inverno, patrimônio e gastronomia ganham peso.'],
  ['Czech Rep.', 'Praga e arredores', null, 'urban', 'CCCMMMMMMMCC', null, 'europeValue', 'Museus, bairros e parques; frio urbano não significa neve garantida.'],
  ['Denmark', 'Copenhague', null, 'urban', 'CCCCMMMMMCCC', null, 'highCost', 'Inverno escuro e frio, viável para cidade e museus; passeios externos mais curtos.'],
  ['Estonia', 'Tallinn e Lahemaa', null, 'heritage', 'CCCCMMMMCCCC', null, 'europeValue', 'Centro histórico e natureza próxima; no inverno, caminhos acessíveis e dias curtos.'],
  ['Finland', 'Rovaniemi e natureza da Lapônia', 'RVN', 'alpine', 'CCCCCMMMCCCC', '333223332233', 'highCost', 'Atividades guiadas de inverno, não trekking de verão; aurora nunca é garantida.'],
  ['Greece', 'Atenas e litoral da Ática', null, 'coast', 'MMMMHHHHHHMM', '112333223321', 'europe', 'Cultura o ano inteiro, banho de mar sazonal; ilhas distantes não estão incluídas.'],
  ['Hungary', 'Budapeste', null, 'urban', 'CCCMMHHHMMCC', null, 'europeValue', 'Termas, museus e gastronomia; inverno frio, verão pode ser quente.'],
  ['Iceland', 'Reykjavík e Círculo Dourado', null, 'outdoors', 'CCCCCMMMCCCC', '222123332222', 'highCost', 'Inverno apenas em circuitos acessíveis/guiados; não inclui Highlands, estradas fechadas ou promessa de aurora.'],
  ['Ireland', 'Dublin e Wicklow', null, 'heritage', 'CCCCMMMMMMCC', null, 'europe', 'Chuva e vento o ano inteiro; clima frio não significa neve.'],
  ['Latvia', 'Riga e entorno', null, 'heritage', 'CCCCMMMMCCCC', null, 'europeValue', 'Cidade e parques; inverno rigoroso pede passeios externos curtos.'],
  ['Liechtenstein', 'Vaduz e Malbun', null, 'alpine', 'CCCMMMMMMMCC', '333223332233', 'highCost', 'Acesso via Zurique e transporte terrestre; neve no inverno e trilhas no verão.'],
  ['Lithuania', 'Vilnius e Trakai', null, 'heritage', 'CCCCMMMMCCCC', null, 'europeValue', 'Patrimônio e lagos; gelo não implica acesso seguro ao lago no inverno.'],
  ['Luxembourg', 'Luxemburgo e vale do Alzette', null, 'heritage', 'CCCMMMMMMMCC', null, 'europe', 'Cidade histórica e passeios de vale; trilhas ajustadas à estação.'],
  ['Malta', 'Valletta e litoral de Malta', null, 'coast', 'MMMMMHHHHMMM', '112333223321', 'europe', 'Patrimônio no inverno; praia e passeios de barco dependem de temperatura e mar.'],
  ['Moldova', 'Chișinău e vinícolas próximas', null, 'heritage', 'CCCMMHHHMMCC', null, 'europeValue', 'Vinhos e cultura; não inclui Transnístria e exige verificação operacional antes da viagem.'],
  ['Monaco', 'Mônaco e jardins da Riviera', null, 'urban', 'MMMMMMHHHMMM', null, 'highCost', 'Acesso por Nice; hospedagem não luxuosa na região e transporte incluídos. Grande Prêmio pode elevar muito os custos.'],
  ['Montenegro', 'Baía de Kotor', 'TIV', 'coast', 'MMMMMHHHHMMM', '112333332211', 'europeValue', 'Baía e cidades históricas; inverno chuvoso, trilhas altas não fazem parte deste perfil.'],
  ['Netherlands', 'Amsterdã e entorno', null, 'urban', 'CCCMMMMMMMCC', null, 'europe', 'Canais, museus e parques; frio e vento no inverno, sem promessa de tulipas fora da primavera.'],
  ['Macedonia', 'Ohrid e seu lago', 'OHD', 'heritage', 'CCCMMHHHMMCC', null, 'europeValue', 'Igrejas históricas e paisagem lacustre; banho no lago apenas na estação adequada.'],
  ['Norway', 'Tromsø e fiordes próximos', 'TOS', 'alpine', 'CCCCCMMMCCCC', '333123332233', 'highCost', 'Inverno guiado, dias curtos e estradas condicionadas ao tempo; aurora não é garantida.'],
  ['Poland', 'Cracóvia e arredores', 'KRK', 'heritage', 'CCCMMMMMMMCC', null, 'europeValue', 'Patrimônio e parques; no inverno o foco é cultural, não trekking nos Tatras.'],
  ['Romania', 'Brașov e castelos da Transilvânia', 'OTP', 'heritage', 'CCCMMMMMMMCC', null, 'europeValue', 'Transfer terrestre incluído; montanha no inverno somente em atividades adequadas.'],
  ['San Marino', 'Centro histórico do Monte Titano', null, 'heritage', 'CCCMMMMMMCCC', null, 'europe', 'Acesso por Bolonha e traslado terrestre; terreno íngreme e frio no inverno.'],
  ['Serbia', 'Belgrado e Novi Sad', null, 'heritage', 'CCCMMHHHMMCC', null, 'europeValue', 'Fortalezas e gastronomia; frio de inverno e calor de verão alteram passeios ao ar livre.'],
  ['Slovakia', 'Poprad e vales dos Tatras', 'TAT', 'alpine', 'CCCCMMMMMCCC', '333223332233', 'europeValue', 'Trilhas altas fecham no inverno; nessa estação, atividades de neve e vales acessíveis.'],
  ['Slovenia', 'Ljubljana e lago Bled', null, 'heritage', 'CCCMMHHHMMCC', null, 'europe', 'Lago e patrimônio com atividades sazonais; não implica trilhas altas abertas no inverno.'],
  ['Sweden', 'Kiruna e natureza da Lapônia', 'KRN', 'alpine', 'CCCCCMMMCCCC', '333123332233', 'highCost', 'Neve e passeios guiados no inverno; verão para caminhadas, sem prometer aurora.'],
  ['Switzerland', 'Interlaken e vales do Oberland', 'ZRH', 'alpine', 'CCCMMMMMMMCC', '333223332233', 'highCost', 'Trens e passeios nos vales; inverno não permite repetir as trilhas alpinas de verão.'],
  ['United Kingdom', 'Londres e parques', null, 'urban', 'CCCMMMMMMMCC', null, 'highCost', 'Museus e bairros, com dias curtos no inverno. Autorização eletrônica permanece distinta de isenção simples.'],

  // Africa: focus on identified regions, no blanket desert/tropical assumptions.
  ['Algeria', 'Argel e Tipasa', null, 'heritage', 'MMMMMHHHHHMM', '223332112332', 'europeValue', 'Litoral mediterrâneo e arqueologia; não representa o Saara.'],
  ['Angola', 'Luanda e litoral próximo', null, 'coast', 'HHHHHHMMHHHH', '111233332211', 'connection', 'Costa e patrimônio; não inclui circuitos remotos, com custos locais relativamente altos.'],
  ['Botswana', 'Kasane e Chobe', 'BBK', 'safari', 'HHHHMMMMHHHH', '111233333321', 'safari', 'Safári guiado e hospedagem terrestre, não lodge de luxo nem voo panorâmico sobre o delta.'],
  ['Cape Verde', 'Ilha do Sal', 'SID', 'island', 'HHHHHHHHHHHH', '333333211233', 'connection', 'Praias atlânticas; ventos e mar podem limitar banho e barcos.'],
  ['Egypt', 'Cairo e Gizé', null, 'heritage', 'MMHHHHHHHHMM', '333210001333', 'europeValue', 'Patrimônio e museus; julho–agosto excluídos pelo calor intenso ao ar livre.'],
  ['Ethiopia', 'Adis Abeba e arredores', null, 'heritage', 'MMMMMMMMMMMM', '333321112333', 'connection', 'Perfil urbano de altitude, não um circuito nacional; reavaliar acesso e segurança antes de viajar.'],
  ['Ghana', 'Acra e Cape Coast', null, 'heritage', 'HHHHHHHHHHHH', '332211222233', 'connection', 'Patrimônio costeiro e mercados; chuvas não são ausência total de atividades culturais.'],
  ['Kenya', 'Nairóbi e circuito Maasai Mara', null, 'safari', 'HHHMMMMMMMHH', '332113333321', 'safari', 'Safári terrestre guiado; manhãs frias não transformam o roteiro em viagem de inverno.'],
  ['Madagascar', 'Antananarivo e Andasibe', null, 'outdoors', 'HHMMMMMMMMMH', '000233333332', 'longValue', 'Floresta úmida e altitude; ciclones excluídos, traslados rodoviários exigem tempo.'],
  ['Mozambique', 'Maputo e costa sul', null, 'coast', 'HHHHHMMMHHHH', '011233333221', 'connection', 'Praias próximas da capital; não inclui ilhas remotas e atenção a tempestades de verão.'],
  ['Namibia', 'Windhoek e Sossusvlei', null, 'outdoors', 'HHHMMMMMHHHH', '112233333321', 'safari', 'Circuito terrestre no deserto; noites frias não significam dias frios, fora expedições remotas.'],
  ['Rwanda', 'Kigali e lago Kivu', null, 'heritage', 'MMMMMMMMMMMM', '221113332212', 'longValue', 'Altitude, cultura e lago; licença e trekking de gorilas NÃO estão no orçamento básico.'],
  ['Senegal', 'Dakar e Gorée', null, 'heritage', 'MMMMHHHHHHHM', '333332111233', 'connection', 'Patrimônio e costa; vento atlântico ameniza Dakar, sem generalizar ao interior quente.'],
  ['Seychelles', 'Mahé', null, 'island', 'HHHHHHHHHHHH', '112332223332', 'longCost', 'Praias e trilhas; vento muda a costa abrigada. Pousadas, não ilhas privadas.'],
  ['Tanzania', 'Zanzibar', 'ZNZ', 'island', 'HHHHHHHHHHHH', '332003333322', 'longValue', 'Praia e Stone Town; abril–maio excluídos pela chuva forte. Não inclui safári ou Kilimanjaro.'],
  ['Tunisia', 'Túnis, Cartago e Sidi Bou Said', null, 'heritage', 'MMMMHHHHHHMM', '223332112332', 'europeValue', 'Patrimônio costeiro, sem usar o clima do Saara para toda a viagem.'],
  ['Uganda', 'Entebbe e lago Vitória', null, 'heritage', 'HHHHHHHHHHHH', '332113331123', 'longValue', 'Lago, jardins e cultura; sem trekking de gorilas ou pacote de safári no preço básico.'],
  ['Zambia', 'Livingstone e Cataratas Vitória', 'LVI', 'outdoors', 'HHHMMMMHHHHH', '222333332211', 'safari', 'Volume de água varia; rafting pode fechar na cheia e não é garantido o ano todo.'],
  ['Zimbabwe', 'Victoria Falls e entorno', 'VFA', 'outdoors', 'HHHMMMMHHHHH', '223333332211', 'safari', 'Quedas e passeios guiados; névoa e vazão variam, sem extrapolar para circuitos remotos.'],
  ['São Tomé & Príncipe', 'Ilha de São Tomé', null, 'island', 'HHHHHHHHHHHH', '221123333112', 'longValue', 'Floresta, roças e costa; chuvas frequentes e mar condicionam passeios. Não inclui voo para Príncipe.'],

  // Asia / Oceania.
  ['Armenia', 'Yerevan e mosteiros próximos', null, 'heritage', 'CCCMMHHHMMCC', null, 'europeValue', 'Patrimônio e gastronomia; inverno frio, sem incluir passes de alta montanha.'],
  ['Azerbaijan', 'Baku e Gobustan', null, 'heritage', 'CCCMMHHHHMMC', null, 'europeValue', 'Cultura e paisagens próximas; vento forte e clima do Cáspio, não perfil alpino.'],
  ['Bhutan', 'Paro e Thimphu', null, 'heritage', 'CCCMMMMMMMCC', '223332112332', 'regulated', 'Inclui margem para taxa turística e guia; trilhas altas e festivais precisam de orçamento específico.'],
  ['China', 'Pequim e Muralha próxima', null, 'heritage', 'CCCMMHHHMMCC', '112332113321', 'longValue', 'Cidade e patrimônio; inverno realmente frio. Verão quente, chuvas e feriados podem elevar a demanda.'],
  ['Georgia', 'Tbilisi e Kakheti', null, 'heritage', 'CCCMMHHHMMCC', null, 'europeValue', 'Gastronomia, vinhos e patrimônio; não depende de acesso a montanhas no inverno.'],
  ['Kazakhstan', 'Almaty e arredores acessíveis', null, 'heritage', 'CCCMMHHHMMCC', '112332223321', 'longValue', 'Cidade e paisagens de vale; no inverno, montanha só em áreas abertas e adequadas.'],
  ['Malaysia', 'Kuala Lumpur e arredores', null, 'urban', 'HHHHHHHHHHHH', '223322222212', 'longValue', 'Cultura, culinária e parques urbanos mesmo com chuva; não generaliza a monção das ilhas da costa leste.'],
  ['Mongolia', 'Ulaanbaatar e Terelj no verão', null, 'outdoors', 'CCCCMMMMCCCC', '000023332000', 'remote', 'Circuito terrestre curto com guia; inverno extremo não entra nesta proposta.'],
  ['Oman', 'Mascate e costa próxima', null, 'heritage', 'HHHHHHHHHHHH', '333100000233', 'longValue', 'Cidades e paisagens costeiras; calor extremo excluído, sem confundir com monção de Salalah.'],
  ['Philippines', 'Palawan: Puerto Princesa e arredores', 'PPS', 'island', 'HHHHHHHHHHHH', '333321110012', 'longValue', 'Praias e natureza; tufões e mar condicionam passeios, circuitos longos de ilhas ficam de fora.'],
  ['Singapore', 'Singapura', null, 'urban', 'HHHHHHHHHHHH', '233223332211', 'longCost', 'Cidade, jardins e gastronomia; chuva equatorial não impede um roteiro urbano com alternativas cobertas.'],
  ['Türkiye', 'Istambul', null, 'urban', 'CCCMMHHHMMCC', null, 'europeValue', 'Museus, bairros e gastronomia; inverno urbano frio, não praia ou esqui na Anatólia.'],
  ['Uzbekistan', 'Tashkent e Samarcanda', null, 'heritage', 'CCCMMHHHMMCC', '112332113321', 'longValue', 'Cidades da Rota da Seda; verão quente pede pausas, inverno frio com foco cultural.'],
  ['Vietnam', 'Hanói e Ninh Binh', null, 'heritage', 'MMHHHHHHHHMM', '223321112332', 'longValue', 'Norte do país: inverno ameno, verão quente e chuvoso; não representa o calendário do litoral central.'],
  ['Saudi Arabia', 'Riad e Diriyah', null, 'heritage', 'MMHHHHHHHHHM', '333100000233', 'longValue', 'Patrimônio e cidade; verão extremo excluído e eVisa não recebe bônus de isenção.'],
  ['Fiji', 'Nadi e costa de Viti Levu', null, 'island', 'HHHHHHHHHHHH', '011233333221', 'remote', 'Ilha principal e deslocamentos curtos; atenção a ciclones no verão, sem resorts de luxo.'],
  ['Samoa', 'Upolu', null, 'island', 'HHHHHHHHHHHH', '011233333211', 'remote', 'Praias e cultura samoana; período mais úmido tem ressalvas e janeiro fica excluído.'],
  ['Tonga', 'Tongatapu', null, 'island', 'HHHHMMMMHHHH', '011233333211', 'remote', 'Ilha principal e patrimônio; não promete baleias fora de temporada nem inclui expedições.'],
  ['Vanuatu', 'Efate', null, 'island', 'HHHHHHMMHHHH', '011233333211', 'remote', 'Praias e cultura local; confirmar acessos, operação e alertas de ciclones. Não inclui vulcões de outras ilhas.'],

  // Additional regions of large countries; keep successful original profiles.
  ['Brazil', 'Rio de Janeiro e parques costeiros', 'GIG', 'coast', 'HHHHHMMHHHHH', '222233333322', 'domestic', 'Praia, patrimônio e natureza; calor e pancadas de verão, sem promessa de trilhas após chuva.'],
  ['Brazil', 'Foz do Iguaçu', 'IGU', 'foodNature', 'HHHMMMMMMHHH', '222233333322', 'domestic', 'Cataratas, passeios acessíveis e culinária da fronteira; não é um roteiro de neve.'],
  ['Argentina', 'Mendoza e arredores', 'MDZ', 'foodNature', 'HHMMMMMMMMHH', '223333223332', 'nearby', 'Vinhos, gastronomia e paisagens de baixa altitude; não inclui Aconcágua nem clima de alta montanha.'],
  ['Argentina', 'Ushuaia e Tierra del Fuego', 'USH', 'alpine', 'MMCCCCCCCCMM', '332113331233', 'connection', 'Inverno para paisagens e atividades de neve guiadas; não repetir trilhas de verão.'],
  ['Chile', 'Santiago e Valparaíso', null, 'heritage', 'HHHMMMMMMHHH', '223333223332', 'nearby', 'Patrimônio, gastronomia e colinas; inverno urbano ameno, separado do perfil de neve andina.'],
  ['Chile', 'San Pedro de Atacama', 'CJC', 'outdoors', 'HHMMMMMMMMHH', '222333223332', 'regional', 'Dias amenos e noites frias; altitude exige adaptação, frio noturno não equivale a inverno o dia inteiro.'],
  ['Peru', 'Lima e litoral urbano', null, 'urban', 'HHHMMMMMMMMH', '333222222223', 'regional', 'Cozinha peruana e patrimônio; inverno com garúa e céu cinzento, sem clima de Cusco.'],
  ['Colombia', 'Medellín e arredores', 'MDE', 'foodNature', 'HHHHHHHHHHHH', '332112221123', 'regional', 'Vale quente, gastronomia e passeios próximos; chuvas e montanhas exigem planejamento de estrada.'],
  ['United States of America', 'Miami e Everglades', 'MIA', 'coast', 'HHHHHHHHHHHH', '333321110023', 'highCost', 'Praia e natureza subtropical; furacões excluem setembro–outubro, sem clima de Nova York.'],
  ['United States of America', 'San Francisco e litoral próximo', 'SFO', 'heritage', 'MMMMMMMMMMMM', '112233333321', 'highCost', 'Clima costeiro ameno com neblina; não inclui desertos quentes nem parques alpinos fechados no inverno.'],
  ['Mexico', 'Cancún e Riviera Maya', 'CUN', 'coast', 'HHHHHHHHHHHH', '333322110023', 'connection', 'Praia e sítios maias; sargaço e tempestades variam, sem pressupor pacote all-inclusive.'],
  ['China', 'Guilin e Yangshuo', 'KWL', 'heritage', 'CMMMHHHHHHMM', '112223223321', 'longValue', 'Paisagens cársticas e vilas; chuvas fortes podem suspender barcos, sem generalizar para Pequim.'],
  ['India', 'Goa', 'GOI', 'coast', 'HHHHHHHHHHHH', '333210000233', 'longValue', 'Praias e patrimônio indo-português; monção forte excluída deste roteiro marítimo.'],
  ['Australia', 'Cairns e recifes próximos', 'CNS', 'island', 'HHHHHHHHHHHH', '011233333321', 'longCost', 'Norte tropical quente mesmo no inverno; saídas ao recife dependem do mar e há riscos sazonais na água.'],
  ['South Africa', 'Joanesburgo e parques próximos', null, 'foodNature', 'HHHMMMMMMHHH', '222233333322', 'connection', 'Gastronomia, patrimônio e passeios curtos; não inclui safári de vários dias no Kruger.'],
  ['France', 'Chamonix e vales alpinos', 'GVA', 'alpine', 'CCCMMMMMMMCC', '333223332233', 'highCost', 'Gateway de Genebra e transfer incluídos. Inverno para atividades de neve, não trilhas altas de verão.'],
  ['Japan', 'Sapporo e arredores de Hokkaido', 'CTS', 'alpine', 'CCCCMMMMMCCC', '333223332233', 'longCost', 'Paisagens de inverno e atividades guiadas; neve não é prometida em toda data.'],
  ['Thailand', 'Bangkok e Ayutthaya', 'BKK', 'urban', 'HHHHHHHHHHHH', '333122221233', 'longValue', 'Templos e gastronomia; monção urbana permite alternativas cobertas, diferente do perfil marítimo de Phuket.']
]);

// Cross-border gateways are explicit, not silently assigned to the wrong country.
export const ACCESS_GATEWAYS = Object.freeze({ Andorra: 'ES', Liechtenstein: 'CH', Monaco: 'FR', 'San Marino': 'IT', 'France:GVA': 'CH' });

// New urban/regional complements are explicit, not inferred from every country's
// foods/checklist. Strength 1 is a real secondary outing, never a defining reason.
export const PROFILE_COMPLEMENTS = Object.freeze({
  'ar-buenos-aires': { natureza: 1 }, 'br-salvador': { natureza: 2, aventura: 1 },
  'ar-bariloche': { gastronomia: 2, cultura: 1 }, 'cl-andes': { gastronomia: 1 },
  'pe-cusco': { gastronomia: 2 }, 'co-cartagena': { natureza: 2 },
  'us-new-york': { natureza: 1 }, 'mx-city': { natureza: 2 },
  'pt-lisbon': { natureza: 2, aventura: 1 }, 'es-madrid': { natureza: 1 },
  'fr-paris': { natureza: 1 }, 'it-rome': { natureza: 1 },
  'de-frankfurt': { natureza: 2 }, 'ma-marrakech': { natureza: 1 },
  'jp-tokyo': { natureza: 1 }, 'kr-seoul': { natureza: 2 },
  'nz-queenstown': { gastronomia: 2 }, 'au-sydney': { aventura: 2 }
});

// Do not equate a national 0 (not the BEST month) with a closed urban destination.
// Severe risks in explicit regional profiles remain 0. This table documents only
// the original profiles whose ordinary shoulder/rainy season was over-rejected.
export const SEASON_REFINEMENTS = Object.freeze({
  'br-salvador': '333211223333', 'co-cartagena': '333222211123',
  'za-cape': '333322112333', 'jp-tokyo': '223332112332',
  'kr-seoul': '222332112332', 'th-phuket': '333211110023',
  'id-bali': '111233333211', 'np-valleys': '123330001332',
  'mv-male-atolls': '333211111112', 'mu-west': '111233333332'
});

export const REFINED_NOTES = Object.freeze({
  'br-salvador': 'Praias, patrimônio e paisagens costeiras; abril–julho mais chuvosos pedem flexibilidade. Carnaval e Réveillon podem exceder a faixa.',
  'co-cartagena': 'Centro histórico, praias e ilhas; meses chuvosos pedem alternativas em terra, e travessias dependem do mar.',
  'za-cape': 'Cidade, gastronomia e natureza. Inverno chuvoso permite passeios curtos em janelas estáveis; não insistir em trilhas sob alerta.',
  'jp-tokyo': 'Cultura, gastronomia e parques de Tóquio. Verão úmido e quente requer pausas e alternativas cobertas; inverno urbano frio.',
  'kr-seoul': 'Cultura, gastronomia e parques de Seul; verão de monção pede flexibilidade, inverno frio exige roupas adequadas.',
  'id-bali': 'Templos, paisagens e praias de Bali. Na monção, planeje alternativas culturais e aceite cancelamentos de barcos.',
  'np-valleys': 'Vale de Katmandu e caminhadas baixas, não Everest ou expedição; junho–agosto inadequados a esta proposta. Guias/licenças precisam ser orçados.',
  'mv-male-atolls': 'Pousada em ilha local, não luxo. Janeiro–março é a janela mais seca; monção e transições exigem flexibilidade e podem cancelar barcos e mergulhos.'
});
