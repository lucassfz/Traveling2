// Descobrir: preferências no topo, em botões, e a lista de destinos que combinam
// se atualiza a cada toque. Escolher um destino destaca o país no globo.
import { useEffect, useMemo, useState } from 'react';
import { COUNTRIES } from '../../js/countries.dataset.js';
import { BUDGETS, CLIMATES, DISCOVERY_MONTHS, INTERESTS, TRIP_REFERENCE } from '../../js/destination.profiles.js';
import { formatTripRange, noMatchAdvice, rankDestinations, rankWithoutInterests } from '../../js/destination.discovery.js';
import { haversineKm } from '../../js/geospatial.js';
import { loadCities, topCities } from '../../js/geo/cities.js';
import { app } from '../state/store.js';
import { airports, globe } from '../state/services.js';
import { closeDiscovery, highlightCountry, planTrip, selectCountry } from '../state/actions.js';
import { openRoute } from '../state/route.js';
import { useAsync } from '../hooks/useAsync.js';
import { CloseButton, Flag, Provenance } from './ui.jsx';

const MAX_RESULTS = 12;
const MAX_INTERESTS = 2;
const SEASONS = ['Evitar', 'Aceitável', 'Boa', 'Ideal'];
const BUDGET_SHORT = { 5000: 'Até 5 mil', 8000: 'Até 8 mil', 12000: 'Até 12 mil', 18000: 'Até 18 mil', above: '18 mil+', any: 'Tanto faz' };
const BUDGET_OPTIONS = BUDGETS.filter(band => band.id !== 'above').map(band => [band.id, BUDGET_SHORT[band.id] ?? band.label]);
const plain = value => String(value ?? '').replace(/^[^\p{L}\d]+/u, '').trim();

