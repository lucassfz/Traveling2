// Etapa 6: resumo da viagem.
import { useState } from 'react';
import { INTERESTS, PLANNER_STEPS, tripProgress } from '../../../js/planner/trip.model.js';
import { showCountryFromPlanner, tripShareUrl } from '../../state/actions.js';
import { useShare } from '../../components/ui.jsx';
import { countryName, tripFacts } from '../labels.js';
import { goToStep } from '../Wizard.jsx';
import { SavedNote } from '../Planner.jsx';
import { TripCost, useTripCost } from '../sections/TripCost.jsx';
import { costSummaryText } from '../../../js/planner/cost.model.js';

function summaryText(trip, cost) {
  return [
    `Viagem para ${countryName(trip)}`,
    ...tripFacts(trip).map(([label, value]) => `${label}: ${value}`),
    trip.interests.length ? `Interesses: ${trip.interests.map(id => INTERESTS[id]).join(', ')}` : '',
    '',
    ...costSummaryText(cost),
    '',
    'Planejado no Traveling.'
  ].filter((line, index, all) => line || all[index - 1]).join('\n').trim();
}

// A folha de impressão mostra só o resumo da viagem (styles.css, @media print).
function print() {
  document.body.classList.add('printing-trip');
  const done = () => {
    document.body.classList.remove('printing-trip');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1000);
}

export function SummaryStep({ trip, onDelete }) {
  const [status, setStatus] = useState('');
  const [share, shareResult] = useShare();
  const cost = useTripCost(trip);
  const progress = tripProgress(trip);

  const copy = () => {
    if (!navigator.clipboard) return setStatus('Não foi possível copiar neste navegador.');
    return navigator.clipboard.writeText(summaryText(trip, cost.summary))
      .then(() => setStatus('Resumo copiado. Cole onde quiser compartilhar.'))
      .catch(() => setStatus('Não foi possível copiar neste navegador.'));
  };

  return (
    <>
      <div className="planner-recap">
        <dl className="planner-recap__facts">{tripFacts(trip).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </div>
      <TripCost trip={trip} cost={cost} onStep={step => goToStep(trip, step)} />
      {trip.interests.length > 0 && (
        <div className="planner-card">
          <h4 className="planner-block-title">Interesses</h4>
          <div className="planner-tags">{trip.interests.map(id => <span className="planner-tag" key={id}>{INTERESTS[id]}</span>)}</div>
        </div>
      )}
      <div className="planner-card">
        <h4 className="planner-block-title">Andamento</h4>
        <ul className="planner-todo">
          {PLANNER_STEPS.slice(0, -1).map((step, index) => (
            <li className={progress.done[index] ? 'planner-todo--done' : ''} key={step.id}>
              <span className="planner-todo__mark" aria-hidden="true">{progress.done[index] ? '✓' : ''}</span>
              <span>{step.label}</span>
              {progress.done[index] ? <small>Concluída</small> : <button className="planner-text-action" type="button" aria-label={`Completar a etapa ${step.label}`} onClick={() => goToStep(trip, index + 1)}>Completar</button>}
            </li>
          ))}
        </ul>
      </div>
      <div className="planner-actions">
        <button className="secondary-button" type="button" onClick={copy}>Copiar resumo</button>
        <button className="secondary-button" type="button" onClick={() => share({ title: `Viagem para ${countryName(trip)}`, text: `Olha o roteiro da viagem para ${countryName(trip)} no Traveling`, url: tripShareUrl(trip) })}>{shareResult || 'Compartilhar viagem'}</button>
        <button className="secondary-button" type="button" onClick={print}>Imprimir / salvar PDF</button>
        <button className="secondary-button" type="button" onClick={() => showCountryFromPlanner(trip.countryKey)}>Ver guia de {countryName(trip)}</button>
      </div>
      <p className="planner-hint" role="status" aria-live="polite">{status}</p>
      <div className="planner-footer">
        <SavedNote />
        <div className="planner-delete"><button className="planner-text-button" type="button" onClick={onDelete}>Excluir viagem</button></div>
      </div>
    </>
  );
}
