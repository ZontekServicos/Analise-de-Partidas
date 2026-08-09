export class FootballDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FootballDataError";
  }
}

export class FootballDataNotConfiguredError extends FootballDataError {
  constructor() {
    super("FOOTBALL_DATA_API_KEY nao configurada.");
    this.name = "FootballDataNotConfiguredError";
  }
}

export class FootballDataTimeoutError extends FootballDataError {
  constructor(url: string) {
    super(`Timeout ao chamar football-data.org (${url}).`);
    this.name = "FootballDataTimeoutError";
  }
}

export class FootballDataInvalidResponseError extends FootballDataError {
  constructor(url: string, detail: string) {
    super(`Resposta invalida da football-data.org (${url}): ${detail}`);
    this.name = "FootballDataInvalidResponseError";
  }
}

/** Erros HTTP mapeados por status: 400/401/403/404/429/5xx. */
export class FootballDataHttpError extends FootballDataError {
  public readonly status: number;
  public readonly url: string;

  constructor(status: number, url: string, message?: string) {
    super(message ?? `football-data.org respondeu ${status} para ${url}.`);
    this.name = "FootballDataHttpError";
    this.status = status;
    this.url = url;
  }
}

export class FootballDataRateLimitError extends FootballDataHttpError {
  public readonly retryAfterSeconds?: number;

  constructor(url: string, retryAfterSeconds?: number) {
    super(429, url, `football-data.org retornou 429 (rate limit) para ${url}.`);
    this.name = "FootballDataRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class FootballDataAuthError extends FootballDataHttpError {
  constructor(url: string, status: 401 | 403) {
    super(status, url, `football-data.org rejeitou a autenticacao (status ${status}) para ${url}.`);
    this.name = "FootballDataAuthError";
  }
}
