// Guia do país (painel da direita): identidade, abas e ações.
import { useEffect, useRef, useState } from 'react';
import { CONTINENT_LABELS, COUNTRIES } from '../../js/countries.dataset.js';
import { countryPagePath } from '../../js/country.slug.js';
import { flagImageUrl } from '../../js/country.exploration.js';
import { useApp, useExternal } from '../state/store.js';
import { savedStore } from '../state/services.js';
import { planTrip, resetToGlobe, setTab, toggleSavedCountry, toggleVisited } from '../state/actions.js';
import { exploreDestination, routeAvailability } from '../state/route.js';
import { announce } from '../state/focus.js';
import { CloseButton, Icon, Indicator, SaveButton, tabKeys, useShare } from '../components/ui.jsx';
import { Overview } from './Overview.jsx';
import { Culture } from './Culture.jsx';
import { History } from './History.jsx';

const TABS = [['overview', 'Visão geral', Overview], ['culture', 'Cultura', Culture], ['history', 'História', History]];
const KEYS = TABS.map(([key]) => key);

export function CountryPanel({ inert }) {
  const open = useApp(state => state.countryOpen);
  const countryKey = useApp(state => state.countryKey);
  // Ao fechar, o conteúdo fica até o painel sair da tela (mas sem foco: inert).
  const [last, setLast] = useState(null);
  const key = open ? countryKey : last;
  if (open && countryKey !== last) setLast(countryKey);
  const country = key ? COUNTRIES[key] : null;
  return (
    <aside className={`country-panel${open ? ' country-panel--open' : ''}`} id="country-panel" aria-label="Guia do país" inert={!open || inert}>
      {country && <Guide countryKey={key} country={country} />}
    </aside>
  );
}

function Guide({ countryKey, country }) {
  const tab = useApp(state => state.tab);
  const visited = useApp(state => state.visited.has(countryKey));
  const saved = useExternal(savedStore, () => savedStore.has(`country:${countryKey}`));
  const disabled = useApp(state => routeAvailability(state).disabled);
  const status = useApp(state => routeAvailability(state).status);
  const [share, shareResult] = useShare();
  const [pulse, setPulse] = useState(false);
  const content = useRef(null);

  useEffect(() => { content.current?.scrollTo({ top: 0 }); }, [countryKey, tab]);

  const visit = () => {
    toggleVisited();
    setPulse(false);
    requestAnimationFrame(() => setPulse(true));
    setTimeout(() => setPulse(false), 340);
  };

  // Em telas estreitas as abas rolam na horizontal: mantém a ativa visível.
  const select = name => {
    setTab(name);
    requestAnimationFrame(() => document.getElementById(`country-tab-button-${name}`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
  };

  return (
    <>
      <header className="country-panel__toolbar">
        <CloseButton id="country-panel-close" label="Fechar guia do país" onClick={resetToGlobe} />
        <span className="country-panel__spacer" />
        <button className={`visit-button share-button${shareResult ? ' share-button--done' : ''}`} id="country-share-button" type="button" aria-label={`Compartilhar ${country.namePt}`}
          onClick={() => share({ title: `${country.namePt}: guia de viagem`, text: `Olha ${country.namePt} no Traveling`, path: countryPagePath(country) })}>
          <Icon name="share" /><span>{shareResult || 'Compartilhar'}</span>
        </button>
        <SaveButton className="visit-button save-toggle" id="country-save-button" saved={saved} name={country.namePt} onToggle={() => toggleSavedCountry(countryKey)} />
        <button className={`visit-button${visited ? ' visit-button--active' : ''}${pulse ? ' button--pulse' : ''}`} id="visit-button" type="button" aria-pressed={visited} aria-label={`Marcar ${country.namePt} como visitado`} onClick={visit}>{visited ? '✓ Visitado' : 'Marcar visitado'}</button>
      </header>

      <div className="country-panel__identity">
        <CountryFlag country={country} key={country.alpha2} />
        <div>
          <div className="country-panel__region" id="country-region">{country.region || CONTINENT_LABELS[country.continent]}</div>
          <h2 className="country-panel__name" id="country-name" tabIndex={-1}>{country.namePt}</h2>
          <div className="country-actions">
            <button className="primary-button country-plan-button" id="country-plan-button" type="button" onClick={() => planTrip(countryKey)}>Planejar viagem</button>
            {/* aria-disabled (e não disabled): continua no Tab e diz por que não funciona. */}
            <button className="secondary-button country-explore-button" id="country-explore-button" type="button" aria-describedby="country-explore-status" aria-disabled={disabled}
              onClick={() => (disabled ? announce(status || 'A rota ainda está carregando.') : exploreDestination())}>Ver rota no globo</button>
          </div>
          <p className="country-explore-status" id="country-explore-status" role="status" aria-live="polite">{status}</p>
        </div>
      </div>

      <div className="country-tabs has-indicator" role="tablist" aria-label="Seções do guia" onKeyDown={tabKeys(KEYS, tab, select)}>
        <Indicator active=".country-tabs__button--active" mode="underline" dependency={tab} />
        {TABS.map(([name, label]) => (
          <button className={`country-tabs__button${name === tab ? ' country-tabs__button--active' : ''}`} key={name} id={`country-tab-button-${name}`} type="button" role="tab" data-tab={name}
            aria-selected={name === tab} aria-controls={`tab-${name}`} tabIndex={name === tab ? 0 : -1} onClick={() => select(name)}>{label}</button>
        ))}
      </div>

      <div className="country-panel__content" ref={content}>
        {TABS.map(([name, , Content]) => (
          <section className={`country-tab${name === tab ? ' country-tab--active' : ''}`} key={name} id={`tab-${name}`} data-tab-panel={name} role="tabpanel" aria-labelledby={`country-tab-button-${name}`} hidden={name !== tab} tabIndex={0}>
            {name === tab && <Content countryKey={countryKey} country={country} key={countryKey} />}
          </section>
        ))}
      </div>
    </>
  );
}

function CountryFlag({ country }) {
  const [failed, setFailed] = useState(false);
  const url = failed ? null : flagImageUrl(country.alpha2);
  return (
    <span className={`country-panel__flag${country.alpha2 === 'NP' ? ' country-panel__flag--nepal' : ''}`} id="country-flag" role="img" aria-label={url ? `Bandeira: ${country.namePt}` : `Bandeira não disponível: ${country.namePt}`}>
      {url ? <img src={url} alt="" width="56" height="42" decoding="async" onError={() => setFailed(true)} /> : <span className="country-panel__flag-fallback">{country.alpha2 || '🌍'}</span>}
    </span>
  );
}
