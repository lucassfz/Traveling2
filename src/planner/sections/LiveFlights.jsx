// Busca de voos reais pelo backend (fase 3.3). Só aparece com o backend ligado
// (<meta name="traveling-api">). "Adicionar à viagem" grava uma cotação no orçamento.
import { useEffect, useRef, useState } from 'react';
import { addLine, removeLine } from '../../../js/planner/trip.model.js';
import { convertToBRL } from '../../../js/planner/currency.js';
import { formatBRL, formatMoney } from '../../../js/planner/money.js';
import { flightSearchFromTrip, searchFlights } from '../../../js/api/travel.client.js';
import { FLIGHT_SORTS, attachedFlights, carriers, clock, flightOfferLine, isOfferExpired, minutesLabel, offerTime, sortOffers, stopsLabel } from '../../../js/planner/flight.offers.js';
import { airports, rates, resolveCityAirport, resolveDestinationAirport, tripStore } from '../../state/services.js';
import { announce } from '../../state/focus.js';
import { useAsync } from '../../hooks/useAsync.js';
import { ExternalLink, Provenance } from '../../components/ui.jsx';
import { PartnerNote } from '../../components/PartnerNote.jsx';
import { previewTripRoute } from './FlightInfo.jsx';

const KINDS = { live: 'live', cached: 'cached', test: 'test' };
const dayMonth = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

async function tripAirports(trip) {
  const [origin, cityAirport] = await Promise.all([
    airports.resolve(trip.origin),
    trip.city ? resolveCityAirport(trip.city.lat, trip.city.lng) : null
  ]);
  return { origin, destination: cityAirport ?? await resolveDestinationAirport(trip.countryKey) };
}

export function LiveFlights({ trip }) {
  const tripKey = [trip.id, trip.origin, trip.countryKey, trip.city?.id ?? '', trip.startDate, trip.endDate, trip.travelers, trip.cabin].join('|');
  // Mudou origem, datas, viajantes ou cabine: resultados antigos não valem mais.
  return <Search trip={trip} key={tripKey} />;
}

function Search({ trip }) {
  const { value: pair } = useAsync(() => tripAirports(trip).catch(() => ({ origin: null, destination: null })), []);
  const [state, setState] = useState({ status: 'idle' });
  const [sort, setSort] = useState('price');
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);

  const built = flightSearchFromTrip(trip, { origin: pair?.origin?.iata, destination: pair?.destination?.iata });
  const ready = 'request' in built;

  const search = async () => {
    if (!ready) return;
    controller.current?.abort();
    controller.current = new AbortController();
    setState({ status: 'loading' });
    try {
      const result = await searchFlights(built.request, { signal: controller.current.signal });
      setState({ status: 'done', result });
      announce(`${result.offers.length} voos encontrados.`);
    } catch (error) {
      if (error.code !== 'CANCELLED') setState({ status: 'error', error });
    }
  };

  const where = pair?.origin && pair?.destination ? `${pair.origin.iata} → ${pair.destination.iata}` : 'Origem e destino da viagem';
  const when = trip.startDate ? `${dayMonth(trip.startDate)}${trip.endDate ? `–${dayMonth(trip.endDate)}` : ''}` : 'datas a definir';

  return (
    <section className="planner-card live-search" aria-label="Buscar voos reais">
      <div className="live-search__head">
        <div>
          <h4 className="planner-block-title">Buscar voos reais</h4>
          <p className="planner-hint">{where} · {when} · {trip.travelers} {trip.travelers === 1 ? 'viajante' : 'viajantes'}</p>
        </div>
        <button className="primary-button" type="button" disabled={!ready || state.status === 'loading'} onClick={search}>{state.status === 'done' ? 'Buscar de novo' : 'Buscar'}</button>
      </div>
      {!trip.startDate && <p className="planner-hint">Para buscar voos reais, defina datas exatas na etapa Datas ("Tenho datas exatas").</p>}
      {trip.startDate && built.missing === 'airports' && pair && <p className="planner-hint">Não encontramos o código IATA de um dos aeroportos desta viagem.</p>}
      <div aria-busy={state.status === 'loading'}>
        {state.status === 'loading' && <p className="planner-hint live-search__status" role="status">Buscando voos…</p>}
        {state.status === 'error' && (
          <>
            <p className="planner-hint live-search__status live-search__status--error" role="alert">{state.error.message}</p>
            {state.error.retryable && <button className="secondary-button" type="button" onClick={search}>Tentar de novo</button>}
          </>
        )}
        {state.status === 'done' && <Results trip={trip} pair={pair} result={state.result} sort={sort} onSort={setSort} />}
      </div>
      <Attached trip={trip} />
    </section>
  );
}

