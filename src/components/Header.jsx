import { useEffect, useRef } from 'react';
import { app, useApp, useExternal } from '../state/store.js';
import { savedStore, tripStore } from '../state/services.js';
import { home, openDiscovery, setA11yOpen, toggleHub, toggleTheme } from '../state/actions.js';
import { Icon } from './ui.jsx';
import { Search } from './Search.jsx';

export function Header({ inert }) {
  const header = useRef(null);
  const brand = useRef(null);
  const actions = useRef(null);
  const hub = useApp(state => state.hub);
  const theme = useApp(state => state.theme);
  const discoveryOpen = useApp(state => state.discoveryOpen);
  const a11yOpen = useApp(state => state.a11yOpen);
  const listening = useApp(state => state.listening);
  const trips = useExternal(tripStore, () => tripStore.trips).length;
  const saved = useExternal(savedStore, () => savedStore.items).length;

  // As duas laterais recebem a largura da maior, para a busca ficar no centro.
  useEffect(() => {
    if (!('ResizeObserver' in window)) return undefined;
    const sides = [brand.current, actions.current];
    const sync = () => header.current?.style.setProperty('--header-side', `${Math.ceil(Math.max(...sides.map(side => side.scrollWidth)))}px`);
    const observer = new ResizeObserver(sync);
    sides.forEach(side => observer.observe(side));
    sync();
    return () => observer.disconnect();
  }, []);

  return (
    <header className="app-header" ref={header} inert={inert}>
      <button className="app-header__brand" id="home-button" type="button" aria-label="Traveling: voltar à visão global" ref={brand} onClick={home}>
        <Icon name="globe" className="app-header__brand-mark" />
        <span className="app-header__brand-word">Traveling</span>
      </button>

      <Search />

      <nav className="app-header__actions" aria-label="Principal" ref={actions}>
        <button className="header-action header-action--search" id="search-toggle" type="button" aria-label="Buscar país" aria-controls="country-search"
          onClick={() => { app.set({ searchOpen: true }); requestAnimationFrame(() => document.getElementById('country-search-input')?.focus()); }}>
          <Icon name="search" />
        </button>
        <button className="header-action header-action--primary" id="discover-button" type="button" aria-label="Descobrir destino" title="Encontrar um destino para sua viagem" aria-expanded={discoveryOpen} aria-controls="discovery-panel" onClick={openDiscovery}>
          <Icon name="spark" /><span className="header-action__label">Descobrir</span>
        </button>
        <button className="header-action" id="trips-launcher" type="button" aria-expanded={hub === 'planner'} aria-controls="planner-panel" title="Planejar viagem"
          aria-label={trips ? `Viagens (${trips} ${trips === 1 ? 'salva' : 'salvas'})` : 'Viagens'} onClick={() => toggleHub('planner')}>
          <Icon name="suitcase" /><span className="header-action__label">Viagens</span>
          <span className="header-action__badge" id="trips-count" hidden={!trips}>{trips}</span>
        </button>
        <button className="header-action" id="saved-launcher" type="button" aria-expanded={hub === 'saved'} aria-controls="saved-panel" title="Destinos salvos"
          aria-label={saved ? `Salvos: ${saved} ${saved === 1 ? 'destino' : 'destinos'}` : 'Salvos: destinos para ver depois'} onClick={() => toggleHub('saved')}>
          <Icon name="bookmark" /><span className="header-action__label">Salvos</span>
          <span className="header-action__badge" id="saved-count" hidden={!saved}>{saved}</span>
        </button>
        <button className="header-action" id="miles-launcher" type="button" aria-expanded={hub === 'miles'} aria-controls="miles-hub" aria-label="Milhas e aeroportos" title="Milhas e aeroportos" onClick={() => toggleHub('miles')}>
          <Icon name="plane" /><span className="header-action__label">Milhas</span>
        </button>
        <button className={`header-action${listening ? ' header-action--live' : ''}`} id="a11y-button" type="button" aria-expanded={a11yOpen} aria-controls="a11y-panel" aria-label="Acessibilidade: voz, leitura em voz alta, texto maior" title="Acessibilidade" onClick={() => setA11yOpen(!a11yOpen)}>
          <Icon name="access" />
        </button>
        <button className="header-action header-action--theme" id="theme-button" type="button" aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} onClick={toggleTheme}>
          <Icon name="sun" className="icon--sun" />
          <Icon name="moon" className="icon--moon" />
        </button>
      </nav>
    </header>
  );
}
