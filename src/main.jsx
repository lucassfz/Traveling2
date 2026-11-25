// Ponto de entrada: monta o React em #root e libera a interface. O globo 3D e os
// painéis pesados (Milhas, Planejador, Descobrir) carregam depois, sob demanda.
import { createRoot } from 'react-dom/client';
import { SplashEngine } from '../js/splash.engine.js';
import { loadFxSnapshot, resolveUsdRate } from '../js/fx.service.js';
import { loadHistoryCatalog } from '../js/history.loader.js';
import { App } from './App.jsx';
import { app } from './state/store.js';
import { airports, globe } from './state/services.js';
import { setTheme } from './state/actions.js';
import { trackModality } from './state/focus.js';

const splash = new SplashEngine(document.getElementById('splash-screen'));

setTheme(app.get().theme);
trackModality();
app.set({ originAirport: airports.coreAirports.find(airport => airport.iata === 'GRU') ?? null });

// Dentro de um <iframe> de outro site, não monta a interface (clickjacking): o GitHub
// Pages não deixa enviar X-Frame-Options, e frame-ancestors não vale em <meta>.
function framedByOther() {
  if (window.top === window.self) return false;
  try { return window.top.location.origin !== location.origin; } catch { return true; }
}

const root = createRoot(document.getElementById('root'));
if (framedByOther()) {
  root.render(<p className="boot-error"><a href={location.href} target="_top">Abrir o Traveling</a></p>);
  markReady();
} else root.render(<App onReady={markReady} />);

// Só depois da primeira pintura do React: some a tela de abertura.
function markReady() {
  window.__travelingBoot = { ...window.__travelingBoot, interactive: true };
  requestAnimationFrame(() => splash.play());
}

resolveUsdRate().then(rate => app.set({ brlPerUsd: rate })).catch(() => {});
loadFxSnapshot().then(snapshot => app.set({ fxSnapshot: snapshot })).catch(() => {});

// Com o navegador ocioso, baixa o que costuma ser aberto depois.
const prefetch = () => {
  loadHistoryCatalog().catch(() => {});
  import('./components/MilesHub.jsx').catch(() => {});
  import('./components/Discovery.jsx').catch(() => {});
};
if ('requestIdleCallback' in window) window.requestIdleCallback(prefetch, { timeout: 6000 });
else window.setTimeout(prefetch, 4000);

// Modo offline e instalação como app (sw.js: rede primeiro, cópia só sem internet).
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

window.addEventListener('pagehide', () => {
  globe.map?.destroy();
  splash.destroy();
}, { once: true });
