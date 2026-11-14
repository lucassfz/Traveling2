import { escapeHtml } from '../core/html.js';
import { loadGeo } from '../geo/geo.repository.js';
import { loadSummaries, summaryFor, summaryHtml, summaryImageHtml } from '../summaries.js';

// Seção "Estados" da Visão geral: Mundo › País › Estado › Cidade.
// Só aparece em países com data/geo/<ISO2>.json; nos outros fica oculta.
// Mostra fatos do arquivo (nome, sigla, região, capital, coordenadas) e, quando
// existe, o resumo da Wikipédia ligado pelo código do estado ou do município.

const CITY_DISTANCE = 1.7;

function formatCoordinate(value, positive, negative) {
  const hemisphere = value >= 0 ? positive : negative;
  return `${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}° ${hemisphere}`;
}

function divisionsHeading(divisions) {
  return divisions.every(division => division.type === 'state' || division.type === 'district') ? 'Estados' : 'Regiões';
}

function sourcesNote(geo) {
  const names = geo.sources.map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.name.split(' — ')[0])}</a>${source.license?.startsWith('CC') ? ` (${escapeHtml(source.license)})` : ''}`);
  return `<p class="geo-nav__source">Fonte: ${names.join(' e ')}.</p>`;
}

/**
 * @param {object} ctx
 * @param {HTMLElement} ctx.root            Contêiner da seção (fica oculto sem dados).
 * @param {() => object|null} ctx.getMap    MapEngine atual, se o globo já carregou.
 * @param {() => void} ctx.onWorld          Volta para o globo inteiro.
 * @param {(place: object, division: object) => void} [ctx.onPlace] "Ver no globo" de uma cidade.
 * @param {(place: object, division: object) => void} [ctx.onPlan]  "Planejar viagem" para uma cidade.
 * @param {object} [ctx.saved] Destinos salvos: { state(place, division) → Promise<boolean>, toggle(place, division) → Promise<boolean> }.
 */
export function createRegionsSection({ root, getMap, onWorld, onPlace, onPlan, saved }) {
  let geo = null;
  let view = { level: 'country', id: null };
  let countryName = '';
  let countryKey = null;
  const STATE_DISTANCE = 2;
  let token = 0;

  function breadcrumb(parts) {
    const items = [
      '<li><button type="button" class="geo-nav__crumb" data-geo-world>Mundo</button></li>',
      ...parts.map(([label, attrs], index) => index === parts.length - 1
        ? `<li><span aria-current="page">${escapeHtml(label)}</span></li>`
        : `<li><button type="button" class="geo-nav__crumb" ${attrs}>${escapeHtml(label)}</button></li>`)
    ];
    return `<nav class="geo-nav__breadcrumb" aria-label="Você está em"><ol>${items.join('')}</ol></nav>`;
  }

  function back(label, attrs) {
    return `<button type="button" class="geo-nav__back" ${attrs}>← ${escapeHtml(label)}</button>`;
  }

  // Resumos chegam depois da primeira pintura: redesenha a vista atual sem mexer no foco.
  function rerenderKeepingFocus() {
    if (!geo) return;
    if (view.level === 'division') renderDivision(view.id, { focus: false });
    else if (view.level === 'place') renderPlace(view.id, { focus: false });
  }

  function renderCountry() {
    view = { level: 'country', id: null };
    const groups = new Map();
    for (const division of geo.divisions) {
      const key = division.region || '';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(division);
    }
    const regions = [...groups.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    root.innerHTML = `
      <div class="section-heading">${divisionsHeading(geo.divisions)}</div>
      <div class="geo-nav__groups">
        ${regions.map(region => `
          <div class="geo-nav__group">
            ${region ? `<span class="geo-nav__region">${escapeHtml(region)}</span>` : ''}
            <div class="geo-nav__chips">
              ${groups.get(region).map(division => `
                <button type="button" class="geo-nav__chip" data-geo-division="${escapeHtml(division.id)}">
                  ${escapeHtml(division.name)}<span>${escapeHtml(division.code)}</span>
                </button>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;
  }

  function renderDivision(divisionId, { focus = true } = {}) {
    const division = geo.division(divisionId);
    if (!division) return renderCountry();
    view = { level: 'division', id: division.id };
    const about = summaryFor('divisions', division.id);
    const capital = geo.capitalPlace(division.id);
    const places = geo.places(division.id);
    const ordered = capital ? [capital, ...places.filter(place => place !== capital)] : places;
    root.innerHTML = `
      ${breadcrumb([[countryName, 'data-geo-country'], [division.name]])}
      ${back(countryName, 'data-geo-country')}
      <h3 class="geo-nav__title" tabindex="-1">${escapeHtml(division.name)}</h3>
      ${summaryImageHtml(about, division.name)}
      ${summaryHtml(about, { className: 'geo-nav__about' })}
      <div class="info-grid">
        <article class="info-card"><div class="info-card__value">${escapeHtml(division.capital.name)}</div><div class="info-card__label">Capital</div></article>
        <article class="info-card"><div class="info-card__value">${escapeHtml(division.region || '—')}</div><div class="info-card__label">Região</div></article>
      </div>
      ${ordered.length ? `
        <div class="section-heading">Cidades</div>
        <ul class="geo-nav__list">
          ${ordered.map(place => `
            <li><button type="button" class="geo-nav__place" data-geo-place="${escapeHtml(place.id)}">
              <span>${escapeHtml(place.name)}</span>${place === capital ? '<small>Capital</small>' : ''}
            </button></li>`).join('')}
        </ul>
        ${ordered.length === 1 ? '<p class="geo-nav__note">Por enquanto, só a capital deste estado.</p>' : ''}` : ''}
      ${sourcesNote(geo)}`;
    if (focus) root.querySelector('.geo-nav__title')?.focus({ preventScroll: true });
  }

  function renderPlace(placeId, { focus = true } = {}) {
    const place = geo.place(placeId);
    const division = place && geo.division(place.division);
    if (!place || !division) return renderCountry();
    view = { level: 'place', id: place.id };
    const about = summaryFor('places', place.id);
    const isCapital = geo.capitalPlace(division.id) === place;
    root.innerHTML = `
      ${breadcrumb([[countryName, 'data-geo-country'], [division.name, `data-geo-division="${escapeHtml(division.id)}"`], [place.name]])}
      ${back(division.name, `data-geo-division="${escapeHtml(division.id)}"`)}
      <div class="geo-nav__title-row">
        <h3 class="geo-nav__title" tabindex="-1">${escapeHtml(place.name)}</h3>
        ${saved ? `<button type="button" class="save-toggle" data-geo-save="${escapeHtml(place.id)}" aria-pressed="false">Salvar</button>` : ''}
      </div>
      ${summaryImageHtml(about, `${place.name}, ${division.name}`)}
      ${summaryHtml(about, { className: 'geo-nav__about' })}
      <div class="info-grid">
        <article class="info-card"><div class="info-card__value">${escapeHtml(division.name)}</div><div class="info-card__label">${isCapital ? 'Capital do estado' : 'Estado'}</div></article>
        <article class="info-card"><div class="info-card__value">${formatCoordinate(place.lat, 'N', 'S')}, ${formatCoordinate(place.lng, 'L', 'O')}</div><div class="info-card__label">Coordenadas</div></article>
      </div>
      <div class="geo-nav__actions">
        <button type="button" class="secondary-button geo-nav__fly" data-geo-fly="${escapeHtml(place.id)}">Ver no globo</button>
        ${onPlan ? `<button type="button" class="primary-button" data-geo-plan="${escapeHtml(place.id)}">Planejar viagem para ${escapeHtml(place.name)}</button>` : ''}
      </div>
      ${about ? '' : `<p class="geo-nav__note">Ainda não há resumo de ${escapeHtml(place.name)}.</p>`}
      ${sourcesNote(geo)}`;
    if (focus) root.querySelector('.geo-nav__title')?.focus({ preventScroll: true });
    syncSaveButton(place, division);
  }

  async function syncSaveButton(place, division) {
    const button = root.querySelector(`[data-geo-save="${CSS.escape(place.id)}"]`);
    if (!button || !saved) return;
    const isSaved = await saved.state(place, division);
    if (!button.isConnected) return;
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? '✓ Salvo' : 'Salvar';
    button.setAttribute('aria-label', `${isSaved ? 'Remover dos salvos' : 'Salvar'}: ${place.name}`);
  }

  root.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target || !geo) return;
    if (target.hasAttribute('data-geo-world')) return onWorld?.();
    if (target.hasAttribute('data-geo-country')) {
      // De volta ao país: a câmera também volta ao enquadramento do país.
      getMap()?.selectCity(null);
      if (countryKey) getMap()?.selectCountry(countryKey);
      renderCountry();
      root.querySelector('.geo-nav__chip')?.focus({ preventScroll: true });
      return;
    }
    if (target.dataset.geoDivision) {
      // Estado: aproxima da capital, num enquadramento regional.
      const capital = geo.capitalPlace(target.dataset.geoDivision);
      getMap()?.selectCity(null);
      if (capital) getMap()?.flyTo(capital.lat, capital.lng, STATE_DISTANCE);
      return renderDivision(target.dataset.geoDivision);
    }
    if (target.dataset.geoPlace) return renderPlace(target.dataset.geoPlace);
    if (target.dataset.geoSave) {
      const place = geo.place(target.dataset.geoSave);
      if (place) saved?.toggle(place, geo.division(place.division)).then(() => syncSaveButton(place, geo.division(place.division)));
      return;
    }
    const placeId = target.dataset.geoFly || target.dataset.geoPlan;
    const place = placeId ? geo.place(placeId) : null;
    if (!place) return;
    const division = geo.division(place.division);
    if (target.dataset.geoPlan) return onPlan?.(place, division);
    if (onPlace) onPlace(place, division);
    else getMap()?.flyTo(place.lat, place.lng, CITY_DISTANCE);
  });

  return {
    async show(country) {
      const current = ++token;
      geo = null;
      root.hidden = true;
      root.innerHTML = '';
      if (!country?.alpha2) return;
      let data = null;
      try {
        data = await loadGeo(country.alpha2);
      } catch {
        data = null; // Sem divisões: a Visão geral segue só com o país.
      }
      if (current !== token || !data) return;
      geo = data;
      countryName = country.namePt;
      countryKey = country.key ?? null;
      renderCountry();
      root.hidden = false;
      loadSummaries().then(() => { if (current === token) rerenderKeepingFocus(); });
    },
    // Abre direto um estado ou uma cidade (destinos salvos). Espera os dados do país.
    async open({ divisionId = null, placeId = null } = {}) {
      for (let tries = 0; !geo && tries < 50; tries += 1) await new Promise(resolve => setTimeout(resolve, 60));
      if (!geo) return false;
      await loadSummaries();
      if (placeId && geo.place(placeId)) renderPlace(placeId);
      else if (divisionId && geo.division(divisionId)) renderDivision(divisionId);
      else return false;
      root.scrollIntoView({ block: 'start' });
      return true;
    },
    // O destino salvo mudou em outro lugar (painel de salvos): atualiza o botão.
    refreshSaved() {
      if (view.level === 'place' && geo) {
        const place = geo.place(view.id);
        if (place) syncSaveButton(place, geo.division(place.division));
      }
    },
    clear() {
      token += 1;
      geo = null;
      root.hidden = true;
      root.innerHTML = '';
    }
  };
}
