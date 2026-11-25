// Etapa 5: regras de entrada e checklist. O checklist é salvo dentro da viagem
// (trip.checklist): marcar numa viagem não muda nenhuma outra.
import { COUNTRIES } from '../../../js/countries.dataset.js';
import { checklistGroups, checklistProgress } from '../../../js/checklist.engine.js';
import { entryPresentation } from '../../../js/entry.presentation.js';
import { setChecklistItems, tripMonth } from '../../../js/planner/trip.model.js';
import { tripStore } from '../../state/services.js';
import { announce } from '../../state/focus.js';
import { ExternalLink, Provenance } from '../../components/ui.jsx';
import { MONTH_NAMES } from '../labels.js';
import { save } from '../Wizard.jsx';
import { PartnerEsim } from '../sections/Partners.jsx';

export function PrepStep({ trip }) {
  const country = COUNTRIES[trip.countryKey];
  return (
    <>
      <div id="planner-prep">
        <h4 className="planner-block-title">Documentos e entrada</h4>
        <div className="planner-card" id="planner-prep-entry"><Entry country={country} /></div>
        <label className="planner-confirm">
          <input type="checkbox" checked={trip.entryReviewed} onChange={event => save(trip, { entryReviewed: event.target.checked })} />
          <span>
            <strong>Conferi as regras de entrada e meus documentos</strong>
            <span className="planner-hint">Passaporte válido, visto ou autorização eletrônica, vacinas e seguro, conforme a fonte oficial.</span>
          </span>
        </label>
        <h4 className="planner-block-title">Checklist desta viagem</h4>
        <div className="planner-card" id="planner-prep-checklist"><Checklist trip={trip} country={country} /></div>
      </div>
      <PartnerEsim />
    </>
  );
}

function Entry({ country }) {
  const entry = entryPresentation(country);
  const official = entry.sources.find(([label]) => label === 'Fonte oficial de entrada')?.[1];
  const domestic = country.visaPolicyBR?.eligibility === 'domestic';
  return (
    <>
      <div className="planner-prep__row">
        <div>
          <strong className={`planner-prep__status planner-prep__status--${entry.status.tone}`}>{entry.status.title}</strong>
          <span className="planner-hint">{entry.status.detail}</span>
        </div>
      </div>
      {!domestic && (official && entry.verifiedAt
        ? <Provenance kind="verified" date={entry.verifiedAt} dateLabel="em" source={official} sourceText="Fonte oficial" detail="confirme antes de comprar a passagem" />
        : <Provenance kind="unverified" detail="regra ainda sem fonte oficial verificada; confirme no consulado" />)}
      <details className="planner-prep__details">
        <summary>Ver regras completas</summary>
        <EntryDetails view={entry} />
      </details>
    </>
  );
}

// Regras de entrada para passaporte brasileiro, com fonte e data de verificação.
function EntryDetails({ view }) {
  const verified = /^\d{4}-\d{2}$/.test(view.verifiedAt || '') ? `${view.verifiedAt.slice(5)}/${view.verifiedAt.slice(0, 4)}` : null;
  return (
    <div className="stack entry-details">
      <article className={`detail-card detail-card--${view.status.tone}`}>
        <div className="detail-card__label">Status de entrada</div>
        <div className="detail-card__value"><strong className="entry-status__title">{view.status.title}</strong><span>{view.status.detail}</span></div>
      </article>
      <article className="detail-card"><div className="detail-card__label">Permanência</div><div className="detail-card__value">{view.stay}</div></article>
      <article className="detail-card">
        <div className="detail-card__label">Antes de viajar</div>
        {view.preparation.length
          ? <ul className="entry-list">{view.preparation.map(([label, value]) => <li key={label}><strong>{label}:</strong> {value}</li>)}</ul>
          : <div className="detail-card__value">Confirme os documentos exigidos para seu roteiro antes da viagem.</div>}
      </article>
      {view.notes.length > 0 && <article className="detail-card"><div className="detail-card__label">Atenção</div><ul className="entry-list">{view.notes.map(note => <li key={note}>{note}</li>)}</ul></article>}
      {(verified || view.sources.length > 0) && (
        <p className="entry-source">
          {verified && `Verificado em ${verified}`}{verified && view.sources.length > 0 && ' · '}
          {view.sources.map(([label, url], index) => <span key={url + label}>{index > 0 && ' · '}<ExternalLink href={url}>{label}</ExternalLink></span>)}
        </p>
      )}
      <p className="entry-reminder">Regras para passaporte brasileiro comum. Outras nacionalidades ou dupla cidadania têm regras próprias. Regras de entrada e saúde podem mudar: confirme-as antes de viajar.</p>
    </div>
  );
}

function Checklist({ trip, country }) {
  const month = tripMonth(trip);
  const groups = checklistGroups(trip.countryKey, country, month ?? new Date().getMonth());
  if (!groups.length) return <p className="planner-hint">Ainda não há checklist para este destino.</p>;
  const { done, total } = checklistProgress(groups, trip.checklist);
  const keys = groups.flatMap(group => group.items.map(item => item.key));
  const set = (list, value) => tripStore.save(setChecklistItems(trip, list, value));
  const toggle = item => {
    const value = !trip.checklist[item.key];
    set([item.key], value);
    announce(`${done + (value ? 1 : -1)} de ${total} itens concluídos.`);
  };
  return (
    <>
      <div className="planner-prep__row">
        <div>
          <strong>{done} de {total} {total === 1 ? 'item concluído' : 'itens concluídos'}</strong>
          <span className="planner-hint">{month === null ? 'Defina o mês ou a data de ida para incluir dicas da época.' : `Inclui dicas para ${MONTH_NAMES[month]}, mês da ida.`}</span>
        </div>
      </div>
      <div className="planner-meter planner-meter--success" role="progressbar" aria-label="Checklist da viagem" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <span style={{ width: `${(total ? done / total * 100 : 0).toFixed(1)}%` }} />
      </div>
      <div className="checklist planner-checklist">
        {groups.map(group => (
          <section className="checklist__group" key={group.group} aria-label={group.group}>
            <h5 className="checklist__title">{group.group}</h5>
            {group.items.map(item => {
              const complete = Boolean(trip.checklist[item.key]);
              return (
                <button className={`checklist__item ${complete ? 'checklist__item--complete' : ''}`} type="button" role="checkbox" aria-checked={complete} key={item.key} onClick={() => toggle(item)}>
                  <span className="checklist__box" aria-hidden="true">{complete ? '✓' : ''}</span>
                  <span aria-hidden="true">{item.icon || '•'}</span>
                  <span className="checklist__label">{item.label}</span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
      <div className="checklist__actions">
        <button className="secondary-button" type="button" onClick={() => { set(keys, true); announce('Todos os itens marcados.'); }}>Marcar tudo</button>
        <button className="secondary-button" type="button" onClick={() => { set(keys, false); announce('Todos os itens desmarcados.'); }}>Limpar</button>
      </div>
    </>
  );
}
