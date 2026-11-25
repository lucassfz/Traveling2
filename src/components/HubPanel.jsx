// Moldura dos painéis da esquerda. Fechado, sai do Tab e do leitor de tela (inert).
import { useEffect, useRef } from 'react';
import { closeHub, resetToGlobe } from '../state/actions.js';
import { CloseButton } from './ui.jsx';

export function HubPanel({ hub, id = `${hub}-hub`, open, inert = false, className = '', label, eyebrow, title, subtitle, closeLabel, reset = false, children }) {
  const panel = useRef(null);
  useEffect(() => { if (open) panel.current?.scrollTo({ top: 0 }); }, [open]);
  return (
    <aside className={`miles-hub ${className}${open ? ' miles-hub--open' : ''}`} id={id} data-hub={hub} aria-label={label} inert={!open || inert} ref={panel}>
      <header className="miles-hub__header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="miles-hub__title" tabIndex={-1}>{title}</h2>
          {subtitle && <p className="miles-hub__subtitle">{subtitle}</p>}
        </div>
        <CloseButton id={`${hub}-close-button`} label={closeLabel} onClick={() => (reset ? resetToGlobe() : closeHub({ restore: true }))} />
      </header>
      {children}
    </aside>
  );
}
