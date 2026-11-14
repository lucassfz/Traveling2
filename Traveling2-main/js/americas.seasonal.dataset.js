// Month-specific, practical checklist additions for every catalog destination
// in the Americas. Dates describe planning windows, not guaranteed weather.
const parseMonths = text => text.split(',').map(Number);
const everyMonth = Array.from({ length: 12 }, (_, index) => index + 1);
const makeTips = (id, months, text) => ({
  id, months, group: 'Bagagem e clima',
  items: text.split(';').map((label, index) => ({ id: `${id}-${index}`, icon: index ? '🧭' : '🧳', label }))
});

// key | first-window months | first-window checklist | other-month checklist.
// The complementary window covers every remaining month, so the selector never
// falls back to an undifferentiated year-round recommendation.
const rows = [
  'Antigua & Barbuda|12,1,2,3,4,5|Levar proteção solar e roupa leve para a estação relativamente seca;Reservar barcos e praias com antecedência no pico de inverno|Conferir alertas de tempestade tropical e cobertura de cancelamento;Levar capa leve para pancadas fortes entre junho e novembro',
  'Argentina|10,11,12,1,2,3|Levar proteção solar e reservar trilhas da Patagônia com antecedência;Prever vento forte e mudanças rápidas de tempo no sul|Levar roupa térmica para o sul e os Andes;Conferir neve e operação de estradas e passeios entre junho e agosto',
  'Bahamas|12,1,2,3,4,5|Levar roupa leve e protetor para ilhas na fase relativamente seca;Reservar ferries e hospedagem na alta temporada|Acompanhar previsão e alertas de furacão de junho a novembro;Prever folga entre ferries e voos interilhas',
  'Barbados|12,1,2,3,4,5|Levar proteção solar e planejar atividades de praia para o período menos chuvoso;Reservar hospedagem de inverno com antecedência|Levar impermeável leve para pancadas tropicais;Monitorar alertas de ciclone e ajustar passeios de barco',
  'Belize|12,1,2,3,4,5|Reservar passeios à barreira de corais na fase mais seca;Levar proteção solar e repelente para ruínas e selva|Conferir risco de furacões e plano de remarcação de barco ou voo;Levar capa de chuva e repelente para áreas de mata',
  'Bolivia|5,6,7,8,9,10|Levar roupa térmica para noites frias no altiplano seco;Conferir aclimatação e acesso a estradas de montanha|Checar alagamentos e operação dos passeios no Salar de Uyuni;Levar capa de chuva e calçado para lama nas terras baixas',
  'Brazil|5,6,7,8,9|Levar casaco ao Sul e Sudeste e considerar seca no Pantanal;Conferir queimadas e qualidade do ar em áreas interiores|Planejar chuva amazônica e temporais de verão no Sul/Sudeste;Levar repelente e proteção para eletrônicos em roteiros de mata',
  'Chile|10,11,12,1,2,3|Reservar trilhas da Patagônia e levar corta-vento;Prever sol forte no Atacama e frio noturno mesmo no verão|Levar roupa térmica para Andes e sul;Verificar neve, passes andinos e horários reduzidos de travessias',
  'Colombia|12,1,2,3|Levar proteção solar para Caribe e altitude para Bogotá;Reservar transportes para praias no período menos chuvoso|Levar capa de chuva e calçado aderente para trilhas andinas;Checar deslizamentos e atrasos rodoviários nas regiões úmidas',
  'Costa Rica|12,1,2,3,4|Reservar parques e praia do Pacífico na estação seca;Levar protetor e repelente para mata e litoral|Levar impermeável e saco estanque para a estação verde;Checar estado de estradas de terra e passeios fluviais',
  'Cuba|11,12,1,2,3,4|Levar roupa leve e uma camada para noites mais frescas;Reservar transporte intermunicipal em feriados|Acompanhar alertas de furacão entre junho e novembro;Prever margem para deslocamentos e levar capa leve',
  'Dominica|12,1,2,3,4,5|Levar botas aderentes para trilhas e cachoeiras;Reservar passeios marítimos na fase menos chuvosa|Acompanhar alertas de ciclone e condição das trilhas;Levar impermeável e proteger documentos em travessias',
  'Dominican Rep.|12,1,2,3,4|Levar proteção solar e reservar litoral na estação mais seca;Planejar transferes para praias e parques antes da chegada|Monitorar furacões e chuvas entre junho e novembro;Manter flexibilidade para barcos, voos e estradas costeiras',
  'Ecuador|6,7,8,9|Levar camadas para Andes frios e secos;Reservar trilhas de altitude e checar aclimatação|Levar capa de chuva para Andes e Amazônia;Conferir lama e operação de vias rurais antes de sair',
  'El Salvador|11,12,1,2,3,4|Levar proteção solar e água para praias e vulcões;Reservar trilhas de vulcão com guia e saída cedo|Levar capa de chuva e repelente;Checar enxurradas e estradas de serra na estação úmida',
  'Grenada|1,2,3,4,5|Levar roupa leve para praias e trilhas de especiarias;Reservar barcos para ilhas menores em dias de mar calmo|Levar impermeável leve para pancadas tropicais;Monitorar alertas de tempestade e horários de barcos',
  'Guatemala|11,12,1,2,3,4|Levar camadas para manhãs frias no altiplano;Reservar acesso a vulcões e ruínas em feriados|Levar capa de chuva e calçado aderente;Checar deslizamentos e condições de trilha nos vulcões',
  'Haiti|11,12,1,2,3,4|Levar água, proteção solar e documentos de contingência;Confirmar condições de segurança e transporte antes de qualquer deslocamento|Monitorar ciclones e chuvas fortes;Não planejar conexão terrestre sem avaliação oficial de segurança e operação',
  'Honduras|12,1,2,3,4|Levar protetor e repelente para litoral e ruínas de Copán;Confirmar previsão para barcos às Ilhas da Baía|Levar capa de chuva e repelente na época úmida;Monitorar furacões e funcionamento de ferries e estradas',
  'Jamaica|12,1,2,3,4|Levar protetor e roupa leve na janela mais seca;Reservar passeio de montanha com camada para noites frescas|Acompanhar risco de furacão e tempestades;Prever folga para transferes e levar impermeável leve',
  'Nicaragua|12,1,2,3,4|Levar proteção solar e água para vulcões e Pacífico;Reservar barcos ao lago e ilhas no período seco|Levar impermeável e repelente para a estação chuvosa;Checar estradas rurais e travessias de barco após temporais',
  'Panama|12,1,2,3,4|Levar roupa leve e protetor para Pacífico e Cidade do Panamá;Conferir previsão do Caribe, que pode divergir da costa pacífica|Levar capa de chuva e repelente;Confirmar barcos para San Blas e estradas após chuva forte',
  'Paraguay|5,6,7,8|Levar camada para noites frias e secas no Chaco;Conferir poeira e distâncias longas de estrada|Levar roupa respirável para calor úmido e temporais;Checar alagamentos e condição de estradas no Chaco',
  'Peru|5,6,7,8,9|Reservar trilhas andinas e trem a Machu Picchu com antecedência;Levar camadas para noites frias e altitude|Levar impermeável e checar trilhas/estradas andinas após chuva;Na costa, prever calor de verão entre dezembro e março enquanto a serra fica úmida',
  'St. Kitts & Nevis|12,1,2,3,4,5|Levar protetor para praia e água para trilha do vulcão;Reservar ferry entre as ilhas em dias de maior demanda|Monitorar tempestades tropicais e ferries;Levar capa leve e proteção para documentos',
  'St. Lucia|12,1,2,3,4,5|Levar calçado aderente para trilhas dos Pitons;Reservar passeios marítimos na fase menos chuvosa|Acompanhar temporada de furacões e chuva intensa;Confirmar trilhas e barcos antes de sair',
  'St. Vincent & Grenadines|12,1,2,3,4,5|Reservar veleiros e ferries na janela relativamente seca;Levar protetor solar e água para as ilhas|Monitorar ciclones e estado do mar entre junho e novembro;Deixar margem para ferry e proteger bagagem da chuva',
  'Trinidad & Tobago|1,2,3,4,5|Levar protetor e reservar transporte no Carnaval e feriados;Conferir mar para travessia até Tobago|Levar repelente e impermeável para chuvas fortes;Monitorar alertas de tempestade e atrasos de ferry',
  'Uruguay|11,12,1,2,3|Levar protetor e reservar litoral em janeiro e fevereiro;Prever vento e noites frescas mesmo no verão|Levar casaco e impermeável para inverno úmido e ventoso;Checar horários reduzidos de balneários fora de temporada',
  'Venezuela|12,1,2,3,4|Levar proteção solar e água para o Caribe na estação menos chuvosa;Confirmar acesso, segurança e abastecimento antes de trajetos longos|Levar capa de chuva e repelente para interior e Canaima;Checar rios, pistas e operação de voos regionais',
];

