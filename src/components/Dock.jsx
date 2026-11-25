// Barra de baixo: países visitados, continentes e filtros do globo.
import { useRef, useState } from 'react';
import { COUNTRIES } from '../../js/countries.dataset.js';
import { useApp } from '../state/store.js';
import { VISA_FREE_KEYS, seasonKeys, selectContinent, setSeasonMonth, toggleVisaFilter } from '../state/actions.js';
import { announce } from '../state/focus.js';
import { Icon, Indicator } from './ui.jsx';

const CONTINENTS = [['EU', 'Europa', 'Europa'], ['NA', 'Am. Norte', 'América do Norte'], ['SA', 'Am. Sul', 'América do Sul'], ['AF', 'África', 'África'], ['AS', 'Ásia', 'Ásia'], ['OC', 'Oceania', 'Oceania']];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const TOTAL = Object.keys(COUNTRIES).length;

export function Dock({ inert }) {
  const visited = useApp(state => state.visited.size);
  const continent = useApp(state => state.continent);
  const visaFilter = useApp(state => state.visaFilter);
  const seasonMonth = useApp(state => state.seasonMonth);
  const [picking, setPicking] = useState(false);
  const seasonButton = useRef(null);
  const hasSeason = Number.isInteger(seasonMonth);

  const chooseMonth = month => {
    const next = month === seasonMonth ? null : month;
    setSeasonMonth(month);
    setPicking(false);
    seasonButton.current?.focus({ preventScroll: true });
    announce(next === null ? 'Filtro de época desligado.' : `${seasonKeys(next).length} países em ótima época em ${MONTH_NAMES[next]}, destacados no globo.`);
  };

  return (
    <>
      <div className="dock" role="group" aria-label="Filtros do globo" inert={inert}>
        <div className="dock__stat" title="Destinos marcados como visitados">
          <Icon name="globe" />
          <span className="sr-only">Visitados:</span>
          <strong id="visited-count">{visited}</strong><span className="dock__stat-total" id="visited-total">/ {TOTAL}</span>
        </div>
        <div className="continent-nav has-indicator" role="group" aria-label="Ir para um continente">
          <Indicator active=".continent-nav__button--active" dependency={continent} />
          {CONTINENTS.map(([code, label, name]) => (
            <button className={`continent-nav__button${continent === code ? ' continent-nav__button--active' : ''}`} type="button" key={code} data-continent={code} aria-pressed={continent === code} aria-label={label === name ? undefined : `${label} (${name})`}
              onClick={() => { selectContinent(code); announce(`${name} no globo.`); }}>{label}</button>
          ))}
        </div>
        <button className={`visa-filter${visaFilter ? ' visa-filter--active' : ''}`} id="visa-free-filter" type="button" aria-pressed={visaFilter}
          title={`${visaFilter ? 'Desativar filtro de' : 'Mostrar'} destinos sem visto prévio nem autorização eletrônica`}
          aria-label={`Sem visto ${VISA_FREE_KEYS.length}: destacar destinos sem visto prévio nem autorização eletrônica para brasileiros`}
          onClick={toggleVisaFilter}>
          <Icon name="shield" />
          <span className="visa-filter__label">Sem visto</span>{' '}
          <strong className="visa-filter__count" id="visa-free-count">{VISA_FREE_KEYS.length}</strong>
        </button>
        <button className={`visa-filter season-filter${hasSeason ? ' visa-filter--active' : ''}`} id="season-filter" type="button" aria-expanded={picking} aria-controls="season-picker" ref={seasonButton}
          aria-label={hasSeason ? `Quando ir: ótimo em ${MONTH_NAMES[seasonMonth]}, ${seasonKeys(seasonMonth).length} países. Trocar o mês` : 'Quando ir: destacar países em ótima época num mês'}
          onClick={() => setPicking(!picking)}>
          <span aria-hidden="true">📅</span>
          <span className="visa-filter__label" id="season-label">{hasSeason ? `Ótimo em ${MONTHS[seasonMonth]} · ${seasonKeys(seasonMonth).length}` : 'Quando ir'}</span>
        </button>
      </div>
      <div className="season-picker" id="season-picker" role="group" aria-label="Escolha o mês da viagem" hidden={!picking} inert={inert}
        onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setPicking(false); seasonButton.current?.focus(); } }}>
        {MONTHS.map((label, month) => (
          <button className="discovery-chip" type="button" key={label} data-season-month={month} aria-pressed={month === seasonMonth} aria-label={`${label} (${MONTH_NAMES[month]})`} onClick={() => chooseMonth(month)}>{label}</button>
        ))}
        {hasSeason && <button className="planner-text-action" type="button" data-season-month="off" onClick={() => chooseMonth(seasonMonth)}>Limpar</button>}
      </div>
    </>
  );
}
