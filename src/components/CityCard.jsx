// Cartão de cidade: só fatos do GeoNames (estado, país, população, hora local e
// coordenadas) e as ações aproximar, compartilhar, guia do país e planejar.
import { useEffect, useRef, useState } from 'react';
import { COUNTRIES } from '../../js/countries.dataset.js';
import { capitalPagePath } from '../../js/country.slug.js';
import { cityHash } from '../../js/share.link.js';
import { reducedMotion } from '../../js/core/motion.js';
import { PARTNERS, klookUrl } from '../../js/planner/partners.js';
import { useApp, useExternal } from '../state/store.js';
import { countryKeyOfCity, globe, savedEntryForCity, savedStore, toggleSavedCity } from '../state/services.js';
import { closeCity, planTrip, selectCountry } from '../state/actions.js';
import { announce } from '../state/focus.js';
import { CloseButton, ExternalLink, Flag, SaveButton, useShare } from './ui.jsx';
import { PartnerNote } from './PartnerNote.jsx';

const RANKS = ['Capital do país', 'Capital regional', null];

export function formatPopulation(value) {
  if (!value) return null;
  return value >= 1e6
    ? `${(value / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} milhões de habitantes`
    : `${Math.round(value / 1000).toLocaleString('pt-BR')} mil habitantes`;
}

function localTime(timeZone) {
  if (!timeZone) return null;
  try {
    return new Intl.DateTimeFormat('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit', weekday: 'short' }).format(new Date());
  } catch {
    return null;
  }
}

const coordinate = (value, positive, negative) => `${Math.abs(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}° ${value >= 0 ? positive : negative}`;

// A hora local é atualizada a cada 30 s enquanto o cartão está aberto.
function useClock(timeZone) {
  const [time, setTime] = useState(() => localTime(timeZone));
  useEffect(() => {
    setTime(localTime(timeZone));
    const timer = setInterval(() => setTime(localTime(timeZone)), 30000);
    return () => clearInterval(timer);
  }, [timeZone]);
  return time;
}

// Guarda a última cidade por 200 ms para a saída animada.
export function CityCard() {
  const city = useApp(state => state.city);
  const [shown, setShown] = useState(city);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(0);
  useEffect(() => {
    clearTimeout(timer.current);
    if (city) {
      setShown(city);
      setLeaving(false);
    } else if (reducedMotion.matches) setShown(null);
    else {
      setLeaving(true);
      timer.current = setTimeout(() => { setShown(null); setLeaving(false); }, 200);
    }
    return () => clearTimeout(timer.current);
  }, [city]);
  return (
    <section className={`city-card${leaving && shown ? ' city-card--leaving' : ''}`} id="city-card" aria-labelledby="city-card-title" hidden={!shown} inert={!city}>
      {shown && <CityContent city={shown} key={shown.id} />}
    </section>
  );
}

function CityContent({ city }) {
  const countryKey = countryKeyOfCity(city);
  const country = countryKey ? COUNTRIES[countryKey] : null;
  const time = useClock(city.timeZone);
  const saved = useExternal(savedStore, () => (countryKey ? savedEntryForCity(city, countryKey) !== null : false));
  const [share, shareResult] = useShare();
  // Capital com página própria: o link mostra foto e resumo na prévia.
  const page = city.rank === 0 && country ? capitalPagePath(country) : '';
  const facts = [
    ['População', formatPopulation(city.population)],
    ['Hora local', time],
    ['Coordenadas', `${coordinate(city.lat, 'N', 'S')}, ${coordinate(city.lng, 'L', 'O')}`]
  ].filter(([, value]) => value);

  return (
    <>
      <div className="city-card__head">
        <Flag country={{ alpha2: city.country }} className="city-card__flag" />
        <div className="city-card__titles">
          {RANKS[city.rank] && <span className="eyebrow">{RANKS[city.rank]}</span>}
          <h2 className="city-card__name" id="city-card-title" tabIndex={-1}>{city.name}</h2>
          <small>{[city.region, country?.namePt ?? city.country].filter(Boolean).join(' · ')}</small>
        </div>
        <div className="city-card__tools">
          {countryKey && <SaveButton saved={saved} name={city.name} onToggle={() => announce(toggleSavedCity(city, countryKey) ? `${city.name} salva.` : `${city.name} removida dos salvos.`)} />}
          <CloseButton className="city-card__close" label="Fechar cidade" onClick={() => closeCity({ restore: true })} />
        </div>
      </div>
      <dl className="city-card__facts">
        {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="city-card__actions">
        <button className="secondary-button" type="button" onClick={() => globe.map?.flyTo(city.lat, city.lng, 1.1, 700)}>Aproximar</button>
        <button className="secondary-button" type="button" onClick={() => share({ title: `${city.name} no Traveling`, text: `Olha ${city.name} no globo do Traveling`, ...(page ? { path: page } : { hash: cityHash(city) }) })}>{shareResult || 'Compartilhar'}</button>
        {country && (
          <>
            <button className="secondary-button" type="button" onClick={() => { closeCity(); selectCountry(countryKey, { focus: true }); }}>Guia de {country.namePt}</button>
            <button className="primary-button" type="button" onClick={() => { closeCity(); planTrip(countryKey, { city }); }}>Planejar viagem para {city.name}</button>
          </>
        )}
      </div>
      {page && <div className="partner-links"><a className="partner-link" href={page} target="_blank" rel="noopener">Guia de {country.capital}: o que ver ↗<span className="sr-only"> (abre em nova aba)</span></a></div>}
      <div className="partner-links">
        <ExternalLink className="partner-link" href={klookUrl(city.name)} sponsored>Passeios em {city.name} ↗</ExternalLink>
        <ExternalLink className="partner-link" href={PARTNERS.aviasales.home} sponsored>Passagens ↗</ExternalLink>
      </div>
      <PartnerNote />
      <p className="city-card__source">Dados: GeoNames (CC BY 4.0)</p>
    </>
  );
}