const result = Object.fromEntries(rows.map(row => {
  const [key, monthText, first, other] = row.split('|');
  const months = parseMonths(monthText);
  return [key, [
    makeTips('season-first', months, first),
    makeTips('season-other', everyMonth.filter(month => !months.includes(month)), other)
  ]];
}));

result['United States of America'] = [
  makeTips('winter', [12, 1, 2], 'Levar roupa térmica para norte e montanhas;Conferir nevascas, estradas e conexões aéreas'),
  makeTips('spring', [3, 4, 5], 'Levar camadas para mudança rápida de temperatura;Monitorar temporais no centro-sul e reservar parques concorridos'),
  makeTips('summer', [6, 7, 8], 'Levar proteção contra calor e sol no sul e oeste;Monitorar incêndios no oeste e furacões no Atlântico/Golfo'),
  makeTips('autumn', [9, 10, 11], 'Levar camadas para frio crescente no norte;Monitorar furacões no Atlântico/Golfo até novembro e reservar folhagem de outono')
];
result.Canada = [
  makeTips('winter', [12, 1, 2], 'Levar camadas térmicas e botas impermeáveis;Conferir nevascas, pneus e fechamento sazonal de estradas'),
  makeTips('spring', [3, 4, 5], 'Levar camadas e impermeável para degelo e chuva;Checar trilhas ainda fechadas e estado das estradas de montanha'),
  makeTips('summer', [6, 7, 8], 'Reservar parques nacionais e travessias na alta temporada;Levar repelente e acompanhar fumaça de incêndios florestais'),
  makeTips('autumn', [9, 10, 11], 'Levar camadas para frio crescente e chuva;Reservar folhagem de outono e checar encerramento de trilhas')
];
result.Mexico = [
  makeTips('dry', [12, 1, 2, 3, 4], 'Levar camadas para altitude na Cidade do México e sol para Yucatán;Reservar sítios arqueológicos e praias em feriados'),
  makeTips('rain', [5, 6, 7, 8, 9, 10], 'Levar capa de chuva para o centro e repelente no trópico;Acompanhar furacões nas costas do Caribe e Pacífico e ajustar deslocamentos'),
  makeTips('shoulder', [11], 'Levar roupa leve e capa para mudança de estação;Em novembro, acompanhar o fim da temporada ciclônica antes de reservar barcos')
];