export default function Discovery({ open }) {
  const [prefs, setPrefs] = useState({ interests: [], climate: 'any', budget: 'any', month: new Date().getMonth(), visaFree: false });
  const [selected, setSelected] = useState(null);
  const [city, setCity] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const matches = useMemo(
    () => (prefs.interests.length ? rankDestinations(COUNTRIES, prefs) : rankWithoutInterests(COUNTRIES, prefs)).slice(0, MAX_RESULTS),
    [prefs]
  );
  const current = matches.find(match => match.profile.id === selected) ?? null;

  // Reabrir o painel destaca de novo o destino que estava escolhido.
  useEffect(() => { if (open && current) highlightCountry(current.countryKey); }, [open]);

  const change = patch => setPrefs(value => ({ ...value, ...patch }));
  const toggleInterest = id => change({ interests: prefs.interests.includes(id) ? prefs.interests.filter(item => item !== id) : [...prefs.interests, id].slice(0, MAX_INTERESTS) });

  const select = match => {
    setCity(null);
    if (match.profile.id === selected) return setSelected(null);
    setSelected(match.profile.id);
    highlightCountry(match.countryKey);
    requestAnimationFrame(() => document.querySelector('.discovery-card--open')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
    return undefined;
  };

  const surprise = () => {
    const options = matches.filter(match => match.profile.id !== selected);
    const match = options[Math.floor(Math.random() * options.length)] ?? matches[0];
    if (!match) return;
    select(match);
    requestAnimationFrame(() => document.querySelector(`[data-pick="${CSS.escape(match.profile.id)}"]`)?.focus({ preventScroll: true }));
  };

  const month = DISCOVERY_MONTHS[prefs.month];
  const summary = [
    prefs.interests.length ? prefs.interests.map(id => plain(INTERESTS[id])).join(' + ') : 'Qualquer interesse',
    month,
    prefs.climate !== 'any' ? plain(CLIMATES[prefs.climate]) : null,
    prefs.budget !== 'any' ? BUDGET_SHORT[prefs.budget] : null,
    prefs.visaFree ? 'Sem visto' : null
  ].filter(Boolean).join(' · ');
  const count = `${matches.length} ${matches.length === 1 ? 'destino' : 'destinos'} para ${month}`;

  return (
    <>
      <div className="discovery-header">
        <div><span className="eyebrow">Descobrir</span><h2 id="discovery-title" tabIndex={-1}>Para onde ir?</h2></div>
        <CloseButton label="Fechar descoberta" onClick={() => closeDiscovery({ restore: true })} />
      </div>

      <button type="button" className="discovery-filters-toggle" aria-expanded={filtersOpen} aria-controls="discovery-filters" onClick={() => setFiltersOpen(!filtersOpen)}>
        <span><small>Filtros</small>{summary}</span>
        <strong>{filtersOpen ? 'Fechar' : 'Editar'}</strong>
      </button>
      <div className={`discovery-filters${filtersOpen ? '' : ' discovery-filters--collapsed'}`} id="discovery-filters">
        <Filter label="O que você quer?" hint={`até ${MAX_INTERESTS}`} name="Interesses" entries={Object.entries(INTERESTS)} isOn={id => prefs.interests.includes(id)} onPick={toggleInterest}
          isDisabled={id => prefs.interests.length >= MAX_INTERESTS && !prefs.interests.includes(id)} />
        <Filter label="Quando?" name="Mês" className="discovery-chips--months" entries={DISCOVERY_MONTHS.map((label, index) => [index, label])} isOn={index => prefs.month === index} onPick={index => change({ month: index })} />
        <Filter label="Clima" name="Clima" entries={Object.entries(CLIMATES)} isOn={id => prefs.climate === id} onPick={id => change({ climate: id })} />
        <Filter label="Orçamento por pessoa" hint="7 dias, com passagem" name="Orçamento por pessoa" entries={BUDGET_OPTIONS} isOn={id => prefs.budget === id} onPick={id => change({ budget: id })} />
        <button type="button" className="discovery-chip discovery-chip--toggle" aria-pressed={prefs.visaFree} onClick={() => change({ visaFree: !prefs.visaFree })}><span aria-hidden="true">🛂 </span>Priorizar sem visto</button>
      </div>

      {/* Só a contagem é anunciada; a lista inteira seria lida a cada filtro. */}
      <p className="sr-only" role="status">{matches.length ? count : 'Nenhum destino com essa combinação.'}</p>
      <section className="discovery-results" aria-label="Destinos sugeridos">
        {!matches.length ? (
          <div className="discovery-empty">
            <strong>Nenhum destino com essa combinação.</strong>
            <p>{noMatchAdvice(COUNTRIES, { ...prefs, interests: prefs.interests.length ? prefs.interests : ['cultura'] })}</p>
          </div>
        ) : (
          <>
            <div className="discovery-results__head">
              <strong>{count}</strong>
              <button type="button" className="discovery-text-button" onClick={surprise}><span aria-hidden="true">🎲 </span>Surpreenda-me</button>
            </div>
            {!matches.some(match => match.tier === 'strong') && <small>Nenhuma combinação perfeita; estas são as melhores com ressalvas.</small>}
            <ul className="discovery-list">
              {matches.map(match => (
                <Card key={match.profile.id} match={match} month={prefs.month} budget={prefs.budget} open={match.profile.id === selected} onToggle={() => select(match)} city={city} onCity={setCity} />
              ))}
            </ul>
            <Provenance kind="estimate" detail="faixa por pessoa, 7 dias, saindo de GRU; não é cotação" />
            <details className="discovery-about"><summary>O que entra no preço?</summary><p>{TRIP_REFERENCE}</p></details>
          </>
        )}
      </section>
    </>
  );
}

function Filter({ label, hint, name, className = '', entries, isOn, onPick, isDisabled = () => false }) {
  return (
    <div className="discovery-filter">
      <span className="discovery-filter__label">{label} {hint && <small>{hint}</small>}</span>
      <div className={`discovery-chips ${className}`} role="group" aria-label={hint ? `${name} (${hint})` : name}>
        {entries.map(([value, text]) => <button type="button" className="discovery-chip" key={value} aria-pressed={isOn(value)} disabled={isDisabled(value)} onClick={() => onPick(value)}>{text}</button>)}
      </div>
    </div>
  );
}

function Card({ match, month, budget, open, onToggle, city, onCity }) {
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const { country, countryKey, profile } = match;
  const detailId = `discovery-${profile.id}`;

  const showRoute = async event => {
    const button = event.currentTarget;
    setBusy(true);
    setFeedback('Preparando rota no globo…');
    try {
      const opened = await openRoute({
        countryKey, airportCode: profile.airport, focusBack: button,
        isCurrent: () => app.get().discoveryOpen && app.get().countryKey === countryKey
      });
      setFeedback(opened ? '' : 'Rota indisponível agora. Aguarde o globo ou tente novamente.');
    } catch {
      setFeedback('Não foi possível carregar o aeroporto. Tente novamente com conexão.');
    } finally {
      setBusy(false);
    }
  };

  const plan = () => {
    const ceiling = BUDGETS.find(band => band.id === budget)?.ceiling ?? Infinity;
    planTrip(countryKey, { profileId: profile.id, city, budgetBRL: Number.isFinite(ceiling) ? ceiling : null });
  };

  return (
    <li className={`discovery-card ${open ? 'discovery-card--open' : ''}`}>
      <button type="button" className="discovery-card__head" data-pick={profile.id} aria-expanded={open} aria-controls={detailId} onClick={onToggle}>
        <Flag country={country} className="discovery-card__flag" />
        <span className="discovery-card__body"><strong>{country.namePt}</strong><small>{profile.region}</small></span>
        <span className="discovery-card__side">
          <span className={`discovery-badge discovery-badge--${match.tier}`}>{match.tier === 'strong' ? 'Combina muito' : 'Boa opção'}</span>
          <strong>{formatTripRange(match.range)}</strong>
        </span>
      </button>
      <div id={detailId} hidden={!open} className="discovery-card__detail">
        {open && (
          <>
            <div className="discovery-card__season">
              <span className="discovery-season" role="img" aria-label={`Época por mês: ${profile.seasonSuitability.map((value, index) => `${DISCOVERY_MONTHS[index]} ${SEASONS[value].toLowerCase()}`).join(', ')}`}>
                {profile.seasonSuitability.map((value, index) => <i className={`discovery-season__m discovery-season__m--${value}${index === month ? ' discovery-season__m--now' : ''}`} key={DISCOVERY_MONTHS[index]} title={`${DISCOVERY_MONTHS[index]}: ${SEASONS[value]}`} />)}
              </span>
              <small>{SEASONS[profile.seasonSuitability[month]]} época em {DISCOVERY_MONTHS[month]}</small>
            </div>
            <ul className="discovery-reasons">{match.reasons.slice(0, 2).map(reason => <li key={reason}>{reason}</li>)}</ul>
            <p className="discovery-note">{profile.note}</p>
            <RegionCities match={match} city={city} onCity={onCity} />
            <div className="discovery-result-actions">
              <button className="primary-button" type="button" disabled={busy} onClick={() => selectCountry(countryKey, { focus: true })}>Explorar {country.namePt}</button>
              <button className="secondary-button" type="button" disabled={busy} onClick={showRoute}><span aria-hidden="true">✈ </span>Ver rota</button>
              <button className="secondary-button" type="button" disabled={busy} onClick={plan}><span aria-hidden="true">＋ </span>Planejar{city ? ` ${city.name}` : ''}</button>
            </div>
            <p className="discovery-feedback" role="status">{feedback}</p>
          </>
        )}
      </div>
    </li>
  );
}

// Cidades da região do roteiro: até 250 km do aeroporto de entrada, maiores
// primeiro; sem aeroporto conhecido, as maiores do país.
async function regionCities({ country, profile }) {
  const [cities, airport] = await Promise.all([loadCities(country.alpha2), airports.resolve(profile.airport).catch(() => null)]);
  const near = airport ? cities
    .map(city => ({ city, km: haversineKm(airport.lat, airport.lng, city.lat, city.lng) }))
    .filter(item => item.km <= 250)
    .sort((a, b) => b.city.population - a.city.population)
    .map(item => item.city) : [];
  return (near.length >= 3 ? near : topCities(cities, 8)).slice(0, 8);
}

function RegionCities({ match, city, onCity }) {
  const { value: cities, error } = useAsync(() => regionCities(match), [match.profile.id]);
  if (error) return null;
  if (!cities) return <div className="discovery-cities"><small>Carregando cidades…</small></div>;
  if (!cities.length) return null;
  const pick = item => {
    if (item.id === city?.id) {
      onCity(null);
      highlightCountry(match.countryKey);
    } else {
      onCity(item);
      globe.map?.selectCity(item);
    }
  };
  return (
    <div className="discovery-cities">
      <span className="discovery-filter__label">Cidades da região</span>
      <div className="discovery-chips" role="group" aria-label="Cidades da região">
        {cities.map(item => <button type="button" className="discovery-chip" key={item.id} aria-pressed={item.id === city?.id} onClick={() => pick(item)}>{item.name}</button>)}
      </div>
    </div>
  );
}
