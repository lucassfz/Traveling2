/**
 * Central America travel content for Brazilian passport holders.
 *
 * Entry rules were reviewed on 2026-08-21 against the linked migration or
 * diplomatic authorities. They remain a pre-trip reference only: transport
 * carriers and border officers make the final admissibility decision.
 * BRL exchange rates are indicative interbank baselines (no spread or fees).
 */

const RATE_AS_OF = '2026-08-21';
const BRL_TO_USD = 0.1926;

export const CENTRAL_AMERICA_DATA = Object.freeze({
  Guatemala: {
    id: 'GT',
    name: 'Guatemala',
    continent: 'América Central',
    overview: {
      capital: 'Cidade da Guatemala',
      currency: 'Quetzal guatemalteco (GTQ)',
      currencySymbol: 'Q',
      brlExchangeRate: 1.4717,
      languages: ['Espanhol'],
      timezones: ['UTC−06:00'],
      voltage: '120V · Tipo A / B',
      countryCode: 'GT',
      bestTimeToVisit: 'Novembro a abril costuma trazer menos chuva; maio a outubro é verde, mas com pancadas mais frequentes.'
    },
    entryRequirements: {
      visaPolicyBR: 'Isento de visto (categoria A) para turismo com passaporte brasileiro; confirme o prazo concedido na entrada.',
      passportValidity: 'Passaporte válido e em bom estado; a imigração pode solicitar comprovação de recursos, hospedagem e saída do país.',
      mandatoryVaccines: ['Certificado Internacional de Vacinação contra Febre Amarela (CIVP) pode ser exigido a viajantes provenientes do Brasil.'],
      declarationForms: 'Apresente o documento de viagem, endereço de hospedagem e bilhete de saída quando solicitados pela imigração.'
    },
    cultureAndEtiquette: {
      localNuances: '“Chapín/chapina” é uma forma local de se referir a guatemaltecos. Em um primeiro contato, “buenos días” e “usted” são escolhas seguras; acompanhe o uso de “vos” se a conversa ficar informal.',
      socialNorms: 'Cumprimentos formais e respeito à herança maia são valorizados. Peça permissão antes de fotografar pessoas, cerimônias, tecidos ou mercados tradicionais.',
      tippingEtiquette: 'Em restaurantes, 10% é uma referência comum quando a taxa de serviço não estiver incluída; confira a conta antes de duplicar a gorjeta.',
      diningAndPayments: 'Cartões funcionam melhor na capital e em destinos consolidados. Leve quetzales em notas pequenas para mercados, transporte local e áreas rurais.',
      safetyAndCommunication: 'Em Cidade da Guatemala use táxi ou transfer identificado à noite; para lagos, trilhas e áreas indígenas, contrate guias locais e planeje os deslocamentos com luz do dia.'
    },
    countryChecklist: ['Passaporte válido e cópias digitais', 'Comprovantes de hospedagem, recursos e saída do país', 'CIVP contra Febre Amarela, se aplicável', 'Adaptador Tipo A / B e capa de chuva leve'],
    landmarks: [{
      name: 'Parque Nacional Tikal',
      city: 'Flores',
      imageUrl: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=82'
    }]
  },
  Belize: {
    id: 'BZ',
    name: 'Belize',
    continent: 'América Central',
    overview: {
      capital: 'Belmopan',
      currency: 'Dólar belizenho (BZD)',
      currencySymbol: 'BZ$',
      brlExchangeRate: 0.3852,
      languages: ['Inglês', 'Espanhol', 'Crioulo belizenho'],
      timezones: ['UTC−06:00'],
      voltage: '110–240V · Tipo A / B / G',
      countryCode: 'BZ',
      bestTimeToVisit: 'Dezembro a maio é, em geral, o período mais seco para ilhas, mergulho e praias; a temporada de furacões vai de junho a novembro.'
    },
    entryRequirements: {
      visaPolicyBR: 'Isento de visto para turismo com passaporte brasileiro válido; confirme o período de permanência e documentos financeiros antes da partida.',
      passportValidity: 'Passaporte válido durante toda a viagem; leve comprovantes de acomodação, recursos e passagem de retorno ou continuação.',
      mandatoryVaccines: ['CIVP contra Febre Amarela pode ser exigido de viajantes provenientes do Brasil.'],
      declarationForms: 'Formulários migratórios e declaração aduaneira são fornecidos no processo de chegada; declare bens sujeitos a controle.'
    },
    cultureAndEtiquette: {
      localNuances: 'O inglês é oficial e o Kriol é amplamente ouvido no dia a dia; uma abordagem simples e cordial funciona bem. A cultura reúne tradições Kriol, maias, garífunas, mestizas e outras comunidades.',
      socialNorms: 'Cumprimente antes de fazer um pedido e trate comunidades e sítios arqueológicos com respeito. Reserve guias licenciados para conhecer a história local sem invadir espaços comunitários.',
      tippingEtiquette: 'Gorjeta de 10% a 15% é habitual quando não estiver incluída na conta; em ilhas e passeios, confirme se a taxa de serviço já está no pacote.',
      diningAndPayments: 'Estabelecimentos turísticos aceitam cartão, mas leve dólares belizenhos em notas pequenas para táxis, mercados e ilhas menores; confirme a moeda antes de concordar com o preço.',
      safetyAndCommunication: 'Use táxis licenciados à noite e siga recomendações locais para passeios marítimos, mergulho e áreas isoladas. Cheque o clima e a operadora antes de sair para o recife.'
    },
    countryChecklist: ['Passaporte válido', 'Comprovantes de retorno, hospedagem e recursos', 'CIVP contra Febre Amarela, se aplicável', 'Adaptador Tipo A / B / G', 'Seguro com cobertura para mergulho, se necessário'],
    landmarks: [{
      name: 'Great Blue Hole',
      city: 'Lighthouse Reef',
      imageUrl: 'https://images.unsplash.com/photo-1544550285-f813152fb2fd?auto=format&fit=crop&w=1200&q=82'
    }]
  },
  'El Salvador': {
    id: 'SV',
    name: 'El Salvador',
    continent: 'América Central',
    overview: {
      capital: 'San Salvador',
      currency: 'Dólar dos Estados Unidos (USD)',
      currencySymbol: 'US$',
      brlExchangeRate: BRL_TO_USD,
      languages: ['Espanhol'],
      timezones: ['UTC−06:00'],
      voltage: '115V · Tipo A / B',
      countryCode: 'SV',
      bestTimeToVisit: 'Novembro a abril é a estação mais seca; entre maio e outubro, espere calor e chuva, especialmente à tarde.'
    },
    entryRequirements: {
      visaPolicyBR: 'Brasileiros com passaporte comum constam na categoria isenta de visto; a permanência turística integra as regras da região CA-4.',
      passportValidity: 'Passaporte válido e em bom estado; confirme o saldo de dias da permanência CA-4 caso visite também Guatemala, Honduras ou Nicarágua.',
      mandatoryVaccines: ['CIVP contra Febre Amarela pode ser exigido de viajantes provenientes de área de risco, incluindo o Brasil.'],
      declarationForms: 'Preencha as informações migratórias solicitadas na chegada e mantenha o comprovante de entrada durante a estadia.'
    },
    cultureAndEtiquette: {
      localNuances: '“Puchica” é uma expressão coloquial; escute o contexto antes de adotá-la. Entre amigos o “vos” é comum; “usted” mantém um tom mais formal e é preferível no primeiro contato.',
      socialNorms: 'Use tratamento cordial e evite reduzir o país a temas de segurança. Surf, café, pupusas e hospitalidade local são boas portas de conversa; em pupuserías, o atendimento costuma ser simples e direto.',
      tippingEtiquette: 'Entre 10% e 15% é usual em restaurantes quando a taxa não estiver incluída. Em pequenos comércios de comida, gorjeta não é uma expectativa automática.',
      diningAndPayments: 'O dólar americano circula; prefira notas pequenas e confirme o troco antes de sair. Cartão é mais prático em zonas urbanas e hotéis do que em vilas de praia ou barracas locais.',
      safetyAndCommunication: 'Prefira deslocamentos agendados, mantenha atenção em zonas urbanas e acompanhe recomendações de guias locais em vulcões e praias. Evite caminhar isolado à noite em áreas desconhecidas.'
    },
    countryChecklist: ['Passaporte válido', 'Comprovação de saída e hospedagem', 'CIVP contra Febre Amarela, se aplicável', 'Dólares em notas pequenas', 'Seguro para atividades de vulcão ou surf'],
    landmarks: [{
      name: 'Parque Nacional El Boquerón',
      city: 'Santa Tecla',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=82'
    }]
  },
  Honduras: {
    id: 'HN',
    name: 'Honduras',
    continent: 'América Central',
    overview: {
      capital: 'Tegucigalpa',
      currency: 'Lempira hondurenha (HNL)',
      currencySymbol: 'L',
      brlExchangeRate: 5.178,
      languages: ['Espanhol'],
      timezones: ['UTC−06:00'],
      voltage: '110V · Tipo A / B',
      countryCode: 'HN',
      bestTimeToVisit: 'Fevereiro a maio tende a ser mais seco em boa parte do país; clima e condição marítima variam nas Ilhas da Baía.'
    },
    entryRequirements: {
      visaPolicyBR: 'Isento de visto para turismo com passaporte brasileiro; a estadia turística pode chegar a 90 dias, sujeita às regras CA-4 e à decisão migratória.',
      passportValidity: 'Passaporte válido por pelo menos 6 meses, conforme orientação do Instituto Nacional de Migração de Honduras.',
      mandatoryVaccines: ['CIVP contra Febre Amarela é exigido de viajantes provenientes do Brasil.'],
      declarationForms: 'A declaração de bagagem é entregue na entrada; declare os artigos indicados pelo formulário aduaneiro.'
    },
    cultureAndEtiquette: {
      localNuances: '“Vos” é comum entre pares; com pessoas mais velhas ou em atendimento, “usted” é uma escolha respeitosa. Um cumprimento antes de perguntar preço ou direção é bem recebido.',
      socialNorms: 'Negocie passeios apenas com operadores estabelecidos, sobretudo em áreas costeiras. Em comunidades garífunas e sítios maias, respeite regras de fotografia, música e espaços locais.',
      tippingEtiquette: '10% é uma referência em restaurantes; confirme se a taxa de serviço já foi adicionada, especialmente em hotéis e operações de mergulho.',
      diningAndPayments: 'Leve lempiras em notas pequenas para mercados e deslocamentos do dia a dia. Cartão é mais aceito em hotéis e centros urbanos do que em pequenas ilhas ou vilas.',
      safetyAndCommunication: 'Evite áreas urbanas de risco, use transfers confiáveis e siga protocolos de mergulho e maré nas Ilhas da Baía. Combine preço e rota antes de entrar em táxi sem taxímetro.'
    },
    countryChecklist: ['Passaporte com 6 meses de validade', 'CIVP contra Febre Amarela', 'Comprovantes de saída, hospedagem e recursos', 'Adaptador Tipo A / B', 'Seguro com cobertura para mergulho'],
    landmarks: [{
      name: 'Sítio Arqueológico de Copán',
      city: 'Copán Ruinas',
      imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=82'
    }]
  },
  Nicaragua: {
    id: 'NI',
    name: 'Nicarágua',
    continent: 'América Central',
    overview: {
      capital: 'Manágua',
      currency: 'Córdoba nicaraguense (NIO)',
      currencySymbol: 'C$',
      brlExchangeRate: 7.055,
      languages: ['Espanhol'],
      timezones: ['UTC−06:00'],
      voltage: '120V · Tipo A / B',
      countryCode: 'NI',
      bestTimeToVisit: 'Novembro a abril costuma ser mais seco para cidades coloniais e vulcões; o Pacífico recebe mais chuva de maio a outubro.'
    },
    entryRequirements: {
      visaPolicyBR: 'Brasil consta na lista de livre visado da disposição migratória de 2026; confirme o prazo de estadia e requisitos operacionais antes de emitir a passagem.',
      passportValidity: 'Passaporte com mais de 6 meses de validade, conforme a Lei Geral de Migração e Estrangeiros.',
      mandatoryVaccines: ['CIVP contra Febre Amarela pode ser exigido de viajantes provenientes do Brasil.'],
      declarationForms: 'Preencha os dados de entrada solicitados pela autoridade migratória e mantenha comprovantes de viagem e hospedagem disponíveis.'
    },
    cultureAndEtiquette: {
      localNuances: 'O “vos” é frequente no espanhol nicaraguense cotidiano; comece por “usted” em atendimento ou situações formais e deixe a outra pessoa definir o grau de informalidade.',
      socialNorms: 'Em cidades coloniais, ritmo calmo e cumprimentos formais são comuns. Respeite áreas religiosas, mercados e orientações de comunidades locais, especialmente no Caribe e em reservas.',
      tippingEtiquette: '10% é adequado em restaurantes quando não houver cobrança de serviço; em bares e comércios pequenos, arredondar é mais natural do que aplicar uma regra fixa.',
      diningAndPayments: 'Córdobas são úteis para compras cotidianas; confirme previamente se preço e troco serão em córdoba ou dólar. Mantenha dinheiro separado e use caixas eletrônicos em locais movimentados.',
      safetyAndCommunication: 'Acompanhe avisos oficiais, use transporte formal e contrate guias credenciados para vulcões e reservas naturais. Evite deslocamentos noturnos longos entre cidades sem logística confirmada.'
    },
    countryChecklist: ['Passaporte com 6 meses de validade', 'Comprovantes de rota, hospedagem e recursos', 'CIVP contra Febre Amarela, se aplicável', 'Adaptador Tipo A / B', 'Calçado fechado para vulcões e trilhas'],
    landmarks: [{
      name: 'Catedral de León',
      city: 'León',
      imageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=82'
    }]
  },
  'Costa Rica': {
    id: 'CR',
    name: 'Costa Rica',
    continent: 'América Central',
    overview: {
      capital: 'San José',
      currency: 'Colón costarriquenho (CRC)',
      currencySymbol: '₡',
      brlExchangeRate: 88.054,
      languages: ['Espanhol'],
      timezones: ['UTC−06:00'],
      voltage: '120V · Tipo A / B',
      countryCode: 'CR',
      bestTimeToVisit: 'Dezembro a abril corresponde à estação mais seca em boa parte do país; Caribe e Pacífico têm microclimas próprios.'
    },
    entryRequirements: {
      visaPolicyBR: 'Isento de visto para turismo e negócios por até 90 dias com passaporte brasileiro válido.',
      passportValidity: 'Passaporte válido durante toda a estadia; leve comprovante de saída, hospedagem e recursos para a viagem.',
      mandatoryVaccines: ['CIVP contra Febre Amarela é exigido para viajantes provenientes do Brasil, salvo exceções oficiais.'],
      declarationForms: 'Use os formulários e declarações migratórias solicitados no percurso de chegada; guarde o comprovante de entrada.'
    },
    cultureAndEtiquette: {
      localNuances: '“Pura vida” serve como cumprimento, agradecimento e comentário positivo. “Mae” é bem informal; em um primeiro contato, “usted” continua uma forma cordial e muito comum no espanhol local.',
      socialNorms: 'A proteção à natureza é parte importante da etiqueta local: mantenha distância da fauna, use trilhas autorizadas e peça autorização antes de fotografar pessoas ou propriedades rurais.',
      tippingEtiquette: 'Restaurantes e hotéis normalmente incluem 10% de serviço e 13% de IVA na conta; gorjeta adicional é opcional.',
      diningAndPayments: 'Cartões são comuns, mas tenha colones para pequenos negócios e áreas rurais. Em parques e atividades de natureza, confirme se a entrada aceita cartão antes de sair.',
      safetyAndCommunication: 'Mantenha atenção a pertences em San José e siga instruções em praias de correnteza. Use guias credenciados e não alimente animais em parques e reservas.'
    },
    countryChecklist: ['CIVP contra Febre Amarela', 'Passaporte válido e comprovante de saída', 'Protetor solar e repelente biodegradável para parques nacionais', 'Adaptador Tipo A / B', 'Capa de chuva leve, mesmo na estação seca'],
    landmarks: [{
      name: 'Parque Nacional Manuel Antonio',
      city: 'Quepos',
      imageUrl: 'https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?auto=format&fit=crop&w=1200&q=82'
    }]
  },
  Panama: {
    id: 'PA',
    name: 'Panamá',
    continent: 'América Central',
    overview: {
      capital: 'Cidade do Panamá',
      currency: 'Balboa panamenho e Dólar dos Estados Unidos (PAB / USD)',
      currencySymbol: 'B/.',
      brlExchangeRate: BRL_TO_USD,
      languages: ['Espanhol'],
      timezones: ['UTC−05:00'],
      voltage: '120V · Tipo A / B',
      countryCode: 'PA',
      bestTimeToVisit: 'Dezembro a abril é a estação mais seca; de maio a novembro há mais chuva, com boa vegetação e menor movimento em alguns destinos.'
    },
    entryRequirements: {
      visaPolicyBR: 'Isento de visto para turismo com passaporte brasileiro por até 90 dias, renovável sem ultrapassar 180 dias por ano, conforme acordo bilateral.',
      passportValidity: 'Passaporte comum válido; confirme com a companhia aérea os requisitos documentais e de passagem de retorno.',
      mandatoryVaccines: ['CIVP contra Febre Amarela pode ser exigido de viajantes provenientes do Brasil.'],
      declarationForms: 'Preencha a declaração aduaneira e os formulários migratórios solicitados na chegada; mantenha comprovantes de saída e hospedagem.'
    },
    cultureAndEtiquette: {
      localNuances: 'Na Cidade do Panamá, espanhol é a regra e um “buenos días” abre bem a conversa. Gírias como “qué xopá” são informais; prefira registro neutro com desconhecidos.',
      socialNorms: 'A cidade tem ritmo cosmopolita, enquanto ilhas e interior pedem planejamento mais tranquilo. Peça autorização para fotografar comunidades indígenas e respeite regras de visita definidas pelos moradores.',
      tippingEtiquette: '10% a 15% é uma prática usual em restaurantes e serviços quando não houver taxa incluída; em hotéis, verifique primeiro se já consta cobrança de serviço.',
      diningAndPayments: 'O dólar americano circula junto ao balboa em moedas; leve notas pequenas para táxis e pequenos comércios. Cartões são amplamente aceitos na capital, mas não substituem dinheiro em ilhas.',
      safetyAndCommunication: 'Use táxis ou aplicativos identificados, proteja objetos em áreas turísticas e reserve operadores credenciados para ilhas e selva. Combine preço antes de saídas de barco ou táxi sem aplicativo.'
    },
    countryChecklist: ['Passaporte válido', 'Comprovantes de saída, hospedagem e recursos', 'CIVP contra Febre Amarela, se aplicável', 'Dólares em notas pequenas', 'Adaptador Tipo A / B'],
    landmarks: [{
      name: 'Eclusas de Miraflores',
      city: 'Cidade do Panamá',
      imageUrl: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=82'
    }]
  }
});

