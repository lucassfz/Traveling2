// Resumos curtos (data/summaries.pt.json): abertura do artigo da Wikipédia em
// português, ligada por identificador (código ISO do país, Wikidata do lugar,
// ISO 3166-2 do estado, id do município em data/geo). Carregado uma vez, só
// quando um painel precisa dele. Sem arquivo ou sem rede, as telas seguem sem resumo.
const URL_SUMMARIES = new URL('../data/summaries.pt.json', import.meta.url);
let promise = null;
let loaded = null;

export function loadSummaries() {
  promise ??= fetch(URL_SUMMARIES)
    .then(response => (response.ok ? response.json() : null))
    .then(data => { loaded = data; return data; })
    .catch(() => { promise = null; return null; });
  return promise;
}

export function summariesIfLoaded() {
  return loaded;
}

/** Resumo pronto ou null. kind: countries | landmarks | divisions | places. */
export function summaryFor(kind, id) {
  return loaded?.[kind]?.[id] ?? null;
}
