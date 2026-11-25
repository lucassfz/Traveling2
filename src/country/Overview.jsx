// Aba "Visão geral" do guia do país.
import { useEffect, useRef, useState } from 'react';
import { getCountryMedia } from '../../js/media.service.js';
import { brasiliaTimezoneNote } from '../../js/timezone.br.js';
import { localPerBrl } from '../../js/fx.service.js';
import { loadCities, searchCities, topCities } from '../../js/geo/cities.js';
import { summaryFor } from '../../js/summaries.js';
import { PARTNERS, klookUrl } from '../../js/planner/partners.js';
import { cheapestFlight } from '../../js/api/prices.client.js';
import { useApp, useExternal } from '../state/store.js';
import { savedStore } from '../state/services.js';
import { selectCity } from '../state/actions.js';
import { announce } from '../state/focus.js';
import { ExternalLink, Provenance, SaveButton, Summary } from '../components/ui.jsx';
import { PartnerNote } from '../components/PartnerNote.jsx';
import { useAsync, useSummaries } from '../hooks/useAsync.js';
import { Regions } from './Regions.jsx';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const SEASON = ['evitar', 'boa época', 'ótima época'];

export function Overview({ countryKey, country }) {
  const summaries = useSummaries();
  return (
    <>
      <div id="country-intro">{summaries && <Summary entry={summaryFor('countries', country.alpha2)} className="country-intro" />}</div>
      <Media countryKey={countryKey} country={country} />
      <Basics country={country} />
      <Regions countryKey={countryKey} country={country} />
      <Cities country={country} />
      <CurrencyConverter country={country} />
      <Season country={country} />
      <Partners country={country} />
    </>
  );
}

// ---------- Lugares em destaque ----------

function Media({ countryKey, country }) {
  const summaries = useSummaries();
  const { value: media } = useAsync(() => getCountryMedia(countryKey, country), [countryKey]);
  if (!media) return <div className="media-strip" id="country-media"><div className="media-empty">Carregando mídia…</div></div>;
  if (!media.length) return <div className="media-strip" id="country-media"><div className="media-empty">Imagem ainda não disponível para este destino.</div></div>;
  return (
    <div className="media-strip" id="country-media" role="group" aria-label="Lugares em destaque">
      {media.map((item, index) => <Landmark countryKey={countryKey} country={country} item={item} primary={index === 0} summary={summaries ? summaryFor('landmarks', item.wikidataId) : null} key={item.url} />)}
    </div>
  );
}

function Landmark({ countryKey, country, item, primary, summary }) {
  const [state, setState] = useState('loading');
  const id = `place:${item.wikidataId}`;
  const saved = useExternal(savedStore, () => savedStore.has(id));
  const toggle = () => {
    const now = savedStore.toggle({
      id, type: 'place', countryKey, name: item.name, context: `${item.city} · ${country.namePt}`, placeId: item.wikidataId,
      ...(Array.isArray(item.coordinates) ? { lat: item.coordinates[0], lng: item.coordinates[1] } : {}),
      ...(item.url ? { image: item.url } : {})
    });
    announce(now ? `${item.name} salvo.` : `${item.name} removido dos salvos.`);
  };
  return (
    <figure className={`media-card${primary ? ' media-card--primary' : ''}${state === 'loaded' ? ' media-card--loaded' : state === 'failed' ? ' media-card--failed' : ''}`} aria-busy={state === 'loading'}>
      <div className="media-card__visual">
        {state !== 'failed' && <img className="media-card__image" src={item.url} loading={primary ? 'eager' : 'lazy'} alt={`${item.name} em ${item.city}`} decoding="async" onLoad={() => setState('loaded')} onError={() => setState('failed')} />}
      </div>
      <figcaption className="media-card__city">
        <span className="media-card__title"><strong>{item.name}</strong>{item.wikidataId && <SaveButton className="save-toggle save-toggle--small" saved={saved} name={item.name} onToggle={toggle} />}</span>
        <span>{item.city}</span>
        <Summary entry={summary} className="media-card__about" />
        <ExternalLink href={item.sourcePage}>Foto: {item.author} · {item.license}<span className="sr-only">, crédito da imagem de {item.name}</span></ExternalLink>
      </figcaption>
    </figure>
  );
}