export const CENTRAL_AMERICA_SOURCES = Object.freeze({
  verifiedOn: '2026-08-21',
  entry: {
    Guatemala: 'https://www.minex.gob.gt/din/26-visas-para-extranjeros',
    Belize: 'https://concordia.itamaraty.gov.br/detalhamento-acordo/11688',
    'El Salvador': 'https://rree.gob.sv/visas-para-extranjeros/',
    Honduras: 'https://inm.gob.hn/visas.html',
    Nicaragua: 'https://www.canal4.com.ni/migracion-y-extranjeria-establece-nuevos-criterios-de-libre-visado-y-visa-consultada/',
    'Costa Rica': 'https://aplicacao.itamaraty.gov.br/ApiConcordia/Documento/download/15405',
    Panama: 'https://aplicacao.itamaraty.gov.br/ApiConcordia/Documento/download/10319'
  },
  exchange: {
    CostaRica: 'https://www.exchange-rates.org/pt/conversor/brl-crc',
    regional: 'https://www.dollarfx.org/Central-America',
    BRLUSD: 'https://www.bcb.gov.br/en/currencyconversion'
  }
});

const UI_META = Object.freeze({
  Guatemala: { airport: 'GUA', airportCity: 'Cidade da Guatemala', food: ['Pepián', 'prato de cozido aromático com tradição maia e espanhola'], vibe: ['Herança maia', 'Vulcões', 'Cidades coloniais'] },
  Belize: { airport: 'BZE', airportCity: 'Belize City', food: ['Rice and beans', 'clássico crioulo servido em mercados e restaurantes locais'], vibe: ['Recifes', 'Mergulho', 'Caribe'] },
  'El Salvador': { airport: 'SAL', airportCity: 'San Salvador', food: ['Pupusas', 'tortilhas recheadas, normalmente acompanhadas de curtido'], vibe: ['Surf', 'Vulcões', 'Café'] },
  Honduras: { airport: 'SAP', airportCity: 'San Pedro Sula', food: ['Baleadas', 'tortilhas de farinha recheadas com feijão, queijo e acompanhamentos'], vibe: ['Ruínas maias', 'Mergulho', 'Caribe'] },
  Nicaragua: { airport: 'MGA', airportCity: 'Manágua', food: ['Gallo pinto', 'arroz e feijão servidos no café da manhã e em refeições cotidianas'], vibe: ['Vulcões', 'Colonial', 'Lagos'] },
  'Costa Rica': { airport: 'SJO', airportCity: 'San José', food: ['Casado', 'prato com arroz, feijão, salada e proteína, popular no almoço'], vibe: ['Biodiversidade', 'Surf', 'Pura vida'] },
  Panama: { airport: 'PTY', airportCity: 'Cidade do Panamá', food: ['Sancocho', 'sopa de frango com raízes e ervas, muito presente na culinária panamenha'], vibe: ['Canal', 'Cosmopolita', 'Ilhas'] }
});

