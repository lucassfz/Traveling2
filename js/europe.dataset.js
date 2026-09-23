// Camada regional para o mesmo modelo consumido pelo drawer. As regras de
// fronteira foram consultadas em 2026-09; continuam sujeitas a mudança.
const EU_BORDER = 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:22025X01998';
const EES_SOURCE = 'https://home-affairs.ec.europa.eu/news/entry-exit-system-fully-operational-10-april-2026-who-exempt-2026-07-27_en';
const ETIAS_SOURCE = 'https://travel-europe.europa.eu/etias';
const SCHENGEN_ENTRY = Object.freeze({
  visaPolicyBR: 'Passaporte brasileiro comum: turismo curto sem visto no espaço Schengen. A permanência é compartilhada entre os países participantes.',
  maxStay: 'Até 90 dias em qualquer período móvel de 180 dias no conjunto Schengen (acordo UE–Brasil vigente desde 1º/3/2026).',
  passportValidity: 'Documento emitido há menos de 10 anos e válido por ao menos 3 meses após a saída prevista.',
  documents: 'Passagem de saída, hospedagem e recursos podem ser solicitados na fronteira.',
  health: 'Seguro médico de viagem é recomendado; não há exigência sanitária geral para turismo vindo do Brasil.',
  ees: { status: 'operacional', notes: 'Registro de entradas/saídas e biometria em fronteiras externas para viajantes elegíveis.', officialSource: EES_SOURCE },
  etias: { status: 'não exigido em 2026-09', notes: 'A UE prevê início no último trimestre de 2026, sem data definitiva anunciada.', officialSource: ETIAS_SOURCE },
  officialSource: EU_BORDER, verifiedAt: '2026-09', status: 'verified'
});

const ASSOCIATED_SCHENGEN_ENTRY = Object.freeze({
  ...SCHENGEN_ENTRY,
  visaPolicyBR: 'Passaporte brasileiro comum: turismo curto sem visto; a permanência conta no limite conjunto do espaço Schengen.',
  maxStay: 'Até 90 dias em 180 dias no conjunto Schengen, sujeito às regras nacionais aplicáveis.',
  officialSource: 'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en'
});

const UK_ENTRY = Object.freeze({
  visaPolicyBR: 'Brasileiros em visita curta normalmente não precisam de visto, mas precisam de ETA válida antes do embarque, salvo exceção legal.',
  maxStay: 'Visita geralmente até 6 meses; autorização de entrada depende do controle migratório.',
  passportValidity: 'Passaporte válido por toda a estadia.',
  documents: 'ETA vinculada ao passaporte, saída, hospedagem e recursos podem ser verificados.',
  health: 'Confira orientações sanitárias para seu itinerário.',
  ees: { status: 'não se aplica', notes: 'Reino Unido não integra o espaço Schengen.' },
  etias: { status: 'não se aplica', notes: 'O Reino Unido usa ETA própria.' },
  officialSource: 'https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-eta-national-list', verifiedAt: '2026-09', status: 'verified'
});

const IRELAND_ENTRY = Object.freeze({
  visaPolicyBR: 'Passaporte brasileiro comum não exige visto irlandês prévio para visita curta; admissão é decidida na fronteira.',
  maxStay: 'Permissão curta geralmente até 90 dias, conforme carimbo da imigração.',
  passportValidity: 'Passaporte válido; confirme exigências específicas antes do embarque.',
  documents: 'Passagem de saída, hospedagem, motivo da visita e recursos podem ser solicitados.',
  health: 'Confira orientações sanitárias para seu itinerário.',
  ees: { status: 'não se aplica', notes: 'Irlanda não participa do EES/Schengen.' },
  etias: { status: 'não se aplica', notes: 'ETIAS não é autorização para entrar na Irlanda.' },
  officialSource: 'https://www.irishimmigration.ie/visa-non-visa-required-nationalities/', verifiedAt: '2026-09', status: 'verified'
});

