// Milhas: conversor (pontos → milhas → reais e "vale a pena?"), cartões e salas
// VIP. Tudo calcula enquanto a pessoa digita ou toca; nada é enviado para fora.
import { useEffect, useState } from 'react';
import { AIRPORT_GUIDES, CARD_OFFERS, MILES_TABS } from '../../js/miles.data.js';
import { cardMatches, filterLoungesByTerminal, findVerifiedLounges, loungeNetworks, parseBrazilianNumber, rankAirportMatches, verifiedRecord } from '../../js/miles.tools.js';
import { AWARD_PROGRAMS, MILHEIRO_REFERENCE_DATE } from '../../js/planner/planner.estimates.js';
import { app, useApp } from '../state/store.js';
import { airports } from '../state/services.js';
import { Indicator, Provenance, tabKeys } from './ui.jsx';

const money = (value, cents = false) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(value);
const number = value => Math.round(value).toLocaleString('pt-BR');
const programOf = id => AWARD_PROGRAMS.find(program => program.id === id) ?? AWARD_PROGRAMS[0];

const PROGRAMS = AWARD_PROGRAMS.map(program => [program.id, program.name]);
const RATIOS = [[1, '1 : 1'], [2, '2 : 1'], [3, '3 : 1']];
const BONUSES = [0, 30, 50, 80, 100].map(value => [value, value ? `+${value}%` : 'Sem bônus']);
const PRIORITIES = { points: 'Acumular pontos', lounges: 'Salas VIP', international: 'Viagens internacionais', nofee: 'Sem anuidade' };
const KEYS = MILES_TABS.map(tab => tab.key);

// Converte "80.000", "80000" ou "80 mil" em número inteiro positivo; null se inválido.
function readWhole(value) {
  const raw = String(value ?? '').trim().toLowerCase().replace(/\s*mil$/, '000').replace(/\s/g, '');
  if (!raw) return null;
  const parsed = parseBrazilianNumber(raw, { whole: true }) ?? parseBrazilianNumber(raw);
  return parsed !== null && parsed > 0 ? Math.round(parsed) : null;
}