function Results({ trip, pair, result, sort, onSort }) {
  const { offers, warnings, providers } = result;
  if (!offers.length) return <p className="planner-hint" role="status">Nenhum voo encontrado para essas datas. Tente outras datas ou outra cabine.</p>;
  return (
    <>
      <div className="live-search__toolbar" role="group" aria-label="Ordenar voos">
        {Object.entries(FLIGHT_SORTS).map(([id, label]) => <button type="button" className="discovery-chip" key={id} aria-pressed={sort === id} onClick={() => onSort(id)}>{label}</button>)}
      </div>
      <ul className="live-offers">{sortOffers(offers, sort).slice(0, 12).map(offer => <Offer trip={trip} pair={pair} offer={offer} key={`${offer.provider}${offer.offerId}`} />)}</ul>
      {warnings.map(warning => <p className="planner-hint" key={warning}>{warning}</p>)}
      <p className="planner-hint">Fonte: {providers.filter(provider => provider.status === 'ok').map(provider => provider.id).join(', ')}. Preços sujeitos a alteração até a reserva.</p>
      {offers.some(offer => offer.bookingUrl) && <PartnerNote />}
    </>
  );
}

function Offer({ trip, pair, offer }) {
  const expired = isOfferExpired(offer);
  const attached = attachedFlights(trip).some(line => line.source.provider === offer.provider && line.source.offerId === offer.offerId);
  const { amount, currency } = offer.price.total;
  const total = Number(amount);
  const converted = currency === 'BRL' ? null : convertToBRL(total, currency, rates());
  const name = carriers(offer);
  const detail = expired ? 'preço expirado: busque de novo' : offer.dataSource === 'cached' && offer.observedAt
    ? `visto em ${new Date(offer.observedAt).toLocaleDateString('pt-BR')}`
    : `consultado às ${clock(offer.searchedAt)}${offer.expiresAt ? ` · vale até ${clock(offer.expiresAt)}` : ''}`;
  const attach = () => {
    if (attached || isOfferExpired(offer)) return;
    tripStore.save(addLine(trip, flightOfferLine(offer, rates())));
    announce('Voo adicionado à viagem.');
  };
  return (
    <li className={`live-offer${expired ? ' live-offer--expired' : ''}`}>
      <div className="live-offer__head">
        <strong className="live-offer__carrier">{name}</strong>
        <span className="live-offer__price">
          <strong>{formatMoney(total, currency)}</strong>
          <small>total · {offer.passengers.adults} {offer.passengers.adults === 1 ? 'adulto' : 'adultos'}{converted && ` · ≈ ${formatBRL(converted.amountBRL)}`}</small>
        </span>
      </div>
      {offer.slices.map((slice, index) => (
        <div className="live-offer__slice" key={slice.departAt}>
          <span className="live-offer__tag">{index ? 'Volta' : 'Ida'} {dayMonth(slice.departAt)}</span>
          <strong>{offerTime(slice.departAt)} {slice.origin}</strong>
          <span className="live-offer__line" aria-hidden="true" />
          <strong>{offerTime(slice.arriveAt)} {slice.destination}</strong>
          <small>{minutesLabel(slice.durationMinutes)} · {stopsLabel(slice.stops)}{slice.connections.length > 0 && ` (${slice.connections.join(', ')})`}</small>
        </div>
      ))}
      <div className="live-offer__foot">
        <Provenance kind={KINDS[offer.dataSource] ?? 'unverified'} tag="span" detail={detail} />
        <div className="live-offer__actions">
          <button className="secondary-button" type="button" disabled={!pair?.origin || !pair?.destination} onClick={event => previewTripRoute(trip, pair.origin, pair.destination, event.currentTarget)}>Ver rota</button>
          <button className={attached ? 'secondary-button' : 'primary-button'} type="button" disabled={attached || expired} onClick={attach}>{attached ? 'Na viagem ✓' : 'Adicionar à viagem'}<span className="sr-only">: {name}</span></button>
          {offer.bookingUrl && !expired && <ExternalLink className="secondary-button" href={offer.bookingUrl} sponsored>Reservar ↗</ExternalLink>}
        </div>
      </div>
    </li>
  );
}

function Attached({ trip }) {
  const lines = attachedFlights(trip);
  return <AttachedLines trip={trip} lines={lines} fallback="Voo" />;
}

/** Cotações já na viagem (voos ou hospedagem), com Remover. */
export function AttachedLines({ trip, lines, fallback }) {
  if (!lines.length) return null;
  const remove = line => {
    tripStore.save(removeLine(trip, line.id));
    announce(`${fallback} removido da viagem.`);
  };
  return (
    <div className="live-attached">
      <h5 className="planner-block-title">Na sua viagem</h5>
      <ul>
        {lines.map(line => {
          const title = line.note || line.source.summary || fallback;
          return (
            <li key={line.id}>
              <span>
                <strong>{title}</strong>
                <small>Cotação de {new Date(line.source.fetchedAt).toLocaleDateString('pt-BR')} · {line.currency ? formatMoney(line.amount, line.currency) : formatBRL(line.amountBRL)} · pode ter mudado</small>
              </span>
              <button className="planner-text-action" type="button" aria-label={`Remover ${title}`} onClick={() => remove(line)}>Remover</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
