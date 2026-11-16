// Roteiro por dia no Planner (Fase 4.5), na etapa Resumo. Os dados ficam em
// trip.itinerary (itinerary.model.js); esta seção só desenha e edita.
//
// Por dia: cidades, regiões, lugares e anotações, com horário, anotação,
// subir/descer, mover para outro dia, ver no globo e remover. Para adicionar:
// a cidade da viagem, os destinos salvos do mesmo país ou uma anotação livre.
// Sem preços: custos continuam no "Quanto vai custar".
import { escapeHtml } from '../core/html.js';
import { tripDays, updateTrip } from './trip.model.js';
import {
  addItineraryItem, itineraryByDay, moveItineraryItem, removeItineraryItem, updateItineraryItem, MAX_ITINERARY_DAYS
} from './itinerary.model.js';

const TYPE_LABELS = { city: 'Cidade', region: 'Região', place: 'Lugar', country: 'País', note: 'Anotação' };
const WEEKDAY = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Dia com data por extenso ("sáb., 20 de dez."), quando a viagem tem datas. */
export function dayLabel(day) {
  const date = day.date ? WEEKDAY.format(new Date(`${day.date}T00:00:00Z`)) : '';
  return `Dia ${day.day}${date ? ` · ${date}` : ''}`;
}

/**
 * Opções para adicionar: a cidade da viagem e os salvos do mesmo país (sem
 * repetir o que já está naquele dia).
 */
export function itineraryOptions(trip, savedItems = []) {
  const options = [];
  if (trip.city) {
    options.push({ type: 'city', ref: `city:${trip.city.id}`, name: trip.city.name, context: trip.city.region ?? '', lat: trip.city.lat, lng: trip.city.lng, countryKey: trip.countryKey });
  }
  for (const item of savedItems) {
    if (item.countryKey !== trip.countryKey || item.type === 'country') continue;
    if (options.some(option => option.ref === item.id)) continue;
    options.push({ type: item.type, ref: item.id, name: item.name, context: item.context ?? '', lat: item.lat, lng: item.lng, countryKey: item.countryKey });
  }
  return options;
}

/**
 * @param {object} deps
 * @param {() => object[]} [deps.getSaved]  Destinos salvos (saved.store.js).
 * @param {(item: object, trip: object) => void} [deps.onShowOnGlobe]
 */
