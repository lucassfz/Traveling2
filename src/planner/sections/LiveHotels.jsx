// "Onde ficar" (fase 3.4): link do Booking.com sempre que há cidade e datas; busca
// com preços só com o backend ligado (<meta name="traveling-api">).
import { useEffect, useRef, useState } from 'react';
import { addLine } from '../../../js/planner/trip.model.js';
import { convertToBRL } from '../../../js/planner/currency.js';
import { formatBRL, formatMoney } from '../../../js/planner/money.js';
import { hotelSearchFromTrip, isEnabled, searchHotels } from '../../../js/api/travel.client.js';
import { BOARD_LABELS, HOTEL_SORTS, affiliateId, attachedHotels, bookingSearchUrl, filterByLodging, hotelOfferLine, isHotelOfferExpired, sortHotelOffers } from '../../../js/planner/hotel.offers.js';
import { clock } from '../../../js/planner/flight.offers.js';
import { rates, tripStore } from '../../state/services.js';
import { announce } from '../../state/focus.js';
import { ExternalLink, Provenance } from '../../components/ui.jsx';
import { AttachedLines } from './LiveFlights.jsx';

const dayMonth = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const HINTS = { city: 'Escolha a cidade na etapa Destino para ver hospedagens.', dates: 'Defina datas exatas na etapa Datas para ver hospedagens.' };

export function LiveHotels({ trip }) {
  return <Search trip={trip} key={[trip.id, trip.city?.id ?? '', trip.startDate, trip.endDate, trip.travelers].join('|')} />;
}

function Search({ trip }) {
  const [state, setState] = useState({ status: 'idle' });
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);

  const aid = affiliateId();
  const link = bookingSearchUrl(trip, { aid });
  const { request, missing } = hotelSearchFromTrip(trip);
  const live = isEnabled();

  const search = async () => {
    controller.current?.abort();
    controller.current = new AbortController();
    setState({ status: 'loading' });
    try {
      const result = await searchHotels(request, { signal: controller.current.signal });
      setState({ status: 'done', result });
      announce(`${result.offers.length} hospedagens encontradas.`);
    } catch (error) {
      if (error.code !== 'CANCELLED') setState({ status: 'error', error });
    }
  };

  return (
    <section className="planner-card live-search" aria-label="Onde ficar">
      <div className="live-search__head">
        <div>
          <h4 className="planner-block-title">Onde ficar</h4>
          <p className="planner-hint">
            {request
              ? `${trip.city.name} · ${dayMonth(request.checkIn)}–${dayMonth(request.checkOut)} · ${request.guests.adults} ${request.guests.adults === 1 ? 'hóspede' : 'hóspedes'} · ${request.rooms} ${request.rooms === 1 ? 'quarto' : 'quartos'}`
              : HINTS[missing]}
          </p>
        </div>
        {live && request && <button className="primary-button" type="button" disabled={state.status === 'loading'} onClick={search}>{state.status === 'done' ? 'Buscar de novo' : 'Buscar'}</button>}
      </div>
      {live && (
        <div aria-busy={state.status === 'loading'}>
          {state.status === 'loading' && <p className="planner-hint" role="status">Buscando hospedagem…</p>}
          {state.status === 'error' && (
            <>
              <p className="planner-hint live-search__status--error" role="alert">{state.error.message}</p>
              {state.error.retryable && <button className="secondary-button" type="button" onClick={search}>Tentar de novo</button>}
            </>
          )}
          {state.status === 'done' && <Results trip={trip} result={state.result} />}
        </div>
      )}
      {link && (
        <p className="live-hotel__external">
          <ExternalLink className="secondary-button" href={link} sponsored={Boolean(aid)}>Ver hotéis em {trip.city.name} no Booking.com ↗</ExternalLink>
          <small>
            {aid
              ? <>Link de parceiro: o Traveling pode receber comissão, sem custo extra para você. <a href="privacidade.html" target="_blank" rel="noopener">Saiba mais<span className="sr-only"> (abre em nova aba)</span></a></>
              : 'Abre a busca no site do Booking.com, com datas e hóspedes preenchidos.'}
          </small>
        </p>
      )}
      <AttachedLines trip={trip} lines={attachedHotels(trip)} fallback="Hospedagem" />
    </section>
  );
}

