// Etapa 4: estilo, hospedagem, locomoção e interesses.
import { INTERESTS, LOCAL_TRANSPORT, TRAVEL_STYLES } from '../../../js/planner/trip.model.js';
import { Choices, Question } from '../Wizard.jsx';
import { LiveHotels } from '../sections/LiveHotels.jsx';
import { PartnerStyle } from '../sections/Partners.jsx';

const LODGING = { hostel: 'Albergue', simple: 'Simples', comfort: 'Conforto', superior: 'Superior' };
const HINTS = {
  style: { economic: 'Gastar pouco', balanced: 'Bom custo-benefício', comfort: 'Mais conforto' },
  lodging: { hostel: 'Quarto compartilhado', simple: 'Quarto privativo', comfort: 'Hotel 3–4★', superior: 'Hotel 4–5★' },
  transport: { public: 'Metrô, ônibus, trem', car: 'Liberdade para rodar', tours: 'Tudo organizado', mixed: 'Depende do dia' }
};

export function StyleStep({ trip }) {
  return (
    <>
      <Question title="Qual o seu estilo de viagem?"><Choices trip={trip} field="style" label="Estilo de viagem" columns={3} options={Object.entries(TRAVEL_STYLES)} hints={HINTS.style} /></Question>
      <Question title="Onde quer ficar?"><Choices trip={trip} field="lodging" label="Hospedagem" options={Object.entries(LODGING)} hints={HINTS.lodging} /></Question>
      <LiveHotels trip={trip} />
      <Question title="Como vai se locomover lá?"><Choices trip={trip} field="transport" label="Locomoção" options={Object.entries(LOCAL_TRANSPORT)} hints={HINTS.transport} /></Question>
      <Question title="O que você mais quer fazer?" note="Escolha quantos quiser."><Choices trip={trip} field="interests" label="Interesses" options={Object.entries(INTERESTS)} multi /></Question>
      <PartnerStyle trip={trip} />
    </>
  );
}
