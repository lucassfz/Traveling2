// Foco e anúncios para quem navega por teclado ou leitor de tela.
import { app } from './store.js';

// Último jeito de interagir: decide se abrir um painel deve mover o foco.
let modality = 'pointer';
export const usingKeyboard = () => modality === 'keyboard';

export function trackModality() {
  const keyboard = () => { modality = 'keyboard'; };
  const pointer = () => { modality = 'pointer'; };
  document.addEventListener('keydown', keyboard, true);
  document.addEventListener('pointerdown', pointer, true);
  return () => {
    document.removeEventListener('keydown', keyboard, true);
    document.removeEventListener('pointerdown', pointer, true);
  };
}

/** Frase curta para o leitor de tela (região viva em components/Announcer.jsx). */
export function announce(text) {
  if (app.get().announcement === text) {
    // Repetir a mesma frase só é lido de novo se o texto mudar.
    app.set({ announcement: '' });
    requestAnimationFrame(() => app.set({ announcement: text }));
  } else app.set({ announcement: text });
}

const focusable = element => element?.isConnected && !element.closest('[inert], [hidden]') && element.getClientRects().length > 0;

// Quem abriu cada painel: ao fechar, o foco volta para esse elemento.
const openers = new Map();
export function rememberOpener(name, element = document.activeElement) {
  openers.delete(name);
  if (element && element !== document.body) openers.set(name, element);
}

/** Devolve o foco a quem abriu o painel; sem ele, ao elemento de reserva. */
export function restoreFocus(name, fallbackId = 'home-button') {
  const opener = openers.get(name);
  openers.delete(name);
  requestAnimationFrame(() => {
    const fallback = document.getElementById(fallbackId);
    const target = focusable(opener) ? opener : focusable(fallback) ? fallback : document.getElementById('home-button');
    target?.focus({ preventScroll: true });
  });
}

/** Foca um elemento depois que o React desenhar (espera até ~2 s por módulos sob demanda). */
export function focusSoon(selector) {
  let tries = 0;
  const attempt = () => {
    const element = document.querySelector(selector);
    if (focusable(element)) element.focus({ preventScroll: true });
    else if (tries++ < 120) requestAnimationFrame(attempt);
  };
  requestAnimationFrame(attempt);
}
