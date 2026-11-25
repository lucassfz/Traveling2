// Passo a passo de uma viagem: cabeçalho, etapas e navegação.
import { COUNTRIES } from '../../js/countries.dataset.js';
import { PLANNER_STEPS, tripProgress, updateTrip } from '../../js/planner/trip.model.js';
import { tripStore } from '../state/services.js';
import { focusSoon } from '../state/focus.js';
import { Flag } from '../components/ui.jsx';
import { setView } from './Planner.jsx';
import { countryName, tripMeta } from './labels.js';
import { DestinationStep } from './steps/DestinationStep.jsx';
import { DatesStep } from './steps/DatesStep.jsx';
import { FlightStep } from './steps/FlightStep.jsx';
import { StyleStep } from './steps/StyleStep.jsx';
import { PrepStep } from './steps/PrepStep.jsx';
import { SummaryStep } from './steps/SummaryStep.jsx';

export const STEP_LEADS = {
  destination: 'Escolha o país e, se quiser, a cidade. Você pode trocar depois.',
  dates: 'Toque nas opções. Não precisa ter datas exatas agora.',
  flight: 'Escolha como prefere voar. A estimativa abaixo acompanha suas escolhas.',
  budget: 'Escolha o jeito de viajar. Dá para mudar quando quiser.',
  prep: 'Documentos, regras de entrada e o checklist do destino.',
  summary: 'Tudo o que você escolheu, num só lugar.'
};

const STEPS = { destination: DestinationStep, dates: DatesStep, flight: FlightStep, budget: StyleStep, prep: PrepStep, summary: SummaryStep };

/** Salva mudanças na viagem. */
export const save = (trip, changes) => tripStore.save(updateTrip(trip, changes));

export function goToStep(trip, step) {
  save(trip, { step });
  document.getElementById('planner-panel')?.scrollTo({ top: 0 });
  focusSoon('#wizard-title');
}

export function Wizard({ trip, onDelete }) {
  const country = COUNTRIES[trip.countryKey];
  const step = PLANNER_STEPS[trip.step - 1];
  const next = PLANNER_STEPS[trip.step];
  const Body = STEPS[step.id];
  const toList = () => {
    setView('home');
    focusSoon(`[data-planner-open="${CSS.escape(trip.id)}"]`);
  };
  return (
    <div className="wizard">
      <button className="planner-back" type="button" data-planner-action="home" onClick={toList}>← Suas viagens</button>
      <div className="wizard__trip">
        <Flag country={country} className="wizard__flag" />
        <div>
          <strong className="wizard__trip-name">{countryName(trip)}</strong>
          <small className="wizard__trip-meta">{tripMeta(trip)}</small>
        </div>
      </div>
      <Stepper trip={trip} current={trip.step} />
      <section className="wizard__step" aria-labelledby="wizard-title" key={step.id}>
        <span className="eyebrow">Etapa {trip.step} de {PLANNER_STEPS.length}</span>
        <h3 className="wizard__title" id="wizard-title" tabIndex={-1} aria-describedby="wizard-step">{step.id === 'summary' ? countryName(trip) : step.title}</h3>
        <span className="sr-only" id="wizard-step">Etapa {trip.step} de {PLANNER_STEPS.length}: {step.label}</span>
        <p className="wizard__lead">{STEP_LEADS[step.id]}</p>
        <Body trip={trip} onDelete={onDelete} />
      </section>
      <footer className="wizard__nav">
        {trip.step > 1 ? <button className="secondary-button" type="button" data-planner-action="prev" onClick={() => goToStep(trip, trip.step - 1)}>Voltar</button> : <span />}
        {next
          ? <button className="primary-button" type="button" data-planner-action="next" onClick={() => goToStep(trip, trip.step + 1)}>Continuar <span className="wizard__nav-next">· {next.label}</span></button>
          : <button className="primary-button" type="button" onClick={toList}>Concluir</button>}
      </footer>
    </div>
  );
}

export function Stepper({ trip, current }) {
  const done = trip ? tripProgress(trip).done : PLANNER_STEPS.map(() => false);
  return (
    <nav aria-label="Etapas do planejamento">
      <ol className="stepper">
        {PLANNER_STEPS.map((step, index) => {
          const number = index + 1;
          const isCurrent = number === current;
          return (
            <li className={`stepper__item stepper__item--${isCurrent ? 'current' : done[index] ? 'done' : 'todo'}`} key={step.id}>
              <button type="button" className="stepper__button" data-planner-step={number} disabled={!trip} aria-current={isCurrent ? 'step' : undefined} aria-label={`Etapa ${number}: ${step.label}${done[index] ? ' (concluída)' : ''}`} onClick={() => goToStep(trip, number)}>
                <span className="stepper__dot">{done[index] && !isCurrent ? '✓' : number}</span>
                <span className="stepper__label">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Pergunta do passo a passo: título, dica opcional e as opções. */
export function Question({ title, note, children }) {
  return <div className="planner-question"><h4 className="planner-question__title">{title}</h4>{note && <p className="planner-hint">{note}</p>}{children}</div>;
}

/** Cartões de escolha única (ou múltipla, com `multi`). */
export function Choices({ trip, field, label, options, hints = {}, columns = 2, multi = false, selected = trip[field], onPick }) {
  const isOn = value => (multi ? selected.includes(value) : String(selected ?? '') === String(value));
  const pick = onPick ?? (value => {
    if (multi) return save(trip, { [field]: selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value] });
    // Tocar de novo na opção marcada desmarca (exceto as que sempre têm valor).
    const keep = field === 'cabin' || field === 'lodging';
    return save(trip, { [field]: !keep && trip[field] === value ? null : value });
  });
  return (
    <div className={`choice-grid choice-grid--${columns}`} role="group" aria-label={label}>
      {options.map(([value, text]) => (
        <button className={`choice ${isOn(value) ? 'choice--on' : ''}`} type="button" key={value} aria-pressed={isOn(value)} onClick={() => pick(value)}>
          <span className="choice__title">{text}</span>
          {hints[value] && <span className="choice__hint">{hints[value]}</span>}
        </button>
      ))}
    </div>
  );
}
