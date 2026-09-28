// Complementos de apresentação para oito ilhas com mídia/História já válidas.
// Entrada permanece a confirmar: não inferir visto a partir da nacionalidade.
// Sazonalidade: americas.seasonal.dataset.js e autoridades de turismo locais.
// Gastronomia: autoridades de turismo (URLs indicadas por registro).
const food = (e, name, desc) => ({ e, name, desc });
const tip = (e, t) => ({ e, t });
const item = (icon, label) => ({ icon, label });
const islandChecklist = (transfer, activity) => [
  { group: 'Documentos e saúde', items: [
    item('📘', 'Confirmar visto, validade do passaporte e exigências de trânsito em fonte oficial antes de emitir'),
    item('🛡️', 'Seguro viagem com cobertura médica e comprovantes de passagem e hospedagem')
  ] },
  { group: 'Ilhas e passeios', items: [item('⛴️', transfer), item('🧭', activity)] },
  { group: 'Mala e clima', items: [
    item('☀️', 'Proteção solar, repelente e roupa leve para clima tropical'),
    item('🌧️', 'Capa leve e margem para remarcação de barco/passeio nos meses chuvosos')
  ] }
];
const preferred = months => Array.from({ length: 12 }, (_, index) => months.includes(index + 1) ? 2 : 1);

