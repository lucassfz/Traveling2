// Globo 3D: o React cria o palco e entrega ao motor (js/map.engine.js), que
// desenha em WebGL por conta própria. Nada dentro do palco é do React.
import { useEffect, useRef, useState } from 'react';
import { StarfieldEngine } from '../../js/starfield.engine.js';
import { STORAGE_KEYS, readStorage, writeStorage } from '../../js/core/storage.js';
import { COUNTRIES } from '../../js/countries.dataset.js';
import { app, useApp } from '../state/store.js';
import { globe } from '../state/services.js';
import { openFromHash, selectCity, selectCountry, syncFilters, toggleHub } from '../state/actions.js';
import { routeArrived } from '../state/route.js';
import { announce } from '../state/focus.js';
import { CityCard } from './CityCard.jsx';
import { tourSeen } from './Tour.jsx';
import { Icon } from './ui.jsx';

const FALLBACK = 'O mapa 3D não carregou. A busca, a lista de países, os guias, as viagens e as milhas continuam disponíveis.';

export function Globe() {
  const stage = useRef(null);
  const stars = useRef(null);
  const theme = useApp(state => state.theme);
  const ready = useApp(state => state.mapReady);
  const failed = useApp(state => state.mapFailed);
  const status = useApp(state => state.mapStatus);
  const countryOpen = useApp(state => state.countryOpen);
  const placesOpen = useApp(state => state.hub === 'places');
  const [hint, dismissHint] = useHint();

  useEffect(() => {
    const starfield = new StarfieldEngine(stars.current);
    stars.current.engine = starfield;
    let cancelled = false;
    startMap(stage.current, () => cancelled);
    return () => {
      cancelled = true;
      starfield.destroy();
    };
  }, []);

  useEffect(() => { stars.current?.engine?.setTheme(theme); }, [theme]);

  // O guia do país cobre a direita do globo: a projeção desloca para o lado visível.
  useEffect(() => {
    const sync = () => {
      const width = app.get().countryOpen ? document.getElementById('country-panel')?.getBoundingClientRect().width ?? 0 : 0;
      globe.map?.setViewInset?.({ right: width });
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [countryOpen, ready]);

  return (
    <main className={`globe${ready || failed ? ' globe--ready' : ''}`} id="globe">
      <canvas className="starfield" id="starfield-canvas" aria-hidden="true" ref={stars} />
      <div className="globe__stage" id="globe-stage" ref={stage} onPointerDown={dismissHint} onWheel={dismissHint} />
      <div className="globe__visual-overlay" aria-hidden="true" />
      <p className="globe-keys" aria-hidden="true"><kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> girar · <kbd>+</kbd><kbd>−</kbd> aproximar · <kbd>Enter</kbd> escolher</p>
      <div className={`globe__status${ready || failed ? ' globe__status--hidden' : ''}`} id="globe-status">
        <span className="globe__spinner" aria-hidden="true" />
        <span>{status}</span>
      </div>
      <CityCard />
      <div className="globe-zoom" role="group" aria-label="Controles do globo">
        <button className="globe-zoom__button" id="zoom-in" type="button" aria-label="Aproximar" title="Aproximar" onClick={() => { dismissHint(); globe.map?.zoomStep(1); }}>+</button>
        <button className="globe-zoom__button" id="zoom-out" type="button" aria-label="Afastar" title="Afastar" onClick={() => { dismissHint(); globe.map?.zoomStep(-1); }}>−</button>
        <button className="globe-zoom__button" id="places-launcher" type="button" aria-label="Lista de países" title="Lista de países" aria-expanded={placesOpen} aria-controls="places-panel" onClick={() => toggleHub('places')}><Icon name="list" /></button>
      </div>
      <p className="globe-hint" id="globe-hint" hidden={!hint}>Arraste para girar · aproxime para ver estados e cidades</p>
      <div className={`globe__fallback${failed ? ' globe__fallback--visible' : ''}`} id="globe-fallback" role="status">
        {failed && <><strong>Globo 3D indisponível</strong><span>{FALLBACK}</span></>}
      </div>
    </main>
  );
}

function useHint() {
  const [visible, setVisible] = useState(() => readStorage(STORAGE_KEYS.globeHint) !== 'seen');
  return [visible, () => {
    if (!visible) return;
    setVisible(false);
    writeStorage(STORAGE_KEYS.globeHint, 'seen');
  }];
}

async function startMap(stage, isCancelled) {
  try {
    const { MapEngine } = await import('../../js/map.engine.js');
    if (isCancelled()) return;
    globe.map = new MapEngine(stage, {
      onHover: (countryKey, x, y) => app.set({ tooltip: countryKey && COUNTRIES[countryKey] ? { countryKey, x, y } : null }),
      onSelect: countryKey => selectCountry(countryKey),
      onCitySelect: city => selectCity(city),
      // Teclado no globo: o leitor de tela ouve o que está no centro.
      onAnnounce: announce,
      onRouteArrived: routeArrived,
      onProgress: message => app.set({ mapStatus: message }),
      onReady: () => {
        app.set({ mapReady: true });
        openFromHash();
        // Primeira visita, sem link de país ou cidade: tour curto.
        if (!location.hash && !tourSeen()) setTimeout(() => { if (!app.get().countryKey && !app.get().hub) app.set({ tourOpen: true }); }, 900);
      }
    });
    globe.map.setVisitedCountries?.(app.get().visited);
    syncFilters();
    await globe.map.init();
  } catch (error) {
    console.error('Traveling map initialization failed:', error);
    app.set({ mapFailed: true });
    openFromHash();
  }
}
