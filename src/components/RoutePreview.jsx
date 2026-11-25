// Cartão da rota em destaque no globo.
import { app, useApp } from '../state/store.js';
import { openHub } from '../state/actions.js';
import { closeRoute } from '../state/route.js';
import { CloseButton, Provenance } from './ui.jsx';

export function RoutePreview() {
  const route = useApp(state => state.route);
  const openLounges = () => {
    const code = route.airportCode;
    closeRoute();
    app.set({ milesRequest: { code } });
    openHub('miles');
  };
  return (
    <section className="flight-preview-panel" id="flight-preview-panel" aria-label="Visualização da rota" hidden={!route}>
      <div className="flight-preview-panel__header">
        <span className="eyebrow">Rota de referência</span>
        <CloseButton id="flight-preview-close" label="Fechar visualização da rota" onClick={() => closeRoute({ restore: true })} />
      </div>
      {route && (
        <>
          <strong id="flight-preview-title">{route.title}</strong>
          <span id="flight-preview-codes">{route.codes}</span>
          <small aria-hidden="true">● Origem · ○ Destino</small>
          <p id="flight-preview-details">{route.details}</p>
          <Provenance kind="estimate" detail="distância em linha geodésica; tempo de viagem estimado, não um voo direto ou horário de companhia aérea" />
          {route.airportCode && <button className="route-preview-airports" id="flight-preview-airports" type="button" onClick={openLounges}>Ver salas VIP · {route.airportCode}</button>}
        </>
      )}
    </section>
  );
}
