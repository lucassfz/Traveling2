/**
 * Small state machine for the SVG flight opener.
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
    this.state = 'flying';
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      this.root.querySelector('#splash-flight')?.beginElement?.();
    }
    const duration = prefersReducedMotion ? 180 : 2640;
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
