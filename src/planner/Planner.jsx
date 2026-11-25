// Planejador: lista de viagens, confirmação de uma viagem nova e o passo a passo
// de seis etapas. As viagens ficam no navegador (trip.store); nada sai do aparelho.
import { useEffect, useRef, useState } from 'react';
import { COUNTRIES } from '../../js/countries.dataset.js';
import { PLANNER_STEPS, TRAVEL_STYLES, tripProgress, tripStatus, updateTrip } from '../../js/planner/trip.model.js';
import { app, useApp, useExternal } from '../state/store.js';
import { tripStore } from '../state/services.js';
import { importSharedTrip, newTrip } from '../state/actions.js';
import { announce, focusSoon } from '../state/focus.js';
import { Flag } from '../components/ui.jsx';
import { Wizard, Stepper, STEP_LEADS } from './Wizard.jsx';
import { DestinationPicker } from './DestinationPicker.jsx';
import { people, tripName, whenLabel } from './labels.js';

const STATUS = { ongoing: 'Em andamento', completed: 'Concluída' };
const UNDO_MS = 8000;

export const setView = (view, draft = null) => app.set({ planner: { view, draft } });

/** Abre uma viagem no passo a passo. */
export function openTrip(id, step = null) {
  tripStore.setActive(id);
  if (step) tripStore.save(updateTrip(tripStore.active(), { step }));
  setView('trip');
  focusSoon('#wizard-title');
}

export default function Planner() {
  const { view, draft } = useApp(state => state.planner);
  const trips = useExternal(tripStore, () => tripStore.trips);
  const trip = useExternal(tripStore, () => tripStore.active());
  const open = useApp(state => state.hub === 'planner');
  const [deleting, setDeleting] = useState(null);
  const [undo, setUndo] = useState(null);
  const undoTimer = useRef(0);

  useEffect(() => () => clearTimeout(undoTimer.current), []);
  // Fechar o painel cancela uma exclusão pendente.
  useEffect(() => { if (!open) setDeleting(null); }, [open]);

  const confirmDelete = () => {
    const target = tripStore.get(deleting);
    setDeleting(null);
    if (!target) return;
    const removed = tripStore.remove(target.id);
    clearTimeout(undoTimer.current);
    if (removed) {
      setUndo({ removed, label: tripName(target) });
      undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
    }
    setView('home');
    focusSoon('[data-planner-undo]');
  };

  const restore = () => {
    const restored = tripStore.restore(undo.removed);
    clearTimeout(undoTimer.current);
    setUndo(null);
    if (restored) {
      announce(`Viagem para ${tripName(restored)} recuperada.`);
      focusSoon(`[data-planner-menu="${CSS.escape(restored.id)}"]`);
    }
  };

  // null = primeira abertura: vai direto à viagem ativa, se houver.
  let current = view ?? (trips.length ? 'trip' : 'home');
  if (current === 'trip' && !trip) current = 'home';
  if (current === 'draft' && !draft) current = 'home';

  return (
    <>
      {current === 'new' && <NewTrip hasTrips={trips.length > 0} />}
      {current === 'draft' && <Draft draft={draft} trips={trips} />}
      {current === 'trip' && <Wizard trip={trip} key={trip.id} onDelete={() => setDeleting(trip.id)} />}
      {current === 'home' && (trips.length ? <Home trips={trips} onDelete={setDeleting} /> : <Welcome />)}
      {deleting && tripStore.get(deleting) && <DeleteDialog trip={tripStore.get(deleting)} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} />}
      <div role="status" aria-live="polite">
        {undo && (
          <div className="planner-toast">
            <span>Viagem para {undo.label} excluída.</span>
            <button className="planner-text-action" type="button" data-planner-undo onClick={restore}>Desfazer</button>
          </div>
        )}
      </div>
    </>
  );
}

const startNew = () => {
  setView('new');
  focusSoon('#planner-destination-search');
};

export function SavedNote() {
  const privacy = <a href="privacidade.html" target="_blank" rel="noopener">Privacidade<span className="sr-only"> (abre em nova aba)</span></a>;
  return tripStore.persistent
    ? <p className="planner-saved">Salvo neste navegador. Limpar os dados do navegador apaga as viagens. {privacy}</p>
    : <p className="planner-saved planner-saved--warning" role="status">Este navegador não permite salvar. As viagens ficam disponíveis só até fechar a página. {privacy}</p>;
}

// ---------- Primeira vez ----------

function Welcome() {
  return (
    <div className="planner-welcome">
      <h3 className="planner-welcome__title">Planeje sua próxima viagem</h3>
      <p className="planner-welcome__lead">Seis etapas rápidas, só tocando nas opções. Tudo fica salvo neste navegador.</p>
      <ol className="planner-welcome__steps">
        {PLANNER_STEPS.map((step, index) => <li key={step.id}><span aria-hidden="true">{index + 1}</span><div><strong>{step.label}</strong></div></li>)}
      </ol>
      <button className="primary-button planner-welcome__cta" type="button" onClick={startNew}>Começar a planejar</button>
    </div>
  );
}

