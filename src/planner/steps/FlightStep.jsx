// Etapa 3: voo.
import { FLIGHT_PREFERENCES, PAY_OPTIONS } from '../../../js/planner/trip.model.js';
import { CABINS } from '../../../js/planner/route.estimator.js';
import { isEnabled } from '../../../js/api/travel.client.js';
import { Choices, Question } from '../Wizard.jsx';
import { FlightInfo } from '../sections/FlightInfo.jsx';
import { LiveFlights } from '../sections/LiveFlights.jsx';
import { PartnerFlight } from '../sections/Partners.jsx';

const HINTS = {
  payWith: { cash: 'Cartão ou Pix', miles: 'LATAM Pass, Smiles, Azul', undecided: 'Mostramos as duas opções' },
  cabin: { economy: 'A mais comum', premium: 'Mais espaço', business: 'Assento-cama em voos longos' },
  flightPreference: { direct: 'Menos conexões e tempo', cheapest: 'Aceito escalas longas' }
};

export function FlightStep({ trip }) {
  return (
    <>
      <Question title="Como pretende pagar a passagem?"><Choices trip={trip} field="payWith" label="Forma de pagamento" columns={3} options={Object.entries(PAY_OPTIONS)} hints={HINTS.payWith} /></Question>
      <Question title="Qual cabine?"><Choices trip={trip} field="cabin" label="Cabine" columns={3} options={Object.entries(CABINS)} hints={HINTS.cabin} /></Question>
      <Question title="O que pesa mais?"><Choices trip={trip} field="flightPreference" label="O que pesa mais" options={Object.entries(FLIGHT_PREFERENCES)} hints={HINTS.flightPreference} /></Question>
      <FlightInfo trip={trip} />
      {/* Busca de voos reais (fase 3.3): só com o backend ligado (meta traveling-api). */}
      {isEnabled() && <LiveFlights trip={trip} />}
      <PartnerFlight trip={trip} />
    </>
  );
}
