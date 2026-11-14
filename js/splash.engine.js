const SEEN_KEY = 'traveling.splash.seen';

function readSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Sem armazenamento: a animação volta a tocar, como antes.
  }
}

/**
 * Small state machine for the brand reveal (wordmark + hairline).
 * It does not wait for remote map assets: the dashboard remains usable if the
 * world-atlas request is slow or fails after the cinematic reveal.
 */
export class SplashEngine {
  constructor(root) {
    this.root = root;
    this.state = 'idle';
    this.finishTimer = 0;
    this.onAnimationEnd = event => {
      if (event.target !== this.root || event.animationName !== 'splashReveal') return;
      this.#remove();
    };
    this.root?.addEventListener('animationend', this.onAnimationEnd);
  }

  play() {
    if (!this.root || this.state !== 'idle') return;
    // A animação completa roda uma vez por sessão do navegador; nas próximas
    // aberturas a tela de abertura só esmaece assim que o app está pronto.
    if (readSeen()) {
      this.state = 'flying';
      this.exit();
      return;
    }
    markSeen();
    this.state = 'flying';
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion ? 180 : 1100;
    this.finishTimer = window.setTimeout(() => this.exit(), duration);
  }

  exit() {
    if (!this.root || this.state === 'removed' || this.state === 'exiting') return;
    this.state = 'exiting';
    this.root.classList.add('splash-screen--exit');
    // The timer is a fallback for browsers where transition animation events
    // are skipped because of a reduced-motion or rendering preference.
    window.setTimeout(() => this.#remove(), 720);
  }

  #remove() {
    if (!this.root || this.state === 'removed') return;
    this.state = 'removed';
    this.root.removeEventListener('animationend', this.onAnimationEnd);
    this.root.remove();
    this.root = null;
  }

  destroy() {
    window.clearTimeout(this.finishTimer);
    this.#remove();
  }
}
