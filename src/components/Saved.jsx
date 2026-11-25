// Destinos salvos e comparação lado a lado.
import { useEffect, useState } from 'react';
import { COUNTRIES } from '../../js/countries.dataset.js';
import { MAX_COMPARE, compareRows } from '../../js/compare.js';
import { app, useApp, useExternal } from '../state/store.js';
import { savedStore } from '../state/services.js';
import { openSaved, planSaved } from '../state/actions.js';
import { announce, focusSoon } from '../state/focus.js';
import { ExternalLink, Flag } from './ui.jsx';
import { recentFare, wholeReais } from '../country/Overview.jsx';

const TYPES = { country: 'País', city: 'Cidade', place: 'Lugar' };

export function Saved() {
  const items = useExternal(savedStore, () => savedStore.items);
  const compare = useApp(state => state.compare);
  // Países salvos (sem repetir): com 2 ou mais, dá para comparar lado a lado.
  const keys = [...new Set(items.filter(item => item.type === 'country').map(item => item.countryKey))].filter(key => COUNTRIES[key]);
  if (compare.open && keys.length >= 2) return <div className="saved-list" id="saved-content"><Compare keys={keys} /></div>;

  if (!items.length) {
    return (
      <div className="saved-list" id="saved-content">
        <div className="saved-empty">
          <strong>Nada salvo ainda</strong>
          <p>Escolha "Salvar" num país, numa cidade ou num lugar em destaque para guardar aqui.</p>
        </div>
      </div>
    );
  }

  const remove = (item, index) => {
    savedStore.remove(item.id);
    announce(`${item.name} removido dos salvos.`);
    const next = items[index + 1] ?? items[index - 1];
    focusSoon(next ? `[data-saved-open="${CSS.escape(next.id)}"]` : '#saved-close-button');
  };

  return (
    <div className="saved-list" id="saved-content">
      {keys.length >= 2 && (
        <button className="primary-button saved-compare-button" type="button" onClick={() => { app.set({ compare: { open: true, keys: null } }); focusSoon('#compare-back'); }}>
          Comparar {keys.length >= 3 ? 'até 3 países' : 'os 2 países'} salvos
        </button>
      )}
      <ul className="saved-items">
        {items.map((item, index) => (
          <li className="saved-item" key={item.id}>
            {item.image ? <img className="saved-item__image" src={item.image} alt="" loading="lazy" decoding="async" /> : <Flag country={COUNTRIES[item.countryKey]} className="saved-item__flag" />}
            <div className="saved-item__body">
              <span className="eyebrow">{TYPES[item.type]}</span>
              <strong>{item.name}</strong>
              {item.context && <small>{item.context}</small>}
              <div className="saved-item__actions">
                <button className="secondary-button" type="button" data-saved-open={item.id} aria-label={`Abrir ${item.name}`} onClick={() => openSaved(item)}>Abrir</button>
                <button className="secondary-button" type="button" aria-label={`Planejar viagem para ${item.name}`} onClick={() => planSaved(item)}>Planejar viagem</button>
                <button className="planner-text-button" type="button" aria-label={`Remover ${item.name} dos salvos`} onClick={() => remove(item, index)}>Remover</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {savedStore.persistent
        ? <p className="planner-saved">Salvo neste navegador. Remover daqui não mexe nas suas viagens.</p>
        : <p className="planner-saved planner-saved--warning" role="status">Este navegador não permite salvar. A lista fica só até fechar a página.</p>}
    </div>
  );
}

function Compare({ keys }) {
  const chosen = useApp(state => state.compare.keys);
  const valid = (chosen ?? []).filter(key => keys.includes(key));
  const shown = valid.length >= 2 ? valid : keys.slice(0, MAX_COMPARE);
  const countries = shown.map(key => COUNTRIES[key]);
  const rows = compareRows(countries);

  const toggle = key => {
    const next = shown.includes(key) ? (shown.length > 2 ? shown.filter(item => item !== key) : shown) : [...shown, key].slice(-MAX_COMPARE);
    app.set({ compare: { open: true, keys: next } });
  };

  return (
    <>
      <button className="planner-text-action" id="compare-back" type="button" onClick={() => { app.set({ compare: { open: false, keys: null } }); focusSoon('.saved-compare-button'); }}>← Voltar à lista</button>
      {keys.length > 2 && (
        <div className="compare-pick" role="group" aria-label={`Países na comparação (até ${MAX_COMPARE})`}>
          {keys.map(key => <button className="discovery-chip" type="button" key={key} aria-pressed={shown.includes(key)} onClick={() => toggle(key)}>{COUNTRIES[key].namePt}</button>)}
        </div>
      )}
      <div className="compare-scroll" role="region" aria-label="Comparação de países" tabIndex={0}>
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Critério</span></th>
              {countries.map(country => <th scope="col" key={country.key}><Flag country={country} className="compare-table__flag" width={28} height={21} /><span>{country.namePt}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <th scope="row">{row.label}</th>
                {row.cells.map((cell, index) => (
                  <td className={cell.tone ? `compare--${cell.tone}` : undefined} key={countries[index].key}>
                    {row.id === 'flight' ? <FareCell country={countries[index]} /> : cell.text}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="planner-hint">Estimativas do Traveling e preços vistos recentemente por outros viajantes: confira antes de comprar. Visto: confirme na fonte oficial.</p>
    </>
  );
}

// Passagem vista recentemente (São Paulo → país, próximo mês), quando o backend responde.
function FareCell({ country }) {
  const [offer, setOffer] = useState(undefined);
  useEffect(() => {
    let current = true;
    recentFare(country).then(value => { if (current) setOffer(value); }).catch(() => { if (current) setOffer(null); });
    return () => { current = false; };
  }, [country]);
  if (offer === undefined) return <span aria-label="carregando">…</span>;
  if (!offer) return '—';
  return <>a partir de <strong>{wholeReais(Number(offer.price.amount))}</strong><br /><ExternalLink href={offer.url} sponsored>Ver no Aviasales ↗</ExternalLink></>;
}