// ---------- Dados básicos ----------

function Basics({ country }) {
  // Só dados que ajudam a decidir a viagem; o fuso, com nota, ocupa a linha toda.
  const cards = [
    ['Capital', country.capital || '—'],
    ['Moeda', country.currency || '—'],
    ['Idioma', country.lang || '—'],
    ['Voltagem', country.voltage || 'Confirmar'],
    ['Fuso', country.timezoneLabel || '—', brasiliaTimezoneNote(country)]
  ];
  return (
    <dl className="info-grid" id="country-basics">
      {cards.map(([label, value, note]) => (
        <div className={`info-card${label === 'Fuso' ? ' info-card--wide' : ''}`} key={label}>
          <dt className="info-card__label">{label}</dt>
          <dd className="info-card__value">{value}</dd>
          {note && <dd className="info-card__note">{note}</dd>}
        </div>
      ))}
    </dl>
  );
}

// ---------- Cidades (a alternativa em lista às cidades do globo) ----------

function Cities({ country }) {
  const [query, setQuery] = useState('');
  const { value: cities, error } = useAsync(() => loadCities(country.alpha2), [country.alpha2]);
  if (error || !cities?.length) return null;
  const list = query.trim().length >= 2 ? searchCities(cities, query, 12) : topCities(cities, 8);
  return (
    <section className="content-section geo-nav" id="country-cities" aria-labelledby="country-cities-title">
      <h3 className="section-heading" id="country-cities-title">Cidades no globo</h3>
      <label className="sr-only" htmlFor="country-city-search">Buscar cidade em {country.namePt}</label>
      <input className="form-field__control" id="country-city-search" type="search" placeholder="Buscar cidade…" autoComplete="off" spellCheck={false} value={query} onChange={event => setQuery(event.target.value)} />
      <p className="sr-only" role="status">{query.trim().length >= 2 ? `${list.length} cidades encontradas.` : ''}</p>
      <div className="geo-nav__chips">
        {list.map(city => (
          <button className="geo-nav__chip" type="button" key={city.id} onClick={() => selectCity(city, { fly: true })}>{city.name}{city.rank === 0 && <span>Capital</span>}</button>
        ))}
      </div>
      {!list.length && <p className="geo-nav__note">Nenhuma cidade encontrada.</p>}
    </section>
  );
}

// ---------- Conversor ----------

function formatAmount(amount, code, symbol) {
  const value = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code || 'USD', maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
  } catch {
    return `${symbol || ''} ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`.trim();
  }
}

function parseAmount(value) {
  const source = String(value ?? '').trim();
  const amount = Number(source.includes(',') && source.includes('.') ? source.replace(/\./g, '').replace(',', '.') : source.replace(',', '.'));
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function CurrencyConverter({ country }) {
  const [amount, setAmount] = useState('100');
  const snapshot = useApp(state => state.fxSnapshot);
  const converter = country.currencyConverter;
  // Preferência: boletim de fechamento do BCB; a taxa editorial do dataset só
  // aparece se o boletim ainda não carregou ou não tem a moeda.
  const official = localPerBrl(snapshot, converter?.targetCode);
  if (!converter || !(official || Number.isFinite(converter.brlExchangeRate))) return null;
  const rate = official ?? converter.brlExchangeRate;
  const { targetCode: code, targetSymbol: symbol } = converter;
  const source = official
    ? { label: 'Cotação de fechamento (BCB)', date: snapshot.date, detail: 'taxa de venda; não inclui spread, IOF ou tarifas', source: snapshot.sourceUrl }
    : { label: 'Taxa de referência', date: converter.rateAsOf, detail: 'não inclui spread, IOF ou tarifas', source: converter.source };
  return (
    <div id="currency-converter">
      <section className="currency-converter-card" aria-labelledby="currency-title">
        <header className="currency-converter-card__header">
          <div>
            <h3 className="currency-converter-card__title" id="currency-title">Conversor de referência</h3>
            <p className="currency-converter-card__rate">1 BRL = {formatAmount(rate, code, symbol)}</p>
          </div>
          <span className="currency-converter-card__badge">BRL ↔ {code || 'local'}</span>
        </header>
        <div className="currency-converter-card__fields">
          <label className="currency-converter-card__field" htmlFor="currency-input">
            <span>Valor em BRL</span>
            <input className="currency-converter-card__input" id="currency-input" type="text" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} />
          </label>
          <span className="currency-converter-card__arrow" aria-hidden="true">→</span>
          <div className="currency-converter-card__field">
            <span>Estimativa local</span>
            <output className="currency-converter-card__output" htmlFor="currency-input">{formatAmount(parseAmount(amount) * rate, code, symbol)}</output>
          </div>
        </div>
        <Provenance kind="verified" sourceText="Ver fonte" className="currency-converter-card__note" {...source} />
      </section>
    </div>
  );
}

