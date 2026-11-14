// Complementos de uso prático para os 11 destinos europeus prioritários.
// História permanece integralmente no conjunto já existente.
const facts = {
  Portugal: {
    currency: 'Euro (EUR)', symbol: '€', lang: 'português', majorAirports: ['LIS', 'OPO', 'FAO'],
    flightNote: 'Lisboa (LIS) é a porta principal; Porto (OPO) e Faro (FAO) podem encurtar o deslocamento final.',
    foods: [['Bacalhau à Brás', 'Bacalhau desfiado com batata e ovos.'], ['Pastel de nata', 'Doce de massa folhada e creme, típico de confeitarias.'], ['Caldo verde', 'Sopa de couve e batata.']],
    etiquette: ['Cumprimente ao entrar em lojas pequenas; evite tratar todo o país como extensão de Lisboa.', 'Serviço pode já aparecer na conta; gorjeta extra é opcional.', 'Em áreas residenciais, reduza ruído ao voltar de passeios noturnos.'],
    checklist: ['Conferir limite de permanência Schengen e EES/ETIAS antes do embarque', 'Planejar trem/metro e eventual cartão de transporte', 'Adaptador C/F e casaco leve para noites atlânticas']
  },
  Spain: {
    currency: 'Euro (EUR)', symbol: '€', lang: 'espanhol/castelhano; catalão, galego e basco em regiões próprias', majorAirports: ['MAD', 'BCN', 'AGP'],
    flightNote: 'Madri (MAD) e Barcelona (BCN) são grandes portas; Málaga (AGP) serve a Costa del Sol.',
    foods: [['Tortilla española', 'Omelete espessa de batatas.'], ['Paella', 'Arroz valenciano; versões regionais diferem.'], ['Gazpacho', 'Sopa fria de tomate, comum no verão.']],
    etiquette: ['Horários de almoço e jantar costumam ser tardios; confira reservas.', 'Espanhol ajuda, mas respeite idiomas regionais e a forma local de nomeá-los.', 'Serviço geralmente está incluído; deixar troco ou pequena gorjeta é facultativo.'],
    checklist: ['Verificar entrada Schengen e comprovantes de hospedagem', 'Reservar trens de alta velocidade com antecedência', 'Adaptador C/F e proteção contra calor no verão interiorano']
  },
  France: {
    currency: 'Euro (EUR)', symbol: '€', lang: 'francês', majorAirports: ['CDG', 'ORY', 'NCE'],
    flightNote: 'CDG recebe mais conexões longas; ORY atende rotas domésticas/europeias e NCE serve a Riviera.',
    foods: [['Croissant', 'Clássico de padarias; experimente no café da manhã.'], ['Crêpe', 'Massa fina doce ou salgada, especialmente associada à Bretanha.'], ['Ratatouille', 'Legumes cozidos típicos do sul.']],
    etiquette: ['Diga bonjour antes de pedir algo em lojas ou cafés.', 'Em restaurantes, serviço costuma estar incluído; gorjeta adicional é opcional.', 'Mantenha voz baixa em trens e respeite a etiqueta de filas.'],
    checklist: ['Conferir entrada Schengen e comprovantes de recursos', 'Reservar trem e museus concorridos', 'Adaptador C/E; camadas para variação entre litoral e interior']
  },
  Italy: {
    currency: 'Euro (EUR)', symbol: '€', lang: 'italiano; línguas regionais', majorAirports: ['FCO', 'MXP', 'VCE'],
    flightNote: 'FCO serve Roma, MXP a região de Milão e VCE a área de Veneza; planeje o trajeto do aeroporto ao centro.',
    foods: [['Pasta alla carbonara', 'Receita romana com ovos, queijo e guanciale.'], ['Pizza napolitana', 'Pizza de massa macia e borda alta.'], ['Gelato', 'Sobremesa gelada artesanal.']],
    etiquette: ['Igrejas podem exigir ombros e joelhos cobertos.', 'Veja coperto e servizio na conta antes de acrescentar gorjeta.', 'Não coma ou se sente em monumentos onde houver proibição.'],
    checklist: ['Conferir entrada Schengen e bilhete de saída', 'Reservar trens e ingressos para sítios populares', 'Adaptador C/F/L e roupa adequada para igrejas']
  },
  'United Kingdom': {
    currency: 'Libra esterlina (GBP)', symbol: '£', lang: 'inglês; galês e gaélico em regiões próprias', majorAirports: ['LHR', 'LGW', 'MAN'],
    flightNote: 'Heathrow (LHR) tem grande rede internacional; Gatwick (LGW) e Manchester (MAN) podem ser melhores conforme roteiro.',
    foods: [['Fish and chips', 'Peixe empanado com batatas fritas.'], ['Sunday roast', 'Assado dominical com acompanhamentos.'], ['Scones', 'Pães doces servidos com chá, geleia ou creme.']],
    etiquette: ['Respeite rigorosamente a fila; use please e thank you.', 'Em pubs, muitas vezes se pede e paga no balcão.', 'Gorjeta em restaurante depende da cobrança de service charge; confira a conta.'],
    checklist: ['Obter ETA britânica vinculada ao passaporte antes do embarque', 'Planejar pagamento por aproximação e transporte urbano', 'Adaptador tipo G; atenção a trânsito separado do Schengen']
  },
  Germany: {
    currency: 'Euro (EUR)', symbol: '€', lang: 'alemão', majorAirports: ['FRA', 'MUC', 'BER'],
    flightNote: 'Frankfurt (FRA) e Munique (MUC) são hubs; Berlim (BER) pode evitar conexão doméstica.',
    foods: [['Bratwurst', 'Linguiça grelhada em várias versões locais.'], ['Brezel', 'Pão trançado salgado.'], ['Käsespätzle', 'Massa curta com queijo, comum no sul.']],
    etiquette: ['Pontualidade conta em compromissos e reservas.', 'Alguns estabelecimentos menores preferem dinheiro; tenha alternativa ao cartão.', 'Separe resíduos conforme regras locais; garrafas podem ter depósito Pfand.'],
    checklist: ['Conferir entrada Schengen e tempo de conexão', 'Checar bilhetes ferroviários e possíveis mudanças de plataforma', 'Adaptador C/F e algum dinheiro para compras pequenas']
  },
  Netherlands: {
    currency: 'Euro (EUR)', symbol: '€', lang: 'neerlandês', majorAirports: ['AMS', 'RTM', 'EIN'],
    flightNote: 'Schiphol (AMS) concentra conexões; RTM e EIN servem rotas regionais/baixo custo.',
    foods: [['Stroopwafel', 'Waffle fino com calda de caramelo.'], ['Bitterballen', 'Salgado frito servido em cafés.'], ['Haring', 'Arenque preparado tradicionalmente.']],
    etiquette: ['Nunca bloqueie ciclovias; olhe para bicicletas antes de cruzar.', 'Reserve museus populares em horários marcados.', 'Comunicação costuma ser direta; não confunda objetividade com grosseria.'],
    checklist: ['Verificar entrada Schengen e reservas de hospedagem', 'Planejar trens e transporte local sem atravessar ciclovias distraidamente', 'Adaptador C/F e capa de chuva leve']
  },
  Belgium: {
    currency: 'Euro (EUR)', symbol: '€', lang: 'neerlandês, francês e alemão', majorAirports: ['BRU', 'CRL'],
    flightNote: 'Bruxelas (BRU) é a chegada principal; Charleroi (CRL) fica mais distante e exige transfer.',
    foods: [['Moules-frites', 'Mexilhões com batatas fritas.'], ['Gaufre', 'Waffle belga de estilos regionais.'], ['Carbonnade flamande', 'Ensopado de carne com cerveja.']],
    etiquette: ['Use francês ou neerlandês conforme a região; Bruxelas é bilíngue.', 'Confira se serviço está incluído na conta antes de dar gorjeta.', 'Cidades históricas são compactas; respeite moradores em ruas residenciais.'],
    checklist: ['Conferir entrada Schengen e documentos de trânsito', 'Escolher BRU ou CRL considerando o transfer', 'Adaptador C/E e reserva de trens interurbanos']
  },
  Switzerland: {
    currency: 'Franco suíço (CHF)', symbol: 'CHF', lang: 'alemão, francês, italiano e romanche', majorAirports: ['ZRH', 'GVA', 'BSL'],
    flightNote: 'Zurique (ZRH) e Genebra (GVA) são os principais acessos; Basileia (BSL) serve a tríplice fronteira.',
    foods: [['Fondue', 'Queijos derretidos compartilhados.'], ['Rösti', 'Batata ralada e dourada, com variações.'], ['Raclette', 'Queijo aquecido servido com batatas e conservas.']],
    etiquette: ['Idioma muda por cantão; confirme a língua local antes da viagem.', 'Pontualidade é valorizada em trens e compromissos.', 'Preço já inclui serviço; gorjeta adicional pequena é opcional.'],
    checklist: ['Conferir regra Schengen aplicável à Suíça', 'Planejar CHF e custo dos passes ferroviários', 'Adaptador C/J e roupas em camadas para mudanças de altitude']
  },
  Austria: {
    currency: 'Euro (EUR)', symbol: '€', lang: 'alemão', majorAirports: ['VIE', 'SZG', 'INN'],
    flightNote: 'Viena (VIE) é o hub; Salzburgo (SZG) e Innsbruck (INN) podem facilitar roteiros alpinos.',
    foods: [['Wiener schnitzel', 'Escalope empanado tradicional.'], ['Apfelstrudel', 'Doce folhado de maçã.'], ['Sachertorte', 'Bolo de chocolate associado a Viena.']],
    etiquette: ['Cumprimente em cafés e estabelecimentos pequenos.', 'Em restaurantes, arredondar a conta é uma prática comum de gorjeta.', 'Respeite silêncio em vagões e trilhas bem sinalizadas.'],
    checklist: ['Conferir entrada Schengen e documentação de retorno', 'Reservar trem para Viena/Salzburgo conforme roteiro', 'Adaptador C/F e roupa apropriada para montanha']
  },
  Ireland: {
    currency: 'Euro (EUR)', symbol: '€', lang: 'inglês e irlandês', majorAirports: ['DUB', 'ORK', 'SNN'],
    flightNote: 'Dublin (DUB) é a porta principal; Cork (ORK) e Shannon (SNN) podem servir melhor o oeste/sul.',
    foods: [['Irish stew', 'Ensopado de carne e legumes.'], ['Soda bread', 'Pão tradicional fermentado com bicarbonato.'], ['Boxty', 'Panqueca de batata de origem regional.']],
    etiquette: ['Em pubs, pedidos geralmente são feitos no balcão.', 'Conversa casual é comum, mas respeite temas pessoais e políticos.', 'Confira service charge antes de deixar gorjeta em restaurantes.'],
    checklist: ['Verificar regra irlandesa própria; Schengen/ETIAS não substituem admissão na Irlanda', 'Planejar cartão de transporte e deslocamentos fora de Dublin', 'Adaptador tipo G e capa de chuva']
  }
};

export const EUROPE_PRIORITY_ENRICHMENT = Object.freeze(Object.fromEntries(
  Object.entries(facts).map(([key, data]) => [key, {
    currency: data.currency, symbol: data.symbol, lang: data.lang,
    majorAirports: data.majorAirports, flightNote: data.flightNote,
    foods: data.foods.map(([name, desc]) => ({ e: '🍽️', name, desc })),
    etiquette: data.etiquette.map((t, index) => ({ e: ['🤝', '💶', 'ℹ️'][index], t })),
    checklist: [
      { group: 'Documentos', items: [
        { icon: '📘', label: 'Passaporte conforme a regra de entrada' },
        { icon: '🧾', label: 'Passagem de saída, hospedagem e recursos comprováveis' },
        { icon: '🛡️', label: 'Seguro de viagem adequado ao roteiro' }
      ] },
      { group: 'No destino', items: data.checklist.map((label, index) => ({ icon: ['🔎', '🚆', '🎒'][index], label })) }
    ],
    dataLevel: 'curated'
  }])
));
