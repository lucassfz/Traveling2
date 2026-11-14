// Pontos históricos editoriais para os países classificados como Américas ou Europa.
// Os textos legados das demais regiões continuam disponíveis no catálogo.
const point = (icon, title, text) => ({ icon, title, text });

export const HISTORY_ENRICHMENT = Object.freeze({
  'Antigua & Barbuda': [
    point('🪶', 'Antes das colônias', 'Povos indígenas habitaram as ilhas muito antes da chegada europeia. Seus vestígios lembram que a história local não começou com os portos coloniais.'),
    point('🌾', 'Açúcar e trabalho forçado', 'Sob domínio britânico, plantações de açúcar dependeram do trabalho de africanos escravizados. Fortificações e antigos estaleiros testemunham a importância marítima das ilhas.'),
    point('📜', 'Autogoverno e independência', 'Após a emancipação e a ampliação da participação política, Antígua e Barbuda tornou-se independente em 1981. Sua identidade combina heranças africanas, caribenhas e coloniais. No século XX, movimentos trabalhistas ampliaram a representação política e prepararam o autogoverno.')
  ],
  Bahamas: [
    point('🪶', 'Mundo lucaio', 'Comunidades lucaias viviam no arquipélago antes das viagens europeias. A colonização trouxe deslocamento e perda populacional, uma ruptura decisiva na história das ilhas.'),
    point('⛵', 'Rotas do Atlântico', 'A posição entre o Caribe e a América do Norte fez das Bahamas um ponto de navegação, comércio e, em certos períodos, pirataria. O domínio britânico moldou suas instituições.'),
    point('📜', 'Caminho próprio', 'A abolição da escravidão e as mudanças econômicas antecederam a independência de 1973. Festas como o Junkanoo preservam expressões culturais afro-bahamenses além da imagem turística. Nassau guarda edifícios ligados a essa vocação atlântica.')
  ],
  Barbados: [
    point('🪶', 'Povoamento antigo', 'Vestígios indígenas antecedem a colonização inglesa do século XVII. A ilha passou a integrar cedo as redes atlânticas de comércio e produção colonial.'),
    point('🌾', 'Economia do açúcar', 'Grandes plantações de cana e trabalho de africanos escravizados transformaram Barbados e influenciaram outras colônias caribenhas. Bridgetown conserva marcas dessa economia marítima.'),
    point('📜', 'Da independência à república', 'Barbados tornou-se independente em 1966 e adotou a forma republicana em 2021. A mudança institucional expressa um longo processo de afirmação política e cultural. Movimentos trabalhistas do século XX ampliaram a participação popular e contestaram a ordem das plantações.')
  ],
  Belize: [
    point('🏛️', 'Herança maia', 'Cidades e centros cerimoniais maias floresceram no território hoje chamado Belize. Comunidades maias continuam presentes, ligando os sítios arqueológicos à vida contemporânea.'),
    point('🌳', 'Madeira e domínio britânico', 'Exploradores britânicos organizaram a extração de madeira; a colônia ficou conhecida como Honduras Britânica. Garífunas e outros grupos ampliaram a diversidade cultural local.'),
    point('📜', 'Independência tardia', 'Belize alcançou a independência em 1981. O inglês oficial e as tradições maias, garífunas e crioulas refletem sua trajetória distinta na América Central. A negociação da soberania também foi marcada por uma prolongada disputa territorial com a Guatemala.')
  ],
  Canada: [
    point('🪶', 'Povos originários', 'Primeiras Nações, inuit e métis têm histórias, línguas e instituições próprias, anteriores ao Estado canadense. Suas reivindicações permanecem centrais para compreender o país.'),
    point('⚜️', 'França e Grã-Bretanha', 'A colonização francesa e depois a expansão britânica disputaram terras e rotas comerciais. O bilinguismo e as tradições jurídicas diferentes são parte desse legado.'),
    point('📜', 'Confederação', 'Em 1867, províncias formaram uma federação que se ampliou ao longo do tempo. A construção nacional ocorreu também à custa da desapropriação e assimilação forçada de povos indígenas.'),
    point('🌍', 'Memória e reconhecimento', 'Debates sobre direitos indígenas, imigração e reconciliação ajudam a explicar o Canadá atual. Sua história é mais ampla que a rivalidade entre os antigos impérios europeus.')
  ],
  'Costa Rica': [
    point('🪶', 'Raízes diversas', 'Povos indígenas viveram entre o Pacífico e o Caribe antes da colonização espanhola. Comunidades como bribris e cabécares preservam idiomas e práticas culturais.'),
    point('☕', 'Café e república', 'Após a independência centro-americana de 1821, o café impulsionou a economia e a formação de instituições. Seus ganhos, porém, não foram distribuídos igualmente.'),
    point('🕊️', 'Escolha institucional', 'Depois da guerra civil de 1948, o país aboliu o exército permanente. Investimentos sociais e eleições regulares tornaram essa decisão um marco de sua identidade política. A conservação ambiental tornou-se, mais tarde, outro traço reconhecido de seu projeto nacional.')
  ],
  Cuba: [
    point('🪶', 'Antes e depois da conquista', 'Povos indígenas, entre eles os taínos, habitavam Cuba quando começou a colonização espanhola. A conquista alterou profundamente a população e a organização da ilha.'),
    point('🌾', 'Açúcar e independência', 'A economia açucareira cresceu com o trabalho de africanos escravizados. Guerras de independência no século XIX e o fim do domínio espanhol em 1898 precederam a república de 1902.'),
    point('⚔️', 'Revolução e Guerra Fria', 'A Revolução de 1959 redefiniu Estado, economia e relações exteriores. Cuba tornou-se protagonista de disputas da Guerra Fria e desenvolveu expressões culturais de alcance global. Música e cinema ganharam projeção internacional nesse período.')
  ],
  Dominica: [
    point('🪶', 'Presença kalinago', 'Os kalinagos resistiram à expansão colonial e mantêm uma comunidade reconhecida na ilha. Sua continuidade distingue Dominica de muitas outras histórias do Caribe.'),
    point('⚓', 'Entre impérios', 'França e Grã-Bretanha disputaram Dominica, deixando marcas na língua crioula, na religião e na organização das plantações. A emancipação não eliminou desigualdades herdadas.'),
    point('📜', 'Independência', 'O país tornou-se independente em 1978. A memória kalinago e as tradições afro-caribenhas ajudam a contar uma história que vai além do período colonial. O idioma crioulo e festas comunitárias preservam parte dessas experiências compartilhadas.')
  ],
  'Dominican Rep.': [
    point('🪶', 'Hispaniola taína', 'A ilha era habitada por povos taínos antes da chegada espanhola. A conquista provocou colapso demográfico e transformou Santo Domingo em centro inicial da colonização europeia nas Américas.'),
    point('🏛️', 'Colônia e novas sociedades', 'A parte oriental de Hispaniola passou por domínio espanhol, ocupações e mudanças políticas. Influências africanas e europeias se entrelaçaram em sua vida urbana e rural.'),
    point('📜', 'Formação nacional', 'A República Dominicana proclamou independência do Haiti em 1844. Sua história posterior inclui disputas de soberania, autoritarismo e democratização, enquanto música e literatura ganharam projeção regional. Santo Domingo conserva construções dos primeiros tempos coloniais.')
  ],
  'El Salvador': [
    point('🪶', 'Povos e território', 'Comunidades indígenas, entre elas nahuas-pipiles e lencas, viveram no território antes da conquista. Seus descendentes e tradições seguem presentes apesar da repressão histórica.'),
    point('☕', 'Independência e café', 'Após 1821, El Salvador integrou a federação centro-americana antes de consolidar sua república. A expansão cafeeira concentrou terras e marcou a estrutura social.'),
    point('🕊️', 'Guerra e paz', 'A guerra civil de 1980 a 1992 deixou perdas profundas. Acordos de paz abriram um novo período institucional, essencial para entender a memória pública salvadorenha. Comissões da verdade documentaram violações e reforçaram esforços de memória.')
  ],
  Grenada: [
    point('🪶', 'Primeiros habitantes', 'Povos indígenas ocuparam Granada antes das potências europeias. A colonização francesa e depois britânica alterou a posse da terra e a população da ilha.'),
    point('🌱', 'Plantações e especiarias', 'O trabalho escravizado sustentou a economia colonial; mais tarde, noz-moscada e cacau ganharam importância. Esses cultivos ainda aparecem na paisagem e na identidade local.'),
    point('📜', 'Independência e mudanças', 'Granada tornou-se independente em 1974. A revolução de 1979 e a intervenção militar de 1983 foram episódios decisivos de sua história política recente. O carnaval reúne tradições africanas e formas locais de expressão pública.')
  ],
  Guatemala: [
    point('🏛️', 'Civilizações maias', 'Centros como Tikal mostram a diversidade política, artística e científica do mundo maia. Povos maias continuam a compor parte fundamental da sociedade guatemalteca.'),
    point('⛪', 'Domínio colonial', 'A conquista espanhola reorganizou terras, trabalho e religião. Cidades coloniais e idiomas indígenas revelam a convivência, muitas vezes desigual, entre diferentes tradições.'),
    point('🕊️', 'República e paz', 'A independência veio no contexto centro-americano de 1821. A guerra interna do século XX terminou com acordos de paz em 1996, sem apagar seus efeitos sociais. Têxteis, idiomas e calendários maias seguem presentes na vida cotidiana.')
  ],
  Haiti: [
    point('🪶', 'Da ilha taína à colônia', 'Povos taínos habitavam Hispaniola antes da conquista europeia. No oeste da ilha, a colônia francesa de Saint-Domingue tornou-se produtora de açúcar por meio da escravidão.'),
    point('⚔️', 'Revolução haitiana', 'A revolta iniciada em 1791 derrubou o sistema colonial e levou à independência em 1804. Foi uma transformação decisiva na história atlântica da liberdade.'),
    point('🌍', 'Legado e obstáculos', 'O Haiti tornou-se a primeira república independente fundada por ex-escravizados. Isolamento diplomático e uma indenização imposta pela França pesaram sobre sua trajetória posterior. Sua revolução também inspirou movimentos antiescravistas em outras regiões.')
  ],
  Honduras: [
    point('🏛️', 'Copán e outros povos', 'Copán foi um importante centro maia, conhecido por esculturas e inscrições. A história pré-colonial do território inclui também outros povos além dessa cidade.'),
    point('⛪', 'Período espanhol', 'A colonização integrou a região a circuitos de mineração e agricultura. Após 1821, Honduras participou da federação centro-americana antes de formar um Estado separado.'),
    point('🍌', 'Economia e soberania', 'No século XX, companhias estrangeiras de banana exerceram grande influência econômica e política. O episódio ajuda a entender debates hondurenhos sobre terra e desenvolvimento. Copán continua essencial para o estudo da escrita e da astronomia maias.')
  ],
  Jamaica: [
    point('🪶', 'Raízes da ilha', 'Povos taínos habitavam a Jamaica antes da conquista espanhola. A ocupação britânica posterior reorganizou a ilha em torno das plantações de açúcar.'),
    point('🌾', 'Escravidão e resistência', 'Africanos escravizados sustentaram a economia colonial; comunidades maroons resistiram nas montanhas e negociaram autonomia. Essa experiência permanece central na memória jamaicana.'),
    point('🎵', 'Independência e voz global', 'Independente desde 1962, a Jamaica projetou reggae e movimentos como o rastafarianismo muito além do Caribe. Música e pensamento social contam parte de sua história moderna. A cultura maroon permanece associada à autonomia e ao reconhecimento de seus descendentes.')
  ],
  Mexico: [
    point('🏛️', 'Civilizações antigas', 'Culturas olmecas, maias, mexicas e muitas outras criaram cidades, conhecimentos e redes comerciais. Seus descendentes e idiomas continuam a integrar o México contemporâneo.'),
    point('⛪', 'Nova Espanha', 'A conquista espanhola transformou instituições, religião e demografia. Mineração e comércio ligaram o vice-reino a circuitos atlânticos e pacíficos, com forte desigualdade social.'),
    point('📜', 'Independência e reforma', 'O movimento iniciado em 1810 levou à independência em 1821. Conflitos posteriores redefiniram a relação entre Igreja, Estado, terra e cidadania.'),
    point('⚔️', 'Revolução mexicana', 'A revolução iniciada em 1910 tornou a reforma agrária e os direitos sociais temas centrais. Arte muralista e novas instituições divulgaram uma narrativa nacional plural.')
  ],
  Nicaragua: [
    point('🪶', 'Sociedades anteriores à conquista', 'Diversos povos indígenas viveram entre lagos, vulcões e a costa caribenha. A colonização espanhola não apagou suas línguas e heranças culturais.'),
    point('📜', 'República centro-americana', 'A independência veio em 1821, seguida por participação na federação regional. Rivalidades internas e influência estrangeira marcaram a formação do Estado.'),
    point('⚔️', 'Transformações do século XX', 'A revolução de 1979 encerrou a ditadura Somoza; conflitos na década seguinte afetaram profundamente o país. Literatura e movimentos sociais registram essas experiências. Cidades como León preservam patrimônio colonial, enquanto a poesia nicaraguense registra mudanças sociais e políticas.')
  ],
  Panama: [
    point('🪶', 'Istmo de encontros', 'Povos indígenas ocuparam o istmo antes da chegada espanhola. Sua posição entre dois oceanos tornou a região um corredor de circulação desde o período colonial.'),
    point('📜', 'Da Colômbia ao Panamá', 'Após a independência da Espanha, o território integrou a Colômbia. A separação em 1903 ocorreu em meio ao interesse internacional por uma passagem interoceânica.'),
    point('🏗️', 'O Canal e seu legado', 'Inaugurado em 1914, o Canal do Panamá encurtou rotas marítimas globais. Sua transferência integral ao controle panamenho em 1999 foi marco de soberania. A construção e operação envolveram trabalhadores de muitas origens e mudaram a paisagem do istmo.')
  ],
  'St. Kitts & Nevis': [
    point('🪶', 'Ilhas antes da colonização', 'Comunidades indígenas viviam em São Cristóvão e Névis antes da chegada europeia. No século XVII, as ilhas entraram cedo na disputa colonial caribenha.'),
    point('🌾', 'Açúcar e fortificações', 'Britânicos e franceses competiram por São Cristóvão; plantações dependiam de africanos escravizados. A Fortaleza de Brimstone Hill registra a dimensão militar desse comércio.'),
    point('📜', 'Federação independente', 'O Estado de São Cristóvão e Névis tornou-se independente em 1983. A organização federativa expressa a história e as identidades próprias de cada ilha. A produção de açúcar permaneceu central por muito tempo, mesmo após o fim da escravidão.')
  ],
  'St. Lucia': [
    point('🪶', 'Primeiras comunidades', 'Povos indígenas habitaram Santa Lúcia antes das colônias europeias. A memória kalinago integra a história mais antiga da ilha.'),
    point('⚓', 'Disputa franco-britânica', 'França e Grã-Bretanha alternaram o controle da ilha. A economia de plantações e a escravidão deixaram marcas sociais, enquanto o crioulo preservou influências francesas e africanas.'),
    point('📜', 'Independência e cultura', 'Santa Lúcia tornou-se independente em 1979. Literatura, música e tradições crioulas ajudam a explicar sua contribuição cultural além das paisagens conhecidas pelos visitantes. O idioma kwéyòl mantém viva uma parte visível dessa história de encontros.')
  ],
  'St. Vincent & Grenadines': [
    point('🪶', 'Resistência garífuna', 'Comunidades indígenas e garífunas resistiram à expansão colonial em São Vicente. Conflitos e deportações no fim do século XVIII espalharam parte dessa herança pela América Central.'),
    point('🌾', 'Ilhas de plantação', 'Sob domínio britânico, o cultivo colonial dependeu do trabalho de africanos escravizados. As Granadinas seguiram trajetórias locais próprias dentro do arquipélago.'),
    point('📜', 'Estado independente', 'São Vicente e Granadinas alcançou a independência em 1979. Sua cultura reúne memórias indígenas, africanas e coloniais em uma sociedade insular diversa. A diáspora garífuna liga a ilha a comunidades da atual América Central.')
  ],
  'Trinidad & Tobago': [
    point('🪶', 'Duas ilhas, muitos povos', 'Comunidades indígenas habitavam Trinidad e Tobago antes da colonização. As ilhas passaram por administrações europeias distintas até a consolidação do domínio britânico.'),
    point('🌾', 'Trabalho e migração', 'A escravidão africana sustentou plantações; depois da emancipação, trabalhadores contratados da Índia transformaram a composição cultural. Essa história aparece na culinária, religião e festas.'),
    point('🥁', 'Independência e invenção cultural', 'Independente desde 1962, o país deu projeção mundial ao steelpan e ao carnaval. São expressões nascidas de experiências urbanas, criatividade e resistência social. Movimentos sociais do século XX também ampliaram a participação política antes da independência.')
  ],
  'United States of America': [
    point('🪶', 'Terras de muitos povos', 'Nações indígenas desenvolveram sociedades distintas por todo o território antes da colonização europeia. A expansão posterior dos Estados Unidos implicou tratados, deslocamentos e resistência indígena.'),
    point('📜', 'Independência e Constituição', 'Treze colônias britânicas declararam independência em 1776. A Constituição federal influenciou debates políticos no mundo, embora direitos e participação fossem inicialmente limitados.'),
    point('⚔️', 'Guerra Civil e cidadania', 'A guerra de 1861 a 1865 terminou com a abolição da escravidão. A igualdade legal avançou gradualmente, em especial por meio do movimento pelos direitos civis.'),
    point('🏗️', 'Indústria e influência', 'Industrialização, imigração e inovação ampliaram o peso econômico do país. Seu poder no século XX moldou política, ciência e cultura global, com efeitos dentro e fora de suas fronteiras.')
  ],
  Argentina: [
    point('🪶', 'Povos e territórios', 'Povos indígenas diversos, como mapuches, guaranis e comunidades andinas, habitaram o território antes da colonização espanhola. Suas histórias continuam além das fronteiras nacionais.'),
    point('📜', 'Independência e Estado', 'A Revolução de Maio abriu o processo que levou à independência em 1816. Disputas entre províncias e poder central marcaram a organização da república.'),
    point('🚢', 'Imigração e economia', 'No fim do século XIX e início do XX, imigração em massa e exportações agropecuárias transformaram cidades e campo. O tango nasceu nesse ambiente urbano plural.'),
    point('🕊️', 'Memória democrática', 'A ditadura de 1976 a 1983 deixou desaparecimentos e violência estatal. A redemocratização consolidou a defesa pública da memória e dos direitos humanos.')
  ],
  Bolivia: [
    point('🏛️', 'Mundo andino', 'Tiwanaku foi um dos grandes centros pré-incas do altiplano; depois, partes da região integraram o Império Inca. Povos aimarás e quéchuas mantêm forte presença.'),
    point('⛏️', 'Prata de Potosí', 'Sob domínio espanhol, a mineração de Potosí conectou os Andes a circuitos econômicos globais. A riqueza extraída esteve ligada a trabalho coercitivo e desigualdade.'),
    point('📜', 'Independência e diversidade', 'A república foi fundada em 1825. Mobilizações indígenas e sociais transformaram o debate sobre cidadania, culminando no reconhecimento constitucional do Estado Plurinacional. O debate sobre terras e representação marcou continuamente a história republicana do país.')
  ],
  Brazil: [
    point('🪶', 'Muitos Brasis anteriores', 'Povos indígenas com línguas e formas de vida diversas habitavam o território muito antes de 1500. Suas culturas continuam vivas e centrais para entender o país.'),
    point('🌾', 'Colônia e escravidão', 'A colonização portuguesa articulou açúcar, mineração e comércio atlântico com trabalho indígena forçado e escravidão africana. Esse passado moldou cidades, desigualdades e práticas culturais.'),
    point('📜', 'Império e República', 'A independência de 1822 manteve a monarquia; a escravidão só foi abolida em 1888. No ano seguinte, a república abriu outra etapa de disputas por participação.'),
    point('🏗️', 'Transformações modernas', 'Industrialização, migrações internas e urbanização redesenharam o Brasil no século XX. A Constituição de 1988 marcou a redemocratização e ampliou direitos civis e sociais.')
  ],
  Chile: [
    point('🪶', 'Povos do território', 'Comunidades mapuches e outros povos viveram do deserto do Atacama ao extremo sul antes da colonização. Sua resistência e continuidade fazem parte da história chilena.'),
    point('📜', 'Independência e expansão', 'O processo de independência consolidou-se no início do século XIX. Guerras, mineração e integração territorial ampliaram o Estado, com efeitos profundos sobre populações locais.'),
    point('⛏️', 'Recursos e mudança social', 'Salitre e depois cobre ligaram o Chile aos mercados mundiais. Conflitos sobre trabalho, propriedade e representação atravessaram a vida política do século XX.'),
    point('🕊️', 'Ditadura e democracia', 'A ditadura iniciada em 1973 terminou em 1990. Memória, direitos humanos e reformas institucionais permanecem temas importantes para compreender o país.')
  ],
  Colombia: [
    point('🏛️', 'Sociedades pré-coloniais', 'Povos como muíscas e taironas desenvolveram redes comerciais, técnicas e expressões artísticas antes da conquista. A diversidade indígena não se limitava aos Andes.'),
    point('📜', 'Nova Granada e independência', 'A região integrou o domínio espanhol e participou das campanhas de independência do início do século XIX. A experiência da Grã-Colômbia antecedeu a república atual.'),
    point('☕', 'Café, conflitos e cultura', 'O café marcou economia e paisagens; disputas por terra e poder alimentaram conflitos prolongados. Música, literatura e iniciativas de paz mostram outras dimensões da história colombiana. Cartagena preserva muralhas ligadas ao comércio atlântico e à defesa colonial.')
  ],
  Ecuador: [
    point('🪶', 'Andes, costa e Amazônia', 'Povos diversos ocuparam as três grandes regiões do atual Equador. Parte dos Andes integrou o mundo inca antes da conquista espanhola.'),
    point('📜', 'De Quito à república', 'A antiga Audiência de Quito participou das guerras de independência e depois da Grã-Colômbia. O Equador formou uma república separada em 1830.'),
    point('🎨', 'Culturas em diálogo', 'Arte colonial, línguas indígenas e tradições afro-equatorianas revelam encontros e desigualdades históricas. A diversidade regional é decisiva para entender sua identidade nacional. O centro histórico de Quito mostra como técnicas locais e europeias se combinaram na arquitetura.')
  ],
  Guyana: [
    point('🪶', 'Terras indígenas', 'Povos indígenas habitavam rios, litoral e floresta muito antes das colônias europeias. Suas comunidades continuam a participar da vida cultural e política da Guiana.'),
    point('🌾', 'Plantação e migração', 'Holandeses e britânicos organizaram plantações; africanos escravizados e, depois, trabalhadores contratados da Índia transformaram a população. As origens desse sistema ainda são visíveis.'),
    point('📜', 'Independência', 'A Guiana tornou-se independente do Reino Unido em 1966. Sua história conecta o Caribe à América do Sul e explica a pluralidade religiosa e linguística atual. Georgetown conserva traços urbanos da época colonial, entre eles edifícios de madeira.')
  ],
  Paraguay: [
    point('🪶', 'Herança guarani', 'Povos guaranis habitavam a região antes da conquista. O guarani permaneceu amplamente falado e tornou-se parte singular da identidade nacional ao lado do espanhol.'),
    point('⛪', 'Missões e independência', 'Missões jesuíticas e colonização espanhola reorganizaram comunidades e território. O Paraguai declarou independência em 1811 e construiu um Estado com trajetória própria.'),
    point('⚔️', 'Guerra e reconstrução', 'A Guerra da Tríplice Aliança, no século XIX, provocou perdas humanas e econômicas enormes. A reconstrução posterior marcou instituições e memória coletiva por gerações. Arquitetura e música das missões testemunham encontros culturais nem sempre equilibrados.')
  ],
  Peru: [
    point('🏛️', 'Civilizações andinas', 'Muito antes dos incas, sociedades andinas desenvolveram cidades, agricultura e obras monumentais. O Império Inca articulou vastas redes de caminhos e administração.'),
    point('⛪', 'Vice-reino e transformação', 'A conquista espanhola desfez o poder inca e fez de Lima um centro colonial. Mineração, cristianização e trabalho coercitivo transformaram a sociedade andina.'),
    point('📜', 'Independência e legado', 'A independência foi proclamada em 1821 e consolidada militarmente nos anos seguintes. Línguas, culinárias e sítios arqueológicos revelam uma história mais longa que o Estado republicano. Machu Picchu é apenas uma parte desse patrimônio material ainda estudado.')
  ],
  Suriname: [
    point('🪶', 'Povos do interior', 'Comunidades indígenas habitavam a região antes da colonização. Rios e florestas continuaram sendo espaços de vida e circulação fora do controle das plantações costeiras.'),
    point('🌾', 'Colônia neerlandesa', 'Plantações com trabalho de africanos escravizados moldaram a costa; comunidades maroons construíram autonomia no interior. Trabalhadores contratados da Índia e de Java ampliaram a diversidade.'),
    point('📜', 'Independência plural', 'O Suriname tornou-se independente dos Países Baixos em 1975. Sua sociedade reúne línguas, religiões e tradições que testemunham várias histórias de migração e resistência. Paramaribo conserva arquitetura de madeira ligada ao período colonial.')
  ],
  Uruguay: [
    point('🪶', 'Antes do Estado', 'Povos indígenas, entre eles os charruas, viveram na região do Rio da Prata. A expansão colonial e republicana reduziu violentamente suas comunidades e territórios.'),
    point('📜', 'Entre dois impérios', 'Disputado por forças espanholas, portuguesas, brasileiras e platinas, o território tornou-se independente em 1828. Montevidéu cresceu como porto estratégico do Atlântico sul.'),
    point('🏛️', 'Reformas e democracia', 'Reformas sociais do início do século XX ajudaram a formar um Estado laico e de proteção social. Após a ditadura de 1973 a 1985, a democracia foi restaurada. O candombe mantém viva a contribuição histórica afro-uruguaia.')
  ],
  Venezuela: [
    point('🪶', 'Povos e regiões', 'Comunidades indígenas diversas habitavam costa, planícies e áreas amazônicas antes da colonização espanhola. Suas línguas e trajetórias seguem presentes na Venezuela.'),
    point('📜', 'Independência continental', 'Campanhas associadas a Simón Bolívar foram decisivas na ruptura com a Espanha. A região integrou a Grã-Colômbia antes de se organizar como Estado separado.'),
    point('🛢️', 'Século do petróleo', 'A exploração petrolífera transformou cidades, economia e relações internacionais no século XX. Sua centralidade ajuda a compreender tanto projetos de modernização quanto desigualdades persistentes. O papel de Bolívar conectou essa trajetória à independência de vários países andinos.')
  ],
  'Fr. Guiana': [
    point('🪶', 'Povos da floresta e dos rios', 'Povos indígenas habitavam a região antes da colonização francesa. Comunidades maroons, formadas por descendentes de pessoas que escaparam da escravidão, também marcaram sua história.'),
    point('⛓️', 'Colônia e prisões', 'A França organizou plantações e, no século XIX, estabeleceu colônias penais como as da Ilha do Diabo. Esse passado permanece visível em antigos edifícios e museus.'),
    point('🚀', 'Território francês hoje', 'A Guiana Francesa tornou-se departamento ultramarino em 1946; não é um país independente. O centro espacial de Kourou acrescentou uma nova dimensão à sua posição atlântica. Línguas indígenas e crioulas revelam trajetórias locais distintas.')
  ],
  Albania: [
    point('🏛️', 'Encruzilhada balcânica', 'Povos antigos do Adriático, entre eles os ilírios, deixaram marcas na região. Influências romanas e bizantinas antecederam as formações políticas medievais.'),
    point('⚔️', 'Séculos otomanos', 'A resistência associada a Skanderbeg tornou-se referência histórica, mas a maior parte do território permaneceu sob domínio otomano por séculos. Religiões e arquitetura refletem essa convivência.'),
    point('📜', 'Independência e abertura', 'A independência foi declarada em 1912. O isolamento durante o regime comunista do século XX terminou com mudanças políticas a partir de 1990. Berat e Gjirokastër preservam exemplos arquitetônicos dessas camadas históricas, hoje valorizados como patrimônio mundial.')
  ],
  Andorra: [
    point('🏔️', 'Comunidades dos Pireneus', 'Vilas de montanha cresceram entre rotas e poderes vizinhos. A posição entre os atuais territórios francês e espanhol moldou instituições próprias.'),
    point('👑', 'Coprincipado', 'Os acordos de 1278 estabeleceram a partilha de autoridade que originou o coprincipado. A continuidade dessa fórmula ajuda a explicar a sobrevivência de Andorra como Estado pequeno.'),
    point('📜', 'Constituição moderna', 'A Constituição de 1993 consolidou a democracia parlamentar e a soberania internacional. O país manteve seus copríncipes, mas o governo passou a responder a instituições eleitas. Igrejas românicas e aldeias antigas tornam visível essa longa continuidade.')
  ],
  Austria: [
    point('👑', 'Centro dos Habsburgo', 'Viena foi capital de uma monarquia que governou povos de várias línguas na Europa Central. Palácios e museus preservam a escala desse antigo poder.'),
    point('🎼', 'Vida intelectual', 'Música, arquitetura e pensamento científico floresceram na capital imperial. A importância de Viena vai além da política: suas obras circularam pelo continente.'),
    point('⚔️', 'Fim do império', 'A Primeira Guerra Mundial encerrou a monarquia em 1918. A Áustria tornou-se república e, após a experiência do nazismo e da Segunda Guerra, reconstruiu suas instituições.'),
    point('📜', 'Soberania renovada', 'O tratado de 1955 restaurou a plena soberania e veio acompanhado da neutralidade permanente. Essa escolha marcou sua posição na Europa da Guerra Fria.')
  ],
  Belarus: [
    point('🏛️', 'Terras de fronteira', 'Principados como Polotsk e, depois, o Grão-Ducado da Lituânia fizeram parte da história da região. Línguas e tradições locais surgiram nesse espaço de encontros.'),
    point('👑', 'Impérios e república soviética', 'Após as partilhas da Comunidade Polaco-Lituana, grande parte do território passou ao Império Russo. O século XX trouxe revoluções, domínio soviético e perdas enormes na Segunda Guerra.'),
    point('📜', 'Independência', 'A Bielorrússia tornou-se independente em 1991, com o fim da União Soviética. Memórias da guerra e a preservação da cultura bielorrussa seguem importantes para entender o país. Monumentos e cemitérios registram especialmente a destruição da guerra.')
  ],
  Belgium: [
    point('🧭', 'Cidades e comércio', 'Cidades flamengas foram centros de tecidos, arte e trocas na Europa medieval e moderna. Regiões de línguas diferentes formaram trajetórias históricas próprias.'),
    point('📜', 'Estado independente', 'A revolução de 1830 criou a Bélgica independente. No século XIX, mineração e indústria fizeram do país um dos primeiros polos industriais do continente.'),
    point('🌍', 'Império e memória', 'A dominação belga no Congo produziu violência e exploração, tema hoje central na memória histórica. O passado colonial também aparece em museus e debates públicos.'),
    point('🏛️', 'Europa contemporânea', 'A organização federal busca acomodar comunidades linguísticas. Bruxelas tornou-se sede de instituições europeias, dando ao país um papel diplomático maior que seu tamanho.')
  ],
  'Bosnia and Herz.': [
    point('🏰', 'Reino medieval', 'A Bósnia medieval desenvolveu instituições próprias antes da expansão otomana. Fortalezas e necrópoles lembram esse período de contatos entre tradições religiosas.'),
    point('🕌', 'Impérios sucessivos', 'O domínio otomano e, depois, o austro-húngaro transformaram cidades, arquitetura e administração. Essa sobreposição explica parte da diversidade cultural do país.'),
    point('🕊️', 'Iugoslávia e pós-guerra', 'Após integrar a Iugoslávia, a Bósnia e Herzegovina declarou independência em 1992. A guerra terminou com os acordos de Dayton, em 1995, deixando memória e instituições complexas. Sarajevo expressa essa convivência e os desafios de preservá-la depois do conflito.')
  ],
  Bulgaria: [
    point('🏛️', 'Antiguidade e medievo', 'Trácios, romanos e bizantinos marcaram o território. Os estados búlgaros medievais criaram centros políticos e culturais importantes nos Bálcãs.'),
    point('📚', 'Letras eslavas', 'Escolas literárias medievais da região ajudaram a difundir a escrita cirílica e textos cristãos. Esse legado ultrapassou as fronteiras da Bulgária.'),
    point('📜', 'Do domínio otomano à república', 'Após séculos de governo otomano, a autonomia e a independência avançaram no fim do século XIX e início do XX. O regime socialista terminou com a transição política de 1989. Mosteiros e manuscritos preservam vestígios dessa produção cultural em diferentes épocas.')
  ],
  Croatia: [
    point('🏰', 'Reinos e litoral', 'A história croata reúne um reino medieval e cidades adriáticas ligadas a Veneza. A costa preserva camadas romanas, medievais e renascentistas.'),
    point('👑', 'Uniões e impérios', 'Partes do território estiveram sob coroas húngaras e Habsburgo, enquanto áreas costeiras seguiram outros circuitos. Essa diversidade explica diferenças regionais visíveis hoje.'),
    point('📜', 'Iugoslávia e independência', 'No século XX, a Croácia integrou a Iugoslávia. A independência de 1991 foi seguida por guerra; reconstrução e integração europeia marcaram as décadas posteriores. Dubrovnik e Split mostram a continuidade das antigas rotas adriáticas na paisagem urbana.')
  ],
  Cyprus: [
    point('🧭', 'Ilha de encontros', 'Localizado entre Europa, Ásia e África, Chipre participou de redes comerciais desde a Antiguidade. Sítios arqueológicos revelam influências gregas, romanas e de outros povos mediterrâneos.'),
    point('👑', 'Domínios sucessivos', 'Bizantinos, venezianos, otomanos e britânicos deixaram marcas na ilha. A convivência histórica de comunidades greco-cipriota e turco-cipriota é parte essencial dessa trajetória.'),
    point('📜', 'Independência e divisão', 'Chipre tornou-se independente do Reino Unido em 1960. Após a crise de 1974, a ilha permaneceu dividida; sua história recente exige atenção às experiências de ambas as comunidades. Nicósia permanece um símbolo visível das consequências desse processo.')
  ],
  'Czech Rep.': [
    point('🏰', 'Boêmia histórica', 'Praga e a Boêmia foram centros políticos e culturais do Sacro Império e, depois, da monarquia dos Habsburgo. Universidades e arquitetura testemunham esse passado.'),
    point('📜', 'Checoslováquia', 'O novo Estado surgiu em 1918, após a Primeira Guerra. A ocupação nazista e o regime comunista posterior marcaram profundamente o século XX.'),
    point('🕊️', 'Veludo e separação', 'A Revolução de Veludo de 1989 encerrou o governo comunista. Em 1993, a Tchéquia tornou-se independente por meio de uma separação negociada com a Eslováquia. Praga conserva vestígios arquitetônicos de todas essas fases políticas.')
  ],
  Denmark: [
    point('⛵', 'Era viking', 'Navegadores e comerciantes da região conectaram o Báltico ao Atlântico na Idade Média. Sua circulação deixou marcas em rotas, assentamentos e línguas do norte europeu.'),
    point('👑', 'Reino e mares', 'A monarquia dinamarquesa governou territórios escandinavos em diferentes períodos e controlou passagens marítimas estratégicas. Copenhague cresceu como centro político e comercial.'),
    point('📜', 'Reformas modernas', 'A transição para a monarquia constitucional no século XIX ampliou a representação política. No século XX, políticas sociais ajudaram a formar o conhecido Estado de bem-estar. A tradição de design e planejamento urbano se desenvolveu nesse contexto de reformas.')
  ],
  Estonia: [
    point('🧭', 'Báltico medieval', 'Comunidades estonianas viveram sob sucessivos poderes germânicos, suecos e russos. Tallinn integrou redes comerciais do norte europeu, visíveis em seu centro histórico.'),
    point('📜', 'Duas independências', 'A Estônia tornou-se independente em 1918. A ocupação soviética durante a Segunda Guerra interrompeu essa soberania, restaurada em 1991.'),
    point('🎵', 'Cultura como resistência', 'Festivais de canto e mobilização cívica tiveram papel simbólico na chamada Revolução Cantada. A preservação da língua estoniana foi central para a identidade nacional. A cadeia humana conhecida como Via Báltica, em 1989, conectou esse movimento às outras repúblicas bálticas.')
  ],
  Finland: [
    point('👑', 'Entre Suécia e Rússia', 'Por séculos, a região integrou o reino sueco; no século XIX tornou-se grão-ducado no Império Russo. Essas camadas aparecem nas instituições e cidades.'),
    point('📚', 'Identidade cultural', 'O fortalecimento do finlandês e obras como o Kalevala alimentaram movimentos nacionais. Cultura e educação ajudaram a construir uma identidade política própria.'),
    point('📜', 'Independência e guerras', 'A Finlândia declarou independência em 1917. A Guerra de Inverno e a Segunda Guerra exigiram decisões difíceis; reconstrução e reformas sociais transformaram o país no pós-guerra. A memória dessas guerras permanece presente em museus e monumentos.')
  ],
  France: [
    point('🏛️', 'Da Gália ao reino', 'O território reúne heranças gaulesas, romanas e francas. Na Idade Média e na era moderna, a monarquia ampliou seu poder e projetou a cultura francesa.'),
    point('💡', 'Ideias e revolução', 'O Iluminismo influenciou debates sobre governo e direitos. A Revolução de 1789 derrubou a ordem absolutista e inspirou mudanças políticas muito além da França.'),
    point('⚔️', 'Império e repúblicas', 'As guerras napoleônicas redesenharam a Europa; depois vieram industrialização, expansão colonial e sucessivas repúblicas. O passado imperial permanece tema de reflexão histórica.'),
    point('🌍', 'Legado contemporâneo', 'Resistência, reconstrução após a Segunda Guerra e integração europeia ajudaram a formar a França atual. Direito, artes e pensamento político são parte de sua influência global.')
  ],
  Germany: [
    point('🏰', 'Muitos estados alemães', 'Principados e cidades do Sacro Império desenvolveram tradições diversas. A Reforma protestante iniciada no século XVI alterou a religião e a política europeias.'),
    point('🏗️', 'Unificação e indústria', 'A unificação de 1871 criou um Estado nacional poderoso. Indústria, ciência e movimentos sociais cresceram rapidamente, em meio a tensões que levaram às guerras mundiais.'),
    point('🕯️', 'Ditadura e memória', 'O regime nazista promoveu guerra e genocídio, incluindo o Holocausto. A preservação de memoriais e a educação histórica são fundamentais para compreender esse período.'),
    point('🕊️', 'Divisão e reunificação', 'Após 1945, a Alemanha foi dividida em dois Estados. A queda do Muro de Berlim em 1989 abriu caminho para a reunificação de 1990 e uma nova posição europeia.')
  ],
  Greece: [
    point('🏛️', 'Cidades antigas', 'Pólis como Atenas e Esparta desenvolveram formas políticas distintas. Filosofia, teatro, ciência e arte gregas deixaram legados duradouros, sem representar uma única sociedade uniforme.'),
    point('⛪', 'Mundos bizantino e otomano', 'A região integrou o Império Romano do Oriente e depois, em grande parte, o domínio otomano. Igrejas, mosteiros e cidades preservam essas camadas.'),
    point('📜', 'Estado moderno', 'A guerra de independência no século XIX abriu caminho para o Estado grego. Mudanças políticas posteriores, inclusive a restauração democrática em 1974, moldaram a república atual. Ruínas e mosteiros tornam essa continuidade especialmente visível.')
  ],
  Hungary: [
    point('👑', 'Reino dos magiares', 'A formação do reino medieval inseriu a Hungria nas redes políticas e cristãs da Europa Central. Budapeste e outras cidades preservam séculos de trocas culturais.'),
    point('⚔️', 'Impérios e fronteiras', 'Após conflitos com os otomanos, o território passou à órbita dos Habsburgo. O acordo de 1867 fez de Budapeste um dos centros da monarquia austro-húngara.'),
    point('📜', 'Século XX', 'O tratado de Trianon redesenhou fronteiras após a Primeira Guerra. A revolta de 1956 e a transição de 1989 marcaram a história sob e após o socialismo. Museus de Budapeste registram essas rupturas.')
  ],
  Iceland: [
    point('⛵', 'Povoamento nórdico', 'Colonizadores nórdicos estabeleceram comunidades na ilha a partir do século IX. O Alþingi, criado por volta de 930, tornou-se referência importante de assembleia política.'),
    point('📚', 'Sagas e memória', 'As sagas medievais registraram histórias familiares, viagens e conflitos. São fontes valiosas, embora misturem lembrança, tradição literária e interpretação.'),
    point('📜', 'República independente', 'Após séculos ligados às coroas norueguesa e dinamarquesa, a Islândia tornou-se república em 1944. Pesca, educação e cultura moldaram sua trajetória contemporânea. A língua islandesa preserva afinidades com o nórdico antigo, facilitando uma relação singular com os textos medievais.')
  ],
  Ireland: [
    point('📚', 'Reinos e mosteiros', 'Tradições gaélicas e centros monásticos produziram manuscritos e redes de ensino na Idade Média. Sua herança permanece visível na língua, na literatura e nos sítios históricos.'),
    point('⚔️', 'Domínio britânico e fome', 'Séculos de controle inglês e britânico transformaram terra e religião. A Grande Fome do século XIX causou morte e emigração em escala profunda.'),
    point('📜', 'Independência e partição', 'A luta pela autonomia levou à criação do Estado Livre Irlandês em 1922; a Irlanda do Norte permaneceu no Reino Unido. A república desenvolveu caminho político próprio.'),
    point('🌍', 'Diáspora e cultura', 'Comunidades irlandesas espalhadas pelo mundo deram projeção à música e à literatura do país. A memória da emigração é parte essencial de sua história social.')
  ],
  Italy: [
    point('🏛️', 'Roma e o Mediterrâneo', 'A República e o Império Romano moldaram direito, infraestrutura e cidades em vastas regiões. Monumentos italianos mostram tanto sua grandeza quanto a complexidade desse mundo antigo.'),
    point('🎨', 'Cidades do Renascimento', 'Florença, Veneza e outras cidades estimularam artes, ciência, bancos e comércio. O Renascimento italiano difundiu novas linguagens visuais e intelectuais pela Europa.'),
    point('📜', 'Unificação', 'Durante séculos, a península reuniu estados distintos. O movimento do Risorgimento levou à formação do Reino da Itália no século XIX, sem eliminar diferenças regionais.'),
    point('🕊️', 'República moderna', 'Após o fascismo e a Segunda Guerra, um referendo de 1946 encerrou a monarquia. A república reconstruiu suas instituições e participou da integração europeia.')
  ],
  Kosovo: [
    point('🏰', 'Heranças medievais', 'A região preserva mosteiros ortodoxos sérvios e tradições albanesas, entre outras camadas culturais. Diferentes comunidades atribuem sentidos próprios a esse patrimônio.'),
    point('🕌', 'Império e Iugoslávia', 'Após séculos sob domínio otomano, Kosovo passou a integrar a Sérvia e, depois, a Iugoslávia. Mudanças demográficas e políticas marcaram o século XX.'),
    point('🕊️', 'Guerra e status atual', 'O conflito de 1998–1999 trouxe deslocamentos e violência. Kosovo declarou independência em 2008; muitos países a reconhecem, enquanto a Sérvia não, tornando seu status tema diplomático. Mosteiros e centros urbanos carregam memórias importantes para comunidades com narrativas diferentes.')
  ],
  Latvia: [
    point('🧭', 'Portos do Báltico', 'Povos bálticos viveram em uma região conectada ao comércio hanseático. Riga tornou-se cidade portuária importante sob diferentes poderes europeus.'),
    point('📜', 'Independência interrompida', 'A Letônia declarou independência em 1918. Ocupações soviética e nazista durante a Segunda Guerra, seguidas por décadas de domínio soviético, deixaram marcas profundas.'),
    point('🎵', 'Retorno da soberania', 'Mobilizações cívicas e culturais ajudaram a restaurar a independência em 1991. A língua letã e a tradição coral são elementos centrais da memória nacional. A Via Báltica de 1989 reuniu manifestantes dos três países bálticos em defesa da liberdade.')
  ],
  Liechtenstein: [
    point('🏰', 'Principado alpino', 'O principado foi criado em 1719 dentro do Sacro Império Romano-Germânico. Seu nome veio da família que adquiriu os territórios de Vaduz e Schellenberg.'),
    point('📜', 'Soberania preservada', 'Com o fim do Sacro Império em 1806, Liechtenstein manteve sua existência política entre vizinhos muito maiores. A monarquia constitucional evoluiu ao longo do século XX.'),
    point('🤝', 'Laços regionais', 'A aproximação econômica com a Suíça marcou a vida moderna do país. Essa integração mostra como um pequeno Estado preservou autonomia por meio de instituições e acordos. Vaduz conserva edifícios ligados à dinastia e ao parlamento.')
  ],
  Lithuania: [
    point('👑', 'Grão-Ducado', 'Na Idade Média, o Grão-Ducado da Lituânia estendeu-se por grande parte da Europa Oriental. A união com a Polônia criou uma comunidade política de longa duração.'),
    point('📜', 'Soberania e ocupações', 'Após partilhas e domínio imperial, a Lituânia declarou independência em 1918. A Segunda Guerra e a incorporação soviética interromperam esse período.'),
    point('🕊️', 'Restauração', 'Em 1990, o país proclamou a restauração da independência, antes da dissolução da União Soviética. Vilnius conserva traços de heranças religiosas e linguísticas diversas. A Via Báltica simbolizou a mobilização pacífica de 1989.')
  ],
  Luxembourg: [
    point('🏰', 'Fortaleza europeia', 'O núcleo medieval de Luxemburgo cresceu em torno de uma posição fortificada. Por séculos, potências vizinhas disputaram seu controle estratégico.'),
    point('📜', 'Estado próprio', 'Os acordos do século XIX consolidaram a independência e a neutralidade do grão-ducado. Suas instituições se desenvolveram entre influências germânicas e francófonas.'),
    point('🏗️', 'Aço e integração', 'A siderurgia impulsionou a economia moderna. Luxemburgo participou da fundação das comunidades europeias, tornando-se um dos centros institucionais da integração continental. A antiga fortaleza, por muito tempo cobiçada, tornou-se patrimônio mundial e recorda a posição do país entre grandes vizinhos.')
  ],
  Malta: [
    point('🏛️', 'Ilhas antigas', 'Templos pré-históricos mostram ocupação humana muito anterior aos impérios mediterrâneos. A posição entre Europa e África fez de Malta um ponto de contato e disputa.'),
    point('⚔️', 'Cavaleiros e fortalezas', 'A Ordem de São João governou as ilhas por séculos. Valletta e suas fortificações refletem o papel militar e marítimo desse período.'),
    point('📜', 'Século XX e independência', 'Sob domínio britânico, Malta teve importância estratégica na Segunda Guerra. Tornou-se independente em 1964 e república em 1974, preservando uma cultura de raízes diversas. O idioma maltês sintetiza influências semíticas e europeias dessa história mediterrânea.')
  ],
  Moldova: [
    point('👑', 'Principado da Moldávia', 'Partes do atual território integraram o principado medieval da Moldávia. Sua posição entre impérios favoreceu contatos culturais, mas também disputas de soberania.'),
    point('🧭', 'Bessarábia', 'A região entre Prut e Dniestre passou ao Império Russo no século XIX; no século XX esteve ligada à Romênia e depois à União Soviética.'),
    point('📜', 'Independência recente', 'A Moldávia tornou-se independente em 1991. O conflito em torno da Transnístria e debates sobre língua e identidade seguem ligados a essa trajetória histórica. Vinhedos e mosteiros testemunham continuidades locais apesar das mudanças de fronteira.')
  ],
  Monaco: [
    point('🏰', 'Casa de Grimaldi', 'A família Grimaldi consolidou seu domínio sobre Mônaco na Idade Média. O rochedo e o porto ajudam a explicar a importância estratégica do pequeno principado.'),
    point('📜', 'Soberania negociada', 'Tratados com a França no século XIX definiram fronteiras e reconheceram a independência monegasca. A constituição ampliou gradualmente a organização institucional.'),
    point('🎭', 'Nova economia', 'Cassino, turismo e vida cultural transformaram Mônaco desde o século XIX. A imagem de luxo nasceu de decisões econômicas, não apenas de sua antiga história dinástica. O Museu Oceanográfico recorda o investimento dos príncipes em ciência marítima.')
  ],
  Montenegro: [
    point('🏔️', 'Terras montanhosas', 'Formações políticas medievais como Zeta antecederam Montenegro. Comunidades das montanhas preservaram autonomia relativa em meio à expansão otomana.'),
    point('📜', 'Estado reconhecido', 'A independência montenegrina foi reconhecida internacionalmente em 1878. Depois, o território integrou diferentes formas de Estado iugoslavo ao longo do século XX.'),
    point('🕊️', 'Novo capítulo', 'Em referendo de 2006, Montenegro optou pela separação da união estatal com a Sérvia. O litoral adriático e a antiga capital Cetinje revelam camadas dessa história. Antigas cidades costeiras como Kotor guardam marcas de comércio e governo veneziano por séculos.')
  ],
  Netherlands: [
    point('🧭', 'Cidades mercantis', 'Territórios dos atuais Países Baixos cresceram em torno de portos, canais e comércio. A luta contra a água também estimulou formas duradouras de cooperação local.'),
    point('📜', 'República neerlandesa', 'A revolta contra o domínio dos Habsburgo espanhóis levou à independência. No século XVII, a república tornou-se potência financeira e marítima.'),
    point('🌍', 'Expansão e escravidão', 'Companhias comerciais atuaram na Ásia, África e Américas. A riqueza desse período esteve ligada à colonização e ao tráfico de pessoas escravizadas.'),
    point('🏛️', 'Reino moderno', 'Transformações do século XIX formaram a monarquia constitucional atual. Museus e cidades históricas permitem observar tanto realizações artísticas quanto debates sobre o passado colonial.')
  ],
  Macedonia: [
    point('🏛️', 'Camadas balcânicas', 'O território atual reúne heranças antigas, bizantinas e eslavas. Ohrid tornou-se importante centro religioso e cultural medieval da região.'),
    point('🕌', 'Séculos otomanos', 'O domínio otomano deixou marcas urbanas e culturais. No século XX, a região passou a integrar a Iugoslávia, onde se desenvolveram instituições republicanas próprias.'),
    point('📜', 'Estado contemporâneo', 'A independência foi declarada em 1991. O acordo que levou ao nome Macedônia do Norte em 2019 resolveu uma longa disputa diplomática com a Grécia. O lago e os monumentos de Ohrid ajudam a compreender sua importância religiosa medieval.')
  ],
  Norway: [
    point('⛵', 'Rotas nórdicas', 'A era viking conectou a costa norueguesa a ilhas e portos do Atlântico. Navegação, comércio e comunidades rurais moldaram a história medieval.'),
    point('👑', 'Uniões escandinavas', 'A Noruega esteve por séculos unida à Dinamarca e depois à Suécia. A separação negociada de 1905 restaurou sua independência.'),
    point('🏗️', 'Recursos e sociedade', 'Pesca, navegação e, mais tarde, petróleo e gás transformaram a economia. A gestão desses recursos ajudou a sustentar instituições públicas e o Estado social. Museus de Oslo e antigos portos costeiros revelam a passagem entre economia marítima e moderna.')
  ],
  Poland: [
    point('👑', 'Reino e comunidade política', 'A Polônia medieval cresceu sob a dinastia Piast. Mais tarde, a união com a Lituânia formou uma das maiores entidades políticas da Europa.'),
    point('⚔️', 'Partilhas e guerras', 'Potências vizinhas dividiram seu território no fim do século XVIII. A independência voltou em 1918, mas a Segunda Guerra trouxe ocupação, destruição e genocídio.'),
    point('🕊️', 'Solidariedade e democracia', 'Sob governo comunista no pós-guerra, o movimento Solidariedade reuniu trabalhadores e opositores. A transição de 1989 ajudou a encerrar a divisão política da Europa. A reconstrução do centro histórico de Varsóvia tornou-se símbolo dessa capacidade de recuperação.')
  ],
  Portugal: [
    point('🏰', 'Formação do reino', 'O reino português consolidou-se na Idade Média na Península Ibérica. Língua, instituições e cidades cresceram em diálogo com outros povos peninsulares.'),
    point('⛵', 'Expansão marítima', 'Navegadores portugueses abriram rotas atlânticas e para o Índico. O império conectou continentes, mas também participou da colonização e do tráfico de africanos escravizados.'),
    point('📜', 'República e ditadura', 'A monarquia terminou em 1910. Depois, décadas de regime autoritário restringiram liberdades e mantiveram guerras coloniais na África.'),
    point('🌹', 'Revolução dos Cravos', 'O movimento de 1974 abriu caminho à democracia e à descolonização. Essa transformação ainda orienta a memória política e as relações de Portugal com países lusófonos.')
  ],
  Romania: [
    point('🏛️', 'Heranças antigas', 'Povos dácios e a presença romana deixaram marcas duradouras, inclusive na língua romena. A região também recebeu influências eslavas, húngaras e otomanas.'),
    point('👑', 'Principados e união', 'Valáquia e Moldávia tiveram trajetórias próprias antes de sua união no século XIX. A independência em relação ao Império Otomano foi reconhecida em 1878.'),
    point('📜', 'Século XX', 'Guerras, mudanças territoriais e um regime comunista transformaram o país. A revolução de 1989 encerrou a ditadura e abriu a transição democrática. Mosteiros da Bucovina e cidades da Transilvânia mostram a variedade de tradições regionais.')
  ],
  Russia: [
    point('🏰', 'Principados e Moscóvia', 'A formação russa envolveu vários principados eslavos orientais e contatos com povos da estepe. Moscou tornou-se centro de um Estado em expansão.'),
    point('👑', 'Império continental', 'Czares ampliaram o território por séculos, reunindo povos e línguas diversas. Reformas, arte e literatura circularam junto com conflitos sociais e dominação imperial.'),
    point('⚔️', 'Revolução e União Soviética', 'As revoluções de 1917 derrubaram a monarquia. A industrialização soviética, repressões e a vitória na Segunda Guerra moldaram a história mundial do século XX.'),
    point('📜', 'Era pós-soviética', 'A dissolução da União Soviética em 1991 criou a Federação Russa. Instituições, economia e relações com antigas repúblicas passaram por mudanças profundas.')
  ],
  'San Marino': [
    point('🏔️', 'República de montanha', 'A tradição local situa suas origens na Antiguidade tardia. Comunidades no monte Titano desenvolveram formas de autogoverno em meio às cidades-estado italianas.'),
    point('📜', 'Instituições duradouras', 'Estatutos antigos e magistraturas colegiadas ajudaram San Marino a preservar autonomia. Sua continuidade republicana é um caso raro na história europeia.'),
    point('🤝', 'Entre vizinhos maiores', 'O território atravessou a unificação italiana sem perder soberania. A história do país mostra como diplomacia e instituições podem sustentar um Estado muito pequeno. Suas torres medievais são símbolos materiais dessa persistência política entre os estados italianos.')
  ],
  Serbia: [
    point('🏰', 'Reino medieval', 'Estados sérvios medievais e mosteiros ortodoxos deixaram patrimônio importante nos Bálcãs. A expansão otomana mudou profundamente a organização da região.'),
    point('📜', 'Independência moderna', 'Revoltas do século XIX ampliaram a autonomia sérvia; a independência recebeu reconhecimento internacional em 1878. O país participou das disputas balcânicas seguintes.'),
    point('⚔️', 'Século iugoslavo', 'Após a Primeira Guerra, a Sérvia integrou um Estado sul-eslavo que depois se tornou a Iugoslávia. Sua dissolução no fim do século XX trouxe guerras e deslocamentos.'),
    point('🧭', 'Estado atual', 'Desde 2006, a Sérvia segue separada da união estatal com Montenegro. Relações com Kosovo permanecem uma questão histórica e diplomática sensível.')
  ],
  Slovakia: [
    point('🏰', 'Europa Central medieval', 'O território participou de formações eslavas medievais e, por séculos, do Reino da Hungria. Castelos e centros urbanos mostram essa história compartilhada.'),
    point('📜', 'Checoslováquia', 'Após a Primeira Guerra, os eslovacos integraram a Checoslováquia. A Segunda Guerra e, depois, o regime comunista alteraram profundamente a vida política.'),
    point('🕊️', 'Estado independente', 'A Revolução de Veludo de 1989 abriu a democracia. Em 1993, a separação negociada com a Tchéquia criou a atual República Eslovaca. Bratislava guarda sinais do período húngaro e da construção posterior da identidade eslovaca moderna.')
  ],
  Slovenia: [
    point('🧭', 'Entre Alpes e Adriático', 'Terras eslovenas estiveram ligadas por séculos aos Habsburgo e a redes comerciais centro-europeias e mediterrâneas. Essa posição aparece em cidades e tradições locais.'),
    point('📜', 'Século iugoslavo', 'Após a Primeira Guerra, a região integrou o Estado dos eslavos do sul, depois Iugoslávia. A língua eslovena permaneceu fundamental à identidade cultural.'),
    point('🕊️', 'Independência', 'A Eslovênia declarou independência em 1991, após um conflito curto. A transição democrática e a integração europeia marcaram sua trajetória posterior. Ljubljana combina vestígios desse passado com intervenções urbanas importantes do século XX, ainda visíveis.')
  ],
  Spain: [
    point('🏛️', 'Península de muitas heranças', 'Romanos, reinos cristãos e sociedades de Al-Andalus moldaram línguas, cidades e saberes. A diversidade regional é parte constitutiva da história espanhola.'),
    point('👑', 'Coroas e império', 'A união dinástica de Castela e Aragão fortaleceu a monarquia. A expansão ultramarina criou redes globais, acompanhadas de conquista, exploração colonial e circulação cultural.'),
    point('⚔️', 'Guerra Civil e ditadura', 'A Guerra Civil de 1936 a 1939 precedeu décadas de governo franquista. Sua memória segue presente em debates sobre justiça e democracia.'),
    point('📜', 'Transição democrática', 'Após 1975, reformas levaram à Constituição de 1978 e à monarquia parlamentar. Autonomias regionais passaram a organizar parte importante do Estado contemporâneo.')
  ],
  Sweden: [
    point('⛵', 'Báltico e era viking', 'Comunidades da região navegaram e comerciaram pelo norte europeu e além. A monarquia sueca consolidou-se gradualmente durante a Idade Média.'),
    point('👑', 'Potência regional', 'Nos séculos XVII e início do XVIII, a Suécia exerceu grande poder no Báltico. Guerras e mudanças de fronteira encerraram essa fase de expansão.'),
    point('📜', 'Reformas sociais', 'A monarquia constitucional e a ampliação do voto abriram caminho a políticas de bem-estar no século XX. Trabalho, educação e igualdade tornaram-se temas centrais. A ampliação da educação e da participação política acompanhou essa transformação social.')
  ],
  Switzerland: [
    point('🏔️', 'Cantões alpinos', 'Alianças entre comunidades e cantões se desenvolveram ao longo da Idade Média. A confederação reuniu línguas e tradições religiosas diferentes.'),
    point('📜', 'Estado federal', 'A Constituição de 1848 criou o Estado federal moderno após conflitos internos. O arranjo preservou ampla autonomia cantonal e mecanismos de participação política.'),
    point('🌍', 'Neutralidade e encontros', 'A tradição de neutralidade influenciou seu papel diplomático. Genebra tornou-se sede de organizações internacionais, somando uma dimensão humanitária à história suíça. Basileia, Zurique e outros centros também participaram de redes de imprensa, ciência e comércio europeus de alcance internacional.')
  ],
  Ukraine: [
    point('🏰', 'Raízes compartilhadas', 'Kyiv foi centro de uma formação medieval importante para vários povos eslavos orientais. Tradições religiosas, linguísticas e políticas desenvolveram-se por caminhos diversos depois dela.'),
    point('⚔️', 'Cossacos e impérios', 'O Hetmanato cossaco foi uma experiência política relevante. Nos séculos seguintes, territórios ucranianos estiveram sob diferentes poderes, entre eles os impérios Russo e Habsburgo.'),
    point('🕯️', 'Século XX difícil', 'O Holodomor, a Segunda Guerra e o domínio soviético deixaram perdas profundas. A preservação da língua e da cultura acompanhou movimentos por autonomia.'),
    point('📜', 'Independência e soberania', 'A Ucrânia tornou-se independente em 1991. Desde 2014, e sobretudo após a invasão russa de 2022, a defesa de sua soberania marca a história recente.')
  ],
  'United Kingdom': [
    point('👑', 'União de reinos', 'Inglaterra, Escócia, País de Gales e Irlanda do Norte têm trajetórias próprias. Uniões políticas sucessivas criaram o Estado atual sem apagar identidades nacionais distintas.'),
    point('🏛️', 'Parlamento e império', 'Conflitos entre Coroa e Parlamento influenciaram a monarquia constitucional. O império britânico conectou continentes, mas também envolveu colonização e tráfico de pessoas escravizadas.'),
    point('🏗️', 'Revolução Industrial', 'Novas máquinas, fábricas e ferrovias transformaram trabalho e cidades a partir do século XVIII. Essas mudanças se difundiram globalmente, junto com desigualdades sociais.'),
    point('🌍', 'Século XX e legado', 'Duas guerras mundiais, descolonização e criação de serviços públicos remodelaram o país. Seu direito, literatura, ciência e cultura popular mantêm influência internacional.')
  ]
});