// ---------- Melhor época ----------

function Season({ country }) {
  const values = country.months?.length === 12 ? country.months : Array(12).fill(1);
  return (
    <section className="content-section" aria-labelledby="season-title">
      <h3 className="section-heading" id="season-title">Melhor época</h3>
      <ul className="month-chart" id="month-chart">
        {values.map((score, index) => (
          <li className="month-chart__month" key={MONTHS[index]} title={`${MONTHS[index]}: ${SEASON[score] ?? 'boa época'}`}>
            <div className={`month-chart__bar${score === 2 ? ' month-chart__bar--great' : score === 1 ? ' month-chart__bar--good' : ''}`} aria-hidden="true" />
            <span aria-hidden="true">{MONTHS[index][0]}</span>
            <span className="sr-only">{MONTHS[index]}: {SEASON[score] ?? 'boa época'}</span>
          </li>
        ))}
      </ul>
      <p className="body-copy" id="best-time-copy">{country.bestTime || 'Consulte clima e sazonalidade antes da reserva.'}</p>
    </section>
  );
}

// ---------- Parceiros ----------

/** Próximo mês, no formato AAAA-MM. */
export function nextMonth(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

export const wholeReais = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

/** Passagem São Paulo → país vista recentemente, ida e volta no próximo mês. */
export function recentFare(country) {
  if (!country.airport || country.airport === 'GRU') return Promise.resolve(null);
  return cheapestFlight({ origin: 'GRU', destination: country.airport, departure: nextMonth(), return: nextMonth() });
}

function Partners({ country }) {
  const { value: offer } = useAsync(() => recentFare(country), [country.key]);
  const root = useRef(null);
  return (
    <section className="content-section country-partners" id="country-partners" aria-labelledby="partners-title" ref={root}>
      <h3 className="section-heading" id="partners-title">Planeje com parceiros</h3>
      {offer && (
        <p className="partner-price">
          Passagem São Paulo → {country.namePt}: <strong>a partir de {wholeReais(Number(offer.price.amount))}</strong> ida e volta em {new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(offer.departureAt ?? Date.now()))}, por pessoa.{' '}
          <Provenance kind="cached" tag="span" detail="visto por outros viajantes; pode ter mudado" />{' '}
          <ExternalLink href={offer.url} sponsored>Ver no Aviasales ↗</ExternalLink>
        </p>
      )}
      <div className="partner-links">
        <ExternalLink className="partner-link" href={PARTNERS.aviasales.home} sponsored>Comparar passagens no Aviasales ↗</ExternalLink>
        <ExternalLink className="partner-link" href={klookUrl(country.namePt)} sponsored>Passeios em {country.namePt} no Klook ↗</ExternalLink>
        <ExternalLink className="partner-link" href={PARTNERS.yesim.home} sponsored>eSIM no Yesim ↗</ExternalLink>
      </div>
      <PartnerNote />
    </section>
  );
}
