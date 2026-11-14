// Panorama histórico sob demanda. Os quatro arquivos de História (~18% do JS)
// não fazem parte da carga inicial: são importados quando a aba História abre
// ou quando o navegador fica ocioso. Cada país tem no máximo uma camada.
let catalogPromise = null;
let catalog = null;

export function loadHistoryCatalog() {
  catalogPromise ??= Promise.all([
    import('./history.americas-europe.dataset.js').then(module => module.HISTORY_ENRICHMENT),
    import('./history.africa.dataset.js').then(module => module.AFRICA_HISTORY),
    import('./history.asia.dataset.js').then(module => module.ASIA_HISTORY),
    import('./history.oceania.dataset.js').then(module => module.OCEANIA_HISTORY)
  ]).then(layers => {
    catalog = Object.freeze(Object.assign({}, ...layers.slice().reverse()));
    return catalog;
  }).catch(error => {
    catalogPromise = null;
    throw error;
  });
  return catalogPromise;
}

// Síncrono: o catálogo se já carregou, ou null.
export function historyCatalogIfLoaded() {
  return catalog;
}

export async function loadCountryHistory(countryKey) {
  return (await loadHistoryCatalog())[countryKey] ?? null;
}