export function createItinerarySection({ getSaved = () => [], onShowOnGlobe = null } = {}) {
  function itemHtml(item, day, dayCount) {
    const label = escapeHtml(item.name);
    const moveOptions = Array.from({ length: dayCount }, (_, index) => index + 1)
      .map(number => `<option value="${number}" ${number === day.day ? 'selected' : ''}>Dia ${number}</option>`).join('');
    return `
      <li class="itinerary__item" data-itin-item="${escapeHtml(item.id)}">
        <div class="itinerary__main">
          <span class="itinerary__type">${TYPE_LABELS[item.type]}</span>
          <strong class="itinerary__name">${label}</strong>
          ${item.context ? `<small class="itinerary__context">${escapeHtml(item.context)}</small>` : ''}
        </div>
        <div class="itinerary__fields">
          <label class="itinerary__field"><span>Horário</span>
            <input type="time" value="${escapeHtml(item.time ?? '')}" data-itin-time="${escapeHtml(item.id)}" aria-label="Horário de ${label}">
          </label>
          <label class="itinerary__field itinerary__field--note"><span>Anotação</span>
            <input type="text" maxlength="280" value="${escapeHtml(item.note ?? '')}" data-itin-note="${escapeHtml(item.id)}" aria-label="Anotação sobre ${label}" placeholder="Ex.: reservar ingresso">
          </label>
        </div>
        <div class="itinerary__tools">
          <button class="icon-button itinerary__move" type="button" data-itin-up="${escapeHtml(item.id)}" aria-label="Subir ${label}">↑</button>
          <button class="icon-button itinerary__move" type="button" data-itin-down="${escapeHtml(item.id)}" aria-label="Descer ${label}">↓</button>
          <label class="itinerary__day-pick"><span class="sr-only">Mover ${label} para o dia</span>
            <select data-itin-day="${escapeHtml(item.id)}">${moveOptions}</select>
          </label>
          ${onShowOnGlobe && Number.isFinite(item.lat) ? `<button class="planner-text-action" type="button" data-itin-globe="${escapeHtml(item.id)}">Ver no globo</button>` : ''}
          <button class="planner-text-button" type="button" data-itin-remove="${escapeHtml(item.id)}" aria-label="Remover ${label} do roteiro">Remover</button>
        </div>
      </li>`;
  }

  function addHtml(trip, day, options) {
    const choices = options.filter(option => !day.items.some(item => item.ref === option.ref));
    return `
      <form class="itinerary__add" data-itin-add="${day.day}">
        <label><span class="sr-only">O que adicionar ao dia ${day.day}</span>
          <select data-itin-choice>
            ${choices.map(option => `<option value="${escapeHtml(option.ref)}">${escapeHtml(TYPE_LABELS[option.type])}: ${escapeHtml(option.name)}</option>`).join('')}
            <option value="note">Anotação livre…</option>
          </select>
        </label>
        <label class="itinerary__note-input" ${choices.length ? 'hidden' : ''}><span class="sr-only">Texto da anotação</span>
          <input type="text" maxlength="120" data-itin-note-text placeholder="Ex.: chegada e check-in">
        </label>
        <button class="secondary-button" type="submit">Adicionar ao dia ${day.day}</button>
      </form>`;
  }

  function contentHtml(trip) {
    const count = tripDays(trip);
    const days = itineraryByDay(trip, count);
    const options = itineraryOptions(trip, getSaved());
    const empty = !trip.itinerary.length;
    return `
      ${empty ? `<p class="planner-hint">Monte o roteiro dia a dia com ${trip.city ? `${escapeHtml(trip.city.name)}, ` : ''}cidades, regiões e lugares salvos de ${escapeHtml(trip.countryName ?? 'este destino')} ou anotações livres. Salve lugares no guia do país para vê-los aqui.</p>` : ''}
      ${count ? '' : '<p class="planner-hint">Sem datas nem duração definidas: o roteiro começa com 1 dia e cresce conforme você adiciona.</p>'}
      <div class="itinerary__days">
        ${days.map(day => `
          <section class="itinerary__day${day.outside ? ' itinerary__day--outside' : ''}" aria-labelledby="itin-day-${day.day}">
            <h5 class="itinerary__day-title" id="itin-day-${day.day}">${escapeHtml(dayLabel(day))}${day.outside ? ' <small>(depois da data de volta)</small>' : ''}</h5>
            ${day.items.length ? `<ol class="itinerary__items">${day.items.map(item => itemHtml(item, day, days.length)).join('')}</ol>` : '<p class="itinerary__empty">Nada planejado para este dia.</p>'}
            ${addHtml(trip, day, options)}
          </section>`).join('')}
      </div>
      ${days.length < MAX_ITINERARY_DAYS ? '<button class="planner-text-action" type="button" data-itin-extra-day>＋ Mais um dia</button>' : ''}
      <p class="planner-hint">O roteiro não soma custos: valores ficam em "Quanto vai custar".</p>
      <p class="sr-only" role="status" aria-live="polite" data-itin-status></p>`;
  }

  // Redesenha o roteiro e devolve o foco ao mesmo controle (pelo atributo e id).
  function paint(root, trip, focus = null) {
    const slot = root.querySelector('#planner-itinerary-body');
    if (!slot) return;
    const active = focus ?? describeFocus(document.activeElement, slot);
    slot.dataset.key = paintKey(trip);
    slot.innerHTML = contentHtml({ ...trip, countryName: slot.dataset.countryName });
    if (active) slot.querySelector(active)?.focus({ preventScroll: true });
  }

  const paintKey = trip => JSON.stringify([trip.itinerary, trip.itineraryDays, trip.startDate, trip.endDate, trip.duration, trip.city?.id]);

  function describeFocus(element, slot) {
    if (!element || !slot.contains(element)) return null;
    for (const name of ['itin-time', 'itin-note', 'itin-up', 'itin-down', 'itin-day', 'itin-remove', 'itin-globe']) {
      const value = element.getAttribute(`data-${name}`);
      if (value) return `[data-${name}="${CSS.escape(value)}"]`;
    }
    const form = element.closest('[data-itin-add]');
    return form ? `[data-itin-add="${form.dataset.itinAdd}"] select` : null;
  }

  function announce(root, text) {
    const status = root.querySelector('[data-itin-status]');
    if (status) status.textContent = text;
  }

  function save(ui, trip, itinerary) {
    return ui.store.save(updateTrip(trip, { itinerary }));
  }

  return {
    id: 'itinerary',
    step: 6,
    render(trip, ui) {
      const countryName = ui?.countries?.[trip.countryKey]?.namePt ?? '';
      return `
        <div class="planner-card itinerary" id="planner-itinerary">
          <h4 class="planner-block-title">Roteiro dia a dia</h4>
          <div id="planner-itinerary-body" data-country-name="${escapeHtml(countryName)}">${contentHtml({ ...trip, countryName })}</div>
        </div>`;
    },
    bind(root, _trip, ui) {
      const card = root.querySelector('#planner-itinerary');
      if (!card) return;
      card.addEventListener('click', event => {
        const trip = ui.trip;
        const button = event.target.closest('button');
        if (!trip || !button) return;
        const { itinUp, itinDown, itinRemove, itinGlobe } = button.dataset;
        if (itinUp || itinDown) {
          const id = itinUp || itinDown;
          const next = moveItineraryItem(trip.itinerary, id, { direction: itinUp ? -1 : 1 });
          if (next === trip.itinerary) return announce(card, itinUp ? 'Já é o primeiro do dia.' : 'Já é o último do dia.');
          save(ui, trip, next);
          return;
        }
        if (itinRemove) {
          const item = trip.itinerary.find(entry => entry.id === itinRemove);
          const list = [...card.querySelectorAll('[data-itin-remove]')];
          const index = list.indexOf(button);
          const neighbor = list[index + 1] ?? list[index - 1];
          const focus = neighbor ? `[data-itin-remove="${CSS.escape(neighbor.dataset.itinRemove)}"]` : '[data-itin-add="1"] select';
          ui.store.save(updateTrip(trip, { itinerary: removeItineraryItem(trip.itinerary, itinRemove) }));
          paint(root, ui.trip, focus);
          announce(card, `${item?.name ?? 'Item'} removido do roteiro.`);
          return;
        }
        if (itinGlobe) {
          const item = trip.itinerary.find(entry => entry.id === itinGlobe);
          if (item) onShowOnGlobe?.(item, trip);
          return;
        }
        if (button.hasAttribute('data-itin-extra-day')) {
          // Dia a mais no roteiro, sem mexer nas datas da viagem (hospedagem e
          // custos continuam pelas datas); depois da volta, o dia aparece marcado.
          const next = Math.min(MAX_ITINERARY_DAYS, itineraryByDay(trip, tripDays(trip)).length + 1);
          ui.store.save(updateTrip(trip, { itineraryDays: next }));
          paint(root, ui.trip, '[data-itin-extra-day]');
          announce(card, `Dia ${next} adicionado.`);
        }
      });
      card.addEventListener('change', event => {
        const trip = ui.trip;
        const target = event.target;
        if (!trip) return;
        if (target.matches('[data-itin-choice]')) {
          const noteInput = target.closest('form')?.querySelector('.itinerary__note-input');
          if (noteInput) noteInput.hidden = target.value !== 'note';
          return;
        }
        if (target.dataset.itinTime !== undefined) {
          save(ui, trip, updateItineraryItem(trip.itinerary, target.dataset.itinTime, { time: target.value }));
        } else if (target.dataset.itinNote !== undefined) {
          save(ui, trip, updateItineraryItem(trip.itinerary, target.dataset.itinNote, { note: target.value }));
        } else if (target.dataset.itinDay !== undefined) {
          const id = target.dataset.itinDay;
          const day = Number(target.value);
          const next = moveItineraryItem(trip.itinerary, id, { day });
          if (next === trip.itinerary) {
            target.value = String(trip.itinerary.find(item => item.id === id)?.day ?? 1);
            return announce(card, 'Esse destino já está naquele dia.');
          }
          save(ui, trip, next);
          paint(root, ui.trip, `[data-itin-day="${CSS.escape(id)}"]`);
          announce(card, `Movido para o dia ${day}.`);
        }
      });
      card.addEventListener('submit', event => {
        event.preventDefault();
        const trip = ui.trip;
        const form = event.target.closest('[data-itin-add]');
        if (!trip || !form) return;
        const day = Number(form.dataset.itinAdd);
        const choice = form.querySelector('[data-itin-choice]').value;
        let entry;
        if (choice === 'note') {
          const text = form.querySelector('[data-itin-note-text]').value.trim();
          if (!text) {
            form.querySelector('.itinerary__note-input').hidden = false;
            form.querySelector('[data-itin-note-text]').focus();
            return announce(card, 'Escreva a anotação antes de adicionar.');
          }
          entry = { type: 'note', name: text, day };
        } else {
          const option = itineraryOptions(trip, getSaved()).find(item => item.ref === choice);
          if (!option) return;
          entry = { ...option, day };
        }
        const result = addItineraryItem(trip.itinerary, entry);
        if (!result.added) return announce(card, result.reason === 'duplicate' ? 'Já está neste dia.' : result.reason === 'full' ? 'O roteiro chegou ao limite de itens.' : 'Não foi possível adicionar.');
        save(ui, trip, result.items);
        paint(root, ui.trip, `[data-itin-add="${day}"] select`);
        announce(card, `${result.added.name} adicionado ao dia ${day}.`);
      });
    },
    // Mudança vinda de fora (datas, outro painel): redesenha se o roteiro mudou.
    refresh(root, trip) {
      const slot = root.querySelector('#planner-itinerary-body');
      if (!slot) return;
      if (slot.dataset.key === paintKey(trip)) return;
      paint(root, trip);
    }
  };
}
