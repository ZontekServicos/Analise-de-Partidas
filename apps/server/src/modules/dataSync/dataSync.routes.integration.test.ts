import assert from "node:assert/strict";
import { test } from "node:test";

import { app } from "../../app";
import { env } from "../../config/env";

test("rotas data-sync protegem header e status nao expoe secrets", async () => {
  const originalSecret = env.DATA_SYNC_SECRET;
  (env as { DATA_SYNC_SECRET?: string }).DATA_SYNC_SECRET = "integration-test-secret";
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const missing = await fetch(`${baseUrl}/api/data-sync/competitions`, { method: "POST" });
    assert.equal(missing.status, 401);

    const wrong = await fetch(`${baseUrl}/api/data-sync/competitions`, {
      method: "POST",
      headers: { "X-Data-Sync-Secret": "wrong-secret" }
    });
    assert.equal(wrong.status, 401);

    // Chega ate a validacao (400), comprovando que o secret correto passou pelo middleware,
    // mas sem executar sync nem qualquer request externa.
    const allowed = await fetch(`${baseUrl}/api/data-sync/competitions/2021/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Data-Sync-Secret": "integration-test-secret" },
      body: JSON.stringify({ season: "x" })
    });
    assert.equal(allowed.status, 400);

    const status = await fetch(`${baseUrl}/api/integrations/football-data/status`);
    assert.equal(status.status, 200);
    const statusText = await status.text();
    assert.ok(!statusText.includes("integration-test-secret"));
    assert.ok(!statusText.includes(env.FOOTBALL_DATA_API_KEY ?? "__not_configured__"));
    assert.ok(!statusText.includes("apiKey"));
  } finally {
    (env as { DATA_SYNC_SECRET?: string }).DATA_SYNC_SECRET = originalSecret;
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
