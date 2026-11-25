// "Quanto vai custar", no resumo. As contas estão em js/planner/cost.model.js.
import { DESTINATION_PROFILES } from '../../../js/destination.profiles.js';
import { BUDGET_TEXT, COST_EMPTY, costAssumptions, costRange, costRowProvenance, costRowRefreshStep, localCostRange, tripCostSummary } from '../../../js/planner/cost.model.js';
import { flightSuggestion } from '../../../js/planner/planner.estimates.js';
import { formatBRL } from '../../../js/planner/money.js';
import { usdRate } from '../../state/services.js';
import { useRecentFare, useRoute } from '../../hooks/useRoute.js';
import { Provenance } from '../../components/ui.jsx';

/** Custo da viagem: { summary, local, loading }. */
export function useTripCost(trip) {
  const route = useRoute(trip);
  const offer = useRecentFare(trip, route);
  const suggestion = route?.status === 'ready' ? flightSuggestion(route.estimate, { travelers: 1, brlPerUsd: usdRate()?.rate ?? null }) : null;
  const local = localCostRange(DESTINATION_PROFILES, trip);
  const summary = tripCostSummary({
    trip, local,
    flight: suggestion ? { low: suggestion.perLegLow * 2, high: suggestion.perLegHigh * 2 } : null,
    seen: offer ? { amount: Number(offer.price.amount), foundOn: offer.foundOn } : null
  });
  return { summary, local, loading: !route || route.status === 'loading' };
}

export function TripCost({ cost, onStep }) {
  return (
    <div className="planner-card trip-cost">
      <h4 className="planner-block-title">Quanto vai custar</h4>
      <div id="planner-trip-cost" aria-live="polite" aria-busy={cost.loading}><Content {...cost} onStep={onStep} /></div>
    </div>
  );
}

function Content({ summary, local, loading, onStep }) {
  if (!summary.rows.length) return <p className="planner-hint">{loading ? 'Calculando…' : COST_EMPTY}</p>;
  const perPerson = summary.perPersonHigh !== summary.high;
  return (
    <>
      <div className="trip-cost__total">
        <span>Total</span>
        <strong>{costRange(summary.low, summary.high)}</strong>
        {perPerson && <small>{costRange(summary.perPersonLow, summary.perPersonHigh)} por pessoa</small>}
      </div>
      {summary.budget && <p className={`trip-cost__budget trip-cost__budget--${summary.budget.status}`}>{BUDGET_TEXT[summary.budget.status](formatBRL(summary.budget.amountBRL))}</p>}
      <ul className="trip-cost__rows">{summary.rows.map(row => <Row row={row} onStep={onStep} key={row.id} />)}</ul>
      {summary.incomplete.length > 0 && <p className="planner-hint">{loading ? 'Calculando' : 'Sem estimativa'}: {summary.incomplete.join(', ').toLowerCase()}.</p>}
      <p className="planner-hint">{costAssumptions(local)}</p>
    </>
  );
}

function Row({ row, onStep }) {
  const { kind, options } = costRowProvenance(row);
  const notes = row.kind === 'quote' ? row.quotes.map(quote => quote.note).filter(Boolean) : [];
  const step = costRowRefreshStep(row);
  return (
    <li className="trip-cost__row">
      <div className="trip-cost__head"><span>{row.label}</span><strong>{costRange(row.low, row.high)}</strong></div>
      {notes.length > 0 && <small className="trip-cost__note">{notes.join(' · ')}</small>}
      <div className="trip-cost__foot">
        <Provenance kind={kind} tag="span" {...options} />
        {step && <button className="planner-text-action" type="button" onClick={() => onStep(step)}>Atualizar preço<span className="sr-only"> de {row.label}</span></button>}
      </div>
    </li>
  );
}
