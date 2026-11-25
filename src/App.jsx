// Estrutura da página. A ordem aqui é a ordem do Tab: atalhos, cabeçalho, globo,
// filtros e, por fim, os painéis (que recebem o foco quando abrem).
import { Suspense, lazy, useEffect, useState } from 'react';
import { COUNTRIES } from '../js/countries.dataset.js';
import { app, useApp } from './state/store.js';
import { globe } from './state/services.js';
import { closeCountry, closeTopLayer, openHub, openFromHash, setHelpOpen } from './state/actions.js';
import { Announcer } from './components/Announcer.jsx';
import { Header } from './components/Header.jsx';
import { Globe } from './components/Globe.jsx';
import { Dock } from './components/Dock.jsx';
import { HubPanel } from './components/HubPanel.jsx';
import { Saved } from './components/Saved.jsx';
import { Places } from './components/Places.jsx';
import { CountryPanel } from './country/CountryPanel.jsx';
import { RoutePreview } from './components/RoutePreview.jsx';
import { A11yPanel } from './components/A11yPanel.jsx';
import { HelpDialog } from './components/HelpDialog.jsx';
import { Tour } from './components/Tour.jsx';
import { Tooltip } from './components/Tooltip.jsx';

const MilesHub = lazy(() => import('./components/MilesHub.jsx'));
const Planner = lazy(() => import('./planner/Planner.jsx'));
const Discovery = lazy(() => import('./components/Discovery.jsx'));

// Painéis sob demanda: montam na primeira abertura e ficam (guardam o estado).
function useOnce(open) {
  const [seen, setSeen] = useState(open);
  if (open && !seen) setSeen(true);
  return seen || open;
}

export function App({ onReady }) {
  const hub = useApp(state => state.hub);
  const discoveryOpen = useApp(state => state.discoveryOpen);
  const routeActive = useApp(state => Boolean(state.route));
  const countryKey = useApp(state => (state.countryOpen ? state.countryKey : null));
  const milesReady = useOnce(hub === 'miles');
  const plannerReady = useOnce(hub === 'planner');
  const discoveryReady = useOnce(discoveryOpen);

  useEffect(() => { onReady(); }, [onReady]);

  // O título da aba acompanha o país: é a primeira coisa que o leitor de tela diz.
  useEffect(() => {
    document.title = countryKey ? `${COUNTRIES[countryKey].namePt} — Traveling` : 'Traveling — Explore o mundo';
  }, [countryKey]);

  useGlobalKeys();

  useEffect(() => {
    const onHash = () => openFromHash();
    const query = window.matchMedia('(max-width: 1199px)');
    const onNarrow = event => { if (event.matches && app.get().hub && app.get().countryOpen) closeCountry(); };
    window.addEventListener('hashchange', onHash);
    query.addEventListener('change', onNarrow);
    return () => {
      window.removeEventListener('hashchange', onHash);
      query.removeEventListener('change', onNarrow);
    };
  }, []);

  return (
    <>
      <SkipLinks />
      <h1 className="sr-only">Traveling: explore o mundo</h1>
      <Header inert={routeActive} />
      <Globe />
      <Dock inert={routeActive} />

      <HubPanel hub="miles" open={hub === 'miles'} inert={routeActive} label="Milhas e pontos" eyebrow="Milhas" title="Milhas e pontos" subtitle="Converta pontos, veja quanto valem e se compensa usar." closeLabel="Fechar Milhas e Aeroportos">
        {milesReady && <Suspense fallback={<p className="planner-empty">Carregando…</p>}><MilesHub /></Suspense>}
      </HubPanel>
      <HubPanel hub="planner" open={hub === 'planner'} inert={routeActive} id="planner-panel" className="planner-panel" label="Planejamento de viagem" eyebrow="Planejamento de viagem" title="Minhas viagens" closeLabel="Fechar planejamento" reset>
        <div className="planner" id="planner-content">
          {plannerReady && <Suspense fallback={<p className="planner-empty">Carregando…</p>}><Planner /></Suspense>}
        </div>
      </HubPanel>
      <HubPanel hub="saved" open={hub === 'saved'} inert={routeActive} id="saved-panel" className="saved-panel" label="Destinos salvos" eyebrow="Para ver depois" title="Destinos salvos" subtitle="Países, cidades e lugares que chamaram sua atenção. Salvar não cria viagem." closeLabel="Fechar destinos salvos" reset>
        {hub === 'saved' && <Saved />}
      </HubPanel>
      <HubPanel hub="places" open={hub === 'places'} inert={routeActive} id="places-panel" className="places-panel" label="Lista de países" eyebrow="Sem usar o globo" title="Lista de países" subtitle="Todos os países por continente. Escolha um para abrir o guia." closeLabel="Fechar lista de países">
        {hub === 'places' && <Places />}
      </HubPanel>

      <CountryPanel inert={routeActive} />
      <Tooltip />
      <aside className="discovery-panel" id="discovery-panel" aria-labelledby="discovery-title" hidden={!discoveryOpen} inert={routeActive}>
        {discoveryReady && <Suspense fallback={<p className="planner-empty">Carregando…</p>}><Discovery open={discoveryOpen} /></Suspense>}
      </aside>
      <RoutePreview />
      <A11yPanel />
      <HelpDialog />
      <Tour />
      <Announcer />
    </>
  );
}

// Primeiros itens do Tab: levam direto ao que interessa sem passar pelo cabeçalho.
function SkipLinks() {
  const go = id => event => {
    event.preventDefault();
    document.getElementById(id)?.focus();
  };
  return (
    <nav className="skip-links" aria-label="Atalhos">
      <a className="skip-link" href="#country-search-input" onClick={go('country-search-input')}>Pular para a busca de países</a>
      <a className="skip-link" href="#places-panel" onClick={event => { event.preventDefault(); openHub('places', { opener: event.currentTarget }); }}>Abrir a lista de países</a>
      <a className="skip-link" href="#globe-stage" onClick={go('globe-stage')}>Pular para o globo</a>
      <a className="skip-link" href="#help" onClick={event => { event.preventDefault(); setHelpOpen(true); }}>Atalhos de teclado</a>
    </nav>
  );
}

function useGlobalKeys() {
  useEffect(() => {
    const onKey = event => {
      const typing = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
      const { route, a11y, helpOpen } = app.get();
      // Com a ajuda aberta (diálogo modal), o teclado é dela.
      if (helpOpen) return;
      if (event.key === 'Escape') {
        if (!event.defaultPrevented) closeTopLayer();
        return;
      }
      const plain = !typing && !event.ctrlKey && !event.metaKey && !event.altKey && a11y.shortcuts;
      const searchKey = (event.key === '/' && plain) || (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey));
      if (searchKey && !route) {
        event.preventDefault();
        app.set({ searchOpen: true });
        const input = document.getElementById('country-search-input');
        input?.focus();
        input?.select();
        return;
      }
      if (event.key === '?' && plain) {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }
      // Sem nada em foco, as setas e + − movem o globo (Enter solto não escolhe nada).
      const active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) return;
      if (event.key === 'Enter' || event.key === ' ') return;
      globe.map?.handleKey(event);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
