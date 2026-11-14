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
- Antes de mexer num arquivo grande e compartilhado (`js/app.js`, `styles.css`,
  `js/countries.dataset.js`), avise a outra pessoa para evitar conflitos.
- Finais de linha são normalizados para LF pelo `.gitattributes`.
- Dados sensíveis ao tempo (vistos, cartões, salas VIP) precisam de fonte oficial
  e `verifiedAt`. Veja `DATA_SOURCES.md`.

## Validadores

| Comando | O que roda | Rede |
| --- | --- | --- |
| `npm run validate` | 15 auditorias de dados, conteúdo, etiquetas, câmbio, planejador e divisões geográficas | Não |
| `npm run validate:online` | geografia do mapa, rota e visualização de voo (baixam arquivos fixados da CDN) | Sim |
| `npm run build:airports` | regenera `data/airports.json` a partir do CSV fixado | Sim |
| `npm run build:fx` | atualiza `data/fx-snapshot.json` com o boletim de fechamento do Banco Central | Sim |

Requer Node.js 20 ou mais recente.

O workflow `Airport data` regenera `data/airports.json` sempre que o arquivo ou o
gerador mudam e falha se o resultado for diferente do arquivo versionado. Para
atualizar a base, rode `npm run build:airports` e versione o arquivo gerado.

## Cache do site

O GitHub Pages guarda os arquivos por cerca de 10 minutos. Ao mudar `styles.css` ou `js/app.js`, atualize a versão `?v=` nos dois links do `index.html` (por exemplo `?v=2026.11.20`), para o navegador não juntar o HTML novo com um CSS antigo.
