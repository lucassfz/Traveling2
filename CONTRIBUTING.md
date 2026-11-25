# Como contribuir com o Traveling

O `main` é a fonte da verdade e é publicado no GitHub Pages. Por isso, nenhuma
mudança entra direto nele.

## Fluxo

1. Atualize o `main` local: `git switch main && git pull`.
2. Crie um branch por assunto: `git switch -c tipo/descricao-curta`
   (por exemplo `fix/filtro-mobile`, `feat/planejador`, `data/europa-entrada`).
3. Faça commits pequenos e com mensagem clara.
4. Rode os validadores antes de enviar: `npm run validate`.
5. Envie o branch (`git push -u origin <branch>`) e abra um Pull Request para o `main`.
6. A outra pessoa revisa; a verificação automática (GitHub Actions) precisa passar.
7. Depois do merge, apague o branch.

## Regras

- Não use "Add files via upload" nem edite arquivos pela interface web do GitHub
  no `main`: isso pula a revisão e pode apagar o trabalho de outra pessoa.
- Não use `git push --force` no `main`.
- Antes de mexer num arquivo grande e compartilhado (`src/state/actions.js`, `styles.css`,
  `js/countries.dataset.js`), avise a outra pessoa para evitar conflitos.
- Finais de linha são normalizados para LF pelo `.gitattributes`.
- Dados sensíveis ao tempo (vistos, cartões, salas VIP) precisam de fonte oficial
  e `verifiedAt`. Veja `DATA_SOURCES.md`.

## Validadores

| Comando | O que roda | Rede |
| --- | --- | --- |
| `npm run dev` | site em http://127.0.0.1:5500/ com recarga automática ao salvar (compatível com a CSP) | Não |
| `npm run build` | compila a interface React (`src/`) em `app/`; versione o resultado junto com a mudança | Não |
| `npm run validate` | 26 auditorias de dados, conteúdo, etiquetas, câmbio, planejador, divisões geográficas, cidades do globo, destinos salvos, resumos, páginas, segredos, backend, CSP/SRI, interface React e segurança | Não |
| `npm run validate:online` | geografia do mapa, rota e visualização de voo, e hashes SRI conferidos com a CDN | Sim |
| `npm run test:a11y` | teclado e axe em todas as telas, no Chrome | Sim |
| `npm run test:security` | tentativas de ataque no Chrome | Sim |
| `npm run build:csp` | atualiza a Content-Security-Policy de `index.html`, `parceiros.html` e `privacidade.html` (rode depois de editar um `<script>` inline nelas) | Não |
| `npm run build:airports` | regenera `data/airports.json` a partir do CSV fixado | Sim |
| `npm run build:fx` | atualiza `data/fx-snapshot.json` com o boletim de fechamento do Banco Central | Sim |

Requer Node.js 20 ou mais recente (22 para os testes no navegador). Rode `npm ci --ignore-scripts` uma vez antes de `npm run dev` ou `npm run build`.

Na interface: nada de HTML cru, clique só em `<button>` ou `<a>`, e links para fora só por `<ExternalLink>`. Os validadores reprovam o resto. Conflito em `app/`? Resolva em `src/` e rode `npm run build`.

O workflow `Airport data` regenera `data/airports.json` sempre que o arquivo ou o
gerador mudam e falha se o resultado for diferente do arquivo versionado. Para
atualizar a base, rode `npm run build:airports` e versione o arquivo gerado.

## Cache do site

O GitHub Pages guarda os arquivos por cerca de 10 minutos. Ao mudar `styles.css` ou `src/`, atualize a versão `?v=` nos dois links do `index.html` (por exemplo `?v=2026.11.20`), para o navegador não juntar o HTML novo com um CSS antigo.