// Campos compactos: aeroporto principal, cidade, eletricidade, comida,
// etiqueta, contexto histórico. Metadados básicos vêm do catálogo existente.
const PROFILES = Object.freeze({
  Portugal: ['LIS', 'Lisboa', '230V · tipos C/F', 'Bacalhau', 'Saudação cordial e refeições sem pressa.', 'De reino medieval à expansão marítima, Portugal viveu ditadura no século XX e tornou-se democracia com a Revolução dos Cravos em 1974.'],
  Spain: ['MAD', 'Madri', '230V · tipos C/F', 'Tortilla española', 'Horários de refeição costumam ser mais tardios; cumprimente antes de pedir.', 'A unificação dinástica e o império ultramarino marcaram a Espanha. Após a ditadura franquista, a transição democrática consolidou a monarquia parlamentar.'],
  France: ['CDG', 'Paris', '230V · tipos C/E', 'Croissant', 'Diga bonjour ao entrar em lojas; gorjeta extra é opcional.', 'A Revolução de 1789 transformou a política europeia. Hoje a França é uma república de forte tradição cultural e laica.'],
  Italy: ['FCO', 'Roma', '230V · tipos C/F/L', 'Pasta regional', 'Respeite códigos de vestimenta em igrejas e ritmos locais das refeições.', 'O legado de Roma antiga e das cidades renascentistas molda o país. A unificação ocorreu no século XIX e a república nasceu após a Segunda Guerra.'],
  'United Kingdom': ['LHR', 'Londres', '230V · tipo G', 'Fish and chips', 'Filas são levadas a sério; peça licença e aguarde sua vez.', 'A união de reinos formou o Estado moderno; a Revolução Industrial e o antigo império deixaram marcas globais. O país mantém monarquia constitucional.'],
  Germany: ['FRA', 'Frankfurt', '230V · tipos C/F', 'Bratwurst', 'Pontualidade e regras locais de reciclagem são valorizadas.', 'Após unificação no século XIX, guerras e divisão no século XX, a reunificação de 1990 formou a atual república federal.'],
  Netherlands: ['AMS', 'Amsterdã', '230V · tipos C/F', 'Stroopwafel', 'Dê prioridade a ciclistas e não caminhe nas ciclovias.', 'A República neerlandesa foi potência comercial no século XVII; hoje o país é monarquia constitucional com longa tradição mercantil.'],
  Switzerland: ['ZRH', 'Zurique', '230V · tipos C/J', 'Fondue', 'Pontualidade e silêncio em transporte público são apreciados.', 'Confederação de cantões com tradição de neutralidade; o Estado federal moderno nasceu em 1848.'],
  Austria: ['VIE', 'Viena', '230V · tipos C/F', 'Wiener schnitzel', 'Cumprimente em estabelecimentos pequenos e respeite horários.', 'Centro da monarquia dos Habsburgo, tornou-se república após 1918; a identidade contemporânea combina herança imperial e vida cultural.'],
  Greece: ['ATH', 'Atenas', '230V · tipos C/F', 'Moussaka', 'Trate sítios arqueológicos e espaços religiosos com respeito.', 'As pólis da Antiguidade influenciaram a cultura ocidental. A independência moderna veio no século XIX; hoje é república parlamentar.'],
  Ireland: ['DUB', 'Dublin', '230V · tipo G', 'Irish stew', 'Conversa cordial é comum; confira se serviço já está incluído.', 'A independência da maior parte da ilha ocorreu no século XX; o país mantém forte tradição literária e identidade celta.'],
  Belgium: ['BRU', 'Bruxelas', '230V · tipos C/E', 'Waffles', 'Idioma varia por região: francês, neerlandês e alemão.', 'Independente desde 1830, a Bélgica desenvolveu uma monarquia federal e abriga importantes instituições europeias.'],
  'Czech Rep.': ['PRG', 'Praga', '230V · tipos C/E', 'Svíčková', 'Peça licença e respeite ambientes históricos.', 'A Boêmia integrou diversos impérios; a Revolução de Veludo de 1989 abriu a democracia e a Tchéquia tornou-se independente em 1993.'],
  Hungary: ['BUD', 'Budapeste', '230V · tipos C/F', 'Goulash', 'Cumprimentos formais ajudam em primeiros contatos.', 'O Reino da Hungria e o Império Austro-Húngaro antecederam o século XX socialista; a transição democrática começou em 1989.'],
  Croatia: ['ZAG', 'Zagreb', '230V · tipos C/F', 'Peka', 'Respeite áreas residenciais em cidades costeiras muito visitadas.', 'Terras croatas passaram por impérios e pela Iugoslávia; a independência foi declarada em 1991. Hoje integra UE e Schengen.'],
  Denmark: ['CPH', 'Copenhague', '230V · tipos C/E/F/K', 'Smørrebrød', 'Pontualidade e respeito ao espaço pessoal são importantes.', 'Reino nórdico de longa continuidade, desenvolveu democracia parlamentar e Estado de bem-estar social.'],
  Sweden: ['ARN', 'Estocolmo', '230V · tipos C/F', 'Köttbullar', 'Respeite filas, silêncio e a natureza.', 'Potência báltica nos séculos XVII e XVIII, a Suécia consolidou monarquia parlamentar e forte modelo social.'],
  Norway: ['OSL', 'Oslo', '230V · tipos C/F', 'Laks', 'Natureza e trilhas seguem regras de conservação; respeite horários.', 'Após união com Dinamarca e Suécia, tornou-se independente em 1905. A economia moderna combina energia e Estado social.'],
  Finland: ['HEL', 'Helsinque', '230V · tipos C/F', 'Karjalanpiirakka', 'Silêncio em saunas e espaços públicos é confortável, não descortês.', 'Após séculos sob Suécia e Rússia, conquistou independência em 1917; educação e design marcam sua identidade atual.'],
  Poland: ['WAW', 'Varsóvia', '230V · tipos C/E', 'Pierogi', 'Cumprimentos formais são comuns; observe regras em igrejas.', 'Partilhas apagaram a Polônia do mapa no século XVIII; recuperou independência em 1918 e democracia após 1989.']
});

