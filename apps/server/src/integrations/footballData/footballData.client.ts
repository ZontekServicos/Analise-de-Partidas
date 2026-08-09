import { env } from "../../config/env";
import {
  FootballDataAuthError,
  FootballDataHttpError,
  FootballDataInvalidResponseError,
  FootballDataNotConfiguredError,
  FootballDataRateLimitError,
  FootballDataTimeoutError
} from "./footballData.errors";

const DEFAULT_TIMEOUT_MS = 10_000;
const LOW_QUOTA_THRESHOLD = 5;

const parseFiniteHeaderNumber = (value: string | null): number | null => {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export type FootballDataQuotaState = {
  requestsAvailable: number | null;
  requestCounterReset: number | null;
  apiVersion: string | null;
  lastCheckedAt: Date | null;
  /** null = nunca chamamos a API ainda; true/false = resultado da ultima chamada real. */
  lastReachable: boolean | null;
};

let quotaState: FootballDataQuotaState = {
  requestsAvailable: null,
  requestCounterReset: null,
  apiVersion: null,
  lastCheckedAt: null,
  lastReachable: null
};

/** Usado pelo endpoint de diagnostico (Etapa 15) — nunca dispara chamada nova, so le o cache. */
export const getFootballDataQuotaState = (): FootballDataQuotaState => ({ ...quotaState });

const updateQuotaFromHeaders = (headers: Headers) => {
  const requestsAvailable = headers.get("x-requests-available");
  const requestCounterReset = headers.get("x-requestcounter-reset");
  const apiVersion = headers.get("x-api-version");

  quotaState = {
    requestsAvailable:
      requestsAvailable !== null ? parseFiniteHeaderNumber(requestsAvailable) : quotaState.requestsAvailable,
    requestCounterReset:
      requestCounterReset !== null ? parseFiniteHeaderNumber(requestCounterReset) : quotaState.requestCounterReset,
    apiVersion: apiVersion ?? quotaState.apiVersion,
    lastCheckedAt: new Date(),
    lastReachable: true
  };

  if (quotaState.requestsAvailable !== null && quotaState.requestsAvailable <= LOW_QUOTA_THRESHOLD) {
    // Nunca logar a API key/token aqui — so os numeros de quota.
    console.warn(
      `[footballData] Quota baixa: ${quotaState.requestsAvailable} requests restantes (reset em ${
        quotaState.requestCounterReset ?? "?"
      }s).`
    );
  }
};

const markUnreachable = () => {
  quotaState = { ...quotaState, lastCheckedAt: new Date(), lastReachable: false };
};

export type FootballDataClientConfig = {
  /** Injetavel para testes — nunca precisa de rede real. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

const buildUrl = (path: string, query?: Record<string, string | number | undefined>) => {
  const base = env.FOOTBALL_DATA_BASE_URL.replace(/\/?$/, "/");
  const url = new URL(path.replace(/^\//, ""), base);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
};

export const createFootballDataClient = (config: FootballDataClientConfig = {}) => {
  const fetchImpl = config.fetchImpl ?? fetch;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const isConfigured = () => Boolean(env.FOOTBALL_DATA_API_KEY);

  const get = async <T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> => {
    if (!env.FOOTBALL_DATA_API_KEY) {
      throw new FootballDataNotConfiguredError();
    }

    const url = buildUrl(path, query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;

    try {
      response = await fetchImpl(url, {
        method: "GET",
        headers: {
          "X-Auth-Token": env.FOOTBALL_DATA_API_KEY,
          Accept: "application/json"
        },
        signal: controller.signal
      });
    } catch (error) {
      markUnreachable();

      if (error instanceof Error && error.name === "AbortError") {
        throw new FootballDataTimeoutError(url);
      }

      throw new FootballDataInvalidResponseError(url, error instanceof Error ? error.message : String(error));
    } finally {
      clearTimeout(timeout);
    }

    updateQuotaFromHeaders(response.headers);

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfterHeader =
          response.headers.get("retry-after") ?? response.headers.get("x-requestcounter-reset");
        throw new FootballDataRateLimitError(
          url,
          parseFiniteHeaderNumber(retryAfterHeader) ?? undefined
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new FootballDataAuthError(url, response.status);
      }

      throw new FootballDataHttpError(response.status, url);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new FootballDataInvalidResponseError(url, "corpo da resposta nao e JSON valido.");
    }
  };

  return { get, isConfigured };
};

export type FootballDataClient = ReturnType<typeof createFootballDataClient>;

export const footballDataClient = createFootballDataClient();
