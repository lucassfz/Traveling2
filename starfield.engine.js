const DEFAULT_PARTICLE_COUNT = 108;

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

/**
 * Lightweight ambient starfield. It is intentionally independent from Three.js:
 * the WebGL scene remains dedicated to geography and the stars are never raycast.
 */
export class StarfieldEngine {
  constructor(canvas, { particleCount = DEFAULT_PARTICLE_COUNT } = {}) {
    this.canvas = canvas;
    this.context = canvas?.getContext?.('2d', { alpha: true });
    this.particleCount = particleCount;
    this.particles = [];
    this.frameId = 0;
    this.isDark = false;
    this.destroyed = false;
    this.reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = Boolean(this.reducedMotionQuery?.matches);

    this.onResize = () => this.#resize();
    this.onReducedMotionChange = event => {
      this.prefersReducedMotion = event.matches;
      this.#scheduleFrame();
    };

    if (!this.context) return;
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(this.canvas);
    this.reducedMotionQuery?.addEventListener?.('change', this.onReducedMotionChange);
    this.setTheme(document.documentElement.dataset.theme || 'dark');
  }

  setTheme(theme) {
    this.isDark = theme === 'dark';
    this.canvas?.classList.toggle('starfield--visible', this.isDark);
    if (!this.context) return;
    if (!this.isDark) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
      this.context.clearRect(0, 0, this.width || 0, this.height || 0);
      return;
    }
    this.#scheduleFrame();
  }

  #resize() {
    if (!this.context || this.destroyed) return;
    const { width, height } = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(this.width * pixelRatio);
    this.canvas.height = Math.round(this.height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (!this.particles.length) {
      this.particles = Array.from({ length: this.particleCount }, () => ({
        x: Math.random(),
        y: Math.random(),
        radius: randomBetween(0.45, 1.2),
        opacity: randomBetween(0.07, 0.24),
        phase: randomBetween(0, Math.PI * 2),
        speed: randomBetween(0.00035, 0.0011)
      }));
    }
    if (this.isDark) this.#draw(performance.now());
  }

  #scheduleFrame() {
    if (!this.isDark || this.destroyed || this.frameId) return;
    if (this.prefersReducedMotion) {
      this.#draw(performance.now());
      return;
    }
    this.frameId = requestAnimationFrame(timestamp => this.#render(timestamp));
  }

  #render(timestamp) {
    this.frameId = 0;
    if (!this.isDark || this.destroyed) return;
    this.#draw(timestamp);
    this.#scheduleFrame();
  }

  #draw(timestamp) {
    if (!this.context || !this.width || !this.height) return;
    this.context.clearRect(0, 0, this.width, this.height);
    for (const particle of this.particles) {
      const twinkle = this.prefersReducedMotion
        ? 1
        : 0.72 + Math.sin(timestamp * particle.speed + particle.phase) * 0.28;
      this.context.beginPath();
      this.context.arc(particle.x * this.width, particle.y * this.height, particle.radius, 0, Math.PI * 2);
      this.context.fillStyle = `rgba(226, 232, 240, ${particle.opacity * twinkle})`;
      this.context.fill();
    }
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.reducedMotionQuery?.removeEventListener?.('change', this.onReducedMotionChange);
    this.context?.clearRect(0, 0, this.width || 0, this.height || 0);
  }
}
