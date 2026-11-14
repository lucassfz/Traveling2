import { escapeHtml } from '../core/html.js';
import { loadGeo } from '../geo/geo.repository.js';

// Seção "Estados" da Visão geral: Mundo › País › Estado › Cidade.
// Só aparece em países com data/geo/<ISO2>.json; nos outros fica oculta.
// Mostra apenas fatos do arquivo (nome, sigla, região, capital, coordenadas).

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
 */
export function createRegionsSection({ root, getMap, onWorld }) {
  let geo = null;
  let countryName = '';
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

  function renderCountry() {
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

  function renderDivision(divisionId) {
    const division = geo.division(divisionId);
    if (!division) return renderCountry();
    const capital = geo.capitalPlace(division.id);
    const places = geo.places(division.id);
    const ordered = capital ? [capital, ...places.filter(place => place !== capital)] : places;
    root.innerHTML = `
      ${breadcrumb([[countryName, 'data-geo-country'], [division.name]])}
      <h3 class="geo-nav__title" tabindex="-1">${escapeHtml(division.name)}</h3>
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
    root.querySelector('.geo-nav__title')?.focus({ preventScroll: true });
  }

  function renderPlace(placeId) {
    const place = geo.place(placeId);
    const division = place && geo.division(place.division);
    if (!place || !division) return renderCountry();
    const isCapital = geo.capitalPlace(division.id) === place;
    root.innerHTML = `
      ${breadcrumb([[countryName, 'data-geo-country'], [division.name, `data-geo-division="${escapeHtml(division.id)}"`], [place.name]])}
      <h3 class="geo-nav__title" tabindex="-1">${escapeHtml(place.name)}</h3>
      <div class="info-grid">
        <article class="info-card"><div class="info-card__value">${escapeHtml(division.name)}</div><div class="info-card__label">${isCapital ? 'Capital do estado' : 'Estado'}</div></article>
        <article class="info-card"><div class="info-card__value">${formatCoordinate(place.lat, 'N', 'S')}, ${formatCoordinate(place.lng, 'L', 'O')}</div><div class="info-card__label">Coordenadas</div></article>
      </div>
      <button type="button" class="secondary-button geo-nav__fly" data-geo-fly="${escapeHtml(place.id)}">Ver no globo</button>
      <p class="geo-nav__note">Guia de ${escapeHtml(place.name)} ainda não disponível.</p>
      ${sourcesNote(geo)}`;
    root.querySelector('.geo-nav__title')?.focus({ preventScroll: true });
  }

  root.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target || !geo) return;
    if (target.hasAttribute('data-geo-world')) return onWorld?.();
    if (target.hasAttribute('data-geo-country')) {
      renderCountry();
      root.querySelector('.geo-nav__chip')?.focus({ preventScroll: true });
      return;
    }
    if (target.dataset.geoDivision) return renderDivision(target.dataset.geoDivision);
    if (target.dataset.geoPlace) return renderPlace(target.dataset.geoPlace);
    if (target.dataset.geoFly) {
      const place = geo.place(target.dataset.geoFly);
      if (place) getMap()?.flyTo(place.lat, place.lng, CITY_DISTANCE);
    }
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
      renderCountry();
      root.hidden = false;
    },
    clear() {
      token += 1;
      geo = null;
      root.hidden = true;
      root.innerHTML = '';
    }
  };
}
