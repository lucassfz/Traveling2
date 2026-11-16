# Fase 4 — Auditoria e plano

Base auditada: `origin/main` em `a93eae8` (16/11/2026). CI do GitHub verde nesse commit (auditorias offline, teste de fumaça no navegador, auditorias online e deploy). Este documento é a referência da Fase 4; a arquitetura de voos e hotéis continua em [`PHASE-3.1-TRAVEL-INTEGRATION-ARCHITECTURE.md`](PHASE-3.1-TRAVEL-INTEGRATION-ARCHITECTURE.md).

## 1. O que já existe (e quem é dono de cada informação)

| Área | Dono no código | Estado medido |
|---|---|---|
| Globo | `js/map.engine.js`, `js/map.admin.layer.js` | Seleção de país, estados e cidades ao aproximar, áreas urbanas e regiões clicáveis, teclado, render sob demanda (271 desenhos por quadro). **Não há rótulos de país** na vista ampla: os rótulos são só de estados e cidades do país em foco, por faixa de população e zoom (`CITY_TIERS`). |
| País | painel em `js/app.js` + `paises/<slug>/` (197 páginas estáticas) | Abas Visão geral, Cultura, História; introdução e lugares com resumo da Wikipédia; regras de entrada no Planner. 196 países com ao menos um lugar em destaque com foto verificada. |
| Região / estado | `js/drawer/regions.section.js` + `data/geo/BR.json` | Só Brasil: 27 unidades, 70 cidades, resumo e foto. Outros países só têm estados no globo (`data/admin`), sem página. |
| Cidade | cartão do globo (`js/city.card.js`), Estados (`regions.section.js`), `cidades/<slug>/` (67 capitais) | Três apresentações diferentes de cidade, sem um perfil único. |
| Lugar (atração) | `js/landmarks.media.js` | 198 lugares, todos com foto verificada (Commons + Wikidata); 144 com resumo. Não têm perfil próprio nem entram em roteiro. |
| Descobrir | `js/destination.*.js`, `js/discovery.ui.js` | 135 perfis regionais, **115 de 196 países** cobertos. Excluídos (81): 60 por regra de entrada em revisão, 8 por dados do país insuficientes, 13 sem recorte regional de clima e custo revisado. |
| Salvos | `js/saved.store.js` | País, cidade e lugar, com comparação de até 3 países. **Sem tipo região.** |
| Planner | `js/planner/*` | Seis etapas, checklist por viagem, backup/importação, compartilhamento por link, impressão, "Quanto vai custar", parceiros. **Sem roteiro por dia.** |
| Voos | `backend/src/providers/duffel.flights.js`, `js/planner/live.flights.section.js` | Adaptador pronto; **Worker publicado só com o fornecedor fictício** (`/providers/status` em 16/11/2026: `mock` para voos e hotéis). Preços vistos recentemente via Travelpayouts ligados no site (`traveling-prices`). |
| Hotéis | `js/planner/live.hotels.section.js` | Link do Booking.com com a busca preenchida (funciona em produção); busca pelo backend só com o fornecedor fictício; LiteAPI aguardando conta. |
| Milhas | `js/miles.*` | Cartões, programas, salas VIP; ligado à rota no globo. |
| Acessibilidade | `js/accessibility.js` | Painel com voz, leitura em voz alta e ajustes visuais; globo pelo teclado. |

## 2. Dívidas e riscos encontrados

