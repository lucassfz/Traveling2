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
| `src/airports.generated.js` | Códigos IATA gerados por `npm run build:backend-airports` |

## Testes

Sem dependências: os testes rodam em Node (≥ 20, com `Request`/`Response` nativos) dentro do `npm run validate` da raiz, por `scripts/validate-backend.js`. Eles exercitam o Worker de ponta a ponta com o fornecedor fictício.

## Rodar localmente (quando o deploy for aprovado)

```sh
cd backend
npx wrangler dev          # http://localhost:8787/api/v1/providers/status
```

`wrangler` não é dependência do projeto; o `npx` baixa sob demanda.

## Adicionar um fornecedor real (fases 3.3 e 3.4)

1. Criar `src/providers/<fornecedor>.<flights|hotels>.js` com a interface descrita em `src/providers/index.js`.
2. Ler credenciais **somente** de `env` (Secrets: `npx wrangler secret put DUFFEL_TOKEN`). Nunca em `wrangler.toml`, no repositório ou no site.
3. Converter a resposta para os modelos de `src/models.js`; `checkFlightOffer`/`checkHotelOffer` precisam devolver lista vazia.
4. Registrar o id em `FACTORIES` e ativá-lo por `FLIGHT_PROVIDERS`/`HOTEL_PROVIDERS`.
5. Testes de contrato com respostas gravadas do fornecedor (sem chaves) em `scripts/validate-backend.js`.
