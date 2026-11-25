// "Estados" da Visão geral: Mundo › País › Estado › Cidade. Só aparece em países
// com data/geo/<ISO2>.json. Mostra fatos do arquivo e, quando existe, o resumo da
// Wikipédia ligado pelo código do estado ou do município.
import { useEffect, useRef } from 'react';
import { loadGeo } from '../../js/geo/geo.repository.js';
import { summaryFor } from '../../js/summaries.js';
import { app, useApp, useExternal } from '../state/store.js';
import { globe, matchGlobeCity, savedStore } from '../state/services.js';
import { planPlace, resetToGlobe, showPlaceOnGlobe } from '../state/actions.js';
import { announce, focusSoon } from '../state/focus.js';
import { ExternalLink, SaveButton, Summary, SummaryImage } from '../components/ui.jsx';
import { useAsync, useSummaries } from '../hooks/useAsync.js';

const STATE_DISTANCE = 2;
const coordinate = (value, positive, negative) => `${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}° ${value >= 0 ? positive : negative}`;

function go(region, focus = '.geo-nav__title') {
  app.set({ region });
  focusSoon(`#country-regions ${focus}`);
}

export function Regions({ countryKey, country }) {
  const root = useRef(null);
  const region = useApp(state => state.region);
  const { value: geo } = useAsync(() => loadGeo(country.alpha2).catch(() => null), [country.alpha2]);
  const summaries = useSummaries();

  // Vindo dos salvos: rola até a cidade assim que os dados chegam.
  useEffect(() => {
    if (!geo || region.level !== 'place' || !region.divisionId) return;
    root.current?.scrollIntoView({ block: 'start' });
    focusSoon('#country-regions .geo-nav__title');
  }, [geo, region]);

  if (!geo) return null;

  const toCountry = () => {
    // De volta ao país: a câmera também volta ao enquadramento do país.
    globe.map?.selectCity(null);
    globe.map?.selectCountry(countryKey);
    go({ level: 'country', id: null }, '.geo-nav__chip');
  };
  const toDivision = id => {
    // Estado: aproxima da capital, num enquadramento regional.
    const capital = geo.capitalPlace(id);
    globe.map?.selectCity(null);
    if (capital) globe.map?.flyTo(capital.lat, capital.lng, STATE_DISTANCE);
    go({ level: 'division', id });
  };
  const toPlace = id => go({ level: 'place', id });

  const place = region.level === 'place' ? geo.place(region.id) : null;
  const division = region.level === 'division' ? geo.division(region.id) : place ? geo.division(place.division) : null;
  const view = { geo, country, summaries, toCountry, toDivision, toPlace };

  return (
    <section className="content-section geo-nav" id="country-regions" aria-label="Estados e cidades" ref={root}>
      {place && division ? <PlaceView {...view} place={place} division={division} countryKey={countryKey} key={place.id} />
        : division ? <DivisionView {...view} division={division} />
          : <CountryView {...view} />}
    </section>
  );
}