const ZONES = Object.freeze({
  Portugal: 'Continente UTC+0/+1; Açores UTC−1/+0', Spain: 'Continente UTC+1/+2; Canárias UTC+0/+1',
  France: 'França metropolitana UTC+1/+2', Italy: 'UTC+1/+2', 'United Kingdom': 'UTC+0/+1',
  Germany: 'UTC+1/+2', Netherlands: 'UTC+1/+2', Switzerland: 'UTC+1/+2', Austria: 'UTC+1/+2',
  Greece: 'UTC+2/+3', Ireland: 'UTC+0/+1', Belgium: 'UTC+1/+2', 'Czech Rep.': 'UTC+1/+2',
  Hungary: 'UTC+1/+2', Croatia: 'UTC+1/+2', Denmark: 'UTC+1/+2', Sweden: 'UTC+1/+2',
  Norway: 'UTC+1/+2', Finland: 'UTC+2/+3', Poland: 'UTC+1/+2'
});

const CAPITALS = Object.freeze({
  Portugal: 'Lisboa', Spain: 'Madri', France: 'Paris', Italy: 'Roma', 'United Kingdom': 'Londres',
  Germany: 'Berlim', Netherlands: 'Amsterdã', Switzerland: 'Berna', Austria: 'Viena',
  Greece: 'Atenas', Ireland: 'Dublin', Belgium: 'Bruxelas', 'Czech Rep.': 'Praga',
  Hungary: 'Budapeste', Croatia: 'Zagreb', Denmark: 'Copenhague', Sweden: 'Estocolmo',
  Norway: 'Oslo', Finland: 'Helsinque', Poland: 'Varsóvia'
});

