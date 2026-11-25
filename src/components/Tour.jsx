// Tour de boas-vindas: três passos na primeira visita, sem bloquear o globo. Some
// com "Pular", no último passo, com Esc ou ao abrir um país. Uma vez por navegador.
import { useEffect, useRef, useState } from 'react';
import { app, useApp } from '../state/store.js';

const KEY = 'traveling.tour';
const STEPS = [
  { target: '#globe-stage', title: 'Explore o mundo', text: 'Gire o globo e toque num país para ver o guia: visto para brasileiros, melhor época, preços e o que fazer. Prefere uma lista? Use o botão "Lista de países".' },
  { target: '#discover-button', title: 'Não sabe para onde ir?', text: 'Em Descobrir, diga o que você quer (praia, cultura, frio...) e o mês, e o Traveling sugere destinos.' },
  { target: '#trips-launcher', title: 'Planeje a viagem', text: 'Em Viagens, monte o roteiro passo a passo: voo, hospedagem, custo total e documentos.' }
];

function seen() {
  try { return localStorage.getItem(KEY) === 'done'; } catch { return true; }
}

function remember() {
  try { localStorage.setItem(KEY, 'done'); } catch { /* sem armazenamento */ }
}

export function Tour() {
  const open = useApp(state => state.tourOpen);
  const [available, setAvailable] = useState(() => !seen());
  const started = useRef(false);
  if (open) started.current = true;
  // Fechou por qualquer caminho: não volta.
  useEffect(() => {
    if (!open && started.current) {
      remember();
      setAvailable(false);
    }
  }, [open]);
  return open && available ? <TourCard /> : null;
}

function TourCard() {
  const [index, setIndex] = useState(0);
  const title = useRef(null);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const close = () => app.set({ tourOpen: false });

  useEffect(() => {
    const element = step.target === '#globe-stage' ? null : document.querySelector(step.target);
    element?.classList.add('tour-target');
    return () => element?.classList.remove('tour-target');
  }, [step]);

  return (
    <section className="tour" role="dialog" aria-labelledby="tour-title">
      <span className="tour__count">{index + 1} de {STEPS.length}</span>
      <h2 id="tour-title" tabIndex={-1} ref={title}>{step.title}</h2>
      <p>{step.text}</p>
      <div className="tour__actions">
        <button className="secondary-button" type="button" data-tour="skip" onClick={close}>{last ? 'Fechar' : 'Pular'}</button>
        {last
          ? <button className="primary-button" type="button" data-tour="done" onClick={close}>Começar</button>
          : <button className="primary-button" type="button" data-tour="next" onClick={() => { setIndex(index + 1); requestAnimationFrame(() => title.current?.focus({ preventScroll: true })); }}>Próximo</button>}
      </div>
    </section>
  );
}