export const CARIBBEAN_AUDIT_ENRICHMENT = Object.freeze({
  'Antigua & Barbuda': {
    bestTime: 'Dezembro a abril costuma ser mais seco; maio acrescenta eventos gastronômicos. Entre junho e novembro, acompanhe chuva e alertas de tempestade.',
    months: preferred([12, 1, 2, 3, 4, 5]), airport: 'ANU', airportCity: "St. John's",
    voltage: '240V/50Hz; alguns hotéis oferecem 110V/60Hz. Confirme tomada e adaptador na hospedagem.',
    voltageSource: 'https://www.visitantiguabarbuda.com/faq/',
    flightNote: 'ANU atende Antígua; para Barbuda, confirme a travessia ou conexão local e o estado do mar.',
    foods: [food('🥘', 'Pepperpot', 'Ensopado de carnes e vegetais, frequentemente servido com fungee.'), food('🌽', 'Fungee', 'Preparação de fubá semelhante a polenta, acompanhada de peixe ou ensopado.'), food('🍠', 'Ducana', 'Batata-doce com coco e especiarias, cozida em folha.')],
    etiquette: [tip('🗣️', 'O inglês é oficial; cumprimente antes de pedir ajuda em mercados e pequenos estabelecimentos.'), tip('⛴️', 'Antígua e Barbuda são ilhas distintas: confirme o transporte interilhas, sobretudo se houver vento ou mar agitado.')],
    checklist: islandChecklist('Reservar e reconfirmar travessia para Barbuda, se incluída no roteiro', 'Respeitar regras de praias e áreas históricas como Nelson’s Dockyard'),
    editorialSource: 'https://www.visitantiguabarbuda.com/public_relations/antigua-and-barbuda-culinary-month-returns-with-exciting-lineup-of-events-throughout-may-2026/'
  },
  Barbados: {
    bestTime: 'Dezembro a maio é a fase relativamente seca; no segundo semestre há mais chuva, embora a ilha permaneça quente o ano inteiro.',
    months: preferred([12, 1, 2, 3, 4, 5]), airport: 'BGI', airportCity: 'Bridgetown',
    voltage: '115V/230V · tipos A/B; confirme a tensão da tomada na hospedagem.',
    voltageSource: 'https://www.visitbarbados.org/plan-your-trip/travel-information',
    flightNote: 'BGI é a principal chegada aérea da ilha; confira o deslocamento até a costa escolhida.',
    foods: [food('🐟', 'Cou-cou e flying fish', 'Fubá com quiabo e peixe-voador, prato associado à culinária barbadiana.'), food('🥧', 'Macaroni pie', 'Massa gratinada com queijo, acompanhamento popular.'), food('🥟', 'Fish cakes', 'Bolinhos de peixe encontrados em lanchonetes e mercados.')],
    etiquette: [tip('💵', 'Confira a conta antes de acrescentar gorjeta: muitos estabelecimentos já incluem taxa de serviço.'), tip('🚗', 'O trânsito circula pela esquerda; tenha atenção redobrada ao dirigir ou atravessar ruas.')],
    checklist: islandChecklist('Planejar traslado de BGI para a hospedagem na costa escolhida', 'Conferir condições do mar e regras locais antes de nadar ou sair de barco'),
    editorialSource: 'https://www.visitbarbados.org/top-ten-things-to-taste-in-barbados'
  },
  Dominica: {
    bestTime: 'Novembro a abril concentra a temporada mais procurada; nas florestas e montanhas chove em qualquer época, então trilhas exigem atenção à previsão.',
    months: preferred([11, 12, 1, 2, 3, 4]), airport: 'DOM', airportCity: 'Marigot',
    voltage: '220–240V; alguns hotéis oferecem outras tomadas. Confirme adaptador e tensão na hospedagem.',
    voltageSource: 'https://legacy.discoverdominica.com/useful-information',
    flightNote: 'DOM atende a ilha; estradas sinuosas tornam importante calcular o traslado até Roseau ou Portsmouth.',
    foods: [food('🥬', 'Sopa de callaloo', 'Sopa de folhas de dasheen com leite de coco, prato nacional.'), food('🦀', 'Crab back', 'Caranguejo temperado servido na própria concha, ligado à temporada crioula.'), food('🍞', 'Pão de mandioca kalinago', 'Pão tradicional de mandioca, que pode ser conhecido em visitas à comunidade kalinago.')],
    etiquette: [tip('🥾', 'Em trilhas e cachoeiras, siga guias e avisos locais: chuva pode elevar rios rapidamente.'), tip('🪶', 'Ao visitar o território kalinago, respeite orientações da comunidade e peça permissão antes de fotografar pessoas.')],
    checklist: islandChecklist('Prever tempo de estrada entre DOM, Roseau e as áreas de trilha', 'Levar calçado aderente e verificar chuva/nível de rios antes de cachoeiras e trilhas'),
    editorialSource: 'https://legacy.discoverdominica.com/en/posts/42/a-taste-of-the-island-dominicas-delicious-culinary-experiences'
  },
  Grenada: {
    bestTime: 'Janeiro a maio é a estação mais seca; junho a dezembro tende a ser mais chuvoso. Passeios de barco dependem do tempo e do mar.',
    months: preferred([1, 2, 3, 4, 5]), airport: 'GND', airportCity: "St. George's",
    voltage: '220V/50Hz; leve adaptador e confirme o tipo de tomada na hospedagem.',
    voltageSource: 'https://www.puregrenada.com/faqs/',
    flightNote: 'GND atende a ilha principal; Carriacou e Petite Martinique exigem transporte adicional.',
    foods: [food('🥘', 'Oil down', 'Ensopado de fruta-pão, callaloo, leite de coco, cúrcuma e carnes ou peixe.'), food('🍫', 'Chocolate granadino', 'Chocolate produzido com cacau local; há visitas a pequenas fábricas.'), food('🍨', 'Sorvete de noz-moscada', 'Doce que aproveita uma das especiarias emblemáticas da ilha.')],
    etiquette: [tip('🌿', 'Em áreas protegidas, não retire corais, plantas ou animais; siga trilhas autorizadas.'), tip('⛴️', 'Para Carriacou e Petite Martinique, confirme ferry e mar antes de ajustar hospedagens ou conexões.')],
    checklist: islandChecklist('Conferir ferry/voo para Carriacou e Petite Martinique, se aplicável', 'Respeitar áreas marinhas e florestais protegidas; não retirar corais ou fauna'),
    editorialSource: 'https://www.puregrenada.com/experiences/culinary/'
  },
  'St. Kitts & Nevis': {
    bestTime: 'Janeiro a abril costuma ser relativamente seco; o verão segue visitável, mas requer atenção à chuva e à temporada de tempestades.',
    months: preferred([1, 2, 3, 4, 12]), airport: 'SKB', airportCity: 'Basseterre',
    voltage: '230V/60Hz · tipos D/G; em Névis há locais com 110V. Confirme a tomada na hospedagem.',
    voltageSource: 'https://www.cia.gov/the-world-factbook/static/23083efa808b04434236c151dd4db6e7/SC-travel-facts.pdf',
    flightNote: 'SKB atende São Cristóvão; para Névis, planeje ferry ou conexão local conforme a chegada.',
    foods: [food('🍲', 'Goat water', 'Ensopado de cabra temperado, servido em São Cristóvão e Névis.'), food('🥟', 'Johnny cakes', 'Pães fritos comuns em refeições e barracas locais.'), food('🦞', 'Frutos do mar', 'Peixe e lagosta aparecem em restaurantes costeiros; confira sazonalidade e origem.')],
    etiquette: [tip('⛴️', 'São Cristóvão e Névis exigem travessia; confira horários de ferry e margem para o voo de saída.'), tip('🥾', 'Para subir o vulcão ou entrar na mata, siga orientação de guia local e previsão do tempo.')],
    checklist: islandChecklist('Reservar ferry para Névis e manter folga antes do voo de volta', 'Levar calçado firme e água para trilhas no Monte Liamuiga'),
    editorialSource: 'https://www.nevisisland.com/nevis-island-restaurants'
  },
  'St. Lucia': {
    bestTime: 'Dezembro a abril é mais seco e procurado; de junho a dezembro a chuva aumenta, sobretudo na floresta. Trilhas e barcos dependem das condições locais.',
    months: preferred([12, 1, 2, 3, 4, 5]), airport: 'UVF', airportCity: 'Vieux Fort',
    voltage: '240V · tipo G; alguns hotéis oferecem 110V. Confira o aparelho e a hospedagem.',
    voltageSource: 'https://stlucia.org/en_uk/plan-your-saint-lucia-trip/traveler-guide/',
    flightNote: 'UVF é a chegada internacional no sul; o traslado a Soufrière ou ao norte percorre estradas sinuosas.',
    foods: [food('🍌', 'Green fig and saltfish', 'Banana verde com peixe salgado, prato nacional.'), food('🍲', 'Bouyon', 'Ensopado crioulo de raízes, vegetais e carne ou peixe.'), food('🐟', 'Peixe crioulo', 'Pescado local com temperos e acompanhamentos regionais.')],
    etiquette: [tip('🗣️', 'O inglês é oficial e o crioulo kwéyòl também é amplamente falado; acolha as duas formas de comunicação.'), tip('⛰️', 'Nos Pitons, siga regras de acesso e guias locais; não trate a escalada como passeio casual.')],
    checklist: islandChecklist('Calcular o traslado de UVF até Soufrière ou a costa norte', 'Confirmar acesso/guia para trilhas dos Pitons e levar calçado aderente'),
    editorialSource: 'https://stlucia.org/en/blog/saint-lucia-for-foodies-introducing-your-kids-to-caribbean-flavours/'
  },
  'St. Vincent & Grenadines': {
    bestTime: 'Dezembro a maio é a estação relativamente seca; mesmo nesse período, verifique ventos e mar antes de navegar entre as ilhas.',
    months: preferred([12, 1, 2, 3, 4, 5]), airport: 'SVD', airportCity: 'Kingstown',
    voltage: '220–240V/50Hz · tipo G na maioria das ilhas; Palm Island e Petit St. Vincent usam 110V/60Hz.',
    voltageSource: 'https://tourism.gov.vc/tourism/index.php/svg-facts/461-electricity',
    flightNote: 'SVD atende São Vicente; as Granadinas dependem de ferry, barco ou voo regional, conforme a ilha.',
    foods: [food('🐟', 'Fruta-pão assada e jackfish', 'Combinação associada ao prato nacional de São Vicente e Granadinas.'), food('🍞', 'Salt fish cakes', 'Bolinhos de peixe salgado presentes na cozinha local.'), food('🦀', 'Crayfish com callaloo', 'Lagostim de água doce servido com folhas de callaloo.')],
    etiquette: [tip('⛵', 'São Vicente e as Granadinas têm logística interilhas: reconfirme barcos, voos regionais e estado do mar.'), tip('🌊', 'Em recifes e reservas, mantenha distância de tartarugas e corais e siga as regras do operador local.')],
    checklist: islandChecklist('Reservar ferry/barco ou voo regional para a ilha exata do roteiro', 'Conferir avisos de mar e regras das áreas marinhas antes de navegar ou mergulhar'),
    editorialSource: 'https://tourism.gov.vc/tourism/images/stories/PDF/Folk_Songs/vincentian%20local%20dish.pdf'
  },
  'Trinidad & Tobago': {
    bestTime: 'Janeiro a maio é mais seco; junho a dezembro tem mais chuva. Carnaval pode elevar preços e exigir reservas antecipadas.',
    months: preferred([1, 2, 3, 4, 5]), airport: 'POS', airportCity: 'Port of Spain',
    voltage: '110/220V conforme local; Tobago costuma usar 120V/60Hz. Confirme tomada e tensão na hospedagem.',
    voltageSource: 'https://www.gotrinidadandtobago.com/travel-information/country-information.html',
    flightNote: 'POS atende Trinidad; para Tobago, planeje conexão aérea ou ferry e confira horários.',
    foods: [food('🥙', 'Doubles', 'Lanche de pães achatados com grão-de-bico condimentado, associado a Trinidad.'), food('🦀', 'Curried crab and dumplings', 'Caranguejo ao curry com bolinhos, especialidade de Tobago.'), food('🍚', 'Pelau', 'Arroz temperado com proteína e leguminosas, presente na culinária das ilhas.')],
    etiquette: [tip('🎭', 'No Carnaval, reserve transporte e hospedagem cedo e respeite limites dos desfiles e participantes.'), tip('⛴️', 'Trinidad e Tobago têm ritmos e transportes diferentes; reconfirme ferry ou voo antes de combinar conexões.')],
    checklist: islandChecklist('Conferir ferry ou voo entre Trinidad e Tobago e reservar com margem', 'Planejar transporte e hospedagem cedo se a viagem coincidir com o Carnaval'),
    editorialSource: 'https://visittobago.gov.tt/local-culture-people-heritage/tobago-food/recipes'
  }
});
