# Discover Destination — expansão e validação

Revisão: 26/09/2026. Projeto: `C:\Users\PC-LUCAS\OneDrive - SENAC - SP\traveling-gis-miles-overhaul`, branch `main`. Trabalho continuado sobre a implementação existente; sem commit, push ou publicação.

## Resultado e causa

Cobertura anterior: 27 perfis / 26 países. Cobertura atual: **133 perfis / 114 países de um catálogo de 196**. São 88 países adicionais. Nenhum país foi reclassificado e nenhum History, foto ou guia foi reescrito.

Os principais gargalos eram a cobertura pequena, interesses ausentes dos metadados e meses apenas menos favoráveis tratados como exclusão. O código anterior **já aceitava sobreposição de orçamento**; não havia exigência de que toda a faixa coubesse no teto. Essa regra foi preservada, sem baratear artificialmente os roteiros originais.

## Arquitetura e regras

- `destination.expansion.js`: sementes compactas por região turística, experiências e classes de custo reutilizáveis; não duplica o catálogo de países.
- `destination.profiles.js`: preserva os 27 perfis originais, refina complementos/temporadas e deriva aeroporto, melhor época e curva mensal do catálogo quando adequados.
- `destination.discovery.js`: filtro/ranking puro, local e determinístico. `discovery.ui.js` mantém as três etapas e o desenho original; apenas explicações/diagnóstico ganharam informação.
- **Clima:** 12 classificações por região turística: quente, ameno ou frio. Seleção explícita exige igualdade; “Tanto faz” não filtra. São aproximações editoriais de condições habituais, não previsões, temperaturas exatas ou certeza de neve. Frio noturno em deserto/altitude não justifica automaticamente um roteiro de frio. Nada é inferido apenas pelo continente.
- **Temporada:** 0 ruim/excluída, 1 aceitável com ressalvas, 2 boa, 3 ideal. Uma curva nacional com zero significa “não preferida”, não necessariamente “turismo inviável”: apenas os roteiros culturais/urbanos documentados recebem esse refinamento. Clima, tempestades severas, calor extremo e janelas de atividades continuam limitando os perfis apropriados. Praia na costa europeia/uruguaia tem máscara mensal própria.
- **Interesses:** 3 definidor, 2 significativo, 1 complemento real, 0 ausente. Primeiro interesse precisa de pelo menos 2; o segundo pode ter 1 quando o primeiro é 3. Nenhum interesse ausente é inventado. Peso interno: primeiro ×8, segundo ×5.
- **Strong Match:** temporada boa/ideal, todos os interesses com força ≥2, nenhuma contradição e alguma folga em relação ao mínimo de custo. **Good Match:** mesma coerência de clima/custo, mas época aceitável, segundo interesse complementar ou orçamento perto do mínimo. Fortes vêm antes dos bons, sem porcentagens visíveis.
- **Ranking dentro da classe:** interesses + temporada (0/7/14 pontos) + orçamento (8 se toda a faixa cabe, 2 se apenas parte cabe) + 16 para isenção de visto quando priorizada. Desempate estável por país/perfil. O bônus de visto nunca remove restrições reais nem transforma eVisa, autorização ou visto na chegada em isenção.
- **Alternativas:** próximo país da lista já ordenada com as mesmas preferências; mantém o melhor perfil por país, sem repetir imediatamente o mesmo país como outra região.
- **Sem combinação:** diagnóstico testa relaxar uma condição por vez, sem mostrar silenciosamente os resultados relaxados. Indica orçamento, clima, mês ou segundo interesse quando há evidência de que esse ajuste ajudaria.

## Orçamento

Uma pessoa, aproximadamente 7 dias/7 noites, saída GRU, ida e volta econômica, quarto privativo simples, refeições comuns, transporte local/transfer e passeios básicos. Não inclui compras, luxo, grandes expedições ou esqui intensivo. Seguro, documentação e itens especiais devem ser cotados à parte. Viagens longas podem exigir dias adicionais de deslocamento além dos sete dias locais.

Passagens e semana local ficam em componentes separados. Classes de custo refletem logística e custo local, não apenas distância ou continente. As faixas são **estimativas editoriais de planejamento, não preços pesquisados/cotados para uma data**. Aplica-se margem de 15% nos meses de pico indicados no perfil, com arredondamento para cima em R$500. Esse ajuste é conservador, não um modelo de preços em tempo real; feriados/câmbio podem ultrapassar a faixa.