function CountryView({ geo, toDivision }) {
  const groups = new Map();
  for (const division of geo.divisions) {
    const key = division.region || '';
    groups.set(key, [...(groups.get(key) ?? []), division]);
  }
  const states = geo.divisions.every(division => division.type === 'state' || division.type === 'district');
  return (
    <>
      <h3 className="section-heading">{states ? 'Estados' : 'Regiões'}</h3>
      <div className="geo-nav__groups">
        {[...groups.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR')).map(name => (
          <div className="geo-nav__group" key={name} role="group" aria-label={name || undefined}>
            {name && <span className="geo-nav__region" aria-hidden="true">{name}</span>}
            <div className="geo-nav__chips">
              {groups.get(name).map(division => (
                <button type="button" className="geo-nav__chip" key={division.id} data-geo-division={division.id} onClick={() => toDivision(division.id)}>{division.name}<span aria-hidden="true">{division.code}</span></button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Breadcrumb({ parts }) {
  return (
    <nav className="geo-nav__breadcrumb" aria-label="Você está em">
      <ol>
        <li><button type="button" className="geo-nav__crumb" onClick={resetToGlobe}>Mundo</button></li>
        {parts.map(([label, onClick]) => (
          <li key={label}>{onClick ? <button type="button" className="geo-nav__crumb" onClick={onClick}>{label}</button> : <span aria-current="page">{label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

const Back = ({ label, onClick }) => <button type="button" className="geo-nav__back" onClick={onClick}>← {label}</button>;

function Sources({ geo }) {
  return (
    <p className="geo-nav__source">
      Fonte: {geo.sources.map((source, index) => (
        <span key={source.url}>{index > 0 && ' e '}<ExternalLink href={source.url}>{source.name.split(' — ')[0]}</ExternalLink>{source.license?.startsWith('CC') && ` (${source.license})`}</span>
      ))}.
    </p>
  );
}

function Facts({ items }) {
  return (
    <dl className="info-grid">
      {items.map(([label, value]) => <div className="info-card" key={label}><dt className="info-card__label">{label}</dt><dd className="info-card__value">{value}</dd></div>)}
    </dl>
  );
}

function DivisionView({ geo, country, division, summaries, toCountry, toPlace }) {
  const about = summaries ? summaryFor('divisions', division.id) : null;
  const capital = geo.capitalPlace(division.id);
  const places = geo.places(division.id);
  const ordered = capital ? [capital, ...places.filter(place => place !== capital)] : places;
  return (
    <>
      <Breadcrumb parts={[[country.namePt, toCountry], [division.name]]} />
      <Back label={country.namePt} onClick={toCountry} />
      <h3 className="geo-nav__title" tabIndex={-1}>{division.name}</h3>
      <SummaryImage entry={about} alt={division.name} />
      <Summary entry={about} className="geo-nav__about" />
      <Facts items={[['Capital', division.capital.name], ['Região', division.region || '—']]} />
      {ordered.length > 0 && (
        <>
          <h4 className="section-heading">Cidades</h4>
          <ul className="geo-nav__list">
            {ordered.map(place => (
              <li key={place.id}><button type="button" className="geo-nav__place" onClick={() => toPlace(place.id)}><span>{place.name}</span>{place === capital && <small>Capital</small>}</button></li>
            ))}
          </ul>
          {ordered.length === 1 && <p className="geo-nav__note">Por enquanto, só a capital deste estado.</p>}
        </>
      )}
      <Sources geo={geo} />
    </>
  );
}

// Destino salvo desta cidade: usa o id da cidade no globo (o mesmo do cartão e
// do Planner) quando há par; senão, o id do lugar em data/geo.
function usePlaceSaved({ country, countryKey, place, division }) {
  const { value: city } = useAsync(() => matchGlobeCity(country, place), [place.id]);
  const geonameId = city?.geonameId ?? place.ids?.geonames;
  const id = `city:${city?.id ?? place.id}`;
  const find = () => savedStore.get(id)
    ?? savedStore.items.find(item => item.type === 'city' && item.countryKey === countryKey
      && (item.placeId === place.id || (geonameId && item.geonameId === geonameId))) ?? null;
  const existing = useExternal(savedStore, find);
  const toggle = () => {
    if (existing) savedStore.remove(existing.id);
    else {
      const image = summaryFor('places', place.id)?.image?.url;
      savedStore.save({
        id, type: 'city', countryKey, name: place.name, context: `${division.name} · ${country.namePt}`, lat: place.lat, lng: place.lng,
        placeId: place.id, divisionId: division.id, ...(city ? { cityId: city.id } : {}), ...(image ? { image } : {}),
        ...(Number.isInteger(geonameId) ? { geonameId } : {})
      });
    }
    announce(existing ? `${place.name} removida dos salvos.` : `${place.name} salva.`);
  };
  return [existing !== null, toggle];
}

function PlaceView({ geo, country, countryKey, place, division, summaries, toCountry, toDivision }) {
  const about = summaries ? summaryFor('places', place.id) : null;
  const [saved, toggle] = usePlaceSaved({ country, countryKey, place, division });
  const isCapital = geo.capitalPlace(division.id) === place;
  return (
    <>
      <Breadcrumb parts={[[country.namePt, toCountry], [division.name, () => toDivision(division.id)], [place.name]]} />
      <Back label={division.name} onClick={() => toDivision(division.id)} />
      <div className="geo-nav__title-row">
        <h3 className="geo-nav__title" tabIndex={-1}>{place.name}</h3>
        <SaveButton saved={saved} name={place.name} onToggle={toggle} />
      </div>
      <SummaryImage entry={about} alt={`${place.name}, ${division.name}`} />
      <Summary entry={about} className="geo-nav__about" />
      <Facts items={[[isCapital ? 'Capital do estado' : 'Estado', division.name], ['Coordenadas', `${coordinate(place.lat, 'N', 'S')}, ${coordinate(place.lng, 'L', 'O')}`]]} />
      <div className="geo-nav__actions">
        <button type="button" className="secondary-button geo-nav__fly" onClick={() => showPlaceOnGlobe(place)}>Ver no globo</button>
        <button type="button" className="primary-button" onClick={() => planPlace(place)}>Planejar viagem para {place.name}</button>
      </div>
      {!about && <p className="geo-nav__note">Ainda não há resumo de {place.name}.</p>}
      <Sources geo={geo} />
    </>
  );
}
