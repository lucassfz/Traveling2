// Focused country records added after the regional curation passes.
// Neither record changes existing History or media.
const tip = (id, label, icon) => ({ id, label, icon });

const kosovoSource = 'https://mpb.rks-gov.net/f/57/11006/INFORMATION-FOR-FOREIGN-CITIZENS-ENTERING-THE-REPUBLIC-OF-KOSOVO';
const taiwanSource = 'https://www.boca.gov.tw/cp-157-4783-f6cb2-2.html';

export const GEOGRAPHIC_COMPLETION_ENRICHMENT = Object.freeze({
  Kosovo: {
    capital: 'Pristina', currency: 'Euro (EUR)', currencyCode: 'EUR', symbol: '€',
    lang: 'albanês e sérvio; inglês comum entre jovens nas cidades',
    timezoneLabel: 'UTC+1 / UTC+2 no horário de verão', voltage: '230V · tipos C/F',
    bestTime: 'Maio–junho e setembro–outubro favorecem cidades e trilhas; inverno é frio e neva nas montanhas.',
    months: [0, 0, 1, 1, 2, 2, 1, 1, 2, 2, 1, 0],
    airport: 'PRN', airportCity: 'Pristina', majorAirports: ['PRN'],
    flightNote: 'Pristina (PRN) é a principal porta aérea; saindo do Brasil, compare conexões pela Europa e regras de trânsito de cada escala.',
    foods: [
      { e: '🍽️', name: 'Flija', desc: 'Massa em camadas assada lentamente, servida com creme ou iogurte.' },
      { e: '🍽️', name: 'Pite', desc: 'Torta de massa fina com queijo, espinafre ou carne, presente em padarias.' },
      { e: '🍽️', name: 'Tavë Prizreni', desc: 'Assado de carne e legumes típico de Prizren e arredores.' }
    ],
    etiquette: [
      { e: '🤝', t: 'Aceitar café ou chá é parte comum da hospitalidade; cumprimente antes de ir direto ao assunto.' },
      { e: '💶', t: 'Gorjeta não é obrigatória; arredondar a conta ou deixar cerca de 5–10% por bom serviço é usual.' },
      { e: '🗣️', t: 'Albanês predomina; sérvio também é oficial. Aprender uma saudação local ajuda, sobretudo fora da capital.' },
      { e: 'ℹ️', t: 'Confira antecipadamente a rota com a Sérvia: o reconhecimento de documentos e carimbos pode afetar a travessia.' }
    ],
    entryRequirements: {
      visaPolicyBR: 'Brasileiros constam da lista oficial de isenção de visto para visita curta; Kosovo não integra o espaço Schengen.',
      modality: 'free', maxStay: 'Até 90 dias em qualquer período de 180 dias, segundo a regra kosovar.',
      passportValidity: 'Passaporte válido durante a viagem; confira com transportadora e imigração se pedem margem adicional.',
      documents: 'Bilhete de saída, endereço de hospedagem e recursos; declarar o endereço em até três dias após a entrada, conforme orientação do Interior.',
      health: 'Confira orientações sanitárias atuais e cobertura de seguro para a rota.',
      officialSource: kosovoSource, verifiedAt: '2026-09', status: 'needs-review',
      ees: { status: 'não se aplica', notes: 'Kosovo não integra o espaço Schengen nem participa do EES.', officialSource: 'https://travel-europe.europa.eu/ees/what-is-the-ees' },
      etias: { status: 'não se aplica', notes: 'ETIAS não autoriza entrada no Kosovo; verificar requisitos kosovares.', officialSource: 'https://travel-europe.europa.eu/etias/what-is-etias' }
    },
    visaPolicyBR: { eligibility: 'visa-free', detail: 'Turismo curto sem visto; confirmar a lista de isenção antes do embarque, pois a página nominal é arquivada.', verifiedOn: '2026-09', source: kosovoSource },
    visa: 'free', visaText: 'Visita curta sem visto, fora de Schengen.',
    borderStatus: 'warn', borderNote: 'Kosovo tem controle de entrada próprio; confirme a isenção brasileira e a rota com a Sérvia antes do embarque. Dias lá não contam para Schengen.',
    passport: 'Levar passaporte válido e conferir margem exigida pela transportadora.',
    vaccines: 'Conferir orientações sanitárias atuais para o itinerário.',
    checklist: [{ group: 'Documentos', items: [
      tip('passport', 'Conferir validade do passaporte e regras de trânsito das escalas.', '📘'),
      tip('kosovo-stay', 'Contar até 90 dias em 180 no Kosovo, separadamente de Schengen.', '🛂'),
      tip('kosovo-address', 'Preparar endereço da hospedagem para declaração em até três dias da entrada.', '🧾'),
      tip('kosovo-serbia', 'Confirmar se a rota com a Sérvia aceita os documentos da viagem.', '🧭')
    ] }],
    travelProfile: {
      moneyTips: [tip('cash', 'Levar euros e algum dinheiro para pequenas compras fora de Pristina.', '💶')],
      healthTips: [tip('health', 'Conferir cobertura médica e condições de trilha nas montanhas.', '💊')],
      connectivityTips: [tip('roaming', 'Verificar roaming: Kosovo pode não estar incluído em pacotes da União Europeia.', '📱')],
      transportTips: [tip('airport', 'Comparar conexões até PRN e reservar transporte do aeroporto.', '✈️'), tip('intercity', 'Checar horários de ônibus para Prizren e Peja; frequências diminuem à noite.', '🚌')],
      packingTips: [tip('adapter', 'Levar adaptador para tomadas C/F de 230V.', '🔌')],
      seasonalTips: [
        { id: 'warm', months: [4, 5, 6, 7, 8, 9, 10], group: 'Bagagem e clima', items: [tip('trail', 'Levar calçado de trilha e camada leve para noites nas montanhas.', '🥾')] },
        { id: 'cold', months: [11, 12, 1, 2, 3], group: 'Bagagem e clima', items: [tip('snow', 'Levar roupa térmica e verificar neve e acesso a passes de montanha.', '🧥')] }
      ]
    },
    dataLevel: 'curated'
  },
  Taiwan: {
    capital: 'Taipé', currency: 'Novo dólar taiwanês (TWD)', currencyCode: 'TWD', symbol: 'NT$',
    lang: 'mandarim; taiwanês (hokkien) e hakka também presentes',
    timezoneLabel: 'UTC+8', voltage: '110V · tipos A/B',
    bestTime: 'Outubro–abril favorece cidades e trilhas com menos calor; junho–outubro exige atenção a tufões e chuva intensa.',
    months: [2, 2, 2, 2, 1, 0, 0, 0, 1, 2, 2, 2],
    airport: 'TPE', airportCity: 'Taipé', majorAirports: ['TPE', 'TSA', 'KHH'],
    flightNote: 'Taoyuan (TPE) é a porta principal; Songshan (TSA) e Kaohsiung (KHH) atendem rotas regionais. Do Brasil, confira conexões e vistos de trânsito.',
    foods: [
      { e: '🍽️', name: 'Beef noodle soup', desc: 'Sopa de macarrão com carne bovina, muito comum em Taipé.' },
      { e: '🍽️', name: 'Gua bao', desc: 'Pão macio recheado com carne suína, verduras e amendoim.' },
      { e: '🍽️', name: 'Xiao long bao', desc: 'Bolinhos cozidos no vapor com caldo no recheio.' }
    ],
    etiquette: [
      { e: '🤝', t: 'Forme fila no metrô e deixe passageiros saírem antes de entrar; mantenha baixo o volume de voz.' },
      { e: '💶', t: 'Gorjeta não é costume na maioria dos restaurantes; alguns estabelecimentos já cobram taxa de serviço.' },
      { e: '🗣️', t: 'Mandarim é predominante; tenha nomes e endereços em caracteres chineses para táxis e lojas pequenas.' },
      { e: 'ℹ️', t: 'No metrô de Taipé, não coma nem beba nas áreas sinalizadas; use o EasyCard para transportes e lojas.' }
    ],
    entryRequirements: {
      visaPolicyBR: 'Passaporte brasileiro comum não consta da lista de isenção de visto; solicite visto de visitante antes da viagem.',
      modality: 'visa', maxStay: 'Conforme o visto concedido (categorias de 14, 30, 60 ou 90 dias); não presumir 90 dias automáticos.',
      passportValidity: 'Passaporte com pelo menos seis meses de validade para o pedido de visto de visitante.',
      documents: 'Formulário, duas fotos, passagem de saída e comprovantes da finalidade; consulte a missão consular para itens adicionais.',
      health: 'Conferir recomendações sanitárias atuais conforme origem, conexões e roteiro.',
      officialSource: taiwanSource, verifiedAt: '2026-09', status: 'verified'
    },
    healthSource: 'https://www.cdc.gov.tw/En',
    entryDeclaration: 'Preencher gratuitamente o Taiwan Arrival Card (TWAC) no portal oficial nos sete dias anteriores à chegada.',
    visaPolicyBR: { eligibility: 'visa-required', detail: 'Visto de visitante antes da viagem para passaporte brasileiro comum; eVisa não é opção turística geral.', verifiedOn: '2026-09', source: taiwanSource },
    visa: 'req', visaText: 'Visto de visitante prévio para turismo com passaporte brasileiro comum.',
    borderStatus: 'warn', borderNote: 'Solicitar visto de visitante antes do embarque; conferir elegibilidade e regras de trânsito.',
    passport: 'Passaporte válido por pelo menos seis meses.',
    vaccines: 'Conferir recomendações sanitárias atuais para a rota.',
    checklist: [{ group: 'Documentos', items: [
      tip('passport', 'Passaporte com pelo menos seis meses de validade.', '📘'),
      tip('visa', 'Solicitar visto de visitante na missão competente antes de comprar o trecho final.', '🛂'),
      tip('ticket', 'Separar passagem de saída, hospedagem e documentos da finalidade da viagem.', '🧾'),
      tip('arrival-card', 'Preencher o Taiwan Arrival Card (TWAC) gratuito nos sete dias antes da chegada.', '📱')
    ] }],
    travelProfile: {
      moneyTips: [tip('cash', 'Levar alguns dólares taiwaneses para mercados noturnos e lojas menores.', '💰')],
      healthTips: [tip('heat', 'Levar proteção solar e hidratação; atenção a calor e umidade no verão.', '💊')],
      connectivityTips: [tip('esim', 'Providenciar eSIM ou chip local e salvar destinos em caracteres chineses.', '📱')],
      transportTips: [tip('arrival', 'Planejar trem ou ônibus do aeroporto TPE até Taipé.', '✈️'), tip('rail', 'Reservar trem de alta velocidade para a costa oeste em feriados.', '🚄')],
      packingTips: [tip('adapter', 'Levar adaptador A/B e verificar compatibilidade dos aparelhos com 110V.', '🔌')],
      seasonalTips: [
        { id: 'cool', months: [11, 12, 1, 2, 3, 4], group: 'Bagagem e clima', items: [tip('layers', 'Levar camada leve e impermeável para norte úmido e áreas altas.', '🌧️')] },
        { id: 'typhoon', months: [5, 6, 7, 8, 9, 10], group: 'Bagagem e clima', items: [tip('storm', 'Acompanhar alertas de tufão e reservar margem para trens e voos.', '🌀')] }
      ]
    },
    dataLevel: 'curated'
  }
});
