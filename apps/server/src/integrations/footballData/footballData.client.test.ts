import assert from "node:assert/strict";
import { test } from "node:test";

import { env } from "../../config/env";
import { createFootballDataClient, getFootballDataQuotaState } from "./footballData.client";
import {
  FootballDataAuthError,
  FootballDataHttpError,
  FootballDataInvalidResponseError,
  FootballDataNotConfiguredError,
  FootballDataRateLimitError,
  FootballDataTimeoutError
} from "./footballData.errors";

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  });

test("client: lanca FootballDataNotConfiguredError quando FOOTBALL_DATA_API_KEY nao existe", async () => {
  const original = env.FOOTBALL_DATA_API_KEY;
  (env as { FOOTBALL_DATA_API_KEY?: string }).FOOTBALL_DATA_API_KEY = undefined;

  try {
    const client = createFootballDataClient({ fetchImpl: async () => jsonResponse({}) });
    await assert.rejects(() => client.get("competitions"), FootballDataNotConfiguredError);
    assert.equal(client.isConfigured(), false);
  } finally {
    (env as { FOOTBALL_DATA_API_KEY?: string }).FOOTBALL_DATA_API_KEY = original;
  }
});

test("client: envia o header X-Auth-Token e monta a URL com base + querystring", async () => {
  const original = env.FOOTBALL_DATA_API_KEY;
  (env as { FOOTBALL_DATA_API_KEY?: string }).FOOTBALL_DATA_API_KEY = "test-token";

  let capturedUrl = "";
  let capturedHeaders: HeadersInit | undefined;

  try {
    const client = createFootballDataClient({
      fetchImpl: async (url, init) => {
        capturedUrl = String(url);
        capturedHeaders = init?.headers;
        return jsonResponse({ count: 0, competitions: [] });
      }
    });

    await client.get("competitions", { season: "2025", empty: "" });

    assert.ok(capturedUrl.startsWith(env.FOOTBALL_DATA_BASE_URL));
    assert.ok(capturedUrl.includes("competitions"));
    assert.ok(capturedUrl.includes("season=2025"));
    assert.ok(!capturedUrl.includes("empty="), "query vazia nao deve ser enviada");
    assert.equal((capturedHeaders as Record<string, string>)["X-Auth-Token"], "test-token");
  } finally {
    (env as { FOOTBALL_DATA_API_KEY?: string }).FOOTBALL_DATA_API_KEY = original;
  }
});

test("client: 401 vira FootballDataAuthError", async () => {
  const client = createFootballDataClient({
    fetchImpl: async () => jsonResponse({ message: "invalid token" }, { status: 401 })
  });

  await assert.rejects(() => client.get("competitions"), FootballDataAuthError);
});

test("client: 403 tambem vira FootballDataAuthError", async () => {
  const client = createFootballDataClient({
    fetchImpl: async () => jsonResponse({ message: "forbidden" }, { status: 403 })
  });

  await assert.rejects(() => client.get("competitions"), FootballDataAuthError);
});

test("client: 429 vira FootballDataRateLimitError", async () => {
  const client = createFootballDataClient({
    fetchImpl: async () =>
      jsonResponse({ message: "too many requests" }, { status: 429, headers: { "Retry-After": "60" } })
  });

  await assert.rejects(() => client.get("competitions"), (error: unknown) => {
    assert.ok(error instanceof FootballDataRateLimitError);
    assert.equal(error.retryAfterSeconds, 60);
    return true;
  });
});

test("client: 500 vira FootballDataHttpError generico", async () => {
  const client = createFootballDataClient({
    fetchImpl: async () => jsonResponse({ message: "boom" }, { status: 500 })
  });

  await assert.rejects(() => client.get("competitions"), (error: unknown) => {
    assert.ok(error instanceof FootballDataHttpError);
    assert.equal(error.status, 500);
    return true;
  });
});

test("client: resposta que nao e JSON valido vira FootballDataInvalidResponseError", async () => {
  const client = createFootballDataClient({
    fetchImpl: async () => new Response("<html>not json</html>", { status: 200 })
  });

  await assert.rejects(() => client.get("competitions"), FootballDataInvalidResponseError);
});

test("client: timeout aborta a requisicao e vira FootballDataTimeoutError", async () => {
  const client = createFootballDataClient({
    timeoutMs: 20,
    fetchImpl: (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      })
  });

  await assert.rejects(() => client.get("competitions"), FootballDataTimeoutError);
});

test("client: atualiza o estado de quota a partir dos headers da resposta", async () => {
  const client = createFootballDataClient({
    fetchImpl: async () =>
      jsonResponse(
        { count: 0, competitions: [] },
        {
          headers: {
            "X-Requests-Available": "7",
            "X-RequestCounter-Reset": "42",
            "X-Api-Version": "v4"
          }
        }
      )
  });

  await client.get("competitions");

  const quota = getFootballDataQuotaState();
  assert.equal(quota.requestsAvailable, 7);
  assert.equal(quota.requestCounterReset, 42);
  assert.equal(quota.apiVersion, "v4");
  assert.equal(quota.lastReachable, true);
});

test("client: header de quota invalido nao gera NaN nem quebra", async () => {
  const client = createFootballDataClient({
    fetchImpl: async () =>
      jsonResponse({ count: 0, competitions: [] }, { headers: { "X-Requests-Available": "invalid" } })
  });

  await client.get("competitions");
  const quota = getFootballDataQuotaState();
  assert.equal(quota.requestsAvailable, null);
});

test("client: 200 valido retorna o corpo tipado normalmente", async () => {
  const client = createFootballDataClient({
    fetchImpl: async () => jsonResponse({ count: 1, competitions: [{ id: 1, name: "X", type: "CUP" }] })
  });

  const response = await client.get<{ count: number }>("competitions");
  assert.equal(response.count, 1);
});

// Teste opcional com a API real — so roda quando FOOTBALL_DATA_API_KEY existe no
// ambiente (nunca em CI sem a chave) e faz UMA unica chamada, so pra validar a
// forma da resposta. Nunca gasta mais de 1 request de quota.
test(
  "client (real, opcional): GET /competitions responde com a forma esperada",
  {
    skip:
      process.env.RUN_FOOTBALL_DATA_SMOKE_TEST !== "true" || !process.env.FOOTBALL_DATA_API_KEY
        ? "smoke real requer opt-in explicito e chave configurada"
        : false
  },
  async () => {
    const client = createFootballDataClient();
    const response = await client.get<{ count: number; competitions: unknown[] }>("competitions");

    assert.equal(typeof response.count, "number");
    assert.ok(Array.isArray(response.competitions));
  }
);
