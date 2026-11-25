// Região viva única: o que muda na tela sem mover o foco é dito aqui.
import { useApp } from '../state/store.js';

export function Announcer() {
  const text = useApp(state => state.announcement);
  return <p className="sr-only" id="globe-announcer" role="status" aria-live="polite" aria-atomic="true">{text}</p>;
}
