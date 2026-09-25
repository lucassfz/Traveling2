// História regional em blocos; o catálogo preserva o conteúdo das demais regiões.
const p = (icon, title, text) => ({ icon, title, text });

export const AFRICA_HISTORY = Object.freeze({
  Algeria: [
    p('🏛️', 'Númidas e romanos', 'Reinos númidas floresceram no norte da África antes da expansão romana. Ruínas como Timgad mostram cidades antigas, enquanto populações amazigh mantiveram línguas e tradições próprias.'),
    p('🕌', 'Magrebe em transformação', 'Dinastias islâmicas ligaram a região ao Mediterrâneo e ao Saara. Cidades como Tlemcen foram centros de ensino, comércio e produção artística ao longo de séculos.'),
    p('📜', 'Colonização e independência', 'A conquista francesa iniciada em 1830 provocou expropriação e resistência. A guerra de 1954 a 1962 levou à independência e continua central para a memória nacional.'),
    p('🎨', 'Memória em língua e arte', 'Literatura e música raï registram experiências urbanas, migração e debates sobre identidade, ampliando a história do país além das instituições políticas.')
  ],
  Angola: [
    p('👑', 'Reinos anteriores à colônia', 'O Reino do Kongo tinha em Mbanza Kongo um centro político e espiritual. Ndongo e outros poderes regionais também organizaram comércio, diplomacia e resistência antes do domínio colonial.'),
    p('⛓️', 'Atlântico e conquista', 'A presença portuguesa começou no século XV e se expandiu por guerras e acordos. O tráfico de pessoas escravizadas conectou violentamente Angola às Américas por séculos.'),
    p('🕊️', 'Independência e reconstrução', 'Após longa guerra anticolonial, a independência veio em 1975. Uma guerra civil prolongada terminou em 2002; reconstruir instituições e preservar memórias diversas seguem tarefas nacionais.'),
    p('🎭', 'Culturas vivas', 'Música, literatura e línguas como kimbundu e umbundu mostram continuidades culturais que atravessaram tanto o tráfico atlântico quanto as guerras modernas.')
  ],
  Benin: [
    p('👑', 'Reinos do Golfo da Guiné', 'O Reino do Daomé e outros estados desenvolveram instituições, exércitos e redes comerciais no território atual. Suas histórias não se confundem com as do antigo Reino do Benin, situado na Nigéria.'),
    p('🌊', 'Costa e tráfico atlântico', 'Portos como Uidá participaram do comércio de pessoas escravizadas. Memoriais e tradições voduns registram tanto a violência da época quanto a continuidade cultural local.'),
    p('📜', 'Da colônia à república', 'Sob domínio francês, o território recebeu o nome Daomé. Independente desde 1960, adotou o nome Benin em 1975 e uma nova ordem constitucional em 1990.'),
    p('🎨', 'Arte e patrimônio', 'Palácios de Abomey e objetos de corte revelam técnicas artísticas e formas de poder. Seu destino em museus estrangeiros gerou debates sobre restituição.')
  ],
  Botswana: [
    p('🪶', 'Sociedades tswana', 'Chefaturas tswana organizaram povoações, assembleias e redes de troca no interior austral. Os debates comunitários conhecidos como kgotla permanecem referência na vida pública do país.'),
    p('🛡️', 'Bechuanalândia', 'Lideranças locais buscaram proteção britânica no século XIX em meio a pressões de colonos e potências vizinhas. O protetorado preservou parte de sua autonomia política.'),
    p('💎', 'Independência e recursos', 'A independência veio em 1966. A descoberta e a gestão dos diamantes financiaram mudanças econômicas e sociais, embora persistam desafios de desigualdade e diversificação.'),
    p('🌿', 'Paisagens habitadas', 'O delta do Okavango também guarda histórias de adaptação de comunidades às cheias sazonais, lembrando que conservação e modos de vida locais estão ligados.')
  ],
  'Burkina Faso': [
    p('👑', 'Reinos mossis', 'Estados mossis desenvolveram instituições duradouras no planalto central. Suas cortes, histórias orais e redes de comércio ajudam a compreender a região antes da conquista europeia.'),
    p('📜', 'Alto Volta', 'A colonização francesa redesenhou fronteiras e relações de trabalho. Independente em 1960 como Alto Volta, o país adotou o nome Burquina Faso em 1984.'),
    p('⚖️', 'Reformas e memória', 'O governo de Thomas Sankara promoveu campanhas de saúde, educação e emancipação feminina nos anos 1980. Sua morte em 1987 marcou debates posteriores sobre democracia e justiça.'),
    p('🎬', 'Expressão regional', 'O festival de cinema FESPACO, criado em Uagadugu, tornou a cidade um espaço importante de encontro e circulação do cinema africano desde 1969.')
  ],
  Burundi: [
    p('👑', 'Reino dos Grandes Lagos', 'Um reino centralizado reuniu comunidades de língua kirundi antes do domínio europeu. Instituições monárquicas e práticas agrícolas moldaram a vida nas terras altas.'),
    p('🧭', 'Domínio colonial', 'Alemanha e depois Bélgica governaram a região, vinculando-a a Ruanda-Urundi. Políticas coloniais rigidificaram categorias sociais e alteraram o equilíbrio político.'),
    p('🕊️', 'Independência e reconciliação', 'O Burundi tornou-se independente em 1962. Violências e guerras civis posteriores deixaram perdas profundas; acordos de paz buscaram repartir poder e reconstruir a convivência.'),
    p('🥁', 'Tradição dos tambores', 'A prática cerimonial dos tambores reais transmite histórias de autoridade e comunidade, preservando uma expressão cultural antiga apesar das rupturas políticas modernas.')
  ],
  'Cape Verde': [
    p('⛵', 'Ilhas atlânticas', 'Não há evidência de povoamento permanente antes da chegada portuguesa no século XV. O arquipélago tornou-se ponto de navegação entre África, Europa e Américas.'),
    p('⛓️', 'Comércio e diáspora', 'A posição atlântica ligou as ilhas ao tráfico de pessoas escravizadas. Secas recorrentes e migrações formaram uma diáspora numerosa e uma cultura crioula própria.'),
    p('📜', 'Independência', 'O movimento conduzido pelo PAIGC articulou lutas de Cabo Verde e Guiné-Bissau. A independência cabo-verdiana veio em 1975; eleições pluripartidárias marcaram nova etapa em 1991.'),
    p('🎵', 'Cultura crioula', 'Mornas e outras músicas expressam experiências de partida, retorno e vida insular, dando forma artística a séculos de migração atlântica.')
  ],
  Cameroon: [
    p('👑', 'Reinos e sociedades', 'O sultanato bamum, chefaturas dos Grassfields e comunidades costeiras desenvolveram tradições políticas distintas. Esculturas e instituições de corte preservam parte dessas histórias regionais.'),
    p('🧭', 'Fronteiras coloniais', 'A Alemanha colonizou Camarões; após a Primeira Guerra, França e Reino Unido dividiram sua administração. Essa trajetória explica a presença institucional do francês e do inglês.'),
    p('📜', 'União e independência', 'A parte sob administração francesa tornou-se independente em 1960. Parte do território britânico uniu-se ao novo Estado em 1961, criando uma federação depois centralizada.'),
    p('📚', 'Escrita bamum', 'O rei Njoya patrocinou uma escrita para a língua bamum e registros de sua corte, exemplo de inovação intelectual africana no início do século XX.')
  ],
  'Central African Rep.': [
    p('🌿', 'Povos e rotas interiores', 'Comunidades diversas ocuparam as bacias do Ubangui e do Chari, ligadas por agricultura, circulação fluvial e comércio regional. Nenhuma tradição isolada resume a história do território.'),
    p('⛓️', 'Ubangui-Chari colonial', 'A conquista francesa trouxe trabalho forçado e concessões comerciais violentas. A experiência colonial alterou povoamentos e deixou dificuldades duradouras para a construção institucional.'),
    p('📜', 'Estado independente', 'A independência veio em 1960. Mudanças de regime e conflitos armados posteriores afetaram a vida cotidiana; iniciativas de paz procuram reconstruir confiança entre comunidades.'),
    p('📜', 'Projeto de Boganda', 'Antes da independência, Barthélemy Boganda defendeu autonomia e cooperação entre territórios centro-africanos. Sua morte em 1959 influenciou a formação do novo Estado.')
  ],
  Chad: [
    p('🐪', 'Reinos do Sahel', 'Estados como Kanem-Bornu, Bagirmi e Uadai participaram de redes transaarianas. Mercadorias, saberes e religiões circularam por rotas que ligavam o lago Chade ao norte africano.'),
    p('🧭', 'Conquista francesa', 'A incorporação ao império colonial francês no início do século XX reuniu regiões com trajetórias diferentes. Fronteiras novas alteraram vínculos de comércio e poder.'),
    p('📜', 'Independência e diversidade', 'O Chade tornou-se independente em 1960. Conflitos posteriores evidenciaram desafios de representação regional, enquanto línguas e tradições locais continuam fundamentais à identidade do país.'),
    p('🎨', 'Patrimônio do Ennedi', 'Pinturas e gravuras rupestres no maciço do Ennedi registram antigas práticas pastorais e mudanças ambientais, ampliando a perspectiva para além dos reinos sahelianos.')
  ],
  Comoros: [
    p('⛵', 'Encontros no Índico', 'Navegadores africanos, austronésios e árabes conectaram as ilhas a rotas do oceano Índico. Línguas, arquitetura e alimentação guardam marcas desses encontros.'),
    p('🕌', 'Sultanatos insulares', 'Cidades costeiras e sultanatos cresceram com o comércio marítimo e a difusão do islã. Cada ilha preservou redes políticas e culturais próprias.'),
    p('📜', 'Descolonização', 'Após domínio francês, três ilhas formaram o Estado independente em 1975; Mayotte permaneceu sob administração francesa. Essa diferença de status continua a marcar relações regionais.'),
    p('🏘️', 'Medinas históricas', 'Os centros antigos das ilhas preservam mesquitas, casas e sistemas defensivos que materializam séculos de intercâmbio entre África oriental e mundo islâmico.')
  ],
  Congo: [
    p('👑', 'Poderes da bacia do Congo', 'Sociedades teke e o reino de Loango desenvolveram comércio, autoridade política e práticas culturais antes da colonização. As rotas fluviais ligavam interiores e litoral.'),
    p('🧭', 'África Equatorial Francesa', 'A presença francesa integrou a região a uma federação colonial e explorou recursos por concessões. Brazzaville ganhou importância política durante a Segunda Guerra.'),
    p('📜', 'República independente', 'Independente desde 1960, a República do Congo viveu mudanças de regime e conflitos. Sua história é distinta da vizinha República Democrática do Congo, apesar do rio compartilhado.'),
    p('🎨', 'Expressão congolesa', 'Música urbana de Brazzaville e tradições de escultura traduzem encontros entre povos da bacia do Congo e transformações do século XX.')
  ],
  'D.R. Congo': [
    p('👑', 'Estados centro-africanos', 'Reinos e redes como Kongo, Luba e Lunda desenvolveram instituições, arte e comércio em diferentes partes do vasto território. Não formavam uma sociedade única.'),
    p('⛓️', 'Violência colonial', 'O Estado Livre do Congo, controlado por Leopoldo II, ficou marcado por extração coercitiva e atrocidades. Depois, a administração belga continuou a explorar minerais e trabalho.'),
    p('📜', 'Independência e desafios', 'A independência veio em 1960, seguida por crise política e conflitos. A riqueza mineral e a diversidade linguística ajudam a explicar tanto sua importância quanto seus desafios históricos.'),
    p('🎵', 'Influência cultural', 'A rumba congolesa tornou-se linguagem musical de alcance continental, criada em diálogo com ritmos locais e sonoridades que circularam pelo Atlântico.')
  ],
  'Ivory Coast': [
    p('👑', 'Reinos e comércio', 'Comunidades akan, mande e outras desenvolveram centros políticos e rotas comerciais entre floresta e savana. A cidade de Kong foi referência intelectual e mercantil.'),
    p('🧭', 'Colônia e cacau', 'O domínio francês reorganizou trabalho e terras. A expansão do cacau e do café atraiu migração regional e transformou profundamente a economia e a paisagem.'),
    p('📜', 'Independência e cidadania', 'Independente desde 1960, a Costa do Marfim cresceu rapidamente nas primeiras décadas. Debates posteriores sobre pertencimento e representação estiveram ligados a conflitos políticos.'),
    p('🎨', 'Tradições materiais', 'Esculturas, tecidos e arquitetura de diferentes comunidades mostram técnicas e ideias transmitidas por gerações, além da história das exportações agrícolas modernas.')
  ],
  Djibouti: [
    p('🐪', 'Afar e issas', 'Comunidades afar e somalis issas ligavam o litoral do mar Vermelho ao interior por rotas de comércio e pastoreio. Sua história antecede a construção do porto moderno.'),
    p('⚓', 'Porto estratégico', 'A França estabeleceu uma colônia no fim do século XIX. O porto moderno cresceu junto a uma das passagens marítimas mais movimentadas entre Índico e Mediterrâneo.'),
    p('📜', 'Estado independente', 'A independência veio em 1977. A posição junto ao estreito de Bab el-Mandeb mantém o país central para a navegação, enquanto acordos internos buscaram equilibrar comunidades.'),
    p('🚂', 'Corredor etíope', 'A ferrovia histórica abriu uma ligação duradoura entre o interior da Etiópia e o mar, ilustrando a importância regional do pequeno Estado portuário.')
  ],
  Egypt: [
    p('🏛️', 'Civilização do Nilo', 'Reinos faraônicos desenvolveram escrita, administração, agricultura irrigada e arquitetura monumental por milênios. Pirâmides e templos revelam tanto poder estatal quanto trabalho especializado.'),
    p('🕌', 'Cairo e novos mundos', 'Períodos grego, romano, cristão e islâmico transformaram a região. Cairo tornou-se centro de ensino, comércio e arte com influência muito além do vale do Nilo.'),
    p('📜', 'Estado contemporâneo', 'O domínio britânico e a monarquia marcaram a era moderna. A revolução de 1952 abriu uma república e redefiniu o papel egípcio no mundo árabe e africano.'),
    p('🏗️', 'Canal e circulação', 'A abertura do Canal de Suez em 1869 alterou rotas marítimas globais e tornou o controle dessa passagem uma questão estratégica para o Egito.')
  ],
  'Eq. Guinea': [
    p('🌿', 'Ilha e continente', 'Bioko e a parte continental têm histórias diferentes: comunidades bubi, fang e outras mantiveram línguas e instituições próprias antes da colonização europeia.'),
    p('🧭', 'Domínio espanhol', 'A Espanha reuniu territórios insulares e continentais numa colônia. Plantações em Bioko e trabalho migrante moldaram uma economia distinta da de países vizinhos.'),
    p('📜', 'Independência e petróleo', 'A independência veio em 1968, seguida por governos autoritários e deslocamentos. A exploração petrolífera a partir dos anos 1990 alterou a economia sem apagar desafios sociais.'),
    p('🗣️', 'Línguas em convivência', 'O espanhol permaneceu oficial, mas fang, bubi e outras línguas preservam histórias e identidades distintas nas ilhas e no continente.')
  ],
  Eritrea: [
    p('⚓', 'Portos do mar Vermelho', 'Adulis conectou o antigo reino de Aksum a rotas entre África, Arábia e Mediterrâneo. Comunidades das terras altas e do litoral desenvolveram trajetórias religiosas e linguísticas variadas.'),
    p('🧭', 'Colônia e federação', 'A Itália colonizou a Eritreia no fim do século XIX. Após administração britânica, a região foi federada à Etiópia e depois anexada, gerando resistência prolongada.'),
    p('📜', 'Independência', 'Décadas de luta terminaram com a independência reconhecida em 1993. A memória desse processo é central para a identidade nacional e para relações com países vizinhos.'),
    p('🏙️', 'Asmara modernista', 'Edifícios erguidos sob o domínio italiano deram a Asmara uma paisagem urbana singular, hoje preservada como testemunho material de uma era colonial.')
  ],
  Swaziland: [
    p('👑', 'Formação do reino', 'Lideranças suázis consolidaram um reino no século XIX em meio a migrações e disputas regionais. Cerimônias e instituições monárquicas continuam importantes para a vida cultural.'),
    p('🛡️', 'Protetorado britânico', 'Pressões coloniais reduziram a autonomia territorial; o país tornou-se protetorado britânico. Autoridades locais conservaram parte de suas estruturas políticas durante esse período.'),
    p('📜', 'Independência e nome', 'A independência veio em 1968. Em 2018, o nome oficial passou de Suazilândia a Essuatíni, valorizando a forma usada na língua siSwati.'),
    p('🥁', 'Cerimônias reais', 'Celebrações como a Incwala expressam vínculos entre monarquia, comunidade e renovação ritual, ainda que a sociedade contemporânea abrigue perspectivas políticas diversas.')
  ],
  Ethiopia: [
    p('🏛️', 'Aksum e redes antigas', 'O reino de Aksum conectou terras altas, mar Vermelho e comércio distante. A adoção antiga do cristianismo deixou patrimônio religioso e artístico duradouro.'),
    p('⛪', 'Reinos das terras altas', 'Dinastias posteriores construíram centros como Lalibela e mantiveram tradições literárias em geez. Povos de muitas línguas participaram da história etíope além das cortes imperiais.'),
    p('🕊️', 'Soberania e mudanças', 'A Etiópia resistiu à conquista italiana em Adwa, em 1896, mas sofreu ocupação entre 1936 e 1941. A queda da monarquia em 1974 abriu outra etapa política.'),
    p('📚', 'Escrita e memória', 'Manuscritos religiosos, tradições orais e alfabetos usados no país documentam uma produção intelectual longa e diversa, não limitada à história imperial.')
  ],
  Gabon: [
    p('🌿', 'Sociedades da floresta', 'Comunidades myene, fang e outras formaram redes de parentesco, comércio e arte no litoral e no interior. Objetos rituais testemunham histórias locais anteriores à colônia.'),
    p('🧭', 'França e estuário', 'A presença francesa cresceu a partir do século XIX e integrou o Gabão à África Equatorial Francesa. Extração de madeira e novas cidades alteraram economias regionais.'),
    p('📜', 'Independência e recursos', 'Independente desde 1960, o país passou a depender fortemente do petróleo. Debates sobre distribuição de riqueza e preservação florestal marcam sua trajetória contemporânea.'),
    p('🎨', 'Arte e transmissão', 'Esculturas e máscaras de diferentes povos gaboneses preservam conceitos de memória ancestral e inspiraram debates artísticos dentro e fora da África.')
  ],
  Gambia: [
    p('🚣', 'Um rio de conexões', 'O rio Gâmbia ligava comunidades mandingas e outras a rotas do Sahel e do Atlântico. Comércio e circulação cultural precederam a definição das fronteiras atuais.'),
    p('⛓️', 'Entre impérios coloniais', 'Britânicos controlaram o corredor fluvial, cercado pelo Senegal francês. O comércio atlântico incluiu o tráfico de pessoas escravizadas, lembrado em sítios históricos do rio.'),
    p('📜', 'Independência e democracia', 'A independência veio em 1965. Mudanças institucionais e uma transição eleitoral em 2017 mostram esforços para ampliar a participação política após décadas de autoritarismo.'),
    p('🎵', 'Griôs e memória', 'Narradores e músicos de tradição mandinga transmitiram genealogias e acontecimentos por gerações, preservando uma memória regional que não depende apenas de arquivos escritos.')
  ],
  Ghana: [
    p('👑', 'Estados akan e asante', 'Reinos e chefaturas organizaram comércio de ouro e instituições políticas no território atual. O Império medieval de Gana, apesar do nome, situava-se mais ao noroeste.'),
    p('⛓️', 'Costa do Ouro', 'Fortes europeus lembram o tráfico atlântico de pessoas escravizadas e disputas por ouro. O domínio britânico transformou a região na colônia chamada Costa do Ouro.'),
    p('📜', 'Independência pioneira', 'Sob liderança de Kwame Nkrumah, Gana tornou-se independente em 1957. Sua experiência influenciou movimentos anticoloniais e debates pan-africanos em todo o continente.'),
    p('🎨', 'Legado artístico', 'Tecidos kente e objetos de corte asante comunicam autoridade, pertencimento e habilidade técnica, mantendo visíveis histórias que antecedem o Estado moderno.')
  ],
  Guinea: [
    p('🕌', 'Futa Jalom e interior', 'O imamato de Futa Jalom foi um centro político e religioso no planalto. Outras comunidades participaram de redes de comércio e de resistência à expansão francesa.'),
    p('🧭', 'Conquista e decisão', 'A colonização francesa reorganizou territórios e trabalho. Em 1958, a Guiné rejeitou por referendo a comunidade política proposta por Paris e tornou-se independente.'),
    p('🎵', 'Cultura e Estado', 'O novo governo buscou afirmar autonomia africana, mas também restringiu liberdades. Música e artes receberam apoio estatal e projetaram tradições guineenses pelo mundo.'),
    p('🌿', 'Paisagens culturais', 'Os planaltos de Futa Jalom abrigam nascentes de grandes rios da África ocidental e comunidades que adaptaram agricultura e pastoreio a esse ambiente.')
  ],
  'Guinea-Bissau': [
    p('👑', 'Kaabu e litoral', 'O reino de Kaabu e sociedades costeiras mantiveram comércio e instituições próprias. Rios e ilhas dos Bijagós favoreceram modos de vida diferentes dos do interior.'),
    p('⚓', 'Presença portuguesa', 'A atuação portuguesa começou em entrepostos costeiros, mas o controle colonial do interior foi tardio e contestado. Resistências locais marcaram essa longa trajetória.'),
    p('📜', 'Luta pela independência', 'O PAIGC, associado a Amílcar Cabral, organizou a guerra anticolonial. A independência foi proclamada em 1973 e reconhecida por Portugal em 1974.'),
    p('🌊', 'Ilhas Bijagós', 'No arquipélago, práticas de navegação, rituais e organização comunitária preservam patrimônios próprios, lembrando a diversidade interna muitas vezes ausente de narrativas nacionais.')
  ],
  Kenya: [
    p('⛵', 'Costa suaíli', 'Cidades costeiras integraram redes do oceano Índico, com comércio, islã e arquitetura própria. No interior, povos como kikuyus e massais seguiram trajetórias distintas.'),
    p('🧭', 'Domínio britânico', 'A construção ferroviária e a ocupação de terras férteis alteraram economias e comunidades. A revolta Mau Mau expressou resistência ao regime colonial nos anos 1950.'),
    p('📜', 'Independência e pluralidade', 'O Quênia tornou-se independente em 1963. A nação reúne muitas línguas e histórias regionais; debates sobre terra e representação seguem ligados ao passado colonial.'),
    p('🦴', 'Passado muito antigo', 'Sítios arqueológicos no vale do Rift ajudam a estudar longos capítulos da evolução humana, muito anteriores à formação das sociedades e fronteiras atuais.')
  ],
  Lesotho: [
    p('🏔️', 'Reino nas montanhas', 'Moshoeshoe I reuniu comunidades basotho no século XIX, usando as montanhas como proteção em meio a conflitos regionais. Sua diplomacia ajudou a preservar uma identidade política própria.'),
    p('🛡️', 'Basutolândia', 'A pressão de colonos vizinhos levou o reino a buscar proteção britânica. O território tornou-se um enclave cercado pela África do Sul, mas não integrou seu Estado.'),
    p('📜', 'Independência', 'O Lesoto tornou-se independente em 1966. A monarquia constitucional e a língua sesotho mantêm a continuidade histórica do reino, apesar de desafios econômicos e políticos.'),
    p('🎨', 'Tradições basotho', 'Cobertores, música e arquitetura de pedra expressam formas de pertencimento que atravessaram mudanças de fronteira e continuam reconhecíveis nas comunidades das montanhas.')
  ],
  Liberia: [
    p('🌿', 'Povos anteriores ao Estado', 'Comunidades indígenas com línguas e instituições próprias viviam na região antes da criação da Libéria. Sua história não começou com a chegada de migrantes atlânticos.'),
    p('⛵', 'Fundação e república', 'A partir do século XIX, pessoas negras livres vindas dos Estados Unidos estabeleceram assentamentos com apoio de uma sociedade colonizadora. A república declarou independência em 1847.'),
    p('🕊️', 'Inclusão e reconstrução', 'As relações entre a elite américo-liberiana e povos locais marcaram a política nacional. Guerras civis entre 1989 e 2003 deixaram perdas profundas e exigiram reconstrução institucional.'),
    p('📚', 'Experiência singular', 'A Libéria não foi uma colônia europeia convencional; sua fundação conectou debates sobre escravidão, cidadania e migração em ambos os lados do Atlântico.')
  ],
  Libya: [
    p('🏛️', 'Mediterrâneo e deserto', 'Cidades antigas da Tripolitânia e Cirenaica participaram de redes gregas e romanas. Comunidades amazigh e rotas saariana deram à região outras histórias além do litoral.'),
    p('🕌', 'Domínios sucessivos', 'Dinastias islâmicas e depois o Império Otomano ligaram o território a circuitos mediterrâneos e africanos. A conquista italiana no século XX encontrou resistência prolongada.'),
    p('📜', 'Reino e república', 'A Líbia tornou-se independente em 1951. A exploração de petróleo e a mudança de regime em 1969 transformaram o Estado; 2011 abriu nova fase de disputas políticas.'),
    p('🏛️', 'Patrimônio urbano', 'Leptis Magna e Cirene conservam ruas, teatros e templos que mostram como cidades locais participavam de circuitos mediterrâneos antigos.')
  ],
  Madagascar: [
    p('⛵', 'Povoamento do Índico', 'Ancestrais vindos do Sudeste Asiático e da África formaram comunidades na ilha. A língua malgaxe e práticas agrícolas revelam conexões marítimas de longa distância.'),
    p('👑', 'Reinos da ilha', 'Diversos reinos regionais floresceram; o reino merina ampliou seu poder no século XIX. Cortes, escrita e redes de comércio produziram uma história política própria.'),
    p('📜', 'Colônia e independência', 'A França colonizou Madagascar em 1896. A revolta de 1947 foi reprimida com violência; a independência chegou em 1960, sem apagar diferenças regionais.'),
    p('🎭', 'Memória ancestral', 'Cerimônias familiares e túmulos monumentais em algumas regiões mostram a importância das relações com antepassados, preservadas em formas culturais diversas.')
  ],
  Malawi: [
    p('👑', 'Maravi e lago', 'Estados associados aos maravi organizaram comércio e poder ao redor do lago Malaui. Comunidades chewa, yao e outras mantiveram redes locais distintas.'),
    p('🧭', 'Protetorado de Niassalândia', 'O domínio britânico alterou terras e trabalho. A região integrou uma federação colonial com as atuais Zâmbia e Zimbábue, contestada por movimentos nacionalistas.'),
    p('📜', 'Independência e abertura', 'O Malaui tornou-se independente em 1964. Após décadas de governo de partido único, eleições pluripartidárias em 1994 abriram outra etapa da vida política.'),
    p('🎨', 'Patrimônio do lago', 'A pesca, a navegação e as pinturas rupestres de Chongoni oferecem registros de práticas econômicas e simbólicas que antecedem o Estado contemporâneo.')
  ],
  Mali: [
    p('👑', 'Impérios do Sahel', 'Territórios do atual Mali participaram das histórias dos impérios de Gana, Mali e Songhai. Rios, ouro e rotas transaarianas sustentaram poder e trocas de longo alcance.'),
    p('📚', 'Timbuktu e conhecimento', 'Timbuktu e Djenné foram centros de comércio, ensino islâmico e produção de manuscritos. Seu legado mostra a importância intelectual africana antes do domínio europeu.'),
    p('📜', 'Estado moderno', 'Após integrar o Sudão Francês, o Mali tornou-se independente em 1960. A convivência entre regiões e comunidades diversas segue central para sua história política.'),
    p('🎵', 'Memória oral', 'Griôs preservam genealogias, acontecimentos e música em tradições de transmissão que complementam os célebres manuscritos das cidades sahelianas.')
  ],
  Mauritania: [
    p('🐪', 'Rotas do Saara', 'Comunidades amazigh, soninquês e outras ligaram o deserto ao vale do Senegal. Caravanas transportaram sal, ouro e livros entre o Magrebe e o Sahel.'),
    p('📚', 'Cidades de saber', 'Centros como Chinguetti abrigaram bibliotecas e ensino religioso. A circulação de manuscritos mostra que o Saara foi também espaço de aprendizagem e contato.'),
    p('📜', 'Independência e sociedade', 'A Mauritânia tornou-se independente da França em 1960. Debates sobre hierarquias sociais, escravidão e pertencimento continuam ligados à formação do Estado.'),
    p('🏘️', 'Patrimônio de adobe', 'Antigas cidades caravaneiras conservam mesquitas e casas de terra, testemunhos de técnicas adaptadas ao deserto e de redes de intercâmbio intelectual.')
  ],
  Mauritius: [
    p('⛵', 'Ilha do oceano Índico', 'Não há evidência de povoamento permanente antes das navegações europeias. Holandeses, franceses e britânicos ocuparam a ilha em diferentes períodos.'),
    p('⛓️', 'Açúcar e migração', 'Plantações empregaram africanos escravizados e, após a abolição, trabalhadores contratados sobretudo da Índia. Aapravasi Ghat preserva memória dessa migração em massa.'),
    p('📜', 'Independência plural', 'Maurício tornou-se independente em 1968 e república em 1992. Suas comunidades, idiomas e religiões refletem séculos de mobilidade no Índico.'),
    p('🐦', 'Natureza transformada', 'A extinção do dodô tornou-se símbolo das mudanças ambientais após a colonização, quando caça e espécies introduzidas alteraram a ecologia da ilha.')
  ],
  Morocco: [
    p('🏔️', 'Raízes amazigh', 'Comunidades amazigh criaram formas políticas e culturais muito antes da islamização. Dinastias marroquinas uniram áreas atlânticas, mediterrâneas e saarianas em diferentes épocas.'),
    p('🕌', 'Cidades e saberes', 'Fez e Marrakesh foram centros de comércio, artesanato e estudo. O Marrocos participou de redes intelectuais e mercantis entre África e Península Ibérica.'),
    p('📜', 'Protetorados e soberania', 'França e Espanha impuseram protetorados no século XX. A independência em 1956 restaurou a soberania, enquanto a monarquia continuou a moldar as instituições.'),
    p('🎨', 'Artes urbanas', 'Medinas preservam ofícios ligados à cerâmica, ao couro e à madeira, transmitidos por gerações e adaptados às mudanças das cidades modernas.')
  ],
  Mozambique: [
    p('⛵', 'Índico e interior', 'Portos da costa suaíli e rotas de Sofala conectaram ouro e outros produtos do interior ao oceano Índico. Reinos e comunidades do interior mantiveram trajetórias próprias.'),
    p('🧭', 'Domínio português', 'A presença portuguesa começou no século XVI e se expandiu de modo desigual. Trabalho coercitivo e concessões coloniais transformaram economias locais e provocaram resistências.'),
    p('🕊️', 'Independência e paz', 'A luta conduzida pela FRELIMO levou à independência em 1975. Uma guerra civil terminou por acordo em 1992; reconstrução e pluralidade cultural marcam o país.'),
    p('🏝️', 'Ilha de Moçambique', 'A antiga cidade portuária reúne arquitetura suaíli, portuguesa e indiana, mostrando encontros comerciais e sociais que moldaram o litoral por séculos.')
  ],
  Namibia: [
    p('🪶', 'Histórias anteriores à colônia', 'Comunidades san, nama, herero e outras deixaram arte rupestre, tradições orais e formas próprias de ocupar terras áridas. Twyfelfontein conserva gravuras antigas.'),
    p('🕯️', 'Conquista e genocídio', 'O domínio colonial alemão iniciou-se no fim do século XIX. Campanhas contra hereros e namas entre 1904 e 1908 são reconhecidas como genocídio.'),
    p('📜', 'Caminho à independência', 'A África do Sul administrou o território após a Primeira Guerra e impôs apartheid. A Namíbia tornou-se independente em 1990, após longa mobilização diplomática e armada.'),
    p('🗣️', 'Memória pública', 'Debates sobre terras, reparação e nomes de lugares mantêm visíveis as consequências coloniais, enquanto línguas locais expressam a diversidade nacional.')
  ],
  Niger: [
    p('🐪', 'Agadez e caravanas', 'Agadez cresceu como centro tuaregue em rotas transaarianas. O comércio ligou comunidades do Saara a mercados do Sahel e do norte africano.'),
    p('👑', 'Estados e diversidade', 'Povos hauçás e zarmas desenvolveram centros políticos e redes agrícolas em outras partes do território. Essa diversidade antecedeu as fronteiras coloniais.'),
    p('📜', 'Da colônia ao Estado', 'A França colonizou a região, que se tornou independente em 1960. Disputas sobre representação, recursos e autonomia regional marcaram a vida política posterior.'),
    p('🏘️', 'Centro histórico de Agadez', 'A mesquita e as casas de adobe registram técnicas de construção adaptadas ao Saara e a antiga importância urbana das caravanas.')
  ],
  Nigeria: [
    p('🏛️', 'Muitos centros históricos', 'Ifé e Oió, cidades hauçás e o Reino do Benin desenvolveram artes, governos e comércio distintos. O território atual não nasceu de uma única tradição.'),
    p('🧭', 'Domínio britânico', 'A colonização reuniu regiões diferentes em uma administração única no século XX. Fronteiras e instituições coloniais influenciaram a federação posterior.'),
    p('📜', 'Independência e federação', 'A Nigéria tornou-se independente em 1960. A guerra de Biafra, entre 1967 e 1970, deixou perdas profundas; literatura, cinema e música ampliaram sua influência global.'),
    p('🎨', 'Bronzes do Benin', 'Objetos produzidos na corte do Benin testemunham grande habilidade técnica; sua dispersão durante a conquista britânica alimenta debates sobre restituição cultural.')
  ],
  Rwanda: [
    p('👑', 'Reino dos Grandes Lagos', 'O reino ruandês desenvolveu instituições próprias antes do domínio europeu. Agricultura, criação de gado e língua kinyarwanda ligavam comunidades diversas.'),
    p('🧭', 'Colonialismo e categorias sociais', 'Administrações alemã e belga transformaram relações políticas e reforçaram divisões étnicas. A independência em 1962 não encerrou tensões e deslocamentos.'),
    p('🕯️', 'Genocídio e reconstrução', 'Em 1994, o genocídio contra os tutsis matou centenas de milhares de pessoas, além de outros assassinatos. Justiça, memória e reconstrução institucional passaram a marcar o país.'),
    p('⚖️', 'Justiça comunitária', 'Tribunais gacaca foram usados depois de 1994 para julgar muitos casos, gerando discussões sobre responsabilização, reconciliação e limites desse modelo.')
  ],
  'São Tomé & Príncipe': [
    p('⛵', 'Ilhas atlânticas', 'Não há evidência de povoamento permanente antes da chegada portuguesa no século XV. As ilhas tornaram-se pontos de experimentação da economia de plantação atlântica.'),
    p('🌱', 'Açúcar, cacau e trabalho', 'Pessoas africanas escravizadas sustentaram a produção colonial de açúcar; mais tarde, cacau e café ganharam peso. Roças antigas preservam vestígios dessa organização.'),
    p('📜', 'Independência insular', 'São Tomé e Príncipe tornou-se independente em 1975. A cultura crioula e a memória das roças ajudam a compreender uma sociedade formada por mobilidade forçada e criação local.'),
    p('🎭', 'Tchiloli e teatro', 'O tchiloli adapta narrativas europeias a práticas cênicas locais, exemplo da maneira criativa como comunidades insulares transformaram heranças coloniais.')
  ],
  Senegal: [
    p('👑', 'Estados e rios', 'Reinos como Jolof e estados do vale do Senegal participaram de redes agrícolas e comerciais. O litoral ligou essas sociedades ao Atlântico de modo desigual.'),
    p('⛓️', 'Portos coloniais', 'Gorée e Saint-Louis guardam memórias do comércio atlântico e da presença francesa. O tráfico de pessoas escravizadas integrou uma história regional mais ampla e dolorosa.'),
    p('📜', 'Independência e cultura', 'Após breve Federação do Mali, o Senegal tornou-se independente em 1960. Literatura, música e o pensamento da negritude projetaram debates culturais além de suas fronteiras.'),
    p('🕌', 'Irmandades sufis', 'Ordens religiosas como a mouride construíram redes de ensino, agricultura e solidariedade, dando à vida senegalesa uma dimensão social própria além do Estado.')
  ],
  Seychelles: [
    p('⛵', 'Arquipélago do Índico', 'Não há evidência de povoamento permanente antes da ocupação europeia. Franceses e depois britânicos usaram as ilhas em circuitos marítimos do oceano Índico.'),
    p('🌱', 'Sociedade crioula', 'Trabalho de africanos escravizados e migrações posteriores formaram uma população diversa. A língua crioula e práticas culturais locais nasceram desse encontro desigual.'),
    p('📜', 'Estado independente', 'As Seicheles tornaram-se independentes em 1976. Sua trajetória posterior inclui mudanças de regime e esforços para equilibrar turismo, conservação ambiental e autonomia insular.'),
    p('🏙️', 'Victoria insular', 'A pequena capital conserva marcas urbanas britânicas e espaços de convivência entre comunidades, testemunhando a formação de uma sociedade crioula no Índico.')
  ],
  'Sierra Leone': [
    p('🌿', 'Povos do litoral e interior', 'Comunidades temne, mende e outras mantiveram redes políticas e comerciais antes da presença britânica. O território abrigou histórias muito anteriores a Freetown.'),
    p('⛵', 'Freetown e retornos', 'No fim do século XVIII, Freetown recebeu pessoas negras libertas e reassentadas do mundo atlântico. Sua língua crioula expressa encontros entre experiências africanas e diaspóricas.'),
    p('🕊️', 'Independência e recuperação', 'Serra Leoa tornou-se independente em 1961. A guerra civil de 1991 a 2002 trouxe graves violações; iniciativas de memória e justiça acompanharam a reconstrução.'),
    p('⚖️', 'Justiça pós-guerra', 'A Comissão da Verdade e o Tribunal Especial documentaram crimes e experiências de sobreviventes, contribuindo para debates internacionais sobre responsabilização.')
  ],
  Somalia: [
    p('⛵', 'Cidades do Índico', 'Portos somalis participaram por séculos de comércio com Arábia, Índia e interior africano. A difusão do islã e a poesia oral enriqueceram tradições locais.'),
    p('🧭', 'Divisões coloniais', 'Potências europeias dividiram territórios habitados por somalis. Em 1960, a Somália britânica e a italiana se uniram para formar o novo Estado.'),
    p('📜', 'Estado e reconstrução', 'A queda do governo central em 1991 abriu longo período de conflitos e administrações regionais. Redes comerciais e instituições locais continuaram a sustentar a vida social.'),
    p('📚', 'Poesia oral', 'A poesia somali tem longa tradição de debate público e memória coletiva, mostrando uma cultura letrada e oral muito além das notícias sobre guerra.')
  ],
  'South Africa': [
    p('🪶', 'Histórias profundas', 'Povos san e khoikhoi, comunidades agrícolas e estados como Mapungubwe desenvolveram culturas diversas. A história sul-africana antecede amplamente a chegada europeia.'),
    p('⛓️', 'Colonização e segregação', 'Colonizações neerlandesa e britânica expropriaram terras e organizaram trabalho coercitivo. No século XX, o apartheid transformou a segregação racial em sistema legal.'),
    p('🕊️', 'Democracia e memória', 'A resistência ao apartheid levou às eleições universais de 1994. A nova democracia buscou reconhecimento de direitos e enfrentamento das desigualdades herdadas.'),
    p('⚖️', 'Verdade pública', 'A Comissão da Verdade e Reconciliação ouviu vítimas e responsáveis por violações, criando um registro público importante, embora incapaz de resolver sozinha injustiças estruturais.')
  ],
  'S. Sudan': [
    p('🌿', 'Povos do alto Nilo', 'Comunidades dinka, nuer, shilluk e muitas outras criaram instituições e tradições próprias. O território reúne histórias que não cabem numa identidade única.'),
    p('🧭', 'Dentro do Sudão', 'O domínio anglo-egípcio e depois o Estado sudanês administraram a região de maneiras desiguais. Guerras prolongadas entre norte e sul provocaram deslocamentos em massa.'),
    p('📜', 'Independência recente', 'Um acordo de paz abriu caminho ao referendo e à independência em 2011. Conflitos posteriores mostraram os desafios de construir instituições compartilhadas no novo país.'),
    p('🎭', 'Expressões culturais', 'Narrativas orais, dança e criação de gado mantêm sentidos sociais variados entre comunidades do país, mesmo diante de deslocamentos e mudanças políticas.')
  ],
  Sudan: [
    p('🏛️', 'Núbia e Cuxe', 'Reinos núbios, entre eles Cuxe, desenvolveram cidades, escrita, templos e pirâmides ao longo do Nilo. Meroé foi um centro de poder com contatos africanos e mediterrâneos.'),
    p('🕌', 'Reinos e rotas', 'Após a Antiguidade, estados cristãos e depois sultanatos islâmicos marcaram o vale do Nilo. Comércio e migrações ligaram o Sudão ao Sahel e ao mar Vermelho.'),
    p('📜', 'Independência e conflitos', 'O país tornou-se independente em 1956 após governo anglo-egípcio. Guerras civis e a separação do Sudão do Sul em 2011 fazem parte de sua história recente.'),
    p('⚔️', 'Revolta mahdista', 'No fim do século XIX, o movimento mahdista derrubou o domínio egípcio e formou um Estado no Sudão, antes da conquista anglo-egípcia.')
  ],
  Tanzania: [
    p('⛵', 'Costa suaíli', 'Kilwa e outras cidades costeiras integraram comércio do oceano Índico, com arquitetura, língua e cultura próprias. Povos do interior também mantiveram redes políticas diversas.'),
    p('🧭', 'Tanganica e Zanzibar', 'A Alemanha colonizou o continente; depois da Primeira Guerra, o Reino Unido o administrou. Zanzibar teve trajetória insular marcada por sultanato e comércio marítimo.'),
    p('📜', 'União e reformas', 'Tanganica independente e Zanzibar uniram-se em 1964 para formar a Tanzânia. O projeto de ujamaa procurou reorganizar a vida rural e a construção nacional.'),
    p('🗣️', 'Suaíli nacional', 'A promoção do suaíli como língua comum ajudou a ligar comunidades diferentes e marcou uma escolha cultural importante do Estado pós-colonial.')
  ],
  Togo: [
    p('🌿', 'Povos e fronteiras', 'Comunidades ewe, kabiyè e outras desenvolveram comércio e instituições próprias antes da conquista europeia. As fronteiras modernas dividiram algumas dessas redes regionais.'),
    p('🧭', 'De colônia alemã a mandato', 'O território passou ao domínio alemão no século XIX. Após a Primeira Guerra, sua administração foi dividida entre França e Reino Unido.'),
    p('📜', 'Independência', 'A parte francesa tornou-se o Togo independente em 1960; a porção britânica seguiu outra trajetória. Mudanças de regime posteriores marcaram debates sobre representação e democracia.'),
    p('🎨', 'Patrimônio de Koutammakou', 'Casas de terra construídas pelos batammariba expressam relações entre arquitetura, crenças e organização familiar, preservadas apesar de mudanças políticas regionais.')
  ],
  Tunisia: [
    p('🏛️', 'Cartago e Roma', 'Cartago foi potência mediterrânea antes da conquista romana. Ruínas púnicas e romanas mostram a importância antiga do litoral tunisiano.'),
    p('🕌', 'Cairuão e Magrebe', 'A expansão islâmica fez de Cairuão um centro religioso e intelectual. Dinastias e rotas comerciais conectaram o território ao interior africano e ao Mediterrâneo.'),
    p('📜', 'Independência e revolução', 'A Tunísia tornou-se protetorado francês em 1881 e independente em 1956. A revolta de 2010–2011 abriu reformas e inspirou mobilizações em outros países.'),
    p('🏛️', 'Mosaicos e cidades', 'Museus e sítios antigos conservam mosaicos, portos e edifícios que revelam encontros púnicos, romanos e norte-africanos ao longo de muitos séculos.')
  ],
  Uganda: [
    p('👑', 'Reinos dos Grandes Lagos', 'Buganda, Bunyoro e outros reinos desenvolveram instituições, agricultura e comércio próprios. Suas histórias permanecem importantes dentro do Estado ugandês atual.'),
    p('🧭', 'Protetorado britânico', 'A colonização britânica apoiou-se em acordos e poderes locais, criando desigualdades regionais. O Uganda tornou-se independente em 1962.'),
    p('📜', 'Rupturas e reconstrução', 'Governos autoritários e guerras nas décadas seguintes deixaram marcas profundas. A restauração de instituições tradicionais e processos de recuperação alteraram a vida política posterior.'),
    p('🎨', 'Patrimônio diverso', 'Artefatos de corte, música e tradições orais dos vários reinos preservam histórias regionais que a administração colonial tentou reunir sob uma só fronteira.')
  ],
  Zambia: [
    p('👑', 'Reinos e sociedades', 'Comunidades bemba, lozi e outras formaram redes políticas e comerciais variadas. O território não teve uma única história antes das fronteiras coloniais.'),
    p('⛏️', 'Cobre e colonização', 'Sob domínio britânico como Rodésia do Norte, minas do Copperbelt atraíram trabalhadores e movimentos sindicais. O cobre tornou-se central para a economia.'),
    p('📜', 'Independência', 'A Zâmbia tornou-se independente em 1964, após oposição à federação colonial centro-africana. Sua posição regional também a ligou a movimentos de libertação vizinhos.'),
    p('🌊', 'Tradição lozi', 'A cerimônia Kuomboka acompanha a mudança sazonal da corte lozi diante das cheias da planície do Barotse, unindo história política e adaptação ambiental.')
  ],
  Zimbabwe: [
    p('🏛️', 'Grande Zimbábue', 'As muralhas de pedra de Grande Zimbábue testemunham um importante centro político e comercial ligado a redes do oceano Índico. Foram construídas por ancestrais de povos shona.'),
    p('🧭', 'Rodésia colonial', 'A ocupação de colonos britânicos expropriou terras e impôs segregação. A declaração unilateral de independência do governo branco em 1965 prolongou o conflito.'),
    p('📜', 'Independência e terra', 'A independência reconhecida em 1980 abriu o governo da maioria. Redistribuição de terras, memória da guerra e disputas institucionais marcaram as décadas seguintes.'),
    p('🎨', 'Nome recuperado', 'O nome do país remete a Grande Zimbábue, reafirmando uma história africana monumental que havia sido desvalorizada por narrativas coloniais.')
  ]
});
