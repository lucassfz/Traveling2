import { escapeHtml } from '../core/html.js';
import { loadGeo } from '../geo/geo.repository.js';
import { loadCities, loadDivisions } from '../geo/cities.js';
import { loadSummaries, summaryFor, summaryHtml, summaryImageHtml } from '../summaries.js';

// Seção "Estados / Regiões" da Visão geral: Mundo › País › Região › Cidade.
// Uma só navegação para todos os países (Fase 4.3):
//   - Brasil (data/geo/BR.json): estados do IBGE com resumo e foto da Wikipédia,
//     e as cidades do arquivo com o próprio resumo;
//   - demais países: divisões do Natural Earth (data/admin) e as maiores cidades
//     de cada uma (GeoNames). A cidade abre o mesmo cartão de cidade do globo.
// Região e cidade podem ser salvas e ir para o roteiro de uma viagem.

const CITY_DISTANCE = 1.7;
const REGION_DISTANCE = 2;
const CHIP_LIMIT = 40;
const REGION_CITY_LIMIT = 12;

// Tipos do Natural Earth (type_en) em português; o resto vira "Divisão".
const TYPE_LABELS = {
  State: 'Estado', Province: 'Província', Region: 'Região', District: 'Distrito', County: 'Condado',
  Department: 'Departamento', Municipality: 'Município', 'Commune|Municipality': 'Município', Prefecture: 'Província',
  'Metropolitan department': 'Departamento', 'Statistical Region': 'Região', Governorate: 'Província', Parish: 'Paróquia',
  'Autonomous Community': 'Comunidade autônoma', Canton: 'Cantão', City: 'Cidade', 'Autonomous Province': 'Província autônoma',
  Republic: 'República', Atoll: 'Atol', Territory: 'Território', 'Union Territory': 'Território', 'Voivodeship|Province': 'Voivodia',
  'Administrative State': 'Estado', Emirate: 'Emirado', 'Autonomous Region': 'Região autônoma', 'Federal District': 'Distrito Federal',
  'Metropolitan City': 'Cidade metropolitana', 'Special Municipality': 'Município especial', Dependency: 'Dependência', Island: 'Ilha'
};
export const regionTypeLabel = type => TYPE_LABELS[type] ?? 'Divisão';

function formatCoordinate(value, positive, negative) {
  const hemisphere = value >= 0 ? positive : negative;
  return `${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}° ${hemisphere}`;
}

const population = value => (value >= 1_000_000
  ? `${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi hab.`
  : `${Math.round(value / 1000).toLocaleString('pt-BR')} mil hab.`);

function divisionsHeading(divisions) {
  return divisions.every(division => ['state', 'district', 'State', 'Federal District', 'Administrative State'].includes(division.type)) ? 'Estados' : 'Regiões';
}