// ---------- Lista de viagens ----------

function Home({ trips, onDelete }) {
  const [status, setStatus] = useState('');

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(tripStore.exportData(), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `traveling-viagens-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setStatus('Backup baixado. Guarde o arquivo; para recuperar, use "Importar backup" em qualquer navegador.');
  };

  const importBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        if (file.size > 2_000_000) throw new Error('grande demais');
        const count = tripStore.importData(JSON.parse(await file.text()));
        setStatus(count ? `${count} ${count === 1 ? 'viagem importada' : 'viagens importadas'}.` : 'Nenhuma viagem nova nesse arquivo.');
      } catch {
        setStatus('Não foi possível ler esse arquivo. Use um backup baixado pelo Traveling.');
      }
    });
    input.click();
  };

  return (
    <div className="planner-home">
      <div className="planner-home__head">
        <h3 className="planner-home__title">Suas viagens</h3>
        <button className="primary-button" type="button" data-planner-action="new" onClick={startNew}><span aria-hidden="true">＋ </span>Nova viagem</button>
      </div>
      <ul className="planner-trip-list">{trips.map(trip => <TripItem trip={trip} key={trip.id} onDelete={onDelete} />)}</ul>
      <div className="planner-backup">
        <button className="planner-text-action" type="button" onClick={exportBackup}>Baixar backup das viagens</button>
        <button className="planner-text-action" type="button" onClick={importBackup}>Importar backup</button>
      </div>
      <p className="planner-hint" role="status" aria-live="polite">{status}</p>
      <SavedNote />
    </div>
  );
}

function TripItem({ trip, onDelete }) {
  const country = COUNTRIES[trip.countryKey];
  const progress = tripProgress(trip);
  const status = STATUS[tripStatus(trip)];
  return (
    <li className="planner-trip-item">
      <button className="planner-trip-card" type="button" data-planner-open={trip.id} onClick={() => openTrip(trip.id)}>
        <Flag country={country} className="planner-trip-card__flag" />
        <span className="planner-trip-card__body">
          <strong>{tripName(trip)}</strong>
          <small>{whenLabel(trip)} · {people(trip.travelers)}{status && <> · <span className="planner-status">{status}</span></>}</small>
          <span className="planner-progress" aria-hidden="true"><span style={{ width: `${(progress.completed / progress.total * 100).toFixed(0)}%` }} /></span>
        </span>
        <span className="planner-trip-card__side">
          <strong>{trip.style ? TRAVEL_STYLES[trip.style] : '—'}</strong>
          <small>{progress.next ? `Etapa ${progress.next}: ${PLANNER_STEPS[progress.next - 1].label}` : 'Pronta ✓'}</small>
        </span>
      </button>
      <TripMenu trip={trip} onDelete={onDelete} />
    </li>
  );
}

// Menu ⋯ (padrão ARIA "menu button"): setas percorrem, Esc fecha e volta ao botão.
function TripMenu({ trip, onDelete }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const toggle = useRef(null);
  const items = () => [...root.current.querySelectorAll('[role="menuitem"]')];

  useEffect(() => {
    if (!open) return undefined;
    items()[0]?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  const close = () => {
    setOpen(false);
    toggle.current?.focus();
  };

  const onKeyDown = event => {
    if (!open) return;
    const list = items();
    const index = list.indexOf(document.activeElement);
    const next = { ArrowDown: (index + 1) % list.length, ArrowUp: (index - 1 + list.length) % list.length, Home: 0, End: list.length - 1 }[event.key];
    if (next !== undefined) {
      event.preventDefault();
      list[next].focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') setOpen(false);
  };

  const duplicate = () => {
    setOpen(false);
    const copy = tripStore.duplicate(trip.id);
    if (!copy) return;
    announce(`Viagem para ${tripName(trip)} duplicada.`);
    focusSoon(`[data-planner-menu="${CSS.escape(copy.id)}"]`);
  };

  const label = `Opções da viagem para ${tripName(trip)}`;
  return (
    <div className="planner-trip-menu" ref={root} onKeyDown={onKeyDown}>
      <button className="icon-button planner-trip-menu__toggle" type="button" ref={toggle} data-planner-menu={trip.id} aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen(!open)}>⋯</button>
      {open && (
        <div className="planner-trip-menu__list" role="menu" aria-label={label}>
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => openTrip(trip.id, 1)}>Editar</button>
          <button type="button" role="menuitem" tabIndex={-1} onClick={duplicate}>Duplicar</button>
          <button type="button" role="menuitem" tabIndex={-1} className="planner-trip-menu__danger" onClick={() => { close(); onDelete(trip.id); }}>Excluir</button>
        </div>
      )}
    </div>
  );
}

// ---------- Viagem nova ----------

function BackToTrips() {
  return <button className="planner-back" type="button" data-planner-action="home" onClick={() => { setView('home'); focusSoon('[data-planner-action="new"]'); }}>← Suas viagens</button>;
}

function NewTrip({ hasTrips }) {
  const pick = countryKey => {
    const existing = tripStore.findByCountry(countryKey);
    if (existing) tripStore.setActive(existing.id);
    else tripStore.save(newTrip(countryKey));
    setView('trip');
    focusSoon('#wizard-title');
  };
  return (
    <div className="wizard">
      {hasTrips && <BackToTrips />}
      <Stepper trip={null} current={1} />
      <section className="wizard__step" aria-labelledby="wizard-title">
        <span className="eyebrow">Etapa 1 de {PLANNER_STEPS.length}</span>
        <h3 className="wizard__title" id="wizard-title" tabIndex={-1}>{PLANNER_STEPS[0].title}</h3>
        <p className="wizard__lead">{STEP_LEADS.destination}</p>
        <DestinationPicker onPick={pick} />
      </section>
    </div>
  );
}

// "Planejar viagem" vindo do país, de uma cidade ou do Descobrir: mostra o
// destino e só cria a viagem quando a pessoa confirma.
function Draft({ draft, trips }) {
  const { countryKey, city, profileId, budgetBRL, shared = null } = draft;
  const country = COUNTRIES[countryKey];
  const existing = trips.filter(trip => trip.countryKey === countryKey);
  const create = () => {
    // País e cidade escolhidos: começa nas datas. Só o país: começa na cidade.
    if (shared) {
      if (!importSharedTrip(shared)) return announce('Não foi possível adicionar: o limite de viagens foi atingido.');
    } else tripStore.save(newTrip(countryKey, { city, profileId, budgetBRL, step: city ? 2 : 1 }));
    setView('trip');
    return focusSoon('#wizard-title');
  };
  return (
    <div className="wizard planner-draft">
      {trips.length > 0 && <BackToTrips />}
      <section className="wizard__step" aria-labelledby="wizard-title">
        <span className="eyebrow">{shared ? 'Viagem recebida por link' : 'Nova viagem'}</span>
        <h3 className="wizard__title" id="wizard-title" tabIndex={-1}>{shared ? 'Adicionar a viagem' : 'Planejar uma viagem'} para {city?.name || country.namePt}?</h3>
        <p className="wizard__lead">{shared ? 'Alguém compartilhou este roteiro com você. Ele' : 'A viagem'} só é {shared ? 'salvo neste navegador' : 'criada'} quando você confirmar. Depois dá para trocar destino, cidade e datas.</p>
        <div className="planner-destination-card">
          <Flag country={country} className="planner-destination-card__flag" />
          <div className="planner-destination-card__body">
            <span className="eyebrow">{country.region || 'Destino'}</span>
            <strong className="planner-destination-card__name">{country.namePt}</strong>
            {city && <small>Cidade: {[city.name, city.region].filter(Boolean).join(' · ')}</small>}
          </div>
        </div>
        {existing.length > 0 && (
          <div className="planner-card planner-card--quiet">
            <strong className="planner-card__title">Você já tem {existing.length === 1 ? 'uma viagem' : `${existing.length} viagens`} para {country.namePt}</strong>
            <ul className="planner-draft__existing">
              {existing.map(trip => <li key={trip.id}><button className="planner-text-action" type="button" onClick={() => openTrip(trip.id)}>Abrir {tripName(trip)} · {whenLabel(trip)}</button></li>)}
            </ul>
          </div>
        )}
        <div className="planner-actions">
          <button className="primary-button" type="button" data-planner-action="draft-create" onClick={create}>{shared ? 'Adicionar às minhas viagens' : existing.length ? 'Criar outra viagem' : 'Criar viagem'}</button>
          <button className="secondary-button" type="button" onClick={startNew}>Escolher outro destino</button>
        </div>
      </section>
    </div>
  );
}

// ---------- Excluir ----------

// Foco preso entre os dois botões; Esc e o fundo cancelam.
function DeleteDialog({ trip, onCancel, onConfirm }) {
  const cancel = useRef(null);
  const opener = useRef(document.activeElement);
  useEffect(() => { cancel.current?.focus(); }, []);
  const dismiss = () => {
    onCancel();
    const target = opener.current;
    requestAnimationFrame(() => { if (target?.isConnected) target.focus(); });
  };
  const onKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
    } else if (event.key === 'Tab') {
      const buttons = [...event.currentTarget.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      event.preventDefault();
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
    }
  };
  return (
    <div className="planner-dialog" onKeyDown={onKeyDown} onClick={event => { if (event.target === event.currentTarget) dismiss(); }}>
      <div className="planner-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="planner-dialog-title" aria-describedby="planner-dialog-text">
        <h3 className="planner-dialog__title" id="planner-dialog-title">Excluir a viagem para {tripName(trip)}?</h3>
        <p className="planner-dialog__text" id="planner-dialog-text">A viagem e o planejamento dela, inclusive o checklist, saem deste navegador. As outras viagens não mudam.</p>
        <div className="planner-dialog__actions">
          <button className="secondary-button" type="button" ref={cancel} onClick={dismiss}>Cancelar</button>
          <button className="secondary-button planner-delete__confirm" type="button" onClick={onConfirm}>Excluir viagem</button>
        </div>
      </div>
    </div>
  );
}