function Results({ trip, result }) {
  const [sort, setSort] = useState('price');
  const [styleOnly, setStyleOnly] = useState(true);
  const { offers, properties, warnings, providers } = result;
  if (!offers.length) return <p className="planner-hint" role="status">Nenhuma hospedagem encontrada para essas datas.</p>;
  const byId = new Map(properties.map(property => [property.propertyId, property]));
  const style = filterByLodging(offers, byId, trip.lodging);
  const shown = styleOnly && style.applied ? style.offers : offers;
  const stars = style.range ? `${style.range[0]}–${style.range[1]}★` : '';
  return (
    <>
      <div className="live-search__toolbar" role="group" aria-label="Ordenar e filtrar hospedagens">
        {Object.entries(HOTEL_SORTS).map(([id, label]) => <button type="button" className="discovery-chip" key={id} aria-pressed={sort === id} onClick={() => setSort(id)}>{label}</button>)}
        {style.applied && <button type="button" className="discovery-chip" aria-pressed={styleOnly} onClick={() => setStyleOnly(!styleOnly)}>Só {stars}</button>}
      </div>
      {style.applied && styleOnly && shown.length < offers.length && <p className="planner-hint">{shown.length} de {offers.length} opções no seu estilo ({stars}).</p>}
      {style.empty && <p className="planner-hint">Nenhuma opção {stars} informada nesta busca; mostrando todas.</p>}
      <ul className="live-offers">{sortHotelOffers(shown, byId, sort).slice(0, 12).map(offer => <Offer trip={trip} offer={offer} property={byId.get(offer.propertyId)} key={`${offer.provider}${offer.offerId}`} />)}</ul>
      {warnings.map(warning => <p className="planner-hint" key={warning}>{warning}</p>)}
      <p className="planner-hint">Fonte: {providers.filter(provider => provider.status === 'ok').map(provider => provider.id).join(', ')}. Disponibilidade e preço confirmados só na reserva.</p>
    </>
  );
}

function Offer({ trip, offer, property }) {
  const attached = attachedHotels(trip).some(line => line.source.provider === offer.provider && line.source.offerId === offer.offerId);
  const expired = isHotelOfferExpired(offer);
  const { amount, currency } = offer.price.total;
  const total = Number(amount);
  const converted = currency === 'BRL' ? null : convertToBRL(total, currency, rates());
  const name = property?.name ?? 'Hospedagem';
  const facts = [
    offer.room?.name,
    offer.board ? BOARD_LABELS[offer.board] : null,
    offer.cancellation?.refundable === true ? 'Cancelamento grátis' : offer.cancellation?.refundable === false ? 'Não reembolsável' : null
  ].filter(Boolean);
  const price = [
    `${offer.nights} ${offer.nights === 1 ? 'noite' : 'noites'}`,
    offer.price.perNight ? `${formatMoney(Number(offer.price.perNight.amount), offer.price.perNight.currency)}/noite` : null,
    converted ? `≈ ${formatBRL(converted.amountBRL)}` : null,
    offer.price.taxesIncluded === true ? 'taxas incluídas' : null
  ].filter(Boolean).join(' · ');
  const attach = () => {
    if (attached || isHotelOfferExpired(offer)) return;
    tripStore.save(addLine(trip, hotelOfferLine(offer, property, rates())));
    announce('Hospedagem adicionada à viagem.');
  };
  return (
    <li className={`live-offer${expired ? ' live-offer--expired' : ''}`}>
      <div className="live-offer__head">
        <span className="live-hotel__name"><strong>{name}</strong>{property?.rating?.stars && <small role="img" aria-label={`${property.rating.stars} estrelas`}>{'★'.repeat(property.rating.stars)}</small>}</span>
        <span className="live-offer__price"><strong>{formatMoney(total, currency)}</strong><small>{price}</small></span>
      </div>
      {facts.length > 0 && <p className="live-hotel__facts">{facts.join(' · ')}</p>}
      <div className="live-offer__foot">
        <Provenance kind={offer.dataSource === 'live' ? 'live' : offer.dataSource === 'cached' ? 'cached' : 'test'} tag="span" detail={expired ? 'preço expirado: busque de novo' : `consultado às ${clock(offer.searchedAt)}`} />
        <div className="live-offer__actions">
          <button className={attached ? 'secondary-button' : 'primary-button'} type="button" disabled={attached || expired} onClick={attach}>{attached ? 'Na viagem ✓' : 'Adicionar à viagem'}<span className="sr-only">: {name}</span></button>
          {offer.reservationUrl && !expired && <ExternalLink className="secondary-button" href={offer.reservationUrl} sponsored>Reservar ↗</ExternalLink>}
        </div>
      </div>
    </li>
  );
}