function readMoney(value) {
  const parsed = parseBrazilianNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

export default function MilesHub() {
  const [tab, setTab] = useState(KEYS[0]);
  const request = useApp(state => state.milesRequest);

  // A rota no globo pede as salas de um aeroporto.
  useEffect(() => { if (request) setTab('lounges'); }, [request]);

  const select = key => {
    setTab(key);
    document.getElementById('miles-hub')?.scrollTo({ top: 0, behavior: 'auto' });
  };
  const panels = { convert: <Converter />, cards: <Cards />, lounges: <Lounges active={tab === 'lounges'} /> };

  return (
    <>
      <div className="miles-tabs has-indicator" id="miles-tabs" role="tablist" aria-label="Seções de Milhas e Aeroportos" onKeyDown={tabKeys(KEYS, tab, select)}>
        <Indicator active=".miles-tab--active" mode="underline" dependency={tab} />
        {MILES_TABS.map(item => (
          <button className={`miles-tab${item.key === tab ? ' miles-tab--active' : ''}`} key={item.key} id={`miles-tab-${item.key}`} type="button" role="tab" aria-controls={`miles-panel-${item.key}`}
            aria-selected={item.key === tab} tabIndex={item.key === tab ? 0 : -1} onClick={() => select(item.key)}>{item.label}</button>
        ))}
      </div>
      <div className="miles-hub__content" id="miles-content">
        {MILES_TABS.map(item => (
          <section className="miles-panel" key={item.key} id={`miles-panel-${item.key}`} role="tabpanel" aria-labelledby={`miles-tab-${item.key}`} tabIndex={0} hidden={item.key !== tab}>{panels[item.key]}</section>
        ))}
      </div>
    </>
  );
}

function Chips({ label, entries, value, onPick }) {
  return (
    <div className="miles-chips" role="group" aria-label={label}>
      {entries.map(([id, text]) => <button type="button" className="miles-chip" key={id} aria-pressed={id === value} onClick={() => onPick(id)}>{text}</button>)}
    </div>
  );
}

function Trust({ item }) {
  return verifiedRecord(item)
    ? <Provenance kind="verified" tag="span" className="miles-trust" date={item.verifiedAt} dateLabel="em" source={item.officialSource} sourceText="Fonte oficial" />
    : <Provenance kind="unverified" tag="span" className="miles-trust" detail="dados específicos ainda não confirmados" />;
}

// ---------- Conversor ----------

function Converter() {
  const [have, setHave] = useState('points');
  const [amountText, setAmountText] = useState('');
  const [program, setProgram] = useState(AWARD_PROGRAMS[0].id);
  const [ratio, setRatio] = useState(1);
  const [bonus, setBonus] = useState(0);
  const points = have === 'points';
  const amount = readWhole(amountText);
  const chosen = programOf(program);
  const miles = amount ? (points ? Math.floor(amount / ratio * (1 + bonus / 100)) : amount) : 0;

  return (
    <>
      <div className="miles-block">
        <h3 className="miles-block__title">Conversor de milhas</h3>
        <p className="miles-block__lead">Transforme pontos do cartão em milhas e veja quanto elas valem em reais.</p>
        <span className="miles-field-label">Você tem</span>
        <Chips label="Você tem" entries={[['points', 'Pontos do cartão'], ['miles', 'Milhas']]} value={have} onPick={setHave} />
        <label className="miles-field-label" htmlFor="miles-amount">Quantidade</label>
        <input className="miles-search miles-amount" id="miles-amount" inputMode="numeric" autoComplete="off" placeholder="Ex.: 50.000" value={amountText} onChange={event => setAmountText(event.target.value)} />
        <span className="miles-field-label">Programa de milhas</span>
        <Chips label="Programa de milhas" entries={PROGRAMS} value={program} onPick={setProgram} />
        <div className="miles-transfer" hidden={!points}>
          <span className="miles-field-label">Paridade <small>pontos para 1 milha</small></span>
          <Chips label="Paridade: pontos para 1 milha" entries={RATIOS} value={ratio} onPick={setRatio} />
          <span className="miles-field-label">Bônus da transferência</span>
          <Chips label="Bônus da transferência" entries={BONUSES} value={bonus} onPick={setBonus} />
        </div>
        <div className="miles-convert-result" id="miles-convert-result" aria-live="polite">
          {!amount ? <p className="miles-empty">Digite quantos pontos ou milhas você tem.</p> : (
            <>
              {points && <p className="miles-convert-result__from">{number(amount)} pontos{ratio > 1 ? ` ÷ ${ratio}` : ''}{bonus ? ` + ${bonus}% de bônus` : ''}</p>}
              <strong className="miles-convert-result__big">{number(miles)} milhas <small>{chosen.name}</small></strong>
              <p className="miles-convert-result__value">valem cerca de <strong>{money(miles / 1000 * chosen.milheiroBRL)}</strong></p>
              <Provenance kind="estimate" detail={`milheiro de referência de ${money(chosen.milheiroBRL)}; o valor real depende do resgate`} />
            </>
          )}
        </div>
      </div>
      <Worth />
      <p className="miles-footnote">Milheiro de referência Traveling ({MILHEIRO_REFERENCE_DATE}): {AWARD_PROGRAMS.map(item => `${item.name} ${money(item.milheiroBRL)}`).join(' · ')} por 1.000 milhas. É uma média de mercado, não cotação.</p>
    </>
  );
}

function Worth() {
  const [cashText, setCash] = useState('');
  const [milesText, setMiles] = useState('');
  const [feesText, setFees] = useState('');
  const [program, setProgram] = useState(AWARD_PROGRAMS[0].id);
  const cash = readMoney(cashText);
  const miles = readWhole(milesText);
  const fees = feesText.trim() ? readMoney(feesText) : 0;

  return (
    <div className="miles-block">
      <h3 className="miles-block__title">Vale a pena usar milhas?</h3>
      <p className="miles-block__lead">Compare a passagem em dinheiro com a mesma passagem em milhas.</p>
      <div className="miles-worth-grid">
        <label className="miles-field-label" htmlFor="miles-worth-cash">Preço em dinheiro (R$)<input className="miles-search" id="miles-worth-cash" inputMode="decimal" autoComplete="off" placeholder="4.200" value={cashText} onChange={event => setCash(event.target.value)} /></label>
        <label className="miles-field-label" htmlFor="miles-worth-miles">Milhas pedidas<input className="miles-search" id="miles-worth-miles" inputMode="numeric" autoComplete="off" placeholder="80.000" value={milesText} onChange={event => setMiles(event.target.value)} /></label>
        <label className="miles-field-label" htmlFor="miles-worth-fees">Taxas (R$)<input className="miles-search" id="miles-worth-fees" inputMode="decimal" autoComplete="off" placeholder="350" value={feesText} onChange={event => setFees(event.target.value)} /></label>
      </div>
      <span className="miles-field-label">Programa</span>
      <Chips label="Programa" entries={PROGRAMS} value={program} onPick={setProgram} />
      <div className="miles-convert-result" id="miles-worth-result" aria-live="polite"><WorthResult cash={cash} miles={miles} fees={fees} program={programOf(program)} /></div>
    </div>
  );
}

function WorthResult({ cash, miles, fees, program }) {
  if (!cash || !miles || fees === null) return <p className="miles-empty">Preencha o preço e as milhas para ver o resultado.</p>;
  if (fees >= cash) return <p className="miles-error">As taxas não podem ser maiores que o preço da passagem.</p>;
  const perThousand = (cash - fees) / miles * 1000;
  const good = perThousand > program.milheiroBRL;
  return (
    <>
      <strong className={`miles-verdict miles-verdict--${good ? 'good' : 'bad'}`}>{good ? 'Vale a pena usar milhas' : 'Melhor pagar em dinheiro'}</strong>
      <p>Cada 1.000 milhas rendem <strong>{money(perThousand, true)}</strong> nesta passagem. A referência da {program.name} é {money(program.milheiroBRL)}.</p>
      <p>Em milhas, a passagem custa o equivalente a <strong>{money(miles / 1000 * program.milheiroBRL + fees)}</strong> (milhas + taxas), contra <strong>{money(cash)}</strong> em dinheiro.</p>
      <Provenance kind="calculated" detail="com os valores que você digitou e o milheiro de referência" />
    </>
  );
}

// ---------- Cartões ----------

function Cards() {
  const [priority, setPriority] = useState('points');
  const preferences = priority === 'nofee'
    ? { values: ['simple'], fee: 'avoid', lounge: 'none', trips: '1-2', abroad: 'rare' }
    : { values: [priority], fee: 'conditional', lounge: priority === 'lounges' ? 'important' : 'none', trips: '3-5', abroad: priority === 'international' ? 'often' : 'sometimes' };
  const top = cardMatches(CARD_OFFERS, preferences).matches.slice(0, 3);
  return (
    <>
      <div className="miles-block">
        <h3 className="miles-block__title">Qual cartão combina com você?</h3>
        <p className="miles-block__lead">Toque no que é mais importante.</p>
        <Chips label="O que é mais importante" entries={Object.entries(PRIORITIES)} value={priority} onPick={setPriority} />
        <p className="sr-only" role="status">{top.length ? `${top.length} cartões: ${top.map(({ card }) => card.name).join(', ')}.` : ''}</p>
        <div id="miles-card-result" className="miles-card-list">
          {top.length ? top.map(({ card }) => (
            <article className="miles-card" key={card.id}>
              <div className="miles-card__head"><h4>{card.name}</h4><small>{card.issuer}</small></div>
              <dl className="miles-facts">
                {[['Pontos', card.earning], ['Salas VIP', card.loungeAccess], ['Anuidade', card.annualFee]].filter(([, value]) => value).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
              </dl>
              <Trust item={card} />
            </article>
          )) : <p className="miles-empty">Ainda não há cartões verificados para esta prioridade.</p>}
        </div>
      </div>
      <p className="miles-footnote">Benefícios e anuidades mudam. Confira as condições no emissor antes de pedir o cartão.</p>
    </>
  );
}

// ---------- Salas VIP ----------

const hasLounges = code => findVerifiedLounges(AIRPORT_GUIDES, code).length > 0;
const NETWORKS = loungeNetworks(AIRPORT_GUIDES);
const CARD_ONLY = AIRPORT_GUIDES.some(guide => guide.lounges?.some(lounge => verifiedRecord(lounge) && !lounge.networks?.length));
const KNOWN = AIRPORT_GUIDES.map(guide => guide.iata).filter(hasLounges);

function Lounges({ active }) {
  const [query, setQuery] = useState('');
  const [airport, setAirport] = useState(null);
  const [network, setNetwork] = useState('all');
  const [terminal, setTerminal] = useState('all');
  const [, setCatalog] = useState(0);
  const context = useApp(state => state.routeContext);
  const request = useApp(state => state.milesRequest);

  // Catálogo mundial de aeroportos, só quando a aba abre.
  useEffect(() => { if (active) airports.loadAll().then(() => setCatalog(value => value + 1)).catch(() => {}); }, [active]);

  const find = code => [context?.origin, context?.destination, ...airports.coreAirports].find(item => item?.iata === code)
    || airports.search(code, 1).find(item => item.iata === code) || null;

  const choose = item => {
    if (!item) return;
    setAirport(item);
    setQuery(item.iata);
    setNetwork('all');
    setTerminal('all');
  };

  useEffect(() => {
    if (!request?.code) return;
    choose(find(request.code));
    app.set({ milesRequest: null });
  }, [request]);

  const onRoute = [context?.origin, context?.destination].filter(item => item?.iata && hasLounges(item.iata));
  const choices = airport || !query ? [] : rankAirportMatches([...new Map([...airports.search(query, 50), ...airports.coreAirports]
    .filter(item => item.iata).map(item => [item.iata, item])).values()], query).slice(0, 6);
  const guide = AIRPORT_GUIDES.find(item => item.iata === airport?.iata && verifiedRecord(item));
  const terminals = guide?.terminals ?? [];

  return (
    <div className="miles-block">
      <h3 className="miles-block__title">Salas VIP</h3>
      <p className="miles-block__lead">Escolha o aeroporto de embarque.</p>
      {onRoute.length > 0 && (
        <div id="miles-route-context" className="miles-route-context">
          <strong>Na sua rota</strong>
          <div>{onRoute.map(item => <button type="button" key={item.iata} onClick={() => choose(item)}>Salas em {item.iata}</button>)}</div>
        </div>
      )}
      <Chips label="Aeroportos com salas verificadas" entries={KNOWN.map(code => [code, code])} value={airport?.iata} onPick={code => choose(find(code))} />
      <label className="miles-field-label" htmlFor="miles-lounge-search">Ou busque outro aeroporto</label>
      <input className="miles-search" id="miles-lounge-search" type="search" placeholder="GRU, Lisboa, JFK…" autoComplete="off" value={query} onChange={event => { setQuery(event.target.value); setAirport(null); setTerminal('all'); }} />
      <p className="sr-only" role="status">{choices.length ? `${choices.length} aeroportos encontrados.` : ''}</p>
      <div id="miles-lounge-airports" className="miles-airport-choices">
        {choices.map(item => <button type="button" key={item.iata} onClick={() => choose(item)}>{item.iata} · {item.city} — {item.name}</button>)}
      </div>
      <label className="miles-field-label" htmlFor="miles-lounge-network">Como você acessa salas?</label>
      <select className="miles-search" id="miles-lounge-network" value={network} onChange={event => setNetwork(event.target.value)}>
        <option value="all">Mostrar todas</option>
        {NETWORKS.map(name => <option value={name} key={name}>{name}</option>)}
        {CARD_ONLY && <option value="card">Outras formas</option>}
      </select>
      {terminals.length >= 2 && (
        <>
          <label className="miles-field-label" htmlFor="miles-lounge-terminal">Terminal</label>
          <select className="miles-search" id="miles-lounge-terminal" value={terminal} onChange={event => setTerminal(event.target.value)}>
            <option value="all">Todos os terminais</option>
            {terminals.map(name => <option value={name} key={name}>{name}</option>)}
          </select>
        </>
      )}
      <div id="miles-lounge-results" className="miles-airport-results" aria-live="polite">
        <LoungeResults airport={airport} network={network} terminal={terminal} onClear={() => { setNetwork('all'); setTerminal('all'); }} />
      </div>
    </div>
  );
}

function LoungeResults({ airport, network, terminal, onClear }) {
  if (!airport) return <p className="miles-empty">Escolha um aeroporto para ver as salas verificadas.</p>;
  const all = findVerifiedLounges(AIRPORT_GUIDES, airport.iata);
  const matches = filterLoungesByTerminal(findVerifiedLounges(AIRPORT_GUIDES, airport.iata, network), terminal);
  return (
    <>
      <h4>{airport.iata} · {airport.city}</h4>
      {!all.length ? <p className="miles-empty">Ainda não há sala verificada para este aeroporto.</p>
        : matches.length ? matches.map(lounge => (
          <article className="miles-card" key={`${lounge.name}${lounge.terminal}`}>
            <div className="miles-card__head"><h5>{lounge.name}</h5><small>{lounge.terminal}</small></div>
            <p>{lounge.eligibility}</p>
            <Trust item={lounge} />
          </article>
        )) : (
          <>
            <p className="miles-empty">Nenhuma sala verificada com este filtro.</p>
            <button className="miles-text-button" type="button" onClick={onClear}>Mostrar todas as salas de {airport.iata}</button>
          </>
        )}
    </>
  );
}
