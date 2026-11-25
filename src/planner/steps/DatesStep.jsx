// Etapa 2: quando, quanto tempo, quem vai e de onde sai.
import { useEffect, useState } from 'react';
import { COUNTRIES } from '../../../js/countries.dataset.js';
import { MAX_TRAVELERS, ORIGIN_AIRPORTS, TRAVEL_GROUPS, TRIP_DURATIONS, tripMonth } from '../../../js/planner/trip.model.js';
import { announce } from '../../state/focus.js';
import { MONTH_NAMES, MONTH_SHORT, people } from '../labels.js';
import { Choices, Question, save } from '../Wizard.jsx';

const GROUP_HINTS = { solo: 'Só você', couple: 'Duas pessoas', family: 'Com crianças ou parentes', friends: 'Turma de amigos' };
const SEASON_CLASS = { 2: 'great', 1: 'good', 0: 'low' };
const isListed = code => ORIGIN_AIRPORTS.some(([value]) => value === code);

export function DatesStep({ trip }) {
  const country = COUNTRIES[trip.countryKey];
  const [exactOpen, setExactOpen] = useState(false);
  const exact = exactOpen || Boolean(trip.startDate);

  // Mês e duração substituem datas exatas.
  const pickDuration = value => save(trip, { duration: trip.duration === value ? null : value, startDate: null, endDate: null });
  const toggleExact = () => {
    setExactOpen(!exact);
    if (exact) save(trip, { startDate: null, endDate: null });
  };
  const setTravelers = value => {
    save(trip, { travelers: value });
    announce(people(value));
  };

  return (
    <>
      <Question title="Em que mês?" note={country?.bestTime}><Months trip={trip} country={country} /></Question>
      <Question title="Por quanto tempo?">
        <Choices trip={trip} field="duration" label="Duração da viagem" columns={4} options={TRIP_DURATIONS.map(item => [item.days, item.label])} selected={trip.startDate ? null : trip.duration} onPick={pickDuration} />
      </Question>
      <div className="planner-exact">
        <button className="planner-text-action" type="button" aria-expanded={exact} aria-controls="planner-exact-dates" onClick={toggleExact}>{exact ? 'Usar só mês e duração' : 'Tenho datas exatas'}</button>
        <div className="form-grid" id="planner-exact-dates" hidden={!exact}>
          <DateField id="planner-start" label="Ida" value={trip.startDate} onSave={startDate => save(trip, { startDate })} />
          <DateField id="planner-end" label="Volta" value={trip.endDate} min={trip.startDate} onSave={endDate => save(trip, { endDate })} />
        </div>
      </div>
      <Question title="Quem vai?"><Choices trip={trip} field="group" label="Quem vai" columns={4} options={Object.entries(TRAVEL_GROUPS)} hints={GROUP_HINTS} /></Question>
      <Question title="Quantas pessoas?">
        <div className="planner-counter" role="group" aria-label="Número de viajantes">
          <button className="icon-button" type="button" aria-label="Menos um viajante" disabled={trip.travelers <= 1} onClick={() => setTravelers(trip.travelers - 1)}>−</button>
          <output>{trip.travelers}</output>
          <button className="icon-button" type="button" aria-label="Mais um viajante" disabled={trip.travelers >= MAX_TRAVELERS} onClick={() => setTravelers(trip.travelers + 1)}>＋</button>
        </div>
      </Question>
      <Question title="Saindo de onde?"><Origin trip={trip} /></Question>
    </>
  );
}

function Months({ trip, country }) {
  const scores = country?.months?.length === 12 ? country.months : null;
  const selected = tripMonth(trip);
  return (
    <>
      <div className="month-grid" role="group" aria-label="Mês da viagem">
        {MONTH_SHORT.map((label, index) => {
          const score = scores?.[index];
          const on = selected === index;
          return (
            <button className={`month-choice month-choice--${SEASON_CLASS[score] ?? 'none'} ${on ? 'choice--on' : ''}`} type="button" key={label} aria-pressed={on} disabled={Boolean(trip.startDate)}
              aria-label={`${label} (${MONTH_NAMES[index]}${score === 2 ? ', ótima época' : score === 0 ? ', época ruim' : ''})`}
              onClick={() => save(trip, { month: trip.month === index ? null : index, startDate: null, endDate: null })}>{label}</button>
          );
        })}
      </div>
      {scores && <p className="planner-legend" aria-hidden="true"><i className="planner-legend__great" />Ótima época <i className="planner-legend__good" />Boa <i className="planner-legend__low" />Evitar</p>}
    </>
  );
}

// Salva assim que a data fica completa (ano digitado pela metade, como 0002, não
// conta) e mostra o valor como foi guardado (o modelo troca datas invertidas).
function DateField({ id, label, value, min, onSave }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => { setDraft(value ?? ''); }, [value]);
  const change = next => {
    setDraft(next);
    if (next === '' || Number(next.slice(0, 4)) >= 2000) onSave(next);
  };
  return (
    <label className="form-field" htmlFor={id}>
      <span className="form-field__label">{label}</span>
      <input className="form-field__control" id={id} type="date" value={draft} min={min || undefined} onChange={event => change(event.target.value)} />
    </label>
  );
}

function Origin({ trip }) {
  const other = isListed(trip.origin) ? '' : trip.origin;
  const [code, setCode] = useState(other);
  useEffect(() => { setCode(other); }, [other]);
  const options = isListed(trip.origin) ? ORIGIN_AIRPORTS : [[trip.origin, trip.origin], ...ORIGIN_AIRPORTS];
  const commit = () => {
    const value = code.trim().toUpperCase();
    if (value && value !== trip.origin) save(trip, { origin: value });
    setCode(isListed(value) ? '' : value || other);
  };
  return (
    <>
      <label className="sr-only" htmlFor="planner-origin">Aeroporto de saída</label>
      <select className="form-field__control" id="planner-origin" value={trip.origin} onChange={event => save(trip, { origin: event.target.value })}>
        {options.map(([value, name]) => <option value={value} key={value}>{name} ({value})</option>)}
      </select>
      <label className="planner-origin-other" htmlFor="planner-origin-code">
        <span className="planner-hint">Outro aeroporto, de qualquer país: digite o código IATA ou ICAO (ex.: LIS, MIA, SBRF).</span>
        <input className="form-field__control" id="planner-origin-code" type="text" inputMode="latin" maxLength={4} autoComplete="off" spellCheck={false} placeholder="Código" value={code}
          onChange={event => setCode(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') commit(); }} />
      </label>
    </>
  );
}
