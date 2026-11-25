// Escolha do país da viagem: busca, países salvos e destinos populares.
import { useState } from 'react';
import { COUNTRIES, searchCountries } from '../../js/countries.dataset.js';
import { useExternal } from '../state/store.js';
import { savedStore, tripStore } from '../state/services.js';
import { openDiscovery } from '../state/actions.js';
import { Combobox } from '../components/Combobox.jsx';
import { Flag } from '../components/ui.jsx';

const POPULAR = ['Portugal', 'Argentina', 'Chile', 'France', 'Italy', 'Spain', 'United States', 'Japan', 'Mexico', 'Uruguay', 'Peru', 'United Kingdom'];

export function DestinationPicker({ onPick }) {
  const [query, setQuery] = useState('');
  const saved = useExternal(savedStore, () => savedStore.items);
  const taken = new Set(tripStore.trips.map(trip => trip.countryKey));
  // Países salvos (inclui a antiga lista "Quero ir") viram sugestões.
  const ideas = [...new Set(saved.filter(item => item.type === 'country').map(item => item.countryKey))].filter(key => COUNTRIES[key] && !taken.has(key));
  const popular = POPULAR.filter(key => COUNTRIES[key] && !ideas.includes(key));
  const matches = query.trim().length >= 2 ? searchCountries(query, 6).map(key => ({ key })) : [];

  return (
    <>
      <div className="planner-picker">
        <label className="sr-only" htmlFor="planner-destination-search">Buscar país</label>
        <Combobox
          id="planner-destination-search"
          query={query}
          onQuery={setQuery}
          options={matches}
          onPick={({ key }) => onPick(key)}
          listLabel="Países encontrados"
          emptyText="Nenhum país encontrado."
          inputClassName="form-field__control planner-picker__input"
          listClassName="planner-picker__results"
          optionClassName="planner-picker__option"
          inputProps={{ placeholder: 'Buscar país…' }}
          renderOption={({ key }) => <><Flag country={COUNTRIES[key]} className="planner-picker__flag" /><span>{COUNTRIES[key].namePt}</span><small>{COUNTRIES[key].region || ''}</small></>}
        />
        {query.trim().length >= 2 && !matches.length && <p className="planner-picker__empty" aria-hidden="true">Nenhum país encontrado.</p>}
      </div>
      {ideas.length > 0 && <Ideas title="Dos seus salvos" keys={ideas} onPick={onPick} />}
      <Ideas title="Destinos populares" keys={popular} onPick={onPick} />
      <div className="planner-card planner-card--quiet planner-row">
        <div className="planner-row__grow"><strong className="planner-card__title">Ainda não sabe para onde?</strong><p className="planner-hint">Diga o que você quer e receba sugestões.</p></div>
        <button className="secondary-button" type="button" onClick={openDiscovery}>Descobrir destino</button>
      </div>
    </>
  );
}

function Ideas({ title, keys, onPick }) {
  return (
    <>
      <h4 className="planner-block-title">{title}</h4>
      <div className="planner-ideas" role="group" aria-label={title}>
        {keys.map(key => (
          <button className="planner-idea" type="button" key={key} onClick={() => onPick(key)}>
            <Flag country={COUNTRIES[key]} className="planner-idea__flag" />
            <span><strong>{COUNTRIES[key].namePt}</strong><small>{COUNTRIES[key].region || ''}</small></span>
          </button>
        ))}
      </div>
    </>
  );
}
