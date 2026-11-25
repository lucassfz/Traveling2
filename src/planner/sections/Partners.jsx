// Links de parceiros no planejador (só links, nenhum script de terceiros).
import { COUNTRIES } from '../../../js/countries.dataset.js';
import { PARTNERS, aviasalesUrl, esimOffer, klookUrl } from '../../../js/planner/partners.js';
import { useRecentFare, useRoute } from '../../hooks/useRoute.js';
import { ExternalLink, Provenance } from '../../components/ui.jsx';
import { PartnerNote } from '../../components/PartnerNote.jsx';
import { wholeReais } from '../../country/Overview.jsx';

const PartnerLink = ({ href, children }) => <ExternalLink className="secondary-button" href={href} sponsored>{children} ↗</ExternalLink>;
const Note = () => <PartnerNote plural={false} className="" />;

export function PartnerFlight({ trip }) {
  const route = useRoute(trip);
  const offer = useRecentFare(trip, route);
  const ready = route?.status === 'ready';
  const url = aviasalesUrl(trip, ready ? { origin: route.origin.iata, destination: route.destination.iata } : {});
  const filled = url !== PARTNERS.aviasales.home;
  return (
    <section className="planner-card" aria-label="Comparar passagens">
      <h4 className="planner-block-title">Comparar passagens</h4>
      {offer && <RecentFare offer={offer} />}
      <p className="live-hotel__external">
        <PartnerLink href={url}>{filled ? `Ver voos ${route.origin.iata} → ${route.destination.iata} no Aviasales` : 'Buscar voos no Aviasales'}</PartnerLink>
        <small>{filled ? 'Abre a busca com aeroportos, datas e passageiros da viagem.' : 'Defina datas exatas para abrir a busca já preenchida.'}</small>
        <Note />
      </p>
    </section>
  );
}

// Preço visto recentemente por outros viajantes (Travelpayouts).
function RecentFare({ offer }) {
  const seen = offer.foundOn ? offer.foundOn.split('-').reverse().slice(0, 2).join('/') : null;
  const stops = offer.transfers === 0 ? 'voo direto' : Number.isInteger(offer.transfers) ? `${offer.transfers} ${offer.transfers === 1 ? 'escala' : 'escalas'} na ida` : '';
  return (
    <>
      <div className="planner-fare">
        <span className="planner-fare__label">{offer.returnAt ? 'Ida e volta' : 'Só ida'}, por pessoa, a partir de</span>
        <strong className="planner-fare__value">{wholeReais(Number(offer.price.amount))}</strong>
        <small>{[`${offer.origin} → ${offer.destination}`, stops].filter(Boolean).join(' · ')}</small>
      </div>
      <Provenance kind="cached" detail={`${seen ? `visto em ${seen}` : 'visto recentemente'} por outros viajantes; pode ter mudado`} />
      <p className="live-hotel__external"><PartnerLink href={offer.url}>Ver esse preço no Aviasales</PartnerLink></p>
    </>
  );
}

export function PartnerStyle({ trip }) {
  const car = trip.transport === 'car' || trip.transport === 'mixed';
  const place = trip.city?.name || COUNTRIES[trip.countryKey]?.namePt;
  return (
    <section className="planner-card" aria-label="Para a viagem">
      <h4 className="planner-block-title">Para a viagem</h4>
      <div className="partner-links">
        {car && <PartnerLink href={PARTNERS.getrentacar.home}>Alugar carro no GetRentacar</PartnerLink>}
        <PartnerLink href={klookUrl(place)}>{place ? `Passeios em ${place} no Klook` : 'Passeios no Klook'}</PartnerLink>
        <PartnerLink href={PARTNERS.gocity.home}>Passes de atrações no Go City</PartnerLink>
      </div>
      <p className="live-hotel__external">{!car && <small>Escolheu carro alugado? O link de aluguel aparece aqui.</small>}<Note /></p>
    </section>
  );
}

export function PartnerEsim() {
  const offer = esimOffer();
  return (
    <section className="planner-card" aria-label="Internet no destino">
      <h4 className="planner-block-title">Internet no destino</h4>
      <p className="planner-hint">Um eSIM de viagem funciona no celular sem trocar de chip, se o aparelho for compatível.</p>
      <p className="live-hotel__external"><PartnerLink href={offer.url}>{offer.label}</PartnerLink>{offer.note && <small>{offer.note}</small>}<Note /></p>
    </section>
  );
}