Compatibilidade: mínimo estimado ≤ teto selecionado. Assim R$7–10 mil cabe na faixa R$8–12 mil; R$12–18 mil não cabe em até R$5 mil. As faixas de orçamento representam capacidade de gasto, não obrigação de gastar o limite inferior. Quando apenas parte da faixa cabe, a interface avisa que o total pode ultrapassar o teto.

## Matriz de testes

Orçamento não especificado abaixo = sem prioridade. Os dez cenários foram executados no motor e pela interface; contagens referem-se à lista inteira do motor, exemplos à inspeção dos resultados.

| Cenário | Países coerentes | Exemplos / conclusão |
|---|---:|---|
| Praia, calor, até R$5 mil, janeiro | 2 | Brasil/Rio e Uruguai/Costa de Oro; Uruguai aparece com ressalva de orçamento |
| Cultura + gastronomia, ameno, R$8–12 mil, outubro | 40 | Argentina/Buenos Aires; Itália/Roma; México/CDMX; Portugal/Lisboa |
| Natureza + aventura, frio, junho | 3 | Argentina/Ushuaia; Chile/Andes; Nova Zelândia/Queenstown |
| Natureza, frio, janeiro | 34 | Andorra, Áustria/Tirol, Finlândia/Lapônia; atividades de inverno explícitas |
| Cidade + cultura, frio, janeiro, priorizar sem visto | 34 | França/Paris, Alemanha, Japão; isenção aumenta ranking, sem excluir os demais |
| Praia, calor, R$12–18 mil, novembro | 24 | Brasil, Cabo Verde/Sal, Índia/Goa, Maurício; Maldivas apenas com ressalva de monção |
| Cultura, ameno, até R$8 mil, maio | 31 | Argentina, Bolívia/La Paz, Chile/Santiago, Paraguai, Peru |
| Aventura, frio, R$8–12 mil, julho | 2 | Argentina/Ushuaia e Chile/Andes; sem falsos destinos tropicais |
| Natureza + gastronomia, qualquer clima, R$5–8 mil, setembro | 40 | Brasil/Foz, Argentina/Mendoza, África do Sul/Joanesburgo, Peru/Cusco |
| Praia, frio, até R$5 mil, janeiro | 0 | Sem combinação; sugestão direcionada para o clima |

10.368 combinações exaustivas: 12 meses × 4 climas × 6 orçamentos × 36 escolhas ordenadas de interesses. Validados filtros, classes, ordem, orçamento, razões, visto, estabilidade e ausência de repetição. Também há casos sintéticos de sobreposição, interesse secundário fraco, dados malformados e janelas sazonais.

Os 133 gateways resolveram no repositório de aeroportos e passaram na validação de país. Exceções geográficas intencionais: Andorra via BCN/Espanha, Liechtenstein via ZRH/Suíça, Mônaco via NCE/França, San Marino via BLQ/Itália e Chamonix via GVA/Suíça. A rota termina no gateway, não finge pousar dentro do país sem aeroporto.

## Auditoria representativa

- América do Sul: Rio é quente em janeiro; Ushuaia é frio em junho/julho; Mendoza e Foz permitem natureza + gastronomia sem transformar noites frescas em viagem de neve.
- América do Norte: Nova York e Miami têm perfis distintos; nenhum cabe em R$5 mil. CDMX amena não herda calor de Cancún.
- Caribe: Jamaica, Cuba e litoral dominicano possuem ressalvas de chuva/tempestades; setembro–outubro não são recomendados nos circuitos expostos.
- Europa: cidades mantêm turismo cultural no inverno; Alpes/Lapônia têm atividades de inverno próprias; praia mediterrânea não fica habilitada o ano inteiro.
- África: Cidade do Cabo, Joanesburgo, costa de Maurício, deserto da Namíbia e altitude de Adis Abeba não compartilham um clima continental genérico. Marrakech não oferece perfil de frio.
- Oriente Médio: Dubai e Mascate têm calor extremo bloqueado para a proposta externa de verão; vistos vêm do catálogo.
- Sul da Ásia: Maldivas nunca cabem em R$5 mil; a monção pode ser apenas opção com ressalvas, não época ideal. Délhi/Agra e Goa têm perfis diferentes.
- Leste Asiático: Tóquio urbano e Hokkaido de natureza se separam; Pequim e Guilin não compartilham a mesma curva mensal. Coreia mantém a categoria de autorização eletrônica.
- Sudeste Asiático: monção urbana em Bangkok/Kuala Lumpur não equivale à viabilidade de barcos em Phuket; ressalvas não são escondidas.
- Oceania: Sydney tem inverno ameno; Cairns é tropical; Queenstown é frio no inverno austral. Não há promessa de viagem barata de longa distância.

