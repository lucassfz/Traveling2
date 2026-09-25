// Blocos históricos para os destinos classificados como Ásia no catálogo atual.
const p = (icon, title, text) => ({ icon, title, text });

export const ASIA_HISTORY = Object.freeze({
  Afghanistan: [
    p('🧭', 'Rotas de encontro', 'A região ligou planaltos iranianos, Índia e Ásia Central. Bamiyan preserva vestígios budistas e artísticos de intercâmbios ocorridos ao longo das rotas da seda.'),
    p('🕌', 'Cortes e cidades', 'Dinastias islâmicas fizeram de Herat e outras cidades centros de literatura, arquitetura e comércio. A influência timúrida marcou fortemente a produção artística regional.'),
    p('📜', 'Estado moderno', 'No século XVIII, a dinastia Durrani reuniu territórios que ajudaram a formar o Afeganistão. Rivalidades entre potências vizinhas influenciaram sua autonomia posterior.'),
    p('🕊️', 'Rupturas recentes', 'Guerras desde o fim do século XX provocaram deslocamentos e danos ao patrimônio. Comunidades seguem preservando línguas, música e saberes apesar dessas rupturas.')
  ],
  Armenia: [
    p('👑', 'Reinos antigos', 'Reinos armênios surgiram entre poderes romanos e persas. A adoção do cristianismo no início do século IV tornou-se marco duradouro de sua identidade histórica.'),
    p('📚', 'Escrita e mosteiros', 'O alfabeto armênio, criado no século V, fortaleceu literatura e transmissão religiosa. Mosteiros preservam manuscritos e arte de muitas épocas.'),
    p('🕯️', 'Genocídio e diáspora', 'Massacres e deportações de armênios no Império Otomano durante a Primeira Guerra produziram uma ampla diáspora. Essa memória permanece central em comunidades no mundo.'),
    p('📜', 'Independência renovada', 'Após breve república no século XX e décadas soviéticas, a Armênia recuperou a independência em 1991. Disputas regionais marcaram sua história recente.')
  ],
  Azerbaijan: [
    p('🧭', 'Entre Cáucaso e Cáspio', 'Povos e dinastias de influência iraniana e túrquica moldaram a região. Rotas comerciais ligaram o mar Cáspio ao interior da Ásia.'),
    p('🏰', 'Cidades e cortes', 'Baku e o estado dos Shirvanshahs preservam arquitetura medieval. Tradições literárias e musicais mostram uma cultura formada em contatos regionais prolongados.'),
    p('🛢️', 'Petróleo e modernidade', 'A extração petrolífera fez de Baku um grande centro industrial no fim do século XIX, atraindo trabalhadores e investimentos de várias origens.'),
    p('📜', 'Repúblicas e disputas', 'Uma república surgiu em 1918, antes do domínio soviético. A independência voltou em 1991; conflitos em torno de Nagorno-Karabakh trouxeram deslocamentos e memórias difíceis.')
  ],
  Bahrain: [
    p('🏺', 'Dilmun antigo', 'Sítios arqueológicos ligam o arquipélago à civilização de Dilmun, ponto comercial entre Mesopotâmia e vale do Indo. Túmulos antigos revelam sua importância regional.'),
    p('🦪', 'Pérolas do Golfo', 'Durante séculos, mergulho e comércio de pérolas sustentaram comunidades costeiras. Casas mercantis de Muharraq registram trabalho, riqueza e relações marítimas.'),
    p('🧭', 'Proteção britânica', 'A dinastia Al Khalifa consolidou o governo local enquanto tratados deram ao Reino Unido influência externa. O país tornou-se independente em 1971.'),
    p('🛢️', 'Petróleo e mudanças', 'A descoberta de petróleo em 1932 acelerou urbanização e novos serviços. A sociedade contemporânea reúne heranças mercantis e debates sobre representação política.')
  ],
  Bangladesh: [
    p('🌾', 'Bengala dos rios', 'O delta sustentou agricultura e cidades por séculos. Dinastias budistas, reinos regionais e depois sultanatos islâmicos deixaram tradições culturais diversas.'),
    p('🧵', 'Tecidos e comércio', 'Sob os mogóis, Dhaka ganhou fama por finos tecidos de musselina. Redes fluviais conectavam produtores e mercados muito além da região.'),
    p('🗣️', 'Língua e partição', 'A partição de 1947 criou o Paquistão Oriental. O movimento pela língua bengali tornou-se símbolo de direitos culturais e autonomia política.'),
    p('📜', 'Independência', 'A guerra de libertação de 1971 deu origem a Bangladesh, com enormes perdas humanas. Literatura e música continuam centrais à memória nacional.')
  ],
  Bhutan: [
    p('🏔️', 'Vale e mosteiros', 'Comunidades himalaicas desenvolveram tradições budistas e redes entre vales. Mosteiros e fortalezas chamados dzongs reuniram funções religiosas e administrativas.'),
    p('👑', 'Formação política', 'No século XVII, o líder Zhabdrung Ngawang Namgyal consolidou instituições que aproximaram diferentes regiões. Uma monarquia hereditária foi estabelecida em 1907.'),
    p('📜', 'Mudança gradual', 'Reformas conduzidas pela monarquia abriram caminho à Constituição de 2008 e às eleições parlamentares. A transição preservou elementos tradicionais do Estado.'),
    p('🎨', 'Cultura preservada', 'Arte sacra, festivais e arquitetura dos dzongs mostram como religião e poder estiveram ligados. A preservação cultural também integra escolhas políticas contemporâneas.')
  ],
  Brunei: [
    p('⛵', 'Sultanato marítimo', 'O sultanato de Brunei teve grande influência em partes de Bornéu durante os séculos XV e XVI. Rotas marítimas ligavam suas cortes a outros portos asiáticos.'),
    p('🕌', 'Tradição islâmica', 'A difusão do islã moldou governo, direito e arquitetura. A continuidade da dinastia faz do sultanato uma referência histórica da região.'),
    p('🧭', 'Protetorado', 'O Reino Unido assumiu a proteção externa de Brunei no fim do século XIX, enquanto o governante local manteve seu título e instituições.'),
    p('🛢️', 'Petróleo e independência', 'A descoberta de petróleo no século XX transformou a economia. Brunei tornou-se plenamente independente em 1984, mantendo a monarquia e uma identidade própria.')
  ],
  Cambodia: [
    p('🏛️', 'Império Khmer', 'Entre os séculos IX e XV, Angkor reuniu capitais, templos e complexos sistemas de água. Sua arte influenciou amplamente o Sudeste Asiático.'),
    p('🧭', 'Protetorado e Estado', 'A França estabeleceu um protetorado no século XIX. A independência de 1953 abriu um período de mudanças políticas em meio a conflitos regionais.'),
    p('🕯️', 'Violência e memória', 'O regime do Khmer Vermelho, entre 1975 e 1979, matou grande parte da população por execuções, fome e trabalho forçado. Memoriais documentam essa tragédia.'),
    p('🎨', 'Herança viva', 'Dança clássica, escultura e práticas budistas mostram continuidades culturais. A preservação de Angkor depende também das comunidades que vivem na região.')
  ],
  China: [
    p('🏛️', 'Estados e escrita', 'Dinastias antigas desenvolveram administração, escrita e centros urbanos em diferentes regiões. A história chinesa não se limita a uma única origem ou tradição.'),
    p('🧭', 'Rotas e invenções', 'Sob dinastias como Han e Tang, redes terrestres e marítimas ampliaram contatos. Papel, impressão e outras técnicas tiveram efeitos além da Ásia.'),
    p('👑', 'Império tardio', 'As dinastias Ming e Qing governaram um vasto território. No século XIX, guerras e pressões estrangeiras enfraqueceram o império e impulsionaram reformas.'),
    p('📜', 'Revolução e transformação', 'A monarquia terminou em 1911; a República Popular foi fundada em 1949. Mudanças sociais e econômicas posteriores redefiniram a posição mundial do país.')
  ],
  Georgia: [
    p('🏛️', 'Reinos do Cáucaso', 'Colchis e Ibéria caucásica participaram de redes entre mar Negro e Oriente Próximo. A cristianização no século IV deixou patrimônio religioso duradouro.'),
    p('👑', 'Reino medieval', 'A unificação e o reinado de Tamar marcaram uma fase de projeção política e artística. Igrejas e manuscritos testemunham sua tradição intelectual.'),
    p('🧭', 'Impérios e União Soviética', 'A região passou por pressões persas e otomanas, depois pelo Império Russo. Uma breve independência antecedeu décadas dentro da União Soviética.'),
    p('📜', 'Soberania recente', 'A Geórgia recuperou a independência em 1991. Conflitos territoriais e esforços de preservação cultural continuam a influenciar sua vida pública.')
  ],
  India: [
    p('🏛️', 'Mundos antigos', 'A civilização do Indo ocupou áreas hoje situadas na Índia e no Paquistão. Tradições védicas e muitas sociedades regionais moldaram períodos posteriores.'),
    p('📚', 'Ideias e reinos', 'Impérios como Maurya e Gupta conviveram com poderes regionais. Budismo, jainismo, hinduísmo, matemática e literatura desenvolveram legados de amplo alcance.'),
    p('👑', 'Cortes e comércio', 'Sultanatos, o Império Mogol e reinos locais produziram arquitetura e arte diversas. Mercadores ligaram portos indianos ao Índico e além.'),
    p('📜', 'Independência e partição', 'O domínio britânico enfrentou movimentos de resistência, inclusive campanhas não violentas. A independência de 1947 veio acompanhada da partição e de deslocamentos em massa.')
  ],
  Indonesia: [
    p('⛵', 'Arquipélago conectado', 'Navegadores austronésios e redes marítimas uniram ilhas diversas. Srivijaya e Majapahit foram centros de poder com influência comercial e cultural regional.'),
    p('🏛️', 'Religiões e arte', 'Templos como Borobudur e Prambanan registram tradições budistas e hindus. Mais tarde, o islã difundiu-se por comércio, cortes e comunidades costeiras.'),
    p('🧭', 'Domínio neerlandês', 'Companhias comerciais e depois o Estado colonial controlaram rotas e recursos de modo desigual. Resistências ocorreram em várias ilhas.'),
    p('📜', 'Independência arquipelágica', 'A independência foi proclamada em 1945 e reconhecida pelos Países Baixos em 1949. Línguas e culturas locais continuam centrais dentro do Estado plural.')
  ],
  Iran: [
    p('👑', 'Impérios persas', 'O Império Aquemênida reuniu povos e territórios vastos; Persépolis expressa sua arquitetura de corte. Partas e sassânidas deram continuidade a tradições políticas diferentes.'),
    p('📚', 'Cultura após o islã', 'A língua persa, poesia, filosofia e ciência floresceram sob dinastias islâmicas. Cidades como Isfahan tornaram-se centros de arte e urbanismo.'),
    p('🧭', 'Reformas modernas', 'A Revolução Constitucional do início do século XX e debates sobre petróleo redefiniram relações entre monarquia, sociedade e potências estrangeiras.'),
    p('📜', 'República Islâmica', 'A revolução de 1979 encerrou a monarquia e instituiu nova ordem política. O país preserva uma história intelectual muito anterior a esse marco.')
  ],
  Iraq: [
    p('🏛️', 'Mesopotâmia antiga', 'Cidades sumérias e reinos babilônicos floresceram entre Tigre e Eufrates. Escrita, leis e sistemas de irrigação marcaram a história de várias sociedades.'),
    p('📚', 'Bagdá abássida', 'A capital do califado abássida tornou-se centro de tradução, ciência e comércio. Seu legado conectou saberes de diferentes línguas e regiões.'),
    p('🧭', 'Do império ao Estado', 'Após séculos sob domínio otomano, um mandato britânico antecedeu a independência do Iraque em 1932. Fronteiras reuniram comunidades com trajetórias próprias.'),
    p('🕊️', 'Guerras e patrimônio', 'Conflitos recentes causaram perdas humanas e danos a sítios históricos. A preservação de cidades e arquivos ajuda a contar uma história mais longa que essas guerras.')
  ],
  Israel: [
    p('🏛️', 'Terra de muitas tradições', 'Reinos antigos de Israel e Judá e períodos posteriores tornaram a região significativa para judaísmo, cristianismo e islã. Seu patrimônio pertence a histórias entrelaçadas.'),
    p('🧭', 'Império e mandato', 'Após séculos de governo otomano, o Reino Unido administrou a Palestina sob mandato. Migrações judaicas e reivindicações nacionais distintas intensificaram tensões.'),
    p('📜', 'Estado e deslocamentos', 'Israel declarou independência em 1948; a guerra daquele ano levou também ao deslocamento de muitos palestinos. O conflito segue central para a história regional.'),
    p('🎨', 'Sociedade plural', 'Comunidades de origens variadas construíram instituições, artes e pesquisa. Memórias judaicas, árabes e de outros grupos continuam essenciais para compreender o país.')
  ],
  Japan: [
    p('👑', 'Cortes e literatura', 'A corte de Heian desenvolveu poesia, narrativa e artes refinadas. Autoridade imperial e poderes locais conviveram em arranjos mutáveis ao longo dos séculos.'),
    p('⚔️', 'Xogunatos e Edo', 'Governos militares samurais moldaram instituições por séculos. No período Edo, cidades, teatro e gravura floresceram sob relativa estabilidade política.'),
    p('🏗️', 'Restauração Meiji', 'A partir de 1868, reformas ampliaram indústria, educação e forças armadas. A expansão imperial japonesa também trouxe dominação e violência a países vizinhos.'),
    p('🕊️', 'Guerra e reconstrução', 'A Segunda Guerra terminou com destruição e os bombardeios atômicos de Hiroshima e Nagasaki. A constituição do pós-guerra acompanhou nova trajetória econômica e cultural.')
  ],
  Jordan: [
    p('🏛️', 'Petra nabateia', 'Os nabateus fizeram de Petra um centro de caravanas e engenharia hídrica. A região depois integrou redes romanas, bizantinas e islâmicas.'),
    p('🕌', 'Rotas e cidades', 'Castelos, mesquitas e antigas cidades revelam passagens de mercadores e peregrinos. O território ligou a Península Arábica ao Levante por séculos.'),
    p('📜', 'Reino hachemita', 'Após a Primeira Guerra, a Transjordânia surgiu sob influência britânica. A independência de 1946 consolidou uma monarquia que participou das transformações regionais.'),
    p('🤝', 'Refúgio e sociedade', 'Fluxos de pessoas deslocadas por guerras vizinhas marcaram a demografia e a política do país. Sua história moderna combina instituições locais e responsabilidades regionais.')
  ],
  Kazakhstan: [
    p('🐎', 'Povos da estepe', 'Comunidades nômades e cidades de oásis conectaram a estepe a rotas da seda. Influências túrquicas e mongóis marcaram língua e organização política.'),
    p('👑', 'Canato Cazaque', 'Formado no século XV, o canato reuniu grupos da estepe sob lideranças próprias. Sua memória permaneceu importante durante a expansão russa.'),
    p('🕯️', 'Século soviético', 'Coletivização forçada provocou fome e grandes perdas nos anos 1930. Testes nucleares em Semipalatinsk deixaram outro legado difícil.'),
    p('📜', 'Independência', 'O Cazaquistão tornou-se independente em 1991. A construção de instituições nacionais e a recuperação de tradições locais seguiram ao lado de uma economia ligada a recursos.')
  ],
  'N. Korea': [
    p('🏛️', 'História coreana compartilhada', 'Reinos antigos e a dinastia Joseon fazem parte da história de toda a península. Tradições de escrita, religião e governo antecedem a divisão moderna.'),
    p('🧭', 'Ocupação e divisão', 'O domínio colonial japonês terminou em 1945. A divisão da península levou à formação de dois Estados em 1948, com sistemas políticos distintos.'),
    p('⚔️', 'Guerra da Coreia', 'O conflito de 1950 a 1953 destruiu cidades e separou famílias. Um armistício interrompeu os combates, sem estabelecer tratado de paz definitivo.'),
    p('📜', 'Estado contemporâneo', 'A Coreia do Norte desenvolveu planejamento estatal e forte centralização política. Memória da guerra e isolamento moldam sua relação com o exterior.')
  ],
  'South Korea': [
    p('🏛️', 'Reinos e Joseon', 'Silla, Goryeo e Joseon deixaram palácios, pensamento e artes. O alfabeto hangul, criado no século XV, ampliou formas de expressão em coreano.'),
    p('🧭', 'Ocupação e guerra', 'A colonização japonesa terminou em 1945, seguida pela divisão da península. A Guerra da Coreia de 1950 a 1953 deixou perdas e separações duradouras.'),
    p('🏗️', 'Industrialização', 'Após a guerra, políticas econômicas e trabalho urbano transformaram o país. O crescimento ocorreu junto a períodos de governo autoritário e reivindicações sociais.'),
    p('🕊️', 'Democracia e projeção', 'Mobilizações populares abriram a transição democrática de 1987. Cinema, música e tecnologia deram nova visibilidade internacional à cultura sul-coreana.')
  ],
  Kuwait: [
    p('⛵', 'Porto do Golfo', 'Kuwait cresceu como centro de navegação, comércio e pesca de pérolas. Famílias mercantis conectavam a cidade a portos da Arábia, Índia e África oriental.'),
    p('👑', 'Governo local e proteção', 'A dinastia Al Sabah consolidou sua autoridade. Acordos com o Reino Unido no fim do século XIX restringiram relações externas até a independência.'),
    p('🛢️', 'Petróleo e Estado', 'A descoberta de petróleo transformou serviços, população e paisagem urbana. Kuwait tornou-se independente em 1961 e desenvolveu instituições parlamentares próprias.'),
    p('🕊️', 'Invasão e recuperação', 'A invasão iraquiana de 1990 interrompeu a soberania; uma coalizão internacional expulsou as forças invasoras em 1991. O episódio permanece central na memória nacional.')
  ],
  Kyrgyzstan: [
    p('🐎', 'Montanhas e mobilidade', 'Comunidades nômades percorreram as montanhas Tian Shan, criando redes de pastoreio e comércio. Rotas da seda conectaram vales a outras partes da Ásia.'),
    p('📚', 'Épico de Manas', 'Narrativas orais sobre Manas preservam valores, conflitos e memória coletiva quirguiz. Sua transmissão mostra a importância da palavra cantada na região.'),
    p('🧭', 'Período soviético', 'A expansão russa e depois a administração soviética alteraram economia e povoamentos. O território tornou-se república soviética no século XX.'),
    p('📜', 'Estado independente', 'A independência veio em 1991. Movimentos políticos posteriores expressaram disputas sobre representação e a construção de instituições próprias.')
  ],
  Laos: [
    p('👑', 'Lan Xang', 'O reino de Lan Xang reuniu partes do vale do Mekong a partir do século XIV. Luang Prabang foi centro político e religioso importante.'),
    p('🪷', 'Budismo e cidades', 'Mosteiros e festivais budistas moldaram arquitetura e calendário social. O patrimônio urbano revela também contatos com povos de montanha e vizinhos regionais.'),
    p('🧭', 'Colônia e guerra', 'O protetorado francês começou no fim do século XIX. Após a independência de 1953, conflitos regionais trouxeram bombardeios intensos e deslocamentos.'),
    p('📜', 'República contemporânea', 'Em 1975, a monarquia terminou e surgiu a República Democrática Popular do Laos. Preservar o passado do Mekong permanece importante para comunidades locais.')
  ],
  Lebanon: [
    p('⛵', 'Cidades fenícias', 'Tiro e Sídon participaram de redes comerciais mediterrâneas antigas. Suas tradições marítimas conectaram o litoral a regiões distantes, sem resumir toda a história local.'),
    p('🕌', 'Camadas do Levante', 'Períodos romano, árabe e otomano deixaram cidades, monumentos e comunidades religiosas diversas. A região foi espaço de circulação intelectual e mercantil.'),
    p('📜', 'Estado independente', 'Após a Primeira Guerra, um mandato francês antecedeu a independência em 1943. Instituições buscaram acomodar grupos religiosos, mas também produziram tensões.'),
    p('🕊️', 'Guerra e reconstrução', 'A guerra civil de 1975 a 1990 transformou o país e sua diáspora. Literatura, comércio e vida urbana seguiram como expressões de resiliência.')
  ],
  Malaysia: [
    p('⛵', 'Estreito de Malaca', 'Portos malaios conectaram comerciantes da China, Índia e mundo islâmico. O sultanato de Malaca tornou-se grande centro mercantil no século XV.'),
    p('🧭', 'Domínios coloniais', 'Portugueses e neerlandeses controlaram Malaca em períodos distintos; o poder britânico cresceu depois. George Town preserva parte dessa história de migração e comércio.'),
    p('📜', 'Federação moderna', 'A Federação Malaia alcançou a independência em 1957. Em 1963, uniu-se a Sabah, Sarawak e Singapura para formar a Malásia; esta última separou-se em 1965.'),
    p('🎨', 'Heranças plurais', 'Tradições malaias, chinesas, indianas e indígenas convivem sem se reduzir a uma só narrativa. Línguas e edifícios históricos revelam essa formação complexa.')
  ],
  Maldives: [
    p('⛵', 'Atóis navegados', 'Comunidades insulares ligaram o arquipélago às rotas do oceano Índico. Vestígios budistas mostram uma fase religiosa anterior à adoção do islã.'),
    p('🕌', 'Sultanato marítimo', 'A conversão ao islã no século XII deu origem a instituições duradouras. Pesca, conchas e comércio sustentaram vínculos com portos asiáticos e africanos.'),
    p('🧭', 'Proteção britânica', 'O arquipélago manteve governantes locais durante a proteção britânica. Tornou-se independente em 1965 e adotou a república em 1968.'),
    p('🌊', 'Memória das ilhas', 'Barcos tradicionais, arquitetura de coral e formas de viver com o mar registram uma história de adaptação, hoje pressionada por mudanças ambientais.')
  ],
  Mongolia: [
    p('🐎', 'Sociedades da estepe', 'Povos pastoris desenvolveram mobilidade, comércio e alianças políticas nas estepes. Essas redes antecederam a expansão do Império Mongol no século XIII.'),
    p('👑', 'Império de Chinggis Khan', 'Conquistas mongóis criaram conexões imensas entre Ásia e Europa. O domínio foi violento, mas também ampliou a circulação de mercadorias e conhecimentos.'),
    p('🪷', 'Budismo e Qing', 'O budismo tibetano ganhou importância enquanto a região passou à órbita da dinastia Qing. Mosteiros se tornaram centros religiosos e culturais.'),
    p('📜', 'Estado moderno', 'A revolução de 1921 abriu um período socialista. Em 1990, reformas democráticas encerraram o partido único, preservando tradições de pastoreio e identidade mongol.')
  ],
  'Myanmar (Burma)': [
    p('🏛️', 'Pyu e Bagan', 'Antigas cidades pyu antecederam o reino de Bagan. Seus milhares de templos documentam a expansão do budismo e a formação de centros políticos regionais.'),
    p('👑', 'Reinos e povos', 'Dinastias posteriores, como Taungoo e Konbaung, governaram áreas diversas. Comunidades mon, shan, kachin e outras mantiveram histórias próprias.'),
    p('🧭', 'Domínio britânico', 'Conquistas britânicas no século XIX integraram o território à administração colonial. A independência veio em 1948, após mobilizações contra a ocupação.'),
    p('🕊️', 'Conflitos contemporâneos', 'Governos militares e conflitos étnicos marcaram décadas posteriores. A perseguição aos rohingyas e deslocamentos de outras comunidades exigem memória e atenção histórica.')
  ],
  Nepal: [
    p('🏛️', 'Vale do Kathmandu', 'Cidades do vale desenvolveram arte, comércio e arquitetura budista e hindu. Praças e templos preservam contribuições de dinastias como a Licchavi e a Malla.'),
    p('👑', 'Unificação himalaica', 'A expansão conduzida pelo reino de Gorkha no século XVIII reuniu territórios diversos. Comunidades das montanhas mantiveram línguas e tradições próprias.'),
    p('📜', 'Da monarquia à república', 'Movimentos democráticos e um conflito interno transformaram o Estado. Em 2008, a monarquia foi encerrada e o Nepal tornou-se república federal.'),
    p('🏗️', 'Patrimônio e reconstrução', 'O terremoto de 2015 danificou monumentos históricos. A restauração envolve conhecimentos artesanais locais e debates sobre como preservar paisagens urbanas vivas.')
  ],
  Oman: [
    p('🧭', 'Incenso e caravanas', 'O antigo comércio de incenso ligou Dhofar a mercados da Arábia e do Mediterrâneo. Fortificações e portos registram rotas pelo deserto e pelo mar.'),
    p('⛵', 'Potência marítima', 'Navegadores omanitas atuaram no Índico e na costa oriental africana. Mascate e Zanzibar estiveram conectadas por comércio, governo e migrações.'),
    p('🕌', 'Imamato e sultanato', 'Tradições ibaditas e diferentes centros de poder moldaram o interior e o litoral. Portugueses ocuparam Mascate antes de serem expulsos no século XVII.'),
    p('📜', 'Transformação moderna', 'Reformas iniciadas em 1970 ampliaram serviços e infraestrutura. O país preserva patrimônio marítimo e urbano enquanto diversifica sua economia.')
  ],
  Pakistan: [
    p('🏛️', 'Vale do Indo', 'Mohenjo-daro foi centro urbano da civilização do Indo, com planejamento e sistemas de água notáveis. A região guarda também sítios de outras épocas antigas.'),
    p('📚', 'Gandara e novos reinos', 'A região de Gandara foi espaço de arte budista e contatos com a Ásia Central. Dinastias islâmicas e o Império Mogol deixaram cidades e monumentos.'),
    p('📜', 'Partição e Estado', 'O Paquistão surgiu na partição da Índia britânica em 1947, acompanhada de violência e migração em massa. A formação federal reuniu regiões diversas.'),
    p('🕊️', 'Mudanças posteriores', 'Em 1971, o Paquistão Oriental tornou-se Bangladesh após guerra. Debates sobre democracia, línguas e autonomia provincial seguem ligados a essa trajetória.')
  ],
  Philippines: [
    p('⛵', 'Ilhas conectadas', 'Comunidades austronésias organizaram redes marítimas, chefaturas e comércio muito antes dos europeus. Portos mantinham contatos com China e Sudeste Asiático.'),
    p('⛪', 'Séculos espanhóis', 'A colonização espanhola difundiu o catolicismo e ligou Manila ao comércio de galeões com o México. Resistências locais também atravessaram esse período.'),
    p('🧭', 'Ocupações e guerra', 'Após 1898, os Estados Unidos assumiram o controle colonial. A ocupação japonesa na Segunda Guerra trouxe violência e destruição, especialmente em Manila.'),
    p('📜', 'Independência e participação', 'A independência veio em 1946. A mobilização popular de 1986 encerrou a ditadura de Ferdinand Marcos e tornou-se referência de ação cívica.')
  ],
  Qatar: [
    p('⛵', 'Costa e pérolas', 'Comunidades costeiras viveram de navegação, pesca e mergulho de pérolas. Redes mercantis ligavam a península a outros portos do Golfo.'),
    p('👑', 'Formação política', 'A família Al Thani consolidou sua autoridade no século XIX. Acordos britânicos limitaram relações externas enquanto instituições locais continuaram a evoluir.'),
    p('📜', 'Independência', 'O Catar tornou-se independente em 1971, após o fim dos tratados de proteção. O novo Estado ampliou serviços e relações internacionais.'),
    p('🔥', 'Era do gás', 'A exploração de gás natural transformou a economia e a paisagem urbana. Museus e restaurações de bairros antigos procuram preservar memórias anteriores a essa mudança.')
  ],
  'Saudi Arabia': [
    p('🐪', 'Arábia antes do islã', 'Oásis e rotas de caravanas conectavam comunidades da península a mercados vizinhos. Tradições tribais e cidades comerciais formavam uma região diversa.'),
    p('🕌', 'Origem do islã', 'Meca e Medina estiveram no centro do surgimento do islã no século VII. A peregrinação passou a ligar a região a comunidades de todo o mundo.'),
    p('👑', 'Unificação do reino', 'Alianças políticas e religiosas dos Saud avançaram em diferentes períodos. A unificação sob Abdulaziz levou à criação do Reino da Arábia Saudita em 1932.'),
    p('🛢️', 'Petróleo e mudanças', 'Descoberto em escala comercial no século XX, o petróleo transformou infraestrutura e influência internacional. Debates sobre patrimônio e modernização acompanham essa trajetória.')
  ],
  Singapore: [
    p('⛵', 'Temasek e rotas', 'Antes do porto colonial, a ilha integrava redes comerciais malaias do estreito. Registros sobre Temasek mostram conexões antigas, embora sua história inicial tenha lacunas.'),
    p('🧭', 'Porto britânico', 'A fundação de um entreposto britânico em 1819 atraiu migrantes chineses, malaios, indianos e outros. A cidade tornou-se nó comercial asiático.'),
    p('⚔️', 'Guerra e federação', 'A ocupação japonesa de 1942 a 1945 deixou marcas profundas. Singapura integrou a Malásia em 1963, mas separou-se dois anos depois.'),
    p('🏗️', 'Cidade-Estado', 'Desde 1965, políticas de habitação, educação e indústria transformaram o território. Bairros históricos registram a convivência de muitas comunidades.')
  ],
  'Sri Lanka': [
    p('🏛️', 'Reinos e budismo', 'Anuradhapura e Polonnaruwa foram centros de governo, irrigação e arte. O budismo moldou monumentos e práticas, junto a outras tradições religiosas da ilha.'),
    p('⛵', 'Índico comercial', 'Portos ligaram a ilha a mercadores árabes, indianos e do Sudeste Asiático. Canela e outras mercadorias atraíram potências europeias.'),
    p('🧭', 'Domínios coloniais', 'Portugueses, neerlandeses e britânicos controlaram áreas da ilha em épocas diferentes. A independência do Reino Unido veio em 1948.'),
    p('🕊️', 'Guerra e memória', 'A guerra civil de 1983 a 2009 trouxe perdas e deslocamentos. Histórias de comunidades cingalesas, tâmeis e outras exigem uma narrativa cuidadosa e plural.')
  ],
  Syria: [
    p('🏛️', 'Cidades antigas', 'Sítios como Ebla e Palmira testemunham redes urbanas e comerciais muito antigas. A região integrou impérios e tradições culturais diferentes.'),
    p('🕌', 'Damasco omíada', 'Damasco foi capital do califado omíada no século VII. Sua arquitetura e seus mercados revelam uma história de circulação religiosa, artística e mercantil.'),
    p('📜', 'Estado moderno', 'Após séculos otomanos, um mandato francês antecedeu a independência em 1946. Mudanças de regime marcaram a política do século XX.'),
    p('🕊️', 'Guerra e patrimônio', 'O conflito iniciado em 2011 provocou mortes, deslocamentos e danos a cidades históricas. Preservar memórias de diferentes comunidades é parte da reconstrução.')
  ],
  Taiwan: [
    p('🪶', 'Povos austronésios', 'Comunidades indígenas habitavam Taiwan muito antes da chegada de governantes e migrantes externos. Suas línguas têm importância para o estudo da expansão austronésia.'),
    p('⛵', 'Estreito disputado', 'Europeus ocuparam áreas limitadas no século XVII; depois, migrações da China continental e governo Qing transformaram a ilha. Histórias indígenas permaneceram distintas.'),
    p('🧭', 'Domínio japonês', 'O Japão governou Taiwan de 1895 a 1945, construindo infraestrutura e impondo políticas coloniais. Após a guerra, a República da China assumiu a administração.'),
    p('📜', 'Democratização', 'A partir do fim da lei marcial em 1987, eleições e movimentos sociais ampliaram liberdades. Seu status internacional permanece tema de disputa política.')
  ],
  Tajikistan: [
    p('🧭', 'Sogdianos e rotas', 'Cidades e comunidades sogdianas participaram das rotas da seda, ligando Ásia Central, China e oeste asiático. O comércio envolvia também circulação de ideias.'),
    p('📚', 'Herança persófona', 'A dinastia samânida fez de centros regionais polos de literatura e cultura persa. A língua tajique preserva parte dessa tradição intelectual.'),
    p('🧭', 'Período soviético', 'A expansão russa e as fronteiras soviéticas reorganizaram o território. Infraestrutura e educação mudaram, mas também surgiram novas divisões administrativas.'),
    p('📜', 'Independência e paz', 'O Tadjiquistão tornou-se independente em 1991. Uma guerra civil nos anos seguintes deixou perdas; acordos de paz marcaram a reconstrução estatal.')
  ],
  Thailand: [
    p('🏛️', 'Reinos históricos', 'Sukhothai e Ayutthaya desenvolveram instituições, arte e redes comerciais. Cidades históricas preservam monumentos budistas e contatos com povos vizinhos.'),
    p('👑', 'Bangkok e reformas', 'A dinastia Chakri estabeleceu Bangkok como capital no fim do século XVIII. Reformas posteriores modernizaram administração e educação sem colonização europeia formal.'),
    p('📜', 'Monarquia constitucional', 'A mudança política de 1932 encerrou a monarquia absoluta. O país passou a se chamar Tailândia, após longo uso do nome Sião.'),
    p('🎨', 'Tradição e mudança', 'Budismo, artes de corte e culturas regionais continuam visíveis. Sua história moderna inclui debates sobre o papel das instituições militares e civis.')
  ],
  'Timor-Leste': [
    p('⛵', 'Rotas e comunidades', 'Povos austronésios e papuas desenvolveram línguas e redes locais na ilha. O sândalo integrou Timor a circuitos comerciais do Sudeste Asiático.'),
    p('🧭', 'Domínio português', 'A presença portuguesa se estendeu por séculos, de modo desigual. O catolicismo e a língua portuguesa tornaram-se parte de uma história cultural plural.'),
    p('🕊️', 'Ocupação e resistência', 'Após declarar independência em 1975, o território foi ocupado pela Indonésia. Décadas de resistência e graves perdas humanas marcaram a sociedade.'),
    p('📜', 'Estado soberano', 'Um referendo em 1999 abriu caminho à independência restaurada em 2002. Instituições novas procuram representar comunidades e preservar memórias da luta.')
  ],
  'Türkiye': [
    p('🏛️', 'Muitas Anatólias', 'Hititas, cidades gregas, romanos e bizantinos deixaram marcas em diferentes partes da Anatólia. A região foi ponte de comércio e ideias.'),
    p('👑', 'Império Otomano', 'Após a expansão turca, o poder otomano fez de Istambul uma capital de alcance europeu, asiático e africano. Artes e instituições nasceram desse mundo plural.'),
    p('⚔️', 'Fim de um império', 'Guerras e nacionalismos abalaram o império no início do século XX. Violências contra armênios e outras comunidades fazem parte dessa memória difícil.'),
    p('📜', 'República', 'A república fundada em 1923 sob Mustafa Kemal Atatürk reformou leis, escrita e educação. Debates entre secularismo, religião e identidade seguiram presentes.')
  ],
  Turkmenistan: [
    p('🧭', 'Oásis das rotas', 'Merv e outros oásis foram centros comerciais e intelectuais nas rotas da seda. Suas ruínas registram contatos entre mundos iranianos e túrquicos.'),
    p('🐎', 'Povos turcomenos', 'Comunidades pastoris desenvolveram tradições de mobilidade, criação de cavalos e tecelagem. Tapetes preservam técnicas e símbolos regionais transmitidos por gerações.'),
    p('🧭', 'Domínio russo e soviético', 'A conquista russa no século XIX mudou o equilíbrio político. Durante a era soviética, fronteiras e economia foram reorganizadas.'),
    p('📜', 'Independência', 'O Turcomenistão tornou-se independente em 1991. Recursos de gás ganharam importância, enquanto a preservação de patrimônios antigos permaneceu ligada à identidade nacional.')
  ],
  'United Arab Emirates': [
    p('🌴', 'Oásis e litoral', 'Comunidades de oásis praticaram agricultura e artesanato; no litoral, pesca e navegação conectaram a região ao Golfo e ao oceano Índico.'),
    p('🦪', 'Pérolas e comércio', 'Mergulho de pérolas e portos como Dubai sustentaram economias locais antes do petróleo. Essas atividades exigiam redes de trabalho e crédito.'),
    p('🧭', 'Estados da Trégua', 'Acordos com o Reino Unido moldaram relações externas dos emirados. Em 1971, seis deles formaram uma federação; Ras al-Khaimah aderiu em 1972.'),
    p('🏗️', 'Transformação moderna', 'Petróleo, comércio e migração alteraram rapidamente cidades e instituições. Fortes e bairros preservados ajudam a lembrar a vida anterior aos arranha-céus.')
  ],
  Uzbekistan: [
    p('🧭', 'Sogdianos e seda', 'Samarcanda e Bucara participaram de redes comerciais que ligaram China, Índia e oeste asiático. Mercadorias circulavam junto com religiões e conhecimentos.'),
    p('📚', 'Cidades de saber', 'Sob dinastias islâmicas, estudiosos e artesãos produziram matemática, astronomia e arquitetura. Madrassas e mercados preservam parte dessa vida urbana.'),
    p('👑', 'Era timúrida', 'A corte de Timur fez de Samarcanda um centro monumental no fim do século XIV. Seu império combinou patrocínio artístico e conquistas violentas.'),
    p('📜', 'Estado moderno', 'A expansão russa e depois soviética redesenhou instituições e fronteiras. O Uzbequistão tornou-se independente em 1991, recuperando referências históricas locais.')
  ],
  Vietnam: [
    p('🌾', 'Rios e reinos', 'Sociedades do rio Vermelho desenvolveram agricultura e estados próprios. Ao sul, Champa e outros poderes participaram de redes marítimas distintas.'),
    p('👑', 'Dinastias vietnamitas', 'Após longos contatos e conflitos com a China, dinastias locais consolidaram governo e cultura escrita. A expansão para o sul transformou fronteiras e populações.'),
    p('🧭', 'Colonialismo e guerras', 'O domínio francês foi contestado por movimentos nacionalistas. A independência proclamada em 1945 antecedeu guerras prolongadas e a reunificação em 1975.'),
    p('🏗️', 'Renovação econômica', 'As reformas Đổi Mới, iniciadas em 1986, mudaram produção e vida urbana. Templos, cidades antigas e memórias de guerra mostram sua trajetória diversa.')
  ],
  Yemen: [
    p('🐪', 'Reinos da Arábia do Sul', 'Estados como Sabá prosperaram em rotas do incenso. Obras de irrigação e inscrições revelam sociedades organizadas muito antes do islã.'),
    p('🕌', 'Cidades e circulação', 'Sanaã e portos como Áden conectaram interior, mar Vermelho e Índico. Arquitetura de terra e pedra registra séculos de intercâmbio comercial.'),
    p('📜', 'Dois Estados e união', 'O norte e o sul seguiram trajetórias políticas diferentes sob influências otomanas e britânicas. A unificação do Iêmen ocorreu em 1990.'),
    p('🕊️', 'Conflito e patrimônio', 'Guerras recentes causaram graves perdas e danos a cidades históricas. Comunidades e especialistas procuram preservar edifícios, manuscritos e memórias locais.')
  ]
});