const BEST_TIME = Object.freeze({
  Portugal: 'Primavera e outono combinam temperaturas mais amenas com menor movimento que o alto verão.',
  Spain: 'Primavera e outono são agradáveis para cidades; o verão é quente em boa parte do interior.',
  France: 'Primavera e outono favorecem cidades; Alpes e litoral têm temporadas próprias.',
  Italy: 'Primavera e outono evitam parte do calor e da lotação do verão nas cidades.',
  'United Kingdom': 'Fim da primavera ao início do outono oferece dias mais longos; chuva é possível o ano todo.',
  Germany: 'Fim da primavera ao início do outono favorece passeios ao ar livre; dezembro atrai pelos mercados.',
  Netherlands: 'Primavera destaca flores e dias mais longos; outono é alternativa menos concorrida.',
  Switzerland: 'Verão favorece trilhas; inverno é temporada de neve nos Alpes.',
  Austria: 'Verão favorece cidades e montanhas; inverno é temporada de esqui e mercados.',
  Greece: 'Maio, junho, setembro e outubro costumam evitar o pico de calor e lotação das ilhas.',
  Ireland: 'Fim da primavera ao início do outono traz dias mais longos; leve proteção contra chuva.',
  Belgium: 'Primavera ao início do outono favorece caminhadas; dezembro tem mercados sazonais.',
  'Czech Rep.': 'Primavera e outono trazem temperaturas mais amenas para Praga e outras cidades.',
  Hungary: 'Primavera e outono são períodos confortáveis para caminhar por Budapeste.',
  Croatia: 'Fim da primavera e setembro combinam clima costeiro e menor movimento que julho/agosto.',
  Denmark: 'Fim da primavera ao verão oferece dias longos para atividades ao ar livre.',
  Sweden: 'Verão oferece dias longos; inverno é procurado por neve e experiências árticas.',
  Norway: 'Verão favorece fiordes e trilhas; inverno é opção para neve e aurora no norte.',
  Finland: 'Verão oferece dias longos; inverno é temporada de neve e aurora na Lapônia.',
  Poland: 'Fim da primavera ao início do outono favorece cidades; inverno costuma ser frio.'
});

export const EUROPE_DATA = Object.freeze(Object.fromEntries(Object.entries(PROFILES).map(([key, profile]) => [key, {
  airport: profile[0], airportCity: profile[1], voltage: profile[2], food: profile[3], etiquette: profile[4], history: profile[5],
  entryRequirements: key === 'United Kingdom' ? UK_ENTRY : key === 'Ireland' ? IRELAND_ENTRY : ['Switzerland', 'Norway'].includes(key) ? ASSOCIATED_SCHENGEN_ENTRY : SCHENGEN_ENTRY
}])));

export const EUROPE_ENRICHMENT = Object.freeze(Object.fromEntries(Object.entries(EUROPE_DATA).map(([key, data]) => [key, {
  capital: CAPITALS[key], airport: data.airport, airportCity: data.airportCity, majorAirports: [data.airport], voltage: data.voltage,
  timezoneLabel: ZONES[key],
  bestTime: BEST_TIME[key],
  foods: [{ e: '🍽️', name: data.food, desc: `Especialidade local para conhecer em ${data.airportCity}.` }],
  etiquette: [{ e: '🤝', t: data.etiquette }],
  history: data.history,
  borderStatus: 'open', borderNote: 'Regra de turismo para brasileiros verificada em 2026-09; confirme antes da viagem.',
  visa: 'free', visaText: data.entryRequirements.visaPolicyBR, passport: data.entryRequirements.passportValidity,
  vaccines: data.entryRequirements.health, entryRequirements: data.entryRequirements,
  visaPolicyBR: { eligibility: 'visa-free', detail: data.entryRequirements.visaPolicyBR, verifiedOn: '2026-09', source: data.entryRequirements.officialSource },
  checklist: [{ group: 'Documentos e viagem', items: [
    { icon: '📘', label: 'Passaporte válido conforme a regra de entrada' },
    { icon: '🧾', label: 'Comprovantes de hospedagem, recursos e saída' },
    { icon: '🛡️', label: 'Seguro de viagem adequado ao itinerário' },
    { icon: '🔎', label: key === 'United Kingdom' ? 'ETA britânica antes do embarque, salvo exceção' : key === 'Ireland' ? 'Conferir admissão irlandesa independente do Schengen' : 'Verificar EES e data efetiva do ETIAS antes de viajar' }
  ] }],
  dataLevel: 'curated'
}])));
