const DEFAULT_PARTICLE_COUNT = 140;

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

/**
 * Lightweight ambient starfield. It is intentionally independent from Three.js:
 * the WebGL scene remains dedicated to geography and the stars are never raycast.
 * The field is static: it is painted only on resize or theme change, so the
 * page never wakes up just to animate the background.
 */
export class StarfieldEngine {
  constructor(canvas, { particleCount = DEFAULT_PARTICLE_COUNT } = {}) {
    this.canvas = canvas;
    this.context = canvas?.getContext?.('2d', { alpha: true });
    this.particleCount = particleCount;
    this.particles = [];
    this.isDark = false;
    this.destroyed = false;
    this.onResize = () => this.#resize();

    if (!this.context) return;
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(this.canvas);
    this.setTheme(document.documentElement.dataset.theme || 'dark');
  }

  setTheme(theme) {
    this.isDark = theme === 'dark';
    this.canvas?.classList.toggle('starfield--visible', this.isDark);
    if (!this.context) return;
    if (!this.isDark) {
      this.context.clearRect(0, 0, this.width || 0, this.height || 0);
      return;
    }
    this.#draw();
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
        radius: randomBetween(0.35, 1.1),
        opacity: randomBetween(0.06, 0.3)
      }));
    }
    if (this.isDark) this.#draw();
  }

  #draw() {
    if (!this.context || !this.width || !this.height) return;
    this.context.clearRect(0, 0, this.width, this.height);
    for (const particle of this.particles) {
      this.context.beginPath();
      this.context.arc(particle.x * this.width, particle.y * this.height, particle.radius, 0, Math.PI * 2);
      this.context.fillStyle = `rgba(226, 232, 240, ${particle.opacity})`;
      this.context.fill();
    }
  }

  destroy() {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.context?.clearRect(0, 0, this.width || 0, this.height || 0);
  }
}
