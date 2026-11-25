// Aba "História": o catálogo carrega quando a aba abre (ou antes, em segundo plano).
import { loadHistoryCatalog } from '../../js/history.loader.js';
import { useAsync } from '../hooks/useAsync.js';

export function History({ countryKey, country }) {
  const { value: catalog, error } = useAsync(loadHistoryCatalog, []);
  return (
    <section className="content-section" aria-labelledby="history-title">
      <h3 className="section-heading" id="history-title">Panorama histórico</h3>
      <div className="history-list" id="country-history" aria-busy={!catalog && !error}>
        <Content catalog={catalog} error={error} countryKey={countryKey} country={country} />
      </div>
    </section>
  );
}

function Content({ catalog, error, countryKey, country }) {
  if (error) return <p className="body-copy" role="status">Não foi possível carregar o panorama histórico. Verifique a conexão e abra a aba novamente.</p>;
  if (!catalog) return <p className="body-copy" role="status">Carregando panorama histórico…</p>;
  const history = catalog[countryKey] ?? country.history;
  if (Array.isArray(history) && history.length) {
    return history.map(item => (
      <article className="history-item" key={item.title}>
        <span className="history-item__icon" aria-hidden="true">{item.icon}</span>
        <div>
          <h4 className="history-item__title">{item.title}</h4>
          <p className="history-item__text">{item.text}</p>
        </div>
      </article>
    ));
  }
  return <p className="body-copy">{typeof history === 'string' && history.trim() ? history : 'Panorama histórico ainda em curadoria para este país.'}</p>;
}
