// História dos destinos classificados como Oceania, seguindo o esquema do guia.
const p = (icon, title, text) => ({ icon, title, text });

export const OCEANIA_HISTORY = Object.freeze({
  Australia: [
    p('🪶', 'Histórias aborígenes', 'Povos aborígenes e das ilhas do Estreito de Torres têm histórias de muitos milênios. Em Budj Bim, os gunditjmara criaram um complexo sistema de aquicultura.'),
    p('⛓️', 'Colonização britânica', 'A partir de 1788, assentamentos coloniais, prisões e expansão pastoral provocaram perda de terras e violência contra povos originários. Resistência e continuidade cultural atravessaram esse período.'),
    p('📜', 'Federação', 'Seis colônias formaram a Comunidade da Austrália em 1901. O novo Estado cresceu com imigração e indústria, inicialmente sob leis raciais de exclusão.'),
    p('🤝', 'Direitos e memória', 'Movimentos indígenas conquistaram avanços em reconhecimento e direitos territoriais. Debates sobre reparação e representação seguem essenciais para entender a Austrália contemporânea.')
  ],
  Fiji: [
    p('⛵', 'Povoamento antigo', 'Navegadores de tradições Lapita e seus descendentes estabeleceram comunidades nas ilhas. Redes marítimas e chefaturas ligaram Fiji a outros arquipélagos do Pacífico.'),
    p('👑', 'Chefaturas e cessão', 'Lideranças locais negociaram e disputaram poder no século XIX. Em 1874, as ilhas foram cedidas à Coroa britânica, iniciando administração colonial.'),
    p('🌾', 'Trabalho contratado', 'Após a colonização, trabalhadores da Índia foram levados para plantações de açúcar sob contratos restritivos. Seus descendentes transformaram a sociedade e a cultura fijianas.'),
    p('📜', 'Independência e diversidade', 'Fiji tornou-se independente em 1970. Mudanças políticas posteriores refletiram debates sobre cidadania e representação entre comunidades de trajetórias históricas distintas.')
  ],
  Kiribati: [
    p('⛵', 'Vida entre atóis', 'Comunidades i-kiribati desenvolveram navegação, agricultura adaptada e formas próprias de organizar aldeias. As ilhas mantiveram contatos com outras sociedades oceânicas.'),
    p('🧭', 'Gilbert coloniais', 'O domínio britânico reuniu ilhas Gilbert e Ellice numa administração. A extração de fosfato em Banaba deixou deslocamentos e uma memória ambiental duradoura.'),
    p('⚔️', 'Tarawa na guerra', 'A batalha de Tarawa, em 1943, mostrou a importância estratégica do Pacífico na Segunda Guerra e causou perdas a militares e habitantes locais.'),
    p('📜', 'Independência', 'Kiribati tornou-se independente em 1979. Sua identidade conecta atóis distantes, enquanto a proteção do território diante do aumento do mar ganhou importância histórica.')
  ],
  'Marshall Islands': [
    p('🧭', 'Navegação marshallesa', 'Comunidades desenvolveram conhecimento preciso de ondas, correntes e estrelas. Cartas de varetas registram técnicas de orientação próprias do arquipélago.'),
    p('⚔️', 'Poderes externos', 'Alemanha, Japão e depois Estados Unidos controlaram as ilhas em períodos diferentes. A Segunda Guerra transformou atóis em posições militares estratégicas.'),
    p('☢️', 'Testes nucleares', 'Explosões conduzidas pelos Estados Unidos em Bikini e Enewetak deslocaram habitantes e contaminaram ambientes. Suas consequências seguem centrais para a memória nacional.'),
    p('📜', 'Autodeterminação', 'A independência em livre associação com os Estados Unidos entrou em vigor em 1986. Lideranças marshallenses também projetam sua experiência em debates ambientais globais.')
  ],
  Micronesia: [
    p('🏛️', 'Nan Madol', 'Em Pohnpei, ilhotas e estruturas de basalto formaram um centro cerimonial associado à dinastia Saudeleur. O sítio revela engenharia e organização política insulares.'),
    p('🪨', 'Yap e trocas', 'Discos de pedra usados em Yap expressam relações de prestígio e intercâmbio com Palau. Cada estado insular preserva trajetórias e tradições próprias.'),
    p('🧭', 'Administrações sucessivas', 'Espanha, Alemanha, Japão e Estados Unidos governaram as ilhas em épocas distintas. A guerra no Pacífico deixou impactos materiais e sociais.'),
    p('📜', 'Federação independente', 'Os Estados Federados da Micronésia conquistaram independência em livre associação com os Estados Unidos em 1986, reunindo Chuuk, Kosrae, Pohnpei e Yap.')
  ],
  Nauru: [
    p('🌊', 'Comunidade insular', 'Nauruanos desenvolveram modos de vida ligados à pesca, às famílias e ao ambiente da pequena ilha antes do domínio europeu. Sua língua preserva essa história.'),
    p('⛏️', 'Fosfato colonial', 'A Alemanha assumiu controle no século XIX; depois, a mineração de fosfato passou a sustentar administrações externas. A extração alterou profundamente o interior da ilha.'),
    p('⚔️', 'Guerra e deslocamentos', 'A ocupação japonesa durante a Segunda Guerra levou a trabalho forçado e deportações de nauruanos. O retorno dos sobreviventes tornou-se parte da memória coletiva.'),
    p('📜', 'Independência e legado', 'Nauru tornou-se independente em 1968. A riqueza temporária do fosfato contrastou com a degradação ambiental e desafios de construir uma economia duradoura.')
  ],
  'New Zealand': [
    p('⛵', 'Chegada māori', 'Navegadores polinésios povoaram Aotearoa por volta do século XIII. Iwi e hapū desenvolveram instituições, agricultura, artes e histórias ligadas a lugares específicos.'),
    p('📜', 'Tratado de Waitangi', 'Em 1840, chefes māori e representantes britânicos assinaram versões do tratado com interpretações diferentes. A colonização posterior causou guerras e perda de terras.'),
    p('🏛️', 'Estado e imigração', 'Instituições de autogoverno cresceram no século XIX. Migração e reformas sociais transformaram o país, sem resolver as consequências da expropriação māori.'),
    p('🤝', 'Reivindicações e cultura', 'A partir do século XX, movimentos māori fortaleceram língua e direitos. O Tribunal de Waitangi passou a examinar violações históricas do tratado.')
  ],
  Palau: [
    p('🪨', 'Aldeias antigas', 'Sítios nas Ilhas Rochosas registram povoamento, arte rupestre e uso de recursos marinhos ao longo de milênios. Chefaturas organizaram relações entre comunidades.'),
    p('🧭', 'Governos estrangeiros', 'Espanha, Alemanha, Japão e Estados Unidos administraram Palau em diferentes fases. Cada domínio deixou marcas em escolas, infraestrutura e paisagens.'),
    p('⚔️', 'Peleliu', 'A batalha de Peleliu, em 1944, deixou vestígios e perdas profundas. Memoriais mostram como a Segunda Guerra atingiu lugares habitados por comunidades locais.'),
    p('📜', 'Soberania', 'Palau tornou-se independente em livre associação com os Estados Unidos em 1994. A preservação de territórios marinhos e tradições locais integra sua identidade nacional.')
  ],
  'Papua New Guinea': [
    p('🌾', 'Agricultura antiga', 'No sítio de Kuk, comunidades das terras altas desenvolveram técnicas agrícolas há milhares de anos. É evidência importante de inovação local na história da alimentação.'),
    p('🗣️', 'Muitas sociedades', 'Montanhas, rios e ilhas abrigam centenas de línguas e instituições próprias. Trocas de conchas e outros bens ligaram comunidades antes das fronteiras coloniais.'),
    p('🧭', 'Colônias e guerra', 'Alemanha e Reino Unido dividiram a região; a Austrália assumiu administração posterior. A Segunda Guerra transformou trilhas como Kokoda em frentes militares.'),
    p('📜', 'Independência', 'Papua-Nova Guiné tornou-se independente em 1975. O novo Estado precisou articular territórios e comunidades muito diversos sem apagar suas histórias locais.')
  ],
  Samoa: [
    p('⛵', 'Navegação polinésia', 'Ancestrais samoanos desenvolveram viagens oceânicas, aldeias e redes de parentesco. O sistema de títulos matai organiza responsabilidades comunitárias até hoje.'),
    p('🧭', 'Domínio e perdas', 'Após disputas coloniais, Samoa Ocidental passou do controle alemão ao da Nova Zelândia. A pandemia de gripe de 1918 causou perdas devastadoras.'),
    p('🕊️', 'Movimento Mau', 'O movimento Mau defendeu a autodeterminação com ampla mobilização civil. A repressão colonial tornou sua memória central à formação política samoana.'),
    p('📜', 'Independência', 'Samoa alcançou a independência em 1962. A tradição fa’a Samoa continua influenciando família, governo local e relação com uma diáspora extensa.')
  ],
  'Solomon Islands': [
    p('⛵', 'Ilhas povoadas', 'Comunidades de origem diversa desenvolveram navegação, horticultura e redes de troca. Tradições Lapita fazem parte de uma história oceânica mais ampla.'),
    p('🧭', 'Protetorado britânico', 'O domínio colonial reorganizou autoridades e trabalho, mas costumes locais continuaram a orientar muitas comunidades. Ilhas diferentes seguiram trajetórias próprias.'),
    p('⚔️', 'Guadalcanal', 'Campanhas da Segunda Guerra fizeram do arquipélago uma frente decisiva no Pacífico. Habitantes locais atuaram como guias e apoiaram redes de comunicação.'),
    p('📜', 'Independência e kastom', 'As Ilhas Salomão tornaram-se independentes em 1978. Debates sobre terras, governo e costumes mostram a importância das instituições comunitárias.')
  ],
  Tonga: [
    p('⛵', 'Mundo polinésio', 'Navegadores de tradições Lapita povoaram o arquipélago. A circulação marítima ligou Tonga a Fiji, Samoa e outros lugares por séculos.'),
    p('👑', 'Autoridade Tuʻi Tonga', 'Chefes de Tonga exerceram influência em amplas redes regionais. Tumbas monumentais e histórias orais revelam formas antigas de poder e parentesco.'),
    p('📜', 'Monarquia constitucional', 'Reformas do século XIX produziram uma constituição em 1875. Tonga manteve sua monarquia durante a proteção britânica, encerrada em 1970.'),
    p('🤝', 'Continuidade e mudanças', 'O país preservou soberania própria enquanto reformou instituições políticas. Igrejas, famílias extensas e uma diáspora crescente participam de sua vida social.')
  ],
  Tuvalu: [
    p('⛵', 'Atóis polinésios', 'Navegadores polinésios povoaram as ilhas e desenvolveram conhecimentos de mar, vento e agricultura em terrenos estreitos. Comunidades locais conservaram tradições próprias.'),
    p('🧭', 'Ilhas Ellice', 'Sob domínio britânico, Tuvalu integrou a colônia das ilhas Gilbert e Ellice. Diferenças culturais e geográficas alimentaram a busca por administração separada.'),
    p('📜', 'Escolha de independência', 'Um referendo em 1974 apoiou a separação das ilhas Gilbert. Tuvalu tornou-se independente em 1978, reunindo seus atóis num Estado próprio.'),
    p('🌊', 'Memória e futuro', 'Canções, encontros comunitários e saberes de navegação preservam sua história. A elevação do nível do mar tornou a continuidade territorial tema internacional.')
  ],
  Vanuatu: [
    p('⛵', 'Povoamento e línguas', 'Navegadores de tradição Lapita chegaram ao arquipélago há milênios. Comunidades desenvolveram muitas línguas e sistemas próprios de troca e autoridade.'),
    p('👑', 'Roi Mata', 'Sítios ligados ao chefe Roi Mata preservam tradições orais, rituais e memória política. Eles mostram a complexidade de lideranças insulares antes da colonização.'),
    p('🧭', 'Condomínio colonial', 'França e Reino Unido administraram conjuntamente as Novas Hébridas, criando instituições paralelas. Movimentos locais contestaram esse arranjo no século XX.'),
    p('📜', 'Independência', 'Vanuatu tornou-se independente em 1980. Costumes chamados kastom continuam importantes para a vida comunitária e para debates sobre identidade nacional.')
  ]
});
