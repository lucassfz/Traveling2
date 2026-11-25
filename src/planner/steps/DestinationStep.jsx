// Etapa 1: país e cidade.
import { useState } from 'react';
import { COUNTRIES } from '../../../js/countries.dataset.js';
import { loadCities, searchCities, topCities } from '../../../js/geo/cities.js';
import { useAsync } from '../../hooks/useAsync.js';
import { showCountryFromPlanner } from '../../state/actions.js';
import { announce, focusSoon } from '../../state/focus.js';
import { Flag } from '../../components/ui.jsx';
import { DestinationPicker } from '../DestinationPicker.jsx';
import { countryName } from '../labels.js';
import { save } from '../Wizard.jsx';

export function DestinationStep({ trip }) {
  const [changing, setChanging] = useState(false);
  const country = COUNTRIES[trip.countryKey];

  if (changing) {
    const pick = countryKey => {
      const lines = trip.lines.filter(line => line.source?.kind !== 'traveling-estimate');
      save(trip, { countryKey, city: null, lines, entryReviewed: false, profileId: null, step: 1 });
      setChanging(false);
      focusSoon('#wizard-title');
    };
    return (
      <>
        <DestinationPicker onPick={pick} />
        <button className="planner-text-action" type="button" onClick={() => { setChanging(false); focusSoon('#wizard-title'); }}>Manter {countryName(trip)}</button>
      </>
    );
  }

  return (
    <>
      <div className="planner-destination-card">
        <Flag country={country} className="planner-destination-card__flag" />
        <div className="planner-destination-card__body">
          <span className="eyebrow">{country?.region || 'Destino'}</span>
          <strong className="planner-destination-card__name">{countryName(trip)}</strong>
          {country?.capital && <small>Capital: {country.capital}</small>}
        </div>
      </div>
      <div className="planner-actions">
        <button className="secondary-button" type="button" onClick={() => showCountryFromPlanner(trip.countryKey)}>Ver guia do país</button>
        <button className="secondary-button" type="button" onClick={() => { setChanging(true); focusSoon('#planner-destination-search'); }}>Trocar destino</button>
      </div>
      <CityPicker trip={trip} country={country} key={trip.countryKey} />
    </>
  );
}

function CityPicker({ trip, country }) {
  const [changing, setChanging] = useState(false);
  const [query, setQuery] = useState('');
  const { value: cities, error } = useAsync(() => loadCities(country?.alpha2), [country?.alpha2]);

  const choose = city => {
    setChanging(false);
    setQuery('');
    save(trip, { city: { id: city.id, name: city.name, lat: city.lat, lng: city.lng, region: city.region } });
    announce(`Cidade escolhida: ${city.name}.`);
    focusSoon('#planner-change-city');
  };

  let body;
  if (trip.city && !changing) {
    body = (
      <div className="planner-city__chosen">
        <span className="planner-city__pin" aria-hidden="true" />
        <span className="planner-city__name"><strong>{trip.city.name}</strong><small>{trip.city.region || country?.namePt || ''}</small></span>
        <button className="planner-text-action" id="planner-change-city" type="button" onClick={() => { setChanging(true); focusSoon('#planner-city-search'); }}>Trocar cidade</button>
      </div>
    );
  } else if (error) body = <p className="planner-hint">Não foi possível carregar as cidades agora. Você pode seguir sem escolher.</p>;
  else if (!cities) body = <p className="planner-hint">Carregando cidades…</p>;
  else if (!cities.length) body = <p className="planner-hint">Ainda não há cidades para este destino.</p>;
  else {
    const searching = query.trim().length >= 2;
    const list = searching ? searchCities(cities, query, 10) : topCities(cities, 8);
    body = (
      <>
        <p className="planner-hint" id="planner-city-hint">Opcional. A cidade define o aeroporto de chegada na estimativa de voo.</p>
        <label className="sr-only" htmlFor="planner-city-search">Buscar cidade</label>
        <input className="form-field__control" id="planner-city-search" type="search" placeholder="Buscar cidade…" autoComplete="off" spellCheck={false} aria-describedby="planner-city-hint" value={query} onChange={event => setQuery(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter' && searching && list[0]) { event.preventDefault(); choose(list[0]); } }} />
        <p className="sr-only" role="status">{searching ? `${list.length} ${list.length === 1 ? 'cidade encontrada' : 'cidades encontradas'}.` : ''}</p>
        <div className="choice-grid choice-grid--2" id="planner-city-results" role="group" aria-label="Cidades">
          {list.map(city => (
            <button className="choice" type="button" key={city.id} onClick={() => choose(city)}>
              <span className="choice__title">{city.name}</span>
              <span className="choice__hint">{[city.rank === 0 ? 'Capital' : null, city.region].filter(Boolean).join(' · ')}</span>
            </button>
          ))}
          {!list.length && <p className="planner-hint">Nenhuma cidade encontrada.</p>}
        </div>
        {trip.city && <button className="planner-text-action" type="button" onClick={() => { setChanging(false); focusSoon('#planner-change-city'); }}>Manter a cidade atual</button>}
      </>
    );
  }
  return <div className="planner-question planner-city"><h4 className="planner-question__title">Qual cidade em {country?.namePt || 'destino'}?</h4>{body}</div>;
}
