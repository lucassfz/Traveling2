// Confiabilidade (§9 do documento da fase 3.1): cache curto, coalescência de
// buscas idênticas, limite por cliente e disjuntor por fornecedor.
//
// Estado em memória do isolate do Worker: é "melhor esforço" (cada isolate tem o
// seu e ele some quando o isolate é reciclado). Para limites globais e cache
// compartilhado, o Worker pode receber um namespace KV (binding TRAVEL_KV) e o
// recurso de rate limiting da Cloudflare; esta camada mantém a mesma interface.

export class TtlCache {
  constructor({ maxEntries = 200 } = {}) {
    this.entries = new Map();
    this.inflight = new Map();
    this.maxEntries = maxEntries;
  }

  get(key, now = Date.now()) {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= now) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs, now = Date.now()) {
    if (ttlMs <= 0) return;
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: now + ttlMs });
    while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value);
  }

  /**
   * Devolve do cache; senão executa `task` uma única vez mesmo com chamadas
   * simultâneas para a mesma chave (as demais aguardam o mesmo resultado).
   * `ttlFor(result)` decide quanto tempo guardar (0 = não guardar, ex.: erro parcial).
   */
  async through(key, task, ttlFor, now = Date.now()) {
    const cached = this.get(key, now);
    if (cached) return { value: cached, cache: 'hit' };
    if (this.inflight.has(key)) return { value: await this.inflight.get(key), cache: 'coalesced' };
    const promise = task();
    this.inflight.set(key, promise);
    try {
      const value = await promise;
      this.set(key, value, ttlFor(value));
      return { value, cache: 'miss' };
    } finally {
      this.inflight.delete(key);
    }
  }
}

// Janela fixa por chave (ex.: IP truncado). Devolve { allowed, retryAfter }.
export class RateLimiter {
  constructor({ limit, windowMs }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.windows = new Map();
  }

  hit(key, now = Date.now()) {
    const start = Math.floor(now / this.windowMs) * this.windowMs;
    const entry = this.windows.get(key);
    if (!entry || entry.start !== start) {
      this.windows.set(key, { start, count: 1 });
      if (this.windows.size > 5000) this.#prune(start);
      return { allowed: true, retryAfter: 0 };
    }
    entry.count += 1;
    if (entry.count <= this.limit) return { allowed: true, retryAfter: 0 };
    return { allowed: false, retryAfter: Math.ceil((start + this.windowMs - now) / 1000) };
  }

  #prune(currentStart) {
    for (const [key, entry] of this.windows) if (entry.start !== currentStart) this.windows.delete(key);
  }
}

// Disjuntor: após `threshold` falhas seguidas, o fornecedor fica "degraded" por
// `cooldownMs` e não é chamado; o status informa o front.
export class CircuitBreaker {
  constructor({ threshold = 3, cooldownMs = 120_000 } = {}) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
    this.state = new Map();
  }

  isOpen(id, now = Date.now()) {
    const entry = this.state.get(id);
    return Boolean(entry && entry.openUntil > now);
  }

  status(id, now = Date.now()) {
    return this.isOpen(id, now) ? 'degraded' : 'operational';
  }

  success(id) {
    this.state.delete(id);
  }

  failure(id, now = Date.now()) {
    const entry = this.state.get(id) ?? { failures: 0, openUntil: 0 };
    entry.failures += 1;
    if (entry.failures >= this.threshold) {
      entry.openUntil = now + this.cooldownMs;
      entry.failures = 0;
    }
    this.state.set(id, entry);
  }
}

/** Executa com prazo; rejeita com { timeout: true } ao estourar e aborta o fornecedor. */
export async function withTimeout(task, ms) {
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(Object.assign(new Error('timeout'), { timeout: true }));
    }, ms);
  });
  try {
    return await Promise.race([task(controller.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Chave de cache estável a partir da requisição já normalizada (sem dados pessoais). */
export function cacheKey(kind, request) {
  const stable = value => (value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value);
  return `${kind}:${JSON.stringify(stable(request))}`;
}
