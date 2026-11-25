// Etapa Voo: estimativa da passagem (ida e volta) e, para quem pensa em usar
// milhas, quantas milhas cada programa brasileiro pediria nessa rota.
import { formatMiles } from '../../../js/pricing.engine.js';
import { awardComparison, flightSuggestion } from '../../../js/planner/planner.estimates.js';
import { CABINS } from '../../../js/planner/route.estimator.js';
import { formatBRL } from '../../../js/planner/money.js';
import { app } from '../../state/store.js';
import { usdRate } from '../../state/services.js';
import { openRoute } from '../../state/route.js';
import { useRoute } from '../../hooks/useRoute.js';
import { Provenance } from '../../components/ui.jsx';

const codeOf = airport => airport.iata || airport.icao;

/** Mostra no globo a rota da viagem. */
export function previewTripRoute(trip, origin, destination, button) {
  return openRoute({
    countryKey: trip.countryKey, originCode: codeOf(origin), airportCode: codeOf(destination), focusBack: button,
    isCurrent: () => app.get().hub === 'planner'
  }).catch(() => false);
}

export function FlightInfo({ trip }) {
  const route = useRoute(trip);
  return (
    <div className="planner-card">
      <h4 className="planner-block-title">Quanto custa, em média</h4>
      <div id="planner-flight-info" aria-live="polite" aria-busy={!route || route.status === 'loading'}><Info trip={trip} route={route} /></div>
    </div>
  );
}

function Info({ trip, route }) {
  if (!route || route.status === 'loading') return <p className="planner-hint">Calculando a estimativa…</p>;
  if (route.status === 'error') return <p className="planner-hint">{route.message}</p>;
  const brlPerUsd = usdRate()?.rate ?? null;
  const suggestion = flightSuggestion(route.estimate, { travelers: 1, brlPerUsd });
  if (!suggestion) return <p className="planner-hint">Câmbio indisponível agora. Tente de novo em instantes.</p>;
  const domestic = Boolean(route.origin.country) && route.origin.country === route.destination.country;
  const comparison = trip.payWith === 'cash' ? null : awardComparison({ estimate: route.estimate, travelers: 1, brlPerUsd, domestic, cabin: trip.cabin });
  return (
    <>
      <div className="planner-fare">
        <span className="planner-fare__label">Passagem ida e volta, por pessoa</span>
        <strong className="planner-fare__value">{formatBRL(suggestion.perLegLow * 2)} – {formatBRL(suggestion.perLegHigh * 2)}</strong>
        <small>{codeOf(route.origin)} ⇄ {codeOf(route.destination)} · {CABINS[trip.cabin]}{trip.city && ` · aeroporto que atende ${trip.city.name}`}</small>
      </div>
      {comparison && (
        <ul className="planner-miles-list">
          {comparison.options.map(option => (
            <li key={option.name}>
              <strong>{option.name}</strong>
              <span>{formatMiles(option.miles)} + {formatBRL(option.feesBRL)} de taxas, por pessoa</span>
              {option.savingBRL > 0 ? <em className="planner-miles-list__good">vale a pena</em> : <em>sai mais caro que dinheiro</em>}
            </li>
          ))}
        </ul>
      )}
      <Provenance kind="estimate" detail="por distância, mês e cabine; não é cotação. Confira preço e disponibilidade na companhia ou no programa" />
      <button className="secondary-button planner-route-preview" type="button" onClick={event => previewTripRoute(trip, route.origin, route.destination, event.currentTarget)}>Ver rota no globo</button>
    </>
  );
}
