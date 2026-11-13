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
| `npm run validate` | 11 auditorias de dados e conteúdo | Não |
| `npm run validate:online` | geografia do mapa, rota e visualização de voo (baixam arquivos fixados da CDN) | Sim |
| `npm run build:airports` | regenera `data/airports.json` a partir do CSV fixado | Sim |

Requer Node.js 20 ou mais recente.

O workflow `Airport data` regenera `data/airports.json` sempre que o arquivo ou o
gerador mudam e falha se o resultado for diferente do arquivo versionado. Para
atualizar a base, rode `npm run build:airports` e versione o arquivo gerado.