// Guianas have two rainy and two less-rainy windows; January and July should
// not collapse into the same advice merely because both can be wet.
result.Guyana = [
  makeTips('short-wet', [12, 1], 'Levar capa e repelente para a estação curta de chuvas;Confirmar pistas do interior e horários de barco após temporais'),
  makeTips('short-dry', [2, 3, 4], 'Levar proteção solar para passeios fluviais;Confirmar voos e barcos a Kaieteur com antecedência'),
  makeTips('long-wet', [5, 6, 7, 8], 'Prever lama e rios altos na estação longa de chuvas;Proteger equipamentos e reservar margem para voos remotos'),
  makeTips('long-dry', [9, 10, 11], 'Levar água e repelente para trilhas de floresta;Reservar operadores para interior na janela de acesso mais estável')
];
result.Suriname = [
  makeTips('short-wet', [12, 1], 'Levar impermeável para a estação curta de chuvas;Confirmar barcos e alojamentos de floresta no fim do ano'),
  makeTips('short-dry', [2, 3], 'Levar protetor solar e repelente para passeios de rio;Reservar transporte para reservas do interior'),
  makeTips('long-wet', [4, 5, 6, 7, 8], 'Prever rios cheios e trilhas enlameadas na chuva longa;Proteger eletrônicos e reservar margem para voos ao interior'),
  makeTips('long-dry', [9, 10, 11], 'Levar roupa leve e repelente para mata;Confirmar nível dos rios antes de contratar transporte fluvial')
];
result['Fr. Guiana'] = [
  makeTips('main-wet', [12, 1, 2, 3, 4, 5, 6], 'Levar impermeável e repelente para a estação chuvosa principal;Confirmar estradas e passeios fluviais após temporais'),
  makeTips('transition', [7], 'Levar capa leve: julho ainda pode ter pancadas fortes;Checar previsão antes de reservar trilhas e barcos no início da transição'),
  makeTips('drier', [8, 9, 10, 11], 'Levar proteção solar e repelente para a seca relativa;Reservar excursões de mata e barco com operador local')
];

export const AMERICAS_SEASONAL_ENRICHMENT = Object.freeze(result);
