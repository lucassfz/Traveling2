// Busca de países do cabeçalho.
import { useEffect, useRef, useState } from 'react';
import { CONTINENT_LABELS, COUNTRIES, searchCountries } from '../../js/countries.dataset.js';
import { app, useApp } from '../state/store.js';
import { selectCountry } from '../state/actions.js';
import { Icon } from './ui.jsx';
import { Combobox } from './Combobox.jsx';

export function Search() {
  const [query, setQuery] = useState('');
  const root = useRef(null);
  const open = useApp(state => state.searchOpen);
  const shortcuts = useApp(state => state.a11y.shortcuts);
  const matches = query.trim().length >= 2 ? searchCountries(query, 8).map(key => ({ key })) : [];

  // Celular: a busca fica recolhida num ícone e abre sobre o cabeçalho.
  useEffect(() => { document.body.classList.toggle('search-open', open); }, [open]);

  const collapse = () => app.set({ searchOpen: false });

  const pick = ({ key }) => {
    setQuery('');
    collapse();
    // Quem busca vai direto para o guia: o foco acompanha.
    selectCountry(key, { focus: true });
  };

  return (
    <div className="search" id="country-search" role="search" ref={root}
      onBlur={() => setTimeout(() => { if (!root.current?.contains(document.activeElement)) collapse(); }, 120)}>
      <label className="sr-only" htmlFor="country-search-input">Buscar país</label>
      <Icon name="search" className="search__icon" />
      <Combobox
        id="country-search-input"
        query={query}
        onQuery={setQuery}
        options={matches}
        onPick={pick}
        listLabel="Sugestões de países"
        emptyText="Nenhum país encontrado."
        inputClassName="search__input"
        listClassName="search__results"
        openClassName="search__results--open"
        optionClassName="search__option"
        inputProps={{ placeholder: 'Buscar país', 'aria-keyshortcuts': shortcuts ? '/ Control+K' : 'Control+K' }}
        onEscape={() => {
          if (!query && !app.get().searchOpen) return false;
          setQuery('');
          collapse();
          return true;
        }}
        renderOption={({ key }) => {
          const country = COUNTRIES[key];
          return (
            <>
              <span className="search__option-flag" aria-hidden="true">{country.flag}</span>
              <span>{country.namePt}</span>
              <span className="search__option-region">{CONTINENT_LABELS[country.continent] || country.region}</span>
            </>
          );
        }}
      >
        <kbd className="search__kbd" aria-hidden="true">/</kbd>
      </Combobox>
    </div>
  );
}
