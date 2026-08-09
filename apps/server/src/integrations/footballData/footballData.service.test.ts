import assert from "node:assert/strict";
import { test } from "node:test";

import { hasResultChanged, requireResponseArray, shouldSkipResultSync } from "./footballData.service";

test("shouldSkipResultSync: sem resultado existente, nunca pula", () => {
  assert.equal(shouldSkipResultSync(null), false);
  assert.equal(shouldSkipResultSync(undefined), false);
});

test("shouldSkipResultSync: resultado ja veio do sync, pode atualizar", () => {
  assert.equal(shouldSkipResultSync("football-data.org"), false);
});

test("shouldSkipResultSync: resultado manual/outra origem nunca e sobrescrito pelo sync", () => {
  assert.equal(shouldSkipResultSync("frontend-mvp"), true);
  assert.equal(shouldSkipResultSync("manual"), true);
});

test("hasResultChanged: sem resultado existente sempre conta como mudanca", () => {
  assert.equal(hasResultChanged(null, { homeGoals: 1, awayGoals: 0 }), true);
});

test("hasResultChanged: mesmo placar nao conta como mudanca (idempotencia)", () => {
  assert.equal(hasResultChanged({ homeGoals: 2, awayGoals: 1 }, { homeGoals: 2, awayGoals: 1 }), false);
});

test("hasResultChanged: placar diferente conta como mudanca", () => {
  assert.equal(hasResultChanged({ homeGoals: 2, awayGoals: 1 }, { homeGoals: 2, awayGoals: 2 }), true);
  assert.equal(hasResultChanged({ homeGoals: 2, awayGoals: 1 }, { homeGoals: 3, awayGoals: 1 }), true);
});

test("hasResultChanged: alteracao apenas nos penaltis tambem atualiza", () => {
  assert.equal(
    hasResultChanged(
      { homeGoals: 1, awayGoals: 1, homePenaltyGoals: 3, awayPenaltyGoals: 2 },
      { homeGoals: 1, awayGoals: 1, homePenaltyGoals: 4, awayPenaltyGoals: 3 }
    ),
    true
  );
});

test("requireResponseArray: rejeita payload 200 com forma invalida", () => {
  assert.throws(() => requireResponseArray(undefined, "matches"), /resposta invalida/);
  assert.deepEqual(requireResponseArray([], "matches"), []);
});