## Rotas e regressões

A arquitetura de voo já estava concluída e **não foi reescrita nesta retomada**:

1. Avião low-poly verdadeiro, escala 1,3, alinhado por tangente/quaternion.
2. Linha geodésica fina com opacidade 0,96; seleção do país é temporariamente retirada para contraste e restaurada depois.
3. Esfera na origem e anel no destino em coordenadas reais. Códigos GRU/destino ficam no cartão existente; não foram acrescentados rótulos flutuantes nem outra camada visual.
4. Um pulso sutil de 700 ms ao chegar, seguido de rota/avião persistentes; movimento reduzido pula voo/pulso.

Testes reais de geometria/objetos Three: GRU→FCO, JFK, NRT, JNB, SYD e MLE; quaternion, direção do nariz, geometria reutilizada, chegada, pulso único, redução de movimento e descarte. As seis rotas também foram abertas/fechadas pela interface com códigos corretos e restauração do painel. Discover→rota foi verificado com a alternativa Uruguai/MVD usando o mesmo motor.

Regressões visuais/funcionais: busca, seleção, rotação manual/hover do globo, clique no hotspot real das Maldivas, continentes, visitados (marcado e desmarcado no ambiente de teste), filtro de visto, Miles, fotos carregadas, História, checklist, temas claro/escuro. Em viewport 390×844: sem overflow horizontal; proporções e área rolável originais preservadas. Console sem novos erros nas sessões testadas. Os 12 validadores passaram; alertas de conteúdo já existentes no catálogo não foram tratados como correções deste escopo.

## Fontes e limites de confiança

Base principal: `countries.dataset.js` e os enriquecimentos regionais existentes (`bestTime`, `months`, `travelProfile.seasonalTips`, `visaPolicyBR`, aeroportos). As novas sementes acrescentam apenas o recorte necessário. Fontes complementares verificadas para amostras críticas:

