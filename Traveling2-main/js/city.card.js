// Cartão de cidade: abre ao clicar numa cidade do globo (pontos e nomes da
// camada de zoom). Mostra só fatos do GeoNames: estado, país, população,
// hora local e coordenadas. Ações: aproximar, abrir o guia do país e planejar.
import { escapeHtml } from './core/html.js';
import { flagImageUrl } from './country.exploration.js';

const RANK_LABELS = ['Capital do país', 'Capital regional', null];

function formatPopulation(value) {
  if (!value) return null;
  return value >= 1e6
    ? `${(value / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} milhões de habitantes`
    : `${Math.round(value / 1000).toLocaleString('pt-BR')} mil habitantes`;
}

function localTime(timeZone) {
  if (!timeZone) return null;
  try {
    return new Intl.DateTimeFormat('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit', weekday: 'short' }).format(new Date());
  } catch {
    return null;
  }
}

function coordinate(value, positive, negative) {
  return `${Math.abs(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}° ${value >= 0 ? positive : negative}`;
}

/**
 * @param {object} deps
 * @param {HTMLElement} deps.root
 * @param {object} deps.countries        COUNTRIES
 * @param {(countryKey: string) => void} deps.onShowCountry
 * @param {(countryKey: string, city: object) => void} deps.onPlan
 * @param {(city: object) => void} deps.onZoom
 * @param {() => void} deps.onClose
 */
export function createCityCard({ root, countries, onShowCountry, onPlan, onZoom, onClose }) {
  const byAlpha2 = new Map(Object.entries(countries).map(([key, country]) => [country.alpha2, key]));
  let current = null;
  let clock = 0;

  function render() {
    const city = current;
    const countryKey = byAlpha2.get(city.country) ?? null;
    const country = countryKey ? countries[countryKey] : null;
    const flag = flagImageUrl(city.country);
    const time = localTime(city.timeZone);
    const facts = [
      ['População', formatPopulation(city.population)],
      ['Hora local', time],
      ['Coordenadas', `${coordinate(city.lat, 'N', 'S')}, ${coordinate(city.lng, 'L', 'O')}`],
      ['Área urbana', city.hasOutline ? 'Contorno destacado no mapa' : null]
    ].filter(([, value]) => value);
    root.innerHTML = `
      <div class="city-card__head">
        ${flag ? `<img class="city-card__flag" src="${flag}" alt="" width="40" height="30" decoding="async">` : ''}
        <div class="city-card__titles">
          ${RANK_LABELS[city.rank] ? `<span class="eyebrow">${RANK_LABELS[city.rank]}</span>` : ''}
          <h2 class="city-card__name" id="city-card-title" tabindex="-1">${escapeHtml(city.name)}</h2>
          <small>${escapeHtml([city.region, country?.namePt ?? city.country].filter(Boolean).join(' · '))}</small>
        </div>
        <button class="icon-button city-card__close" type="button" data-city-action="close" aria-label="Fechar cidade">✕</button>
      </div>
      <dl class="city-card__facts">
        ${facts.map(([label, value]) => `<div><dt>${label}</dt><dd ${label === 'Hora local' ? 'data-city-clock' : ''}>${escapeHtml(value)}</dd></div>`).join('')}
      </dl>
      <div class="city-card__actions">
        <button class="secondary-button" type="button" data-city-action="zoom">Aproximar</button>
        ${countryKey ? `<button class="secondary-button" type="button" data-city-action="country">Guia de ${escapeHtml(country.namePt)}</button>
        <button class="primary-button" type="button" data-city-action="plan">Planejar viagem para ${escapeHtml(city.name)}</button>` : ''}
      </div>
      <p class="city-card__source">Dados: GeoNames (CC BY 4.0)</p>`;
    root.dataset.countryKey = countryKey ?? '';
  }

  root.addEventListener('click', event => {
    const action = event.target.closest('[data-city-action]')?.dataset.cityAction;
    if (!action || !current) return;
    const countryKey = root.dataset.countryKey;
    if (action === 'close') hide(true);
    if (action === 'zoom') onZoom(current);
    if (action === 'country' && countryKey) { hide(); onShowCountry(countryKey); }
    if (action === 'plan' && countryKey) { const city = current; hide(); onPlan(countryKey, city); }
  });

  function show(city) {
    current = city;
    render();
    root.hidden = false;
    clearInterval(clock);
    // A hora local é atualizada a cada 30 s enquanto o cartão está aberto.
    clock = setInterval(() => {
      const slot = root.querySelector('[data-city-clock]');
      const time = localTime(current?.timeZone);
      if (slot && time) slot.textContent = time;
    }, 30000);
    root.querySelector('#city-card-title')?.focus({ preventScroll: true });
  }

  function hide(notify = false) {
    if (root.hidden) return;
    root.hidden = true;
    current = null;
    clearInterval(clock);
    if (notify) onClose?.();
  }

  return { show, hide, get isOpen() { return !root.hidden; } };
}
