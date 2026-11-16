// "Adicionar ao roteiro" (Fase 4.4/4.5): de uma cidade, região ou lugar para um
// dia de uma viagem. Diálogo nativo (<dialog>, modal: foco preso, Esc fecha).
// Salvar nunca cria viagem; aqui a viagem só é criada se a pessoa tocar em
// "Criar viagem para …", e só para o país do destino.
import { escapeHtml } from '../core/html.js';
import { createTrip, tripDays, updateTrip } from './trip.model.js';
import { addItineraryItem, itineraryByDay } from './itinerary.model.js';
import { dayLabel } from './itinerary.section.js';

/**
 * @param {object} deps
 * @param {object} deps.store       trip.store.js
 * @param {object} deps.countries
 * @param {(tripId: string) => void} deps.onOpenTrip  Abre o roteiro da viagem no Planner.
 */
export function createItineraryAdder({ store, countries, onOpenTrip }) {
  let dialog = null;
  let entry = null;
  let returnFocus = null;

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'itinerary-add';
    dialog.setAttribute('aria-labelledby', 'itinerary-add-title');
    document.body.appendChild(dialog);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) return close();
      const action = event.target.closest('[data-add-action]')?.dataset.addAction;
      if (action === 'cancel') close();
      if (action === 'create') createAndAdd();
      if (action === 'open') {
        const id = event.target.closest('[data-add-action]').dataset.tripId;
        close();
        onOpenTrip(id);
      }
    });
    dialog.addEventListener('change', event => {
      if (event.target.matches('[data-add-trip]')) renderDays();
    });
    dialog.addEventListener('submit', event => {
      event.preventDefault();
      addToSelected();
    });
    // Esc fecha só o diálogo: não pode chegar aos atalhos do app (que fecham o
    // cartão da cidade de onde o diálogo foi aberto e levam o foco embora).
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') event.stopPropagation();
    });
    dialog.addEventListener('close', () => {
      returnFocus?.focus?.({ preventScroll: true });
      returnFocus = null;
    });
    return dialog;
  }

  const tripsFor = countryKey => store.trips.filter(trip => trip.countryKey === countryKey);
  const tripLabel = trip => {
    const when = trip.startDate ? new Date(`${trip.startDate}T00:00:00Z`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'sem data';
    return `${countries[trip.countryKey]?.namePt ?? trip.countryKey}${trip.city ? ` · ${trip.city.name}` : ''} · ${when}`;
  };

  function daysOptions(trip) {
    const days = itineraryByDay(trip, tripDays(trip));
    // Mais um dia além dos que existem, para começar um dia novo.
    const list = [...days, { day: days.length + 1, date: null, items: [] }];
    return list.map(day => `<option value="${day.day}">${escapeHtml(dayLabel(day))}${day.items.length ? ` (${day.items.length} ${day.items.length === 1 ? 'item' : 'itens'})` : ''}</option>`).join('');
  }

  function renderDays() {
    const trip = store.get(dialog.querySelector('[data-add-trip]')?.value);
    const select = dialog.querySelector('[data-add-day]');
    if (trip && select) select.innerHTML = daysOptions(trip);
  }

  function render(message = '') {
    const country = countries[entry.countryKey];
    const trips = tripsFor(entry.countryKey);
    const active = store.active();
    const preferred = trips.find(trip => trip.id === active?.id) ?? trips[0];
    dialog.innerHTML = `
      <form class="planner-dialog__box itinerary-add__box" method="dialog">
        <h3 class="planner-dialog__title" id="itinerary-add-title">Adicionar ${escapeHtml(entry.name)} ao roteiro</h3>
        ${trips.length ? `
          <label class="itinerary-add__field"><span>Viagem</span>
            <select data-add-trip>${trips.map(trip => `<option value="${escapeHtml(trip.id)}" ${trip === preferred ? 'selected' : ''}>${escapeHtml(tripLabel(trip))}</option>`).join('')}</select>
          </label>
          <label class="itinerary-add__field"><span>Dia</span>
            <select data-add-day>${daysOptions(preferred)}</select>
          </label>` : `
          <p class="planner-dialog__text">Você ainda não tem viagem para ${escapeHtml(country?.namePt ?? 'este país')}. Crie uma para montar o roteiro; ${escapeHtml(entry.name)} entra no dia 1.</p>`}
        <p class="planner-dialog__text itinerary-add__status" role="status" aria-live="polite">${message}</p>
        <div class="planner-dialog__actions">
          <button class="secondary-button" type="button" data-add-action="cancel">Cancelar</button>
          ${trips.length
            ? '<button class="primary-button" type="submit">Adicionar</button>'
            : `<button class="primary-button" type="button" data-add-action="create">Criar viagem para ${escapeHtml(country?.namePt ?? 'o país')}</button>`}
        </div>
      </form>`;
  }

  function done(trip, day) {
    dialog.innerHTML = `
      <div class="planner-dialog__box itinerary-add__box">
        <h3 class="planner-dialog__title" id="itinerary-add-title" tabindex="-1">${escapeHtml(entry.name)} está no dia ${day}</h3>
        <p class="planner-dialog__text">Viagem: ${escapeHtml(tripLabel(trip))}.</p>
        <div class="planner-dialog__actions">
          <button class="secondary-button" type="button" data-add-action="cancel">Fechar</button>
          <button class="primary-button" type="button" data-add-action="open" data-trip-id="${escapeHtml(trip.id)}">Ver roteiro</button>
        </div>
      </div>`;
    dialog.querySelector('#itinerary-add-title')?.focus();
  }

  function add(trip, day) {
    const result = addItineraryItem(trip.itinerary, { ...entry, day });
    if (!result.added) {
      render(result.reason === 'duplicate' ? `${escapeHtml(entry.name)} já está no dia ${day} desta viagem.` : 'Não foi possível adicionar ao roteiro.');
      dialog.querySelector('[data-add-day]')?.focus();
      return;
    }
    const saved = store.save(updateTrip(trip, { itinerary: result.items }));
    done(saved, day);
  }

  function addToSelected() {
    const trip = store.get(dialog.querySelector('[data-add-trip]')?.value);
    const day = Number(dialog.querySelector('[data-add-day]')?.value);
    if (trip && Number.isInteger(day)) add(trip, day);
  }

  function createAndAdd() {
    const city = entry.type === 'city' && entry.cityRef ? entry.cityRef : null;
    const trip = store.save(createTrip({ countryKey: entry.countryKey, city }));
    add(trip, 1);
  }

  function close() {
    if (dialog?.open) dialog.close();
  }

  return {
    /**
     * @param {object} item { type, ref, name, context?, countryKey, lat?, lng?, cityRef? }
     *   cityRef: a cidade (id, nome, coordenadas) para uma viagem nova, quando é cidade.
     */
    open(item, trigger = document.activeElement) {
      if (!item?.countryKey || !countries[item.countryKey] || !item.ref) return false;
      entry = item;
      returnFocus = trigger;
      ensureDialog();
      render();
      if (!dialog.open) dialog.showModal();
      dialog.querySelector('select, [data-add-action="create"]')?.focus();
      return true;
    },
    close
  };
}
