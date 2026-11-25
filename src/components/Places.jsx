// Lista de países: a alternativa em texto ao globo 3D. Tudo o que o globo abre
// com o mouse também se abre daqui, só com Tab, setas ou títulos do leitor de tela.
import { useMemo, useState } from 'react';
import { CONTINENT_LABELS, COUNTRIES } from '../../js/countries.dataset.js';
import { normalize } from '../../js/accessibility.js';
import { useApp } from '../state/store.js';
import { VISA_FREE_KEYS, selectCountry } from '../state/actions.js';
import { Flag } from './ui.jsx';

const ORDER = ['SA', 'NA', 'EU', 'AF', 'AS', 'OC'];
const VISA_FREE = new Set(VISA_FREE_KEYS);
const ALL = Object.entries(COUNTRIES).map(([key, country]) => ({ key, country, search: normalize(`${country.namePt} ${country.capital ?? ''}`) }))
  .sort((a, b) => a.country.namePt.localeCompare(b.country.namePt, 'pt-BR'));

export function Places() {
  const [query, setQuery] = useState('');
  const [visaFree, setVisaFree] = useState(false);
  const visited = useApp(state => state.visited);
  const current = useApp(state => state.countryKey);
  const term = normalize(query);

  const groups = useMemo(() => {
    const shown = ALL.filter(item => (!term || item.search.includes(term)) && (!visaFree || VISA_FREE.has(item.key)));
    const known = ORDER.map(code => [code, shown.filter(item => item.country.continent === code)]);
    const rest = shown.filter(item => !ORDER.includes(item.country.continent));
    return [...known, ['other', rest]].filter(([, items]) => items.length);
  }, [term, visaFree]);
  const total = groups.reduce((sum, [, items]) => sum + items.length, 0);

  return (
    <div className="places">
      <label className="miles-field-label" htmlFor="places-filter">Filtrar por país ou capital</label>
      <input className="form-field__control" id="places-filter" type="search" autoComplete="off" spellCheck={false} value={query} onChange={event => setQuery(event.target.value)} />
      <button className="discovery-chip" type="button" aria-pressed={visaFree} onClick={() => setVisaFree(!visaFree)}>Só sem visto para brasileiros</button>
      <p className="planner-hint" role="status">{total} {total === 1 ? 'país' : 'países'}</p>
      {groups.map(([code, items]) => (
        <section key={code} aria-labelledby={`places-${code}`}>
          <h3 className="planner-block-title" id={`places-${code}`}>{CONTINENT_LABELS[code] ?? 'Outros'} <small>({items.length})</small></h3>
          <ul className="places__list">
            {items.map(({ key, country }) => (
              <li key={key}>
                <button className="places__item" type="button" data-place={key} aria-current={key === current ? 'true' : undefined} onClick={() => selectCountry(key, { focus: true })}>
                  <Flag country={country} className="places__flag" width={28} height={21} />
                  <span><strong>{country.namePt}</strong><small>{[country.capital, VISA_FREE.has(key) ? 'sem visto' : null, visited.has(key) ? 'visitado' : null].filter(Boolean).join(' · ')}</small></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
