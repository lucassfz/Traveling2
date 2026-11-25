// Etiqueta que segue o mouse sobre o globo. Só visual: no teclado, o centro do
// globo é anunciado em texto.
import { CONTINENT_LABELS, COUNTRIES } from '../../js/countries.dataset.js';
import { isVisaFreeForBrazil } from '../../js/country.exploration.js';
import { useApp } from '../state/store.js';

export function Tooltip() {
  const tip = useApp(state => state.tooltip);
  const visited = useApp(state => state.visited);
  const country = tip ? COUNTRIES[tip.countryKey] : null;
  const badge = !country ? '' : visited.has(tip.countryKey) ? 'Visitado' : isVisaFreeForBrazil(country) ? 'Sem visto' : '';
  return (
    <div className={`country-tooltip${country ? ' country-tooltip--visible' : ''}`} id="country-tooltip" aria-hidden="true"
      style={tip ? { '--tooltip-x': `${tip.x + 14}px`, '--tooltip-y': `${tip.y - 10}px` } : undefined}>
      {country && (
        <>
          <span className="country-tooltip__flag">{country.flag}</span>
          <span className="country-tooltip__content">
            <strong className="country-tooltip__name">{country.namePt}</strong>
            <span className="country-tooltip__meta">{CONTINENT_LABELS[country.continent] || country.region || 'Mundo'}</span>
          </span>
          {badge && <span className="country-tooltip__badge">{badge}</span>}
        </>
      )}
    </div>
  );
}
