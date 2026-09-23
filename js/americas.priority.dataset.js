// Complementos editoriais para seis destinos americanos. Regras de fronteira
// foram consultadas em fontes oficiais em 2026-09 e exigem reconfirmação pré-viagem.
const entry = (visaPolicyBR, maxStay, passportValidity, documents, health, officialSource, status = 'verified') => ({
  visaPolicyBR, maxStay, passportValidity, documents, health,
  officialSource, verifiedAt: '2026-09', status
});
const item = (icon, label) => ({ icon, label });
const group = (name, items) => ({ group: name, items });

export const AMERICAS_PRIORITY_ENRICHMENT = Object.freeze({
  Mexico: {
    capital: 'Cidade do México', currency: 'Peso mexicano (MXN)', symbol: 'MX$', lang: 'espanhol; dezenas de línguas indígenas reconhecidas',
    timezoneLabel: 'UTC−8 a UTC−5, conforme região e horário local', voltage: '127V · tipos A/B',
    bestTime: 'Novembro a abril é mais seco no centro; praias e sul variam por região e temporada de furacões.',
    airport: 'MEX', airportCity: 'Cidade do México', majorAirports: ['MEX', 'CUN', 'GDL'],
    flightNote: 'MEX serve a capital; CUN é a porta para Cancún/Riviera Maya e GDL para Guadalajara. Verifique visto também em conexões pelo México.',
    borderStatus: 'open', borderNote: 'Entrada sujeita à decisão da imigração; visto eletrônico é opção para brasileiros que chegam por via aérea.',
    visa: 'req', visaText: 'Brasileiros precisam de visto; e-visa disponível para entrada aérea desde 5/2/2026. Entrada terrestre ou marítima exige visto consular, salvo isenção aplicável.',
    passport: 'Passaporte válido durante toda a viagem; confirme condições da companhia e do trânsito.',
    vaccines: 'A embaixada mexicana informa que não há certificado de vacina exigido de forma geral; reavalie seu itinerário.',
    entryRequirements: entry('Visto obrigatório para passaporte brasileiro comum, com e-visa para chegada aérea e entrada única; isenções documentais podem existir.', 'Até 180 dias, conforme decisão migratória e modalidade autorizada.', 'Passaporte válido, cobrindo a estadia.', 'Leve passagem de saída, hospedagem e roteiro; a imigração pode pedir comprovações.', 'Sem vacina geral exigida segundo a embaixada; seguro viagem recomendado.', 'https://embamex.sre.gob.mx/brasil/index.php/servicios-consulares/visas'),
    foods: [
      { e: '🌮', name: 'Tacos', desc: 'Tortilhas com recheios regionais; observe salsas e pimenta antes de adicionar.' },
      { e: '🫔', name: 'Tamales', desc: 'Massa de milho cozida em folha, com variações doces e salgadas.' },
      { e: '🍫', name: 'Mole poblano', desc: 'Molho complexo, muitas vezes servido com aves; pergunte sobre ingredientes e alergias.' }
    ],
    etiquette: [
      { e: '🤝', t: 'Cumprimente antes de pedir ajuda; o espanhol cortês abre portas, e idiomas indígenas variam por região.' },
      { e: '💵', t: 'Gorjeta em restaurantes é comum quando o serviço não está incluído; confira a conta antes de pagar.' },
      { e: '🏛️', t: 'Em sítios arqueológicos, respeite áreas fechadas e regras para fotografia ou uso de drone.' }
    ],
    checklist: [
      group('Documentos', [item('📘', 'Passaporte válido e e-visa aprovada ou isenção/visto consular aplicável'), item('🎫', 'Passagem de saída, reserva de hospedagem e roteiro')]),
      group('Dinheiro e conexão', [item('💱', 'Pesos mexicanos e cartão habilitado; verifique tarifas de saque'), item('📱', 'Mapa offline e dados móveis antes dos deslocamentos')]),
      group('Transporte e mala', [item('🚕', 'Planejar traslado de MEX, CUN ou GDL até o destino'), item('🔌', 'Adaptador tipos A/B e checagem de aparelhos em 127V')])
    ], dataLevel: 'curated'
  },
  Cuba: {
    currencyCode: 'CUP', currency: 'Peso cubano (CUP)', symbol: 'CUP', timezoneLabel: 'UTC−5/−4', voltage: '110V/220V · tipos A/B/C/L, conforme hospedagem',
    bestTime: 'Novembro a abril costuma ser mais seco; junho a novembro coincide com a temporada de furacões no Caribe.',
    airport: 'HAV', airportCity: 'Havana', majorAirports: ['HAV', 'VRA', 'SNU'],
    flightNote: 'HAV é a chegada para Havana; VRA atende Varadero e SNU o centro da ilha. Confirme vistos e conexões antes de emitir.',
    borderStatus: 'open', borderNote: 'Visto de turismo, formulário DViajeros e documentação sanitária são exigidos.',
    visa: 'req', visaText: 'Visto de turismo obrigatório para brasileiros; solicitação eletrônica disponível em evisacuba.cu.',
    passport: 'Válido por ao menos 6 meses desde a entrada.',
    vaccines: 'Viajantes procedentes do Brasil devem apresentar comprovante de vacinação contra febre amarela.',
    entryDeclaration: 'Preencher DViajeros antes do embarque e apresentar o QR code.',
    entryRequirements: entry('Visto turístico obrigatório; pode ser solicitado eletronicamente.', 'Até 90 dias, com possibilidade de prorrogação por mais 90 mediante autorização local.', 'Mínimo de 6 meses desde a data de entrada.', 'Passagem de ida e volta, QR code do DViajeros e seguro com cobertura médica.', 'Comprovante de vacina contra febre amarela para quem vem do Brasil; seguro médico obrigatório.', 'https://www.cuba.travel/en/useful-information/regulations-and-formalities'),
    healthSource: 'https://www.gov.br/mre/pt-br/embaixada-havana/consular-1/recomendacoes-a-turistas-e-visitantes-brasileiros',
    foods: [
      { e: '🍚', name: 'Moros y cristianos', desc: 'Arroz com feijão preto, acompanhamento frequente.' },
      { e: '🍖', name: 'Ropa vieja', desc: 'Carne desfiada com molho de tomate e pimentões.' },
      { e: '🍌', name: 'Tostones', desc: 'Banana-da-terra frita, servida como acompanhamento.' }
    ],
    etiquette: [
      { e: '💵', t: 'Leve dinheiro em espécie; cartões podem falhar ou não ser aceitos, especialmente os vinculados a bancos dos EUA.' },
      { e: '📱', t: 'Internet e energia podem ser intermitentes; salve reservas, endereço e mapa offline.' },
      { e: '📷', t: 'Peça permissão antes de fotografar pessoas e respeite restrições em instalações oficiais.' }
    ],
    checklist: [
      group('Documentos e saúde', [item('📘', 'Passaporte com 6 meses, e-visa e passagem de volta'), item('📲', 'QR code DViajeros salvo offline'), item('💉', 'Certificado internacional de vacina contra febre amarela'), item('🛡️', 'Seguro de viagem com cobertura médica')]),
      group('Dinheiro e comunicação', [item('💶', 'Dinheiro em espécie e confirmação prévia do uso do cartão'), item('🗺️', 'Mapas, reservas e contatos offline')]),
      group('Transporte e mala', [item('🚕', 'Traslado do aeroporto HAV reservado ou combinado'), item('🔌', 'Conferir tensão e tipo de tomada da hospedagem')])
    ], dataLevel: 'curated'
  },
  Haiti: {
    capital: 'Porto Príncipe', currency: 'Gourde haitiano (HTG)', symbol: 'G', lang: 'crioulo haitiano e francês',
    timezoneLabel: 'UTC−5/−4', voltage: '110V · tipos A/B',
    bestTime: 'Dezembro a março tende a ser mais seco, mas a situação de segurança deve determinar qualquer planejamento.',
    airport: 'PAP', airportCity: 'Porto Príncipe', majorAirports: ['PAP', 'CAP'],
    flightNote: 'PAP e CAP são as principais entradas aéreas; voos, acesso terrestre e segurança podem mudar rapidamente.',
    borderStatus: 'warn', borderNote: 'Alerta elevado de segurança: autoridades estrangeiras desaconselham toda viagem; confirme condições locais e voos antes de qualquer plano.',
    visa: 'free', visaText: 'Embaixada haitiana lista brasileiros fora dos países que exigem visto turístico; admissão e prazo são decididos na chegada.',
    passport: 'Mínimo de 6 meses de validade.', vaccines: 'Confira recomendações sanitárias e exigências de trânsito antes de viajar.',
    entryRequirements: entry('Turismo sem visto prévio para brasileiro, segundo lista da embaixada; confirmar antes do embarque.', 'Prazo concedido pela imigração na chegada; fonte consultada não fixa um máximo para brasileiros.', 'Pelo menos 6 meses de validade.', 'Tenha passagem de saída, endereço de hospedagem e meios de subsistência; confirme taxa de chegada.', 'Seguro médico e de evacuação fortemente recomendado; riscos sanitários exigem orientação individual.', 'https://www.haiti.org/tourist-visa/', 'needs-review'),
    foods: [
      { e: '🍚', name: 'Diri ak djon djon', desc: 'Arroz com cogumelos negros, típico da culinária haitiana.' },
      { e: '🥘', name: 'Griot', desc: 'Porco marinado e frito, frequentemente com pikliz.' },
      { e: '🥬', name: 'Pikliz', desc: 'Conserva apimentada de legumes; prove aos poucos.' }
    ],
    etiquette: [
      { e: '🗣️', t: 'O crioulo haitiano é a língua cotidiana; o francês também é oficial. Pergunte antes de fotografar pessoas.' },
      { e: '⚠️', t: 'Não improvise trajetos nem deslocamentos noturnos; a segurança deve ser avaliada com fontes atuais e apoio local confiável.' },
      { e: '💵', t: 'Dinheiro vivo pode ser necessário; organize pequenos valores e evite exposição pública de objetos de valor.' }
    ],
    checklist: [
      group('Segurança e documentos', [item('⚠️', 'Reavaliar a necessidade da viagem diante do alerta de segurança'), item('📘', 'Passaporte com 6 meses e confirmação consular de entrada'), item('🛡️', 'Seguro médico/evacuação com cobertura efetiva')]),
      group('Logística', [item('✈️', 'Confirmar operação do aeroporto e itinerário sem conexões inseguras'), item('🚗', 'Planejar deslocamentos apenas com apoio local confiável'), item('📱', 'Compartilhar itinerário e contatos de emergência')])
    ], dataLevel: 'curated'
  },
  'Dominican Rep.': {
    capital: 'Santo Domingo', currency: 'Peso dominicano (DOP)', symbol: 'RD$', timezoneLabel: 'UTC−4', voltage: '110V · tipos A/B',
    bestTime: 'Dezembro a abril costuma ser mais seco; monitore a temporada de furacões de junho a novembro.',
    airport: 'PUJ', airportCity: 'Punta Cana', majorAirports: ['PUJ', 'SDQ', 'STI'],
    flightNote: 'PUJ é prático para Punta Cana; SDQ serve Santo Domingo e STI o norte interior. Compare tempo de transfer.',
    borderStatus: 'open', borderNote: 'Turismo de curta duração sem visto para brasileiros; e-ticket obrigatório nas viagens comerciais.',
    visa: 'free', visaText: 'Brasileiros dispensados de visto turístico de curta duração; estadias acima do período inicial exigem atenção às taxas e à prorrogação.',
    passport: 'Exceção até 31/12/2026: válido durante toda a estadia e na saída para brasileiros em turismo.',
    vaccines: 'Verifique orientações sanitárias conforme origem e conexões; seguro viagem recomendado.',
    entryDeclaration: 'E-ticket gratuito de entrada e de saída no portal oficial.',
    entryRequirements: entry('Turismo sem visto para brasileiros; autorização final cabe à imigração.', 'Período turístico inicial de 30 dias; extensão e taxas dependem da duração.', 'Válido durante a estadia e a saída para brasileiros turistas, por exceção vigente até 31/12/2026.', 'Bilhete de ida e volta, endereço local, recursos e e-ticket gratuito.', 'Confira exigências sanitárias de seu itinerário; seguro recomendado.', 'https://www.godominicanrepublic.com/travel/entry-requirements'),
    foods: [
      { e: '🍲', name: 'Sancocho', desc: 'Ensopado farto de carnes e tubérculos.' },
      { e: '🍚', name: 'La bandera', desc: 'Arroz, feijão e carne, refeição cotidiana.' },
      { e: '🍌', name: 'Mangú', desc: 'Purê de banana-da-terra verde, comum no café da manhã.' }
    ],
    etiquette: [
      { e: '🤝', t: 'Saudações calorosas e conversa breve antes de negociar serviços são comuns.' },
      { e: '💵', t: 'Confira se serviço já está incluído na conta; gorjeta extra é discricionária.' },
      { e: '🌦️', t: 'Fora dos resorts, planeje deslocamento e dinheiro local; acompanhe alertas climáticos na temporada de furacões.' }
    ],
    checklist: [
      group('Documentos', [item('📘', 'Passaporte válido para toda a viagem e passagem de volta'), item('📲', 'E-ticket gratuito para entrada e saída'), item('🏨', 'Endereço da hospedagem e comprovantes')]),
      group('Dinheiro e transporte', [item('💱', 'Pesos dominicanos e cartão habilitado'), item('🚕', 'Confirmar traslado do aeroporto PUJ, SDQ ou STI')]),
      group('Mala', [item('🌀', 'Acompanhar avisos de tempestade na temporada de furacões'), item('🔌', 'Adaptador A/B e aparelhos compatíveis com 110V')])
    ], dataLevel: 'curated'
  },
  Bahamas: {
    currency: 'Dólar bahamense (BSD)', symbol: 'B$', timezoneLabel: 'UTC−5/−4', voltage: '120V · tipos A/B',
    bestTime: 'Dezembro a abril tende a ser mais seco; junho a novembro é a temporada de furacões.',
    airport: 'NAS', airportCity: 'Nassau', majorAirports: ['NAS', 'FPO', 'GGT'],
    flightNote: 'NAS é o principal portão de entrada; FPO e GGT servem outras ilhas. Reserve margem em conexões interilhas.',
    borderStatus: 'open', borderNote: 'Brasileiros podem visitar sem visto por menos de três meses; imigração confirma a duração da estada.',
    visa: 'free', visaText: 'Sem visto para brasileiro em visita inferior a três meses, segundo turismo oficial das Bahamas.',
    passport: 'Planeje 6 meses de validade na entrada; a página oficial em português diverge da versão inglesa, confirme com imigração/companhia.',
    vaccines: 'Certificado de febre amarela exigido de viajantes vindos do Brasil segundo turismo oficial.',
    entryRequirements: entry('Isenção de visto para visita inferior a três meses.', 'Menos de 3 meses sem visto; duração autorizada pela imigração.', 'Planeje pelo menos 6 meses de validade; páginas oficiais em idiomas diferentes divergem.', 'Passagem de saída, endereço da hospedagem e prova de recursos se solicitada.', 'Certificado de febre amarela para quem chega do Brasil, conforme turismo oficial.', 'https://www.bahamas.com/plan-your-trip/island-faq/visa-immigration', 'needs-review'),
    healthSource: 'https://www.bahamas.com/pt/plan-your-trip/island-faq/visa-immigration',
    foods: [
      { e: '🐚', name: 'Conch salad', desc: 'Salada cítrica de molusco conch; confirme alergias a frutos do mar.' },
      { e: '🍘', name: 'Conch fritters', desc: 'Bolinhos fritos populares em bares e mercados.' },
      { e: '🍚', name: 'Peas and rice', desc: 'Arroz com feijão-de-corda, acompanhamento frequente.' }
    ],
    etiquette: [
      { e: '🌊', t: 'Respeite áreas marinhas protegidas; não toque corais nem alimente a fauna.' },
      { e: '💵', t: 'Veja se a taxa de serviço está na conta antes de acrescentar gorjeta.' },
      { e: '🚤', t: 'Ferries e voos entre ilhas têm horários próprios; reserve folga entre conexões.' }
    ],
    checklist: [
      group('Documentos e saúde', [item('📘', 'Passaporte: confirmar validade com a imigração/companhia; planejar 6 meses'), item('🎫', 'Bilhete de saída e reserva de hospedagem'), item('💉', 'Certificado de febre amarela para chegada do Brasil')]),
      group('Ilhas e dinheiro', [item('💳', 'Cartão habilitado e dinheiro para despesas em ilhas menores'), item('⛴️', 'Reservar transfers/ferries entre ilhas com margem para conexões')]),
      group('Mala', [item('🌀', 'Monitorar tempestades na temporada de furacões'), item('🔌', 'Adaptador A/B e proteção solar')])
    ], dataLevel: 'curated'
  },
  Jamaica: {
    currency: 'Dólar jamaicano (JMD)', symbol: 'J$', timezoneLabel: 'UTC−5 o ano todo', voltage: '110V · tipos A/B',
    bestTime: 'Dezembro a abril é mais seco; junho a novembro exige monitorar alertas de furacão.',
    airport: 'MBJ', airportCity: 'Montego Bay', majorAirports: ['MBJ', 'KIN'],
    flightNote: 'MBJ atende Montego Bay e costa norte; KIN é mais útil para Kingston e sudeste.',
    borderStatus: 'open', borderNote: 'Brasileiros dispensados de visto para visita de até 90 dias; formulário C5 de imigração/alfândega.',
    visa: 'free', visaText: 'Sem visto para brasileiros por até 90 dias, conforme agência jamaicana de imigração.',
    passport: 'Passaporte válido; confirme margem de validade exigida pela companhia ou conexão.',
    vaccines: 'Confira exigências sanitárias para origem e trânsito antes da viagem.',
    entryDeclaration: 'Preencher o formulário de imigração e alfândega C5 online ou em papel.',
    entryRequirements: entry('Sem visto para brasileiros por até 90 dias.', 'Até 90 dias.', 'Passaporte válido; confirmar validade adicional com a companhia conforme trânsito.', 'Bilhete de saída e formulário C5 de imigração/alfândega.', 'Verifique orientações de saúde e eventuais requisitos da rota; seguro recomendado.', 'https://www.pica.gov.jm/node/101'),
    foods: [
      { e: '🍗', name: 'Jerk chicken', desc: 'Frango com marinada picante assado ou defumado.' },
      { e: '🐟', name: 'Ackee and saltfish', desc: 'Prato nacional com fruta ackee e bacalhau salgado.' },
      { e: '🥟', name: 'Jamaican patty', desc: 'Pastel assado de massa amarela, com recheios variados.' }
    ],
    etiquette: [
      { e: '🗣️', t: 'Inglês é oficial e o patois é amplamente falado; escute com respeito e evite imitar sotaques.' },
      { e: '💵', t: 'Confirme taxa de serviço no restaurante e preço do transporte antes de iniciar o trajeto.' },
      { e: '🎶', t: 'Peça permissão para fotografar artistas ou moradores; em eventos, respeite o espaço local.' }
    ],
    checklist: [
      group('Documentos', [item('📘', 'Passaporte válido e bilhete de saída'), item('📲', 'Formulário C5 preenchido e comprovante salvo')]),
      group('Dinheiro e transporte', [item('💱', 'Dólares jamaicanos e cartão habilitado'), item('🚕', 'Definir traslado de MBJ ou KIN antes da chegada')]),
      group('Mala e conexão', [item('🌀', 'Monitorar alertas de furacão na estação'), item('📱', 'Mapa offline e contatos da hospedagem'), item('🔌', 'Adaptador A/B')])
    ], dataLevel: 'curated'
  }
});
