// Backend do Traveling (Cloudflare Worker). Contrato: docs/PHASE-3.1-TRAVEL-INTEGRATION-ARCHITECTURE.md §8.
//
//   GET  /api/v1/providers/status
//   POST /api/v1/flights/search
//   POST /api/v1/hotels/search
//
// Credenciais de fornecedores existem SOMENTE em `env` (Secrets do Worker). Nada
// aqui fala com fornecedores reais ainda: a fase 3.2 usa o fornecedor fictício.
//
// Variáveis (wrangler.toml [vars], sem segredos):
//   ALLOWED_ORIGINS   origens do site, separadas por vírgula
//   SEARCH_ENABLED    "false" desliga as buscas (503 SEARCH_DISABLED)
//   FLIGHT_PROVIDERS  ids separados por vírgula (padrão "mock")
//   HOTEL_PROVIDERS   ids separados por vírgula (padrão "mock")
//   RATE_PER_MINUTE   buscas por cliente por minuto (padrão 10)
//   RATE_PER_DAY      buscas por cliente por dia (padrão 100)
import { API_VERSION, ApiError, LIMITS } from './contract.js';
import { validateFlightSearch, validateHotelSearch } from './validate.js';
import { checkFlightOffer, checkHotelOffer, checkHotelProperty, dedupeFlights, sortByPrice } from './models.js';
import { allProviders, providersFor } from './providers/index.js';
import { CircuitBreaker, ProviderMetrics, RateLimiter, TtlCache, cacheKey, withTimeout } from './reliability.js';

const TTL = Object.freeze({ live: 5 * 60_000, cached: 60 * 60_000, test: 5 * 60_000 });
const WARNINGS = Object.freeze({
  test: 'Dados de teste: preços, horários e hotéis são fictícios.',
  cached: 'Preços vistos recentemente por outros viajantes; podem ter mudado.',
  live: 'Preços sujeitos a alteração até a reserva.'
});

// Agrupa o cliente sem guardar o IP inteiro: IPv4 /24, IPv6 /48.
export function clientKey(request) {
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':');
  return ip.split('.').slice(0, 3).join('.');
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins(env).includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '600',
    vary: 'origin'
  };
}

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
  });
}

async function readBody(request) {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > LIMITS.maxBodyBytes) throw new ApiError('PAYLOAD_TOO_LARGE', 'Requisição grande demais.');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > LIMITS.maxBodyBytes) throw new ApiError('PAYLOAD_TOO_LARGE', 'Requisição grande demais.');
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('INVALID_REQUEST', 'O corpo precisa ser um JSON válido.');
  }
}

/**
 * Cria a aplicação com estado próprio (cache, limites, disjuntor). Em produção há
 * uma por isolate; nos testes, uma por cenário, com relógio injetável.
 */
