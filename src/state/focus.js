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

// Um pedido de foco por vez: o mais novo cancela o anterior. Repete por até ~2 s
// porque o destino pode não existir ainda (módulo sob demanda) ou estar no começo
// da animação de abertura (visibility: hidden), quando focus() é ignorado.
let request = 0;
function moveFocus(find, { tries = 120 } = {}) {
  const id = ++request;
  const start = document.activeElement;
  let left = tries;
  const attempt = () => {
    if (id !== request) return;
    const active = document.activeElement;
    // A pessoa já foi para outro lugar: não puxa o foco de volta.
    if (active !== start && active !== document.body && active?.isConnected) return;
    const target = find();
    if (target) {
      target.focus({ preventScroll: true });
      if (document.activeElement === target) return;
    }
    left -= 1;
    if (left > 0) requestAnimationFrame(attempt);
  };
  requestAnimationFrame(attempt);
}

const usable = element => (element?.isConnected && !element.closest('[inert], [hidden]') && element.getClientRects().length > 0 ? element : null);

/** Foca um elemento assim que ele puder receber o foco. */
export function focusSoon(selector) {
  moveFocus(() => usable(document.querySelector(selector)));
}

// Quem abriu cada painel: ao fechar, o foco volta para esse elemento.
const openers = new Map();
export function rememberOpener(name, element = document.activeElement) {
  openers.delete(name);
  if (element && element !== document.body) openers.set(name, element);
}

/** Devolve o foco a quem abriu o painel; sem ele, ao elemento de reserva ou à marca. */
export function restoreFocus(name, fallbackId = 'home-button') {
  const opener = openers.get(name);
  openers.delete(name);
  moveFocus(() => usable(opener) ?? usable(document.getElementById(fallbackId)) ?? usable(document.getElementById('home-button')));
}

/** Devolve o foco a um elemento específico, se ele ainda existir. */
export function focusElement(element, fallbackId = 'home-button') {
  moveFocus(() => usable(element) ?? usable(document.getElementById(fallbackId)));
}
