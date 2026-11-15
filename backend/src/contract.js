// Contrato da API interna do Traveling (docs/PHASE-3.1-TRAVEL-INTEGRATION-ARCHITECTURE.md §8).
// Constantes compartilhadas por validação, roteamento e testes. Sem dependências.

export const API_VERSION = 'v1';

export const LIMITS = Object.freeze({
  maxBodyBytes: 2048,
  maxPassengers: 9,
  maxRooms: 4,
  maxNights: 30,
  maxDaysAhead: 330,
  maxResults: 50,
  defaultResults: 20,
  maxRadiusKm: 50,
  defaultRadiusKm: 10,
  flightTimeoutMs: 12_000,
  hotelTimeoutMs: 10_000
});

export const CABINS = Object.freeze(['economy', 'premium', 'business', 'first']);
export const DATA_SOURCES = Object.freeze(['live', 'cached', 'test']);
export const BOARDS = Object.freeze(['room-only', 'breakfast', 'half-board', 'full-board', 'all-inclusive']);
export const AVAILABILITY = Object.freeze(['available', 'on-request', 'unconfirmed', 'sold-out']);
export const OFFER_STATUSES = Object.freeze(['available', 'expired', 'unconfirmed']);

// Código interno → status HTTP. O front nunca recebe a mensagem crua do fornecedor.
export const ERRORS = Object.freeze({
  INVALID_REQUEST: 400,
  INVALID_AIRPORT: 400,
  INVALID_DATES: 400,
  INVALID_PASSENGERS: 400,
  INVALID_DESTINATION: 400,
  PAYLOAD_TOO_LARGE: 413,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INVALID_ROUTE: 422,
  UNSUPPORTED_CABIN: 422,
  RATE_LIMITED: 429,
  PROVIDER_ERROR: 502,
  PROVIDER_UNAVAILABLE: 503,
  SEARCH_DISABLED: 503,
  PROVIDER_TIMEOUT: 504
});

// Erros em que tentar de novo pode funcionar (o front pode oferecer "Tentar novamente").
export const RETRYABLE = new Set(['RATE_LIMITED', 'PROVIDER_ERROR', 'PROVIDER_UNAVAILABLE', 'PROVIDER_TIMEOUT']);

export class ApiError extends Error {
  constructor(code, message, { field = null, retryAfter = null } = {}) {
    super(message);
    if (!Object.hasOwn(ERRORS, code)) throw new Error(`Código de erro desconhecido: ${code}`);
    this.code = code;
    this.status = ERRORS[code];
    this.field = field;
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.field ? { field: this.field } : {}),
      retryable: RETRYABLE.has(this.code)
    };
  }
}
