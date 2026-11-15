# Backend do Traveling (fase 3.2)

Camada entre o site (GitHub Pages) e os fornecedores de voos e hotéis. Arquitetura, contrato e decisões: [`docs/PHASE-3.1-TRAVEL-INTEGRATION-ARCHITECTURE.md`](../docs/PHASE-3.1-TRAVEL-INTEGRATION-ARCHITECTURE.md).

**Estado atual:** fundação pronta e testada, **só com o fornecedor fictício** (`mock`, dados de teste declarados como tais). Nenhum fornecedor real, nenhuma chave, nenhum deploy.

## Estrutura

| Arquivo | Papel |
|---|---|
| `src/index.js` | Worker: rotas, CORS, limite de corpo, validação, limite de buscas, prazos, resultado parcial, cache, registros sem dados pessoais |
| `src/contract.js` | Limites, códigos de erro e `ApiError` |
| `src/validate.js` | Validação estrita das buscas (IATA conferido com `data/airports.json`) |
| `src/models.js` | `FlightOffer`, `HotelProperty`, `HotelOffer`: verificação, deduplicação e ordenação |
| `src/reliability.js` | Cache curto com coalescência, limite por cliente, disjuntor e prazo |
| `src/providers/index.js` | Registro de fornecedores (interface comum) |
| `src/providers/mock.js` | Fornecedor fictício e determinístico |
| `src/providers/duffel.flights.js` | Adaptador Duffel (voos); ativo só com o Secret `DUFFEL_TOKEN` e `duffel` em `FLIGHT_PROVIDERS` |
| `src/airports.generated.js` | Códigos IATA gerados por `npm run build:backend-airports` |

## Testes

Sem dependências: os testes rodam em Node (≥ 20, com `Request`/`Response` nativos) dentro do `npm run validate` da raiz, por `scripts/validate-backend.js`. Eles exercitam o Worker de ponta a ponta com o fornecedor fictício.

## Rodar localmente

Sem instalar nada (o mesmo Worker, em Node):

```sh
npm run dev:backend                    # http://localhost:8787/api/v1/providers/status
DUFFEL_TOKEN=duffel_test_… FLIGHT_PROVIDERS=mock,duffel npm run dev:backend
```

Para ver a busca no site local, acrescente temporariamente ao `<head>` do `index.html` a meta `<meta name="traveling-api" content="http://localhost:8787/api/v1">` (não commitar).

Com o runtime da Cloudflare: `cd backend && npx wrangler dev` (`wrangler` não é dependência; o `npx` baixa sob demanda).

## Publicar

```sh
cd backend
npx wrangler deploy
npx wrangler secret put DUFFEL_TOKEN   # token de TESTE até a decisão de vender (D2)
```

Depois, ajuste `ALLOWED_ORIGINS` ao endereço do site e inclua no `index.html` a meta `traveling-api` com o endereço do Worker.

## Adicionar um fornecedor real (fases 3.3 e 3.4)

1. Criar `src/providers/<fornecedor>.<flights|hotels>.js` com a interface descrita em `src/providers/index.js`.
2. Ler credenciais **somente** de `env` (Secrets: `npx wrangler secret put DUFFEL_TOKEN`). Nunca em `wrangler.toml`, no repositório ou no site.
3. Converter a resposta para os modelos de `src/models.js`; `checkFlightOffer`/`checkHotelOffer` precisam devolver lista vazia.
4. Registrar o id em `FACTORIES` e ativá-lo por `FLIGHT_PROVIDERS`/`HOTEL_PROVIDERS`.
5. Testes de contrato com respostas gravadas do fornecedor (sem chaves) em `scripts/validate-backend.js`.