function sourcesNote(geo) {
  const names = geo.sources.map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.name.split(' — ')[0])}</a>${source.license?.startsWith('CC') ? ` (${escapeHtml(source.license)})` : ''}`);
  return `<p class="geo-nav__source">Fonte: ${names.join(' e ')}.</p>`;
}

const ADMIN_SOURCE = '<p class="geo-nav__source">Fonte: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a> (divisões, domínio público) e <a href="https://www.geonames.org/" target="_blank" rel="noopener">GeoNames</a> (cidades com 15 mil habitantes ou mais, CC BY 4.0).</p>';

function saveButton(attr, value, isSaved, name) {
  return `<button type="button" class="save-toggle" ${attr}="${escapeHtml(value)}" aria-pressed="${isSaved}" aria-label="${isSaved ? 'Remover dos salvos' : 'Salvar'}: ${escapeHtml(name)}">${isSaved ? '✓ Salvo' : 'Salvar'}</button>`;
}

/**
 * @param {object} ctx
 * @param {HTMLElement} ctx.root            Contêiner da seção (fica oculto sem dados).
 * @param {() => object|null} ctx.getMap    MapEngine atual, se o globo já carregou.
 * @param {() => void} ctx.onWorld          Volta para o globo inteiro.
 * @param {(place: object, division: object) => void} [ctx.onPlace] "Ver no globo" de uma cidade (Brasil).
 * @param {(place: object, division: object) => void} [ctx.onPlan]  "Planejar viagem" para uma cidade (Brasil).
 * @param {(city: object) => void} [ctx.onCity]  Cidade do globo (demais países): abre o cartão da cidade.
 * @param {object} [ctx.saved] Cidades do Brasil: { state(place, division) → Promise<boolean>, toggle(place, division) → Promise<boolean> }.
 * @param {object} [ctx.regions] Regiões: { isSaved(code) → boolean, toggle(region) → boolean }.
 * @param {(entry: object, trigger: HTMLElement) => void} [ctx.onAddToItinerary]
 */
export function createRegionsSection({ root, getMap, onWorld, onPlace, onPlan, onCity, saved, regions: savedRegions, onAddToItinerary }) {
  let geo = null;          // Brasil: data/geo
  let admin = null;        // demais: { divisions, cities }
  let view = { level: 'country', id: null };
  let country = null;
  let showAll = false;
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

  // Região como destino (salvar e roteiro): mesmo formato nas duas fontes.
  function regionEntry(region) {
    return {
      id: `region:${region.code}`, type: 'region', ref: `region:${region.code}`, countryKey: country.key, name: region.name,
      context: `${region.typeLabel} · ${country.namePt}`, lat: region.lat, lng: region.lng, regionCode: region.code
    };
  }

  function regionActions(region) {
    const isSaved = savedRegions?.isSaved(region.code) ?? false;
    return `
      <div class="geo-nav__actions">
        ${savedRegions ? saveButton('data-geo-save-region', region.code, isSaved, region.name) : ''}
        ${onAddToItinerary ? `<button type="button" class="secondary-button" data-geo-itinerary-region="${escapeHtml(region.code)}">＋ Roteiro</button>` : ''}
        ${Number.isFinite(region.lat) ? `<button type="button" class="secondary-button" data-geo-fly-region="${escapeHtml(region.code)}">Ver no globo</button>` : ''}
      </div>`;
  }

  // ---------- Brasil (data/geo) ----------

  const geoRegion = division => ({
    code: division.id, name: division.name, typeLabel: division.type === 'district' ? 'Distrito Federal' : 'Estado',
    lat: geo.capitalPlace(division.id)?.lat ?? null, lng: geo.capitalPlace(division.id)?.lng ?? null
  });

  // Resumos chegam depois da primeira pintura: redesenha a vista atual sem mexer no foco.
  function rerenderKeepingFocus() {
    if (!geo) return;
    if (view.level === 'division') renderDivision(view.id, { focus: false });
    else if (view.level === 'place') renderPlace(view.id, { focus: false });
  }

  function renderCountry() {
    view = { level: 'country', id: null };
    if (admin) return renderAdminCountry();
    const groups = new Map();
    for (const division of geo.divisions) {
      const key = division.region || '';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(division);
    }
    const keys = [...groups.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    root.innerHTML = `
      <div class="section-heading">${divisionsHeading(geo.divisions)}</div>
      <div class="geo-nav__groups">
        ${keys.map(region => `
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
      ${breadcrumb([[country.namePt, 'data-geo-country'], [division.name]])}
      ${back(country.namePt, 'data-geo-country')}
      <h3 class="geo-nav__title" tabindex="-1">${escapeHtml(division.name)}</h3>
      ${regionActions(geoRegion(division))}
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
      ${breadcrumb([[country.namePt, 'data-geo-country'], [division.name, `data-geo-division="${escapeHtml(division.id)}"`], [place.name]])}
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
        ${onAddToItinerary ? `<button type="button" class="secondary-button" data-geo-itinerary-place="${escapeHtml(place.id)}">＋ Roteiro</button>` : ''}
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

  // ---------- Demais países (data/admin) ----------

  const adminRegion = code => admin?.divisions.find(division => division.code === code) ?? null;

  function renderAdminCountry() {
    const list = [...admin.divisions].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const visible = showAll ? list : list.slice(0, CHIP_LIMIT);
    root.innerHTML = `
      <div class="section-heading">${divisionsHeading(admin.divisions)}</div>
      <div class="geo-nav__chips">
        ${visible.map(division => `<button type="button" class="geo-nav__chip" data-geo-region="${escapeHtml(division.code)}">${escapeHtml(division.name)}</button>`).join('')}
      </div>
      ${list.length > visible.length ? `<button type="button" class="planner-text-action" data-geo-all>Mostrar todas (${list.length})</button>` : ''}
      ${ADMIN_SOURCE}`;
  }

  function renderAdminRegion(code, { focus = true } = {}) {
    const division = adminRegion(code);
    if (!division) return renderCountry();
    view = { level: 'region', id: code };
    const cities = admin.cities.filter(city => city.regionCode === code).sort((a, b) => b.population - a.population);
    const top = cities.slice(0, REGION_CITY_LIMIT);
    const region = { ...division, typeLabel: regionTypeLabel(division.type) };
    root.innerHTML = `
      ${breadcrumb([[country.namePt, 'data-geo-country'], [division.name]])}
      ${back(country.namePt, 'data-geo-country')}
      <span class="eyebrow">${escapeHtml(region.typeLabel)}</span>
      <h3 class="geo-nav__title" tabindex="-1">${escapeHtml(division.name)}</h3>
      ${regionActions(region)}
      ${top.length ? `
        <div class="section-heading">Maiores cidades</div>
        <ul class="geo-nav__list">
          ${top.map(city => `
            <li><button type="button" class="geo-nav__place" data-geo-city="${escapeHtml(city.id)}">
              <span>${escapeHtml(city.name)}</span><small>${city.rank === 0 ? 'Capital · ' : ''}${escapeHtml(population(city.population))}</small>
            </button></li>`).join('')}
        </ul>
        ${cities.length > top.length ? `<p class="geo-nav__note">Mais ${cities.length - top.length} ${cities.length - top.length === 1 ? 'cidade' : 'cidades'} no globo: aproxime para ver.</p>` : ''}`
        : '<p class="geo-nav__note">Nenhuma cidade com 15 mil habitantes ou mais nesta região no GeoNames.</p>'}
      ${ADMIN_SOURCE}`;
    if (focus) root.querySelector('.geo-nav__title')?.focus({ preventScroll: true });
  }

  function currentRegion(code) {
    if (geo) {
      const division = geo.division(code);
      return division ? geoRegion(division) : null;
    }
    const division = adminRegion(code);
    return division ? { ...division, typeLabel: regionTypeLabel(division.type) } : null;
  }

  function syncRegionButton(code) {
    const button = root.querySelector(`[data-geo-save-region="${CSS.escape(code)}"]`);
    const region = currentRegion(code);
    if (!button || !region) return;
    const isSaved = savedRegions?.isSaved(code) ?? false;
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? '✓ Salvo' : 'Salvar';
    button.setAttribute('aria-label', `${isSaved ? 'Remover dos salvos' : 'Salvar'}: ${region.name}`);
  }

  root.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target || (!geo && !admin)) return;
    if (target.hasAttribute('data-geo-world')) return onWorld?.();
    if (target.hasAttribute('data-geo-country')) {
      // De volta ao país: a câmera também volta ao enquadramento do país.
      getMap()?.selectCity(null);
      if (country?.key) getMap()?.selectCountry(country.key);
      renderCountry();
      root.querySelector('.geo-nav__chip')?.focus({ preventScroll: true });
      return;
    }
    if (target.hasAttribute('data-geo-all')) {
      showAll = true;
      renderAdminCountry();
      root.querySelectorAll('.geo-nav__chip')[CHIP_LIMIT]?.focus({ preventScroll: true });
      return;
    }
    const { geoRegion: regionCode, geoSaveRegion, geoItineraryRegion, geoFlyRegion, geoCity, geoItineraryPlace } = target.dataset;
    if (regionCode) {
      const division = adminRegion(regionCode);
      getMap()?.selectCity(null);
      if (division) getMap()?.flyTo(division.lat, division.lng, REGION_DISTANCE);
      return renderAdminRegion(regionCode);
    }
    if (geoSaveRegion) {
      const region = currentRegion(geoSaveRegion);
      if (region) savedRegions?.toggle(regionEntry(region));
      return syncRegionButton(geoSaveRegion);
    }
    if (geoItineraryRegion) {
      const region = currentRegion(geoItineraryRegion);
      if (region) onAddToItinerary?.(regionEntry(region), target);
      return;
    }
    if (geoFlyRegion) {
      const region = currentRegion(geoFlyRegion);
      if (region && Number.isFinite(region.lat)) {
        getMap()?.selectCity(null);
        getMap()?.flyTo(region.lat, region.lng, REGION_DISTANCE);
      }
      return;
    }
    if (geoCity) {
      const city = admin?.cities.find(item => item.id === geoCity);
      if (city) onCity?.(city);
      return;
    }
    if (!geo) return;
    if (target.dataset.geoDivision) {
      // Estado: aproxima da capital, num enquadramento regional.
      const capital = geo.capitalPlace(target.dataset.geoDivision);
      getMap()?.selectCity(null);
      if (capital) getMap()?.flyTo(capital.lat, capital.lng, REGION_DISTANCE);
      return renderDivision(target.dataset.geoDivision);
    }
    if (target.dataset.geoPlace) return renderPlace(target.dataset.geoPlace);
    if (target.dataset.geoSave) {
      const place = geo.place(target.dataset.geoSave);
      if (place) saved?.toggle(place, geo.division(place.division)).then(() => syncSaveButton(place, geo.division(place.division)));
      return;
    }
    if (geoItineraryPlace) {
      const place = geo.place(geoItineraryPlace);
      if (place) onAddToItinerary?.({ place, division: geo.division(place.division) }, target);
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

  async function waitForData() {
    for (let tries = 0; !geo && !admin && tries < 60; tries += 1) await new Promise(resolve => setTimeout(resolve, 60));
    return Boolean(geo || admin);
  }

  return {
    async show(next) {
      const current = ++token;
      geo = null;
      admin = null;
      showAll = false;
      root.hidden = true;
      root.innerHTML = '';
      if (!next?.alpha2) return;
      country = next;
      let data = null;
      try {
        data = await loadGeo(next.alpha2);
      } catch {
        data = null;
      }
      if (current !== token) return;
      if (data) {
        geo = data;
        renderCountry();
        root.hidden = false;
        loadSummaries().then(() => { if (current === token) rerenderKeepingFocus(); });
        return;
      }
      // Sem data/geo: divisões e cidades do mesmo arquivo do globo.
      const [divisions, cities] = await Promise.all([loadDivisions(next.alpha2), loadCities(next.alpha2)]).catch(() => [[], []]);
      if (current !== token || divisions.length < 2) return;
      admin = { divisions, cities };
      renderCountry();
      root.hidden = false;
    },
    // Abre direto uma região ou uma cidade do Brasil (destinos salvos). Espera os dados do país.
    async open({ divisionId = null, placeId = null, regionCode = null } = {}) {
      if (!(await waitForData())) return false;
      if (geo) {
        await loadSummaries();
        const division = divisionId ?? regionCode;
        if (placeId && geo.place(placeId)) renderPlace(placeId);
        else if (division && geo.division(division)) renderDivision(division);
        else return false;
      } else if (regionCode && adminRegion(regionCode)) renderAdminRegion(regionCode);
      else return false;
      root.scrollIntoView({ block: 'start' });
      return true;
    },
    // O destino salvo mudou em outro lugar (painel de salvos): atualiza os botões.
    refreshSaved() {
      if (view.level === 'place' && geo) {
        const place = geo.place(view.id);
        if (place) syncSaveButton(place, geo.division(place.division));
      }
      if (view.level === 'division' || view.level === 'region') syncRegionButton(view.id);
    },
    clear() {
      token += 1;
      geo = null;
      admin = null;
      root.hidden = true;
      root.innerHTML = '';
    }
  };
}