export function createApp({ now = () => new Date(), log = line => console.log(JSON.stringify(line)) } = {}) {
  const cache = new TtlCache();
  const breaker = new CircuitBreaker();
  const metrics = new ProviderMetrics();
  const limiters = new Map();

  function limiter(name, limit, windowMs) {
    const key = `${name}:${limit}`;
    if (!limiters.has(key)) limiters.set(key, new RateLimiter({ limit, windowMs }));
    return limiters.get(key);
  }

  function checkRate(request, env) {
    const key = clientKey(request);
    const time = now().getTime();
    for (const [name, limit, windowMs] of [
      ['minute', Number(env.RATE_PER_MINUTE ?? 10), 60_000],
      ['day', Number(env.RATE_PER_DAY ?? 100), 86_400_000]
    ]) {
      const result = limiter(name, limit, windowMs).hit(key, time);
      if (!result.allowed) throw new ApiError('RATE_LIMITED', 'Muitas buscas em pouco tempo. Tente de novo em instantes.', { retryAfter: result.retryAfter });
    }
  }

  async function runProviders(kind, request, providers) {
    const timeoutMs = kind === 'flights' ? LIMITS.flightTimeoutMs : LIMITS.hotelTimeoutMs;
    // Voos e hotéis podem ter o mesmo id (ex.: mock): a saúde é contada por tipo.
    const slot = provider => `${kind}:${provider.id}`;
    const available = providers.filter(provider => !breaker.isOpen(slot(provider), now().getTime()));
    if (!available.length) throw new ApiError('PROVIDER_UNAVAILABLE', 'A busca está indisponível no momento. Tente mais tarde.');
    const started = available.map(() => Date.now());
    const settled = await Promise.allSettled(available.map((provider, index) => withTimeout(
      signal => (kind === 'flights' ? provider.searchFlights(request, { signal, now: now() }) : provider.searchHotels(request, { signal, now: now() })),
      timeoutMs - 1000
    ).finally(() => { started[index] = Date.now() - started[index]; })));
    const results = [];
    const failures = [];
    settled.forEach((outcome, index) => {
      const provider = available[index];
      metrics.record(slot(provider), { ms: started[index], ok: outcome.status === 'fulfilled', timeout: Boolean(outcome.reason?.timeout), at: now().getTime() });
      if (outcome.status === 'fulfilled') {
        breaker.success(slot(provider));
        results.push({ provider, value: outcome.value });
      } else {
        breaker.failure(slot(provider), now().getTime());
        failures.push({ provider, timeout: Boolean(outcome.reason?.timeout) });
      }
    });
    if (!results.length) {
      throw failures.every(failure => failure.timeout)
        ? new ApiError('PROVIDER_TIMEOUT', 'A busca demorou demais. Tente de novo.')
        : new ApiError('PROVIDER_ERROR', 'Não foi possível buscar agora. Tente de novo em instantes.');
    }
    return { results, failures };
  }

  async function searchFlights(request, env) {
    const { results, failures } = await runProviders('flights', request, providersFor('flights', env));
    let dropped = 0;
    const offers = results.flatMap(({ value }) => value.offers ?? []).filter(offer => {
      const ok = checkFlightOffer(offer).length === 0;
      if (!ok) dropped += 1;
      return ok;
    });
    return {
      offers: sortByPrice(dedupeFlights(offers)).slice(0, request.maxResults),
      providers: [...results.map(({ provider }) => ({ id: provider.id, status: 'ok', dataSource: provider.dataSource })),
        ...failures.map(({ provider, timeout }) => ({ id: provider.id, status: timeout ? 'timeout' : 'error', dataSource: provider.dataSource }))],
      partial: failures.length > 0,
      dropped
    };
  }

  async function searchHotels(request, env) {
    const { results, failures } = await runProviders('hotels', request, providersFor('hotels', env));
    let dropped = 0;
    const properties = new Map();
    for (const { value } of results) {
      for (const property of value.properties ?? []) {
        if (checkHotelProperty(property).length) dropped += 1;
        else properties.set(`${property.provider}:${property.propertyId}`, property);
      }
    }
    const offers = sortByPrice(results.flatMap(({ value }) => value.offers ?? []).filter(offer => {
      const ok = checkHotelOffer(offer).length === 0 && properties.has(`${offer.provider}:${offer.propertyId}`);
      if (!ok) dropped += 1;
      return ok;
    })).slice(0, request.maxResults);
    const used = new Set(offers.map(offer => `${offer.provider}:${offer.propertyId}`));
    return {
      properties: [...properties.entries()].filter(([key]) => used.has(key)).map(([, property]) => property),
      offers,
      providers: [...results.map(({ provider }) => ({ id: provider.id, status: 'ok', dataSource: provider.dataSource })),
        ...failures.map(({ provider, timeout }) => ({ id: provider.id, status: timeout ? 'timeout' : 'error', dataSource: provider.dataSource }))],
      partial: failures.length > 0,
      dropped
    };
  }

  // Quanto guardar: o menor entre a duração do tipo de dado e a expiração das ofertas;
  // resultado parcial (algum fornecedor falhou) não é guardado.
  function ttlFor(result) {
    if (result.partial) return 0;
    const sources = new Set(result.providers.map(provider => provider.dataSource));
    let ttl = Math.min(...[...sources].map(source => TTL[source] ?? 0));
    const time = now().getTime();
    for (const offer of result.offers) {
      if (offer.expiresAt) ttl = Math.min(ttl, Date.parse(offer.expiresAt) - time);
    }
    return Math.max(0, ttl);
  }

  function warningsFor(result) {
    return [...new Set(result.providers.filter(provider => provider.status === 'ok').map(provider => WARNINGS[provider.dataSource]).filter(Boolean))];
  }

  async function route(request, env, requestId) {
    const url = new URL(request.url);
    const base = `/api/${API_VERSION}`;
    if (url.pathname === `${base}/providers/status`) {
      if (request.method !== 'GET') throw new ApiError('METHOD_NOT_ALLOWED', 'Use GET.');
      const time = now().getTime();
      return json(200, {
        requestId,
        searchEnabled: env.SEARCH_ENABLED !== 'false',
        providers: allProviders(env).map(provider => ({ id: provider.id, kind: provider.kind, mode: provider.mode, dataSource: provider.dataSource, status: breaker.status(`${provider.kind}:${provider.id}`, time), recent: metrics.snapshot(`${provider.kind}:${provider.id}`) }))
      });
    }
    const kind = url.pathname === `${base}/flights/search` ? 'flights' : url.pathname === `${base}/hotels/search` ? 'hotels' : null;
    if (!kind) throw new ApiError('NOT_FOUND', 'Rota não encontrada.');
    if (request.method !== 'POST') throw new ApiError('METHOD_NOT_ALLOWED', 'Use POST.');
    if (env.SEARCH_ENABLED === 'false') throw new ApiError('SEARCH_DISABLED', 'A busca está temporariamente desligada.');
    const body = await readBody(request);
    const normalized = kind === 'flights' ? validateFlightSearch(body, { now: now() }) : validateHotelSearch(body, { now: now() });
    checkRate(request, env);
    const { value, cache: cacheState } = await cache.through(
      cacheKey(kind, normalized),
      () => (kind === 'flights' ? searchFlights(normalized, env) : searchHotels(normalized, env)),
      ttlFor
    );
    const payload = {
      requestId,
      status: value.partial ? 'partial' : 'ok',
      searchedAt: now().toISOString(),
      providers: value.providers,
      ...(kind === 'flights' ? { offers: value.offers } : { properties: value.properties, offers: value.offers }),
      warnings: warningsFor(value)
    };
    return json(200, payload, { 'x-cache': cacheState });
  }

  return {
    async fetch(request, env = {}) {
      const started = Date.now();
      const requestId = `req_${crypto.randomUUID()}`;
      const cors = corsHeaders(request, env);
      const origin = request.headers.get('origin');
      let response;
      let code = null;
      if (request.method === 'OPTIONS') {
        response = new Response(null, { status: Object.keys(cors).length ? 204 : 403, headers: cors });
      } else if (env.REQUIRE_ORIGIN !== 'false' && new URL(request.url).pathname !== `/api/${API_VERSION}/providers/status` && (!origin || !allowedOrigins(env).includes(origin))) {
        // Buscas só a partir do site (navegadores enviam Origin em POST com JSON).
        code = 'INVALID_REQUEST';
        response = json(403, { requestId, error: { code, message: 'Origem não autorizada.', retryable: false } });
      } else {
        try {
          response = await route(request, env, requestId);
        } catch (error) {
          const apiError = error instanceof ApiError ? error : new ApiError('PROVIDER_ERROR', 'Erro inesperado. Tente de novo.');
          if (!(error instanceof ApiError)) log({ level: 'error', requestId, message: String(error?.message ?? error) });
          code = apiError.code;
          response = json(apiError.status, { requestId, error: apiError.toJSON() }, apiError.retryAfter ? { 'retry-after': String(apiError.retryAfter) } : {});
        }
      }
      for (const [name, value] of Object.entries(cors)) response.headers.set(name, value);
      response.headers.set('x-request-id', requestId);
      // Registro sem dados pessoais: nada de IP, corpo da busca ou dados de passageiros.
      log({ requestId, method: request.method, path: new URL(request.url).pathname, status: response.status, code, cache: response.headers.get('x-cache'), ms: Date.now() - started });
      return response;
    }
  };
}

const app = createApp();
export default {
  fetch(request, env) {
    return app.fetch(request, env);
  }
};