/** Adapter used by the existing country drawer and globe engine. */
export const CENTRAL_AMERICA_ENRICHMENT = Object.freeze(Object.fromEntries(
  Object.entries(CENTRAL_AMERICA_DATA).map(([key, data]) => {
    const meta = UI_META[key];
    const [foodName, foodDescription] = meta.food;
    return [key, {
      region: data.continent,
      currency: data.overview.currency,
      currencyCode: key === 'El Salvador' || key === 'Panama' ? 'USD' : data.overview.currency.match(/\(([A-Z]{3})\)/)?.[1],
      symbol: data.overview.currencySymbol,
      lang: data.overview.languages.join(' / '),
      timezoneLabel: data.overview.timezones.join(' · '),
      voltage: data.overview.voltage,
      bestTime: data.overview.bestTimeToVisit,
      borderStatus: 'open',
      borderNote: 'Referência para turismo brasileiro; confirme regras e documentos antes de embarcar.',
      visa: 'free',
      visaText: data.entryRequirements.visaPolicyBR,
      visaPolicyBR: {
        eligibility: 'visa-free',
        detail: data.entryRequirements.visaPolicyBR,
        verifiedOn: CENTRAL_AMERICA_SOURCES.verifiedOn,
        source: CENTRAL_AMERICA_SOURCES.entry[key]
      },
      passport: data.entryRequirements.passportValidity,
      vaccines: data.entryRequirements.mandatoryVaccines.join(' '),
      entryDeclaration: data.entryRequirements.declarationForms,
      foods: [{ e: '🍽️', name: foodName, desc: foodDescription, must: true }],
      etiquette: [
        { e: '🗣️', t: data.cultureAndEtiquette.localNuances },
        { e: '🤝', t: data.cultureAndEtiquette.socialNorms },
        { e: '💡', t: data.cultureAndEtiquette.tippingEtiquette },
        { e: '💳', t: data.cultureAndEtiquette.diningAndPayments },
        { e: '🛡️', t: data.cultureAndEtiquette.safetyAndCommunication }
      ],
      vibe: meta.vibe,
      checklist: [{
        group: 'Essenciais para este destino',
        items: data.countryChecklist.map((label, index) => ({ icon: ['📘', '🧾', '💉', '🔌', '🧳'][index] || '✓', label }))
      }],
      landmarks: data.landmarks.map(landmark => ({ ...landmark, country: data.name })),
      photos: data.landmarks.map(landmark => ({ url: landmark.imageUrl, city: landmark.city })),
      airport: meta.airport,
      airportCity: meta.airportCity,
      majorAirports: [meta.airport],
      months: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2],
      currencyConverter: {
        baseCode: 'BRL',
        targetCode: key === 'El Salvador' || key === 'Panama' ? 'USD' : data.overview.currency.match(/\(([A-Z]{3})\)/)?.[1],
        targetSymbol: data.overview.currencySymbol,
        brlExchangeRate: data.overview.brlExchangeRate,
        rateAsOf: RATE_AS_OF,
        source: key === 'Costa Rica' ? CENTRAL_AMERICA_SOURCES.exchange.CostaRica : CENTRAL_AMERICA_SOURCES.exchange.regional
      },
      dataLevel: 'curated'
    }];
  })
));