1. **Identidade das cidades do globo:** `data/admin/*.json` ainda não tem a coluna `geonameid` (o gerador já a grava; o arquivo não foi regenerado). O id em uso (`BR-174`) é a posição no arquivo. Salvos e viagens já são reencontrados por `resolveCity` (nome + 3 km), mas a Fase 4 não deve criar mais referências a esse id: **regenerar `data/admin` com Node é pré-requisito** de roteiro e atrações por cidade.
2. **Três apresentações de cidade** (cartão do globo, Estados, páginas `cidades/`) com dados de fontes diferentes (`data/admin`, `data/geo`, conteúdo das páginas). O perfil de cidade da Fase 4 precisa ser **um só**, alimentado por um identificador comum, e as três entradas passam a abrir esse perfil.
3. **Correções de dados pendentes** no branch local `fix/auditoria-dados-pendente` (não enviado): Argentina e Chile com fonte oficial, documentos do Mercosul (Anexo I em vigor desde 29/07/2026), capitais da Bolívia e de Israel com o status real, fotos que não esperam os resumos. Conflita com 4 arquivos do `main` e precisa de PR próprio.
4. **Descobrir:** 60 países ficam de fora por regra de entrada em revisão. Ampliar a cobertura é, antes de tudo, trabalho de verificação de fontes oficiais, não de código.
5. **Busca real de voos e hotéis** depende de contas (Duffel, LiteAPI) e de configuração no Worker. Sem elas, o site deve continuar mostrando estimativa, preço visto recentemente ou link externo, cada um com o rótulo certo — nunca o fornecedor fictício como se fosse real.
6. **Painel de acessibilidade × painel do país:** o problema de sobreposição citado no pedido não foi reproduzido nesta auditoria (as capturas não estavam disponíveis). Precisa de passos para reproduzir.

## 3. Plano em etapas (um PR por etapa, nenhum merge sem aprovação)

| Etapa | Entrega | Depende de | Pronto quando |
|---|---|---|---|
| 4.0 | PR das correções pendentes (`fix/auditoria-dados-pendente` reaplicado sobre o `main`) | — | Conflitos resolvidos, validadores e teste de fumaça verdes |
| 4.1 | **Identidade geográfica:** regenerar `data/admin` com `geonameid`; `destination id` único (`country:XX`, `region:BR-BA`, `city:gn<geonameid>`, `place:Q…`) com migração de salvos e viagens antigos | Máquina com Node.js | Salvos e viagens antigos abrem o mesmo lugar depois da migração (teste com dados reais embaralhados) |
| 4.2 | **Rótulos do globo:** nomes de país na vista ampla com prioridade por área e colisão; capitais no zoom médio; cidades menores no zoom alto; conferência de que país selecionado = polígono destacado = painel | — | Europa legível em 1440 e 390 px; teste automático de colisão e de seleção |
| 4.3 | **Perfil de destino único** (país → região → cidade → lugar) no painel, com "Quando ir" por região, informações práticas e linha do tempo da história já existente; páginas `cidades/` e cartão do globo levando ao mesmo perfil | 4.1 | Mesma cidade mostra o mesmo conteúdo pelas três entradas; nada duplicado entre seções |
| 4.4 | **Salvos por região e lugar** + "Adicionar ao roteiro" | 4.1 | Duplicidade impedida por id; salvar nunca cria viagem |
| 4.5 | **Roteiro por dia no Planner** (lugares e cidades da viagem, reordenar, ver no globo, custos só quando houver valor confiável) | 4.1, 4.4 | Roteiro persiste, entra no "Quanto vai custar" sem contar duas vezes |
| 4.6 | **Descobrir:** motivos explícitos por recomendação, ações Ver perfil / Salvar / Comparar / Planejar; ampliar países só com regra de entrada verificada | Verificação de fontes | Nenhum país entra sem fonte; combinações testadas continuam iguais |
| 4.7 | **Voos e hotéis reais:** ativar Duffel (voos) e LiteAPI (hotéis) no Worker | Contas e tokens (responsável pelo projeto) | `/providers/status` mostra o fornecedor real; rótulos de procedência corretos |
| 4.8 | Acabamento: acessibilidade × painéis, animações, 320–1440 px, temas | — | Teste de fumaça + verificação de sobreposição nas 6 larguras |

## 4. Decisões que precisam do Lucas ou do Leo

- Rodar `npm run build:admin` (Node.js) e versionar o `data/admin` regenerado — desbloqueia 4.1, 4.3, 4.4 e 4.5.
- Contas Duffel e LiteAPI e os Secrets no Worker — desbloqueia 4.7.
- Ordem das etapas 4.2 a 4.6 (cada uma é um PR independente depois da 4.1).
- Passos para reproduzir o problema do painel de acessibilidade.