- [Inverno na Finlândia](https://www.visitfinland.com/en/things-to-do/winter/)
- [Estações e clima de Innsbruck](https://www.innsbruck.info/en/destinations/travel-tips/seasons/climate.html)
- [Clima de Cairns — meteorologia australiana](https://www.bom.gov.au/qld/cairns/climate.shtml)
- [Estações na Austrália](https://www.australia.com/en-us/facts-and-planning/when-to-go/australias-seasons.html)
- [Centros de esqui do Chile](https://chile.travel/en/destinations/ski-resorts/)
- [Inverno em Queenstown](https://www.queenstownnz.co.nz/stories/post/winter-in-queenstown/)
- [Meteorologia das Maldivas](https://meteorology.gov.mv/climate)
- [Clima e estações do Marrocos](https://www.visitmorocco.com/en/travel-info/climate-and-seasons)
- [Tempo em Dubai](https://www.visitdubai.com/plan-your-trip/weather-in-dubai)
- [Tóquio — JNTO](https://www.japan.travel/en/weather/kanto/tokyo/)
- [Médias climáticas de Londres/Heathrow](https://www.metoffice.gov.uk/research/climate/maps-and-data/location-specific-long-term-averages/gcpsveqyg)

A revisão não é uma nova auditoria consular/de segurança de todos os países, nem validação climatológica estação por estação. O sistema preserva as categorias do catálogo e exclui os países sinalizados. Clima pode variar dentro do mês; consulte previsão/alertas antes de reservar. Faixas de custo são aproximadas e não garantem disponibilidade. Cobertura adicional futura deve preencher região, clima, janela de atividades e custos antes de habilitar um país.

## Países excluídos

82 países permanecem fora. As categorias abaixo descrevem **o estado dos dados do projeto**, não uma nova classificação de segurança ou de fronteiras.

### entrada/viabilidade requer revisão no catálogo — 60

Afeganistão, Bahamas, Barein, Bangladesh, Bielorrússia, Brunei, Burundi, Camboja, República Centro-Africana, Chade, Comores, República do Congo, Costa do Marfim, Guiné Equatorial, Eritreia, Gabão, Gâmbia, Guiné-Bissau, Haiti, Irã, Iraque, Israel, Jordânia, Kosovo, Quiribati, Coreia do Norte, Kuwait, Quirguistão, Laos, Líbano, Lesoto, Libéria, Líbia, Malaui, Mali, Ilhas Marshall, Mauritânia, Micronésia, Mianmar (Birmânia), Nauru, Níger, Paquistão, Palau, Papua-Nova Guiné, Catar, Rússia, Ilhas Salomão, Somália, Sudão do Sul, Sri Lanka, Sudão, Síria, Taiwan, Tadjiquistão, Timor-Leste, Turcomenistão, Tuvalu, Ucrânia, Venezuela, Iêmen.

### dados de país insuficientes — 9

Antígua e Barbuda, Barbados, Canadá, Dominica, Granada, São Cristóvão e Névis, Santa Lúcia, São Vicente e Granadinas, Trinidad e Tobago.

### sem recorte regional de clima/custo suficientemente revisado — 13

Benin, Burquina Faso, Camarões, Congo - Kinshasa, Djibuti, Essuatíni, Guiné, Guiana, Nigéria, Serra Leoa, Suriname, Togo, Guiana Francesa.

## Inventário reproduzível dos perfis

Clima Jan–Dez: Q quente, A ameno, F frio. Temporada Jan–Dez: 0 ruim, 1 aceitável, 2 boa, 3 ideal. Custos abaixo são a soma-base antes da margem sazonal; categoria de entrada é herdada sem recategorização.

| País | Recorte turístico | Gateway | Clima | Época | BRL base | Entrada do catálogo |
|---|---|---|---|---|---|---|
| Brasil | Salvador e litoral próximo | SSA | QQQQQQQQQQQQ | 333211223333 | 4000–7500 | domestic |
| Argentina | Buenos Aires | EZE | QQAAAAAAAAAQ | 223332223332 | 5000–9500 | visa-free |
| Argentina | Bariloche: lagos e montanhas no inverno | BRC | AAAAFFFFFFAA | 000002330000 | 9500–15500 | visa-free |
| Chile | Andes próximos a Santiago: inverno | SCL | AAAFFFFFFAAA | 000002332000 | 8000–14000 | visa-free |
| Peru | Cusco e Vale Sagrado | CUZ | AAAAAAAAAAAA | 000233333200 | 6500–11000 | visa-free |
| Colômbia | Cartagena e ilhas próximas | CTG | QQQQQQQQQQQQ | 333222211123 | 6000–10500 | visa-free |
| Estados Unidos | Nova York | JFK | FFFAAQQQAAFF | 222333223322 | 12500–20000 | unknown |
| México | Cidade do México | MEX | AAAAAAAAAAAA | 333332222333 | 8000–13000 | unknown |
| Jamaica | Montego Bay e costa norte | MBJ | QQQQQQQQQQQQ | 333320000002 | 10000–16000 | visa-free |
| Portugal | Lisboa e Sintra | LIS | AAAAAQQQQAAA | 222333223322 | 8500–13500 | visa-free |
| Espanha | Madri e Toledo | MAD | FFAAAQQQQAAF | 223332223322 | 9000–14500 | visa-free |
| França | Paris | CDG | FFFAAAAAAAFF | 222333223322 | 11000–18000 | visa-free |
| Itália | Roma | FCO | AAAAAQQQQAAA | 223332223322 | 10000–16000 | visa-free |
| Alemanha | Frankfurt e vale do Reno | FRA | FFFAAAAAAFFF | 222333333222 | 9500–15500 | visa-free |
| Marrocos | Marrakech | RAK | AAAAQQQQQAAA | 223332002332 | 8000–13500 | visa-free |
| África do Sul | Cidade do Cabo e península | CPT | QQQAAAAAAAQQ | 333322112333 | 8000–13500 | visa-free |
| Maurício | Costa oeste de Maurício | MRU | QQQQQAAAAQQQ | 111233333332 | 12500–19000 | visa-free |
| Emirados Árabes Unidos | Dubai | DXB | QQQQQQQQQQQQ | 333200000233 | 11000–17500 | visa-free |
| Maldivas | Ilhas locais do atol de Malé | MLE | QQQQQQQQQQQQ | 333211111112 | 12500–19000 | visa-on-arrival |
| Índia | Délhi e Agra | DEL | AAQQQQQQQQAA | 333200000233 | 9500–14500 | evisa |
| Nepal | Vale de Katmandu e trilhas baixas | KTM | AAAAQQQQQAAA | 123330001332 | 11000–17000 | visa-on-arrival |
| Japão | Tóquio e arredores | NRT | FFAAAQQQQAAF | 223332112332 | 11500–18000 | visa-free |
| Coreia do Sul | Seul | ICN | FFFAAQQQAAFF | 222332112332 | 11500–18000 | authorization |
| Tailândia | Phuket: costa do Andamão | HKT | QQQQQQQQQQQQ | 333211110023 | 10000–15500 | visa-free |
| Indonésia | Bali | DPS | QQQQQQQQQQQQ | 111233333211 | 11000–17000 | visa-on-arrival |
| Austrália | Sydney e Blue Mountains | SYD | QQQAAAAAAAQQ | 223332223332 | 14500–22000 | visa-required |
| Nova Zelândia | Queenstown: lagos e montanhas | ZQN | AAAAFFFFAAAA | 333222332233 | 15000–24000 | authorization |
| Uruguai | Montevidéu e Costa de Oro | MVD | QQAAAAAAAAAQ | 333221112223 | 4200–8800 | visa-free |
| Paraguai | Assunção e Areguá | ASU | QQQQAAAAQQQQ | 112233332211 | 4500–8700 | visa-free |
| Bolívia | La Paz e Tiwanaku | LPB | AAAAAAAAAAAA | 111233333221 | 5500–10000 | unknown |
| Equador | Quito e arredores andinos | UIO | AAAAAAAAAAAA | 222223332222 | 7000–12000 | visa-free |
| Belize | Caye Caulker e recifes próximos | BZE | QQQQQQQQQQQQ | 333332110012 | 7000–12000 | visa-free |
| Costa Rica | La Fortuna e Arenal | SJO | QQQQQQQQQQQQ | 333322211123 | 7000–12000 | visa-free |
| Cuba | Havana e Viñales | HAV | QQQQQQQQQQQQ | 333322110023 | 7000–12000 | unknown |
| República Dominicana | Santo Domingo e litoral de Bayahibe | SDQ | QQQQQQQQQQQQ | 333322110023 | 7000–12000 | visa-free |
| El Salvador | San Salvador e Ruta de las Flores | SAL | QQQQQQQQQQQQ | 333321111123 | 7000–12000 | visa-free |
| Guatemala | Antigua e lago Atitlán | GUA | AAAAAAAAAAAA | 333321110023 | 7000–12000 | visa-free |
| Honduras | Roatán | RTB | QQQQQQQQQQQQ | 223332211001 | 7000–12000 | visa-free |
| Nicarágua | Granada e vulcões próximos | MGA | QQQQQQQQQQQQ | 333321111123 | 7000–12000 | visa-free |
| Panamá | Cidade do Panamá e canal | PTY | QQQQQQQQQQQQ | 333322222123 | 7000–12000 | visa-free |
| Albânia | Tirana e Berat | TIA | AAAAAQQQQAAA | 112233332211 | 8000–13500 | visa-free |
| Andorra | Andorra la Vella e vales dos Pireneus | BCN | FFFFAAAAAFFF | 333223332233 | 9500–16500 | visa-free |
| Áustria | Innsbruck e vales tiroleses | INN | FFFAAAAAAAFF | 333223332233 | 9500–16500 | visa-free |
| Bélgica | Bruxelas e Bruges | BRU | FFFAAAAAAAFF | 122233332223 | 9500–16500 | visa-free |
| Bósnia e Herzegovina | Sarajevo e Mostar | SJJ | FFFAAQQQAAFF | 112233332211 | 8000–13500 | visa-free |
| Bulgária | Sófia e mosteiro de Rila | SOF | FFFAAQQQAAFF | 122233332221 | 8000–13500 | visa-free |
| Croácia | Split e costa dálmata | SPU | AAAAAQQQQAAA | 112233332211 | 9500–16500 | visa-free |
| Chipre | Larnaca e litoral sul | LCA | AAAAQQQQQQAA | 112333223321 | 9500–16500 | visa-free |
| Tchéquia | Praga e arredores | PRG | FFFAAAAAAAFF | 122233332223 | 8000–13500 | visa-free |
| Dinamarca | Copenhague | CPH | FFFFAAAAAFFF | 112233332211 | 13000–21000 | visa-free |
| Estônia | Tallinn e Lahemaa | TLL | FFFFAAAAFFFF | 112223332211 | 8000–13500 | visa-free |
| Finlândia | Rovaniemi e natureza da Lapônia | RVN | FFFFFAAAFFFF | 333223332233 | 13000–21000 | visa-free |
| Grécia | Atenas e litoral da Ática | ATH | AAAAQQQQQQAA | 112333223321 | 9500–16500 | visa-free |
| Hungria | Budapeste | BUD | FFFAAQQQAAFF | 122333223321 | 8000–13500 | visa-free |
| Islândia | Reykjavík e Círculo Dourado | KEF | FFFFFAAAFFFF | 222123332222 | 13000–21000 | visa-free |
| Irlanda | Dublin e Wicklow | DUB | FFFFAAAAAAFF | 112233332211 | 9500–16500 | visa-free |
| Letônia | Riga e entorno | RIX | FFFFAAAAFFFF | 112223332211 | 8000–13500 | visa-free |
| Liechtenstein | Vaduz e Malbun | ZRH | FFFAAAAAAAFF | 333223332233 | 13000–21000 | visa-free |
| Lituânia | Vilnius e Trakai | VNO | FFFFAAAAFFFF | 112233332211 | 8000–13500 | visa-free |
| Luxemburgo | Luxemburgo e vale do Alzette | LUX | FFFAAAAAAAFF | 122233332223 | 9500–16500 | visa-free |
| Malta | Valletta e litoral de Malta | MLA | AAAAAQQQQAAA | 112333223321 | 9500–16500 | visa-free |
| Moldávia | Chișinău e vinícolas próximas | RMO | FFFAAQQQAAFF | 112233332211 | 8000–13500 | visa-free |
| Mônaco | Mônaco e jardins da Riviera | NCE | AAAAAAQQQAAA | 122332223321 | 13000–21000 | visa-free |
| Montenegro | Baía de Kotor | TIV | AAAAAQQQQAAA | 112333332211 | 8000–13500 | visa-free |
| Países Baixos | Amsterdã e entorno | AMS | FFFAAAAAAAFF | 122333222321 | 9500–16500 | visa-free |
| Macedônia do Norte | Ohrid e seu lago | OHD | FFFAAQQQAAFF | 112233332211 | 8000–13500 | visa-free |
| Noruega | Tromsø e fiordes próximos | TOS | FFFFFAAAFFFF | 333123332233 | 13000–21000 | visa-free |
| Polônia | Cracóvia e arredores | KRK | FFFAAAAAAAFF | 122233332223 | 8000–13500 | visa-free |
| Romênia | Brașov e castelos da Transilvânia | OTP | FFFAAAAAAAFF | 112233332211 | 8000–13500 | visa-free |
| San Marino | Centro histórico do Monte Titano | BLQ | FFFAAAAAAFFF | 122233332221 | 9500–16500 | visa-free |
| Sérvia | Belgrado e Novi Sad | BEG | FFFAAQQQAAFF | 112233332211 | 8000–13500 | visa-free |
| Eslováquia | Poprad e vales dos Tatras | TAT | FFFFAAAAAFFF | 333223332233 | 8000–13500 | visa-free |
| Eslovênia | Ljubljana e lago Bled | LJU | FFFAAQQQAAFF | 122233332221 | 9500–16500 | visa-free |
| Suécia | Kiruna e natureza da Lapônia | KRN | FFFFFAAAFFFF | 333123332233 | 13000–21000 | visa-free |
| Suíça | Interlaken e vales do Oberland | ZRH | FFFAAAAAAAFF | 333223332233 | 13000–21000 | visa-free |
| Reino Unido | Londres e parques | LHR | FFFAAAAAAAFF | 112233332211 | 13000–21000 | authorization |
| Argélia | Argel e Tipasa | ALG | AAAAAQQQQQAA | 223332112332 | 8000–13500 | visa-required |
| Angola | Luanda e litoral próximo | LAD | QQQQQQAAQQQQ | 111233332211 | 7000–12000 | visa-free |
| Botsuana | Kasane e Chobe | BBK | QQQQAAAAQQQQ | 111233333321 | 13000–21500 | visa-free |
| Cabo Verde | Ilha do Sal | SID | QQQQQQQQQQQQ | 333333211233 | 7000–12000 | visa-free |
| Egito | Cairo e Gizé | CAI | AAQQQQQQQQAA | 333210001333 | 8000–13500 | visa-required |
| Etiópia | Adis Abeba e arredores | ADD | AAAAAAAAAAAA | 333321112333 | 7000–12000 | visa-required |
| Gana | Acra e Cape Coast | ACC | QQQQQQQQQQQQ | 332211222233 | 7000–12000 | visa-required |
| Quênia | Nairóbi e circuito Maasai Mara | NBO | QQQAAAAAAAQQ | 332113333321 | 13000–21500 | authorization |
| Madagascar | Antananarivo e Andasibe | TNR | QQAAAAAAAAAQ | 000233333332 | 9500–15500 | visa-required |
| Moçambique | Maputo e costa sul | MPM | QQQQQAAAQQQQ | 011233333221 | 7000–12000 | visa-required |
| Namíbia | Windhoek e Sossusvlei | WDH | QQQAAAAAQQQQ | 112233333321 | 13000–21500 | visa-free |
| Ruanda | Kigali e lago Kivu | KGL | AAAAAAAAAAAA | 221113332212 | 9500–15500 | visa-required |
| Senegal | Dakar e Gorée | DSS | AAAAQQQQQQQA | 333332111233 | 7000–12000 | visa-free |
| Seicheles | Mahé | SEZ | QQQQQQQQQQQQ | 112332223332 | 14000–22500 | authorization |
| Tanzânia | Zanzibar | ZNZ | QQQQQQQQQQQQ | 332003333322 | 9500–15500 | visa-required |
| Tunísia | Túnis, Cartago e Sidi Bou Said | TUN | AAAAQQQQQQAA | 223332112332 | 8000–13500 | visa-free |
| Uganda | Entebbe e lago Vitória | EBB | QQQQQQQQQQQQ | 332113331123 | 9500–15500 | visa-required |
| Zâmbia | Livingstone e Cataratas Vitória | LVI | QQQAAAAQQQQQ | 222333332211 | 13000–21500 | visa-required |
| Zimbábue | Victoria Falls e entorno | VFA | QQQAAAAQQQQQ | 223333332211 | 13000–21500 | visa-required |
| São Tomé e Príncipe | Ilha de São Tomé | TMS | QQQQQQQQQQQQ | 221123333112 | 9500–15500 | visa-free |
| Armênia | Yerevan e mosteiros próximos | EVN | FFFAAQQQAAFF | 111233223321 | 8000–13500 | visa-free |
| Azerbaijão | Baku e Gobustan | GYD | FFFAAQQQQAAF | 112332113321 | 8000–13500 | evisa |
| Butão | Paro e Thimphu | PBH | FFFAAAAAAAFF | 223332112332 | 18000–28000 | visa-required |
| China | Pequim e Muralha próxima | PEK | FFFAAQQQAAFF | 112332113321 | 9500–15500 | visa-free |
| Geórgia | Tbilisi e Kakheti | TBS | FFFAAQQQAAFF | 111233223321 | 8000–13500 | visa-free |
| Cazaquistão | Almaty e arredores acessíveis | ALA | FFFAAQQQAAFF | 112332223321 | 9500–15500 | visa-free |
| Malásia | Kuala Lumpur e arredores | KUL | QQQQQQQQQQQQ | 223322222212 | 9500–15500 | visa-free |
| Mongólia | Ulaanbaatar e Terelj no verão | UBN | FFFFAAAAFFFF | 000023332000 | 14500–23500 | visa-free |
| Omã | Mascate e costa próxima | MCT | QQQQQQQQQQQQ | 333100000233 | 9500–15500 | visa-free |
| Filipinas | Palawan: Puerto Princesa e arredores | PPS | QQQQQQQQQQQQ | 333321110012 | 9500–15500 | visa-free |
| Singapura | Singapura | SIN | QQQQQQQQQQQQ | 233223332211 | 14000–22500 | visa-free |
| Turquia | Istambul | IST | FFFAAQQQAAFF | 112333223321 | 8000–13500 | visa-free |
| Uzbequistão | Tashkent e Samarcanda | TAS | FFFAAQQQAAFF | 112332113321 | 9500–15500 | visa-free |
| Vietnã | Hanói e Ninh Binh | HAN | AAQQQQQQQQAA | 223321112332 | 9500–15500 | evisa |
| Arábia Saudita | Riad e Diriyah | RUH | AAQQQQQQQQQA | 333100000233 | 9500–15500 | evisa |
| Fiji | Nadi e costa de Viti Levu | NAN | QQQQQQQQQQQQ | 011233333221 | 14500–23500 | visa-free |
| Samoa | Upolu | APW | QQQQQQQQQQQQ | 011233333211 | 14500–23500 | visa-on-arrival |
| Tonga | Tongatapu | TBU | QQQQAAAAQQQQ | 011233333211 | 14500–23500 | visa-on-arrival |
| Vanuatu | Efate | VLI | QQQQQQAAQQQQ | 011233333211 | 14500–23500 | visa-free |
| Brasil | Rio de Janeiro e parques costeiros | GIG | QQQQQAAQQQQQ | 222233333322 | 3400–6700 | domestic |
| Brasil | Foz do Iguaçu | IGU | QQQAAAAAAQQQ | 222233333322 | 3400–6700 | domestic |
| Argentina | Mendoza e arredores | MDZ | QQAAAAAAAAQQ | 223333223332 | 4500–8700 | visa-free |
| Argentina | Ushuaia e Tierra del Fuego | USH | AAFFFFFFFFAA | 332113331233 | 7000–12000 | visa-free |
| Chile | Santiago e Valparaíso | SCL | QQQAAAAAAQQQ | 223333223332 | 4500–8700 | visa-free |
| Chile | San Pedro de Atacama | CJC | QQAAAAAAAAQQ | 222333223332 | 5500–10000 | visa-free |
| Peru | Lima e litoral urbano | LIM | QQQAAAAAAAAQ | 333222222223 | 5500–10000 | visa-free |
| Colômbia | Medellín e arredores | MDE | QQQQQQQQQQQQ | 332112221123 | 5500–10000 | visa-free |
| Estados Unidos | Miami e Everglades | MIA | QQQQQQQQQQQQ | 333321110023 | 13000–21000 | unknown |
| Estados Unidos | San Francisco e litoral próximo | SFO | AAAAAAAAAAAA | 112233333321 | 13000–21000 | unknown |
| México | Cancún e Riviera Maya | CUN | QQQQQQQQQQQQ | 333322110023 | 7000–12000 | unknown |
| China | Guilin e Yangshuo | KWL | FAAAQQQQQQAA | 112223223321 | 9500–15500 | visa-free |
| Índia | Goa | GOI | QQQQQQQQQQQQ | 333210000233 | 9500–15500 | evisa |
| Austrália | Cairns e recifes próximos | CNS | QQQQQQQQQQQQ | 011233333321 | 14000–22500 | visa-required |
| África do Sul | Joanesburgo e parques próximos | JNB | QQQAAAAAAQQQ | 222233333322 | 7000–12000 | visa-free |
| França | Chamonix e vales alpinos | GVA | FFFAAAAAAAFF | 333223332233 | 13000–21000 | visa-free |
| Japão | Sapporo e arredores de Hokkaido | CTS | FFFFAAAAAFFF | 333223332233 | 14000–22500 | visa-free |
| Tailândia | Bangkok e Ayutthaya | BKK | QQQQQQQQQQQQ | 333122221233 | 9500–15500 | visa-free |

## Reproduzir validações

```sh
node scripts/validate-discovery.js --airports --coverage
node scripts/validate-flight-visualization.js
node scripts/validate-flight-route.js
```

Sem `--airports`, o teste de descoberta é local e não consulta rede. A validação Three busca somente a versão já fixada pelo aplicativo para testes, sem instalar dependências. Nenhuma API/IA é consultada ao ajustar filtros ou recomendar; aeroportos podem usar a base já existente quando uma rota é aberta.
