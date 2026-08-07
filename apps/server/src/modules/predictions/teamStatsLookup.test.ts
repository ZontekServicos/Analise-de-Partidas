import assert from "node:assert/strict";
import { test } from "node:test";

import { buildTeamStatsLookupAttempts } from "./teamStatsLookup";

test("competicao e temporada informadas: tenta competicao+temporada, depois competicao, depois global", () => {
  const attempts = buildTeamStatsLookupAttempts({ competitionId: "comp-1", seasonId: "season-1" });

  assert.deepEqual(attempts, [
    { competitionId: "comp-1", seasonId: "season-1" },
    { competitionId: "comp-1" },
    {}
  ]);
});

test("so competicao informada: tenta competicao, depois global (sem tentativa de temporada)", () => {
  const attempts = buildTeamStatsLookupAttempts({ competitionId: "comp-1" });

  assert.deepEqual(attempts, [{ competitionId: "comp-1" }, {}]);
});

test("nenhum escopo informado: so tenta o fallback global", () => {
  const attempts = buildTeamStatsLookupAttempts({});

  assert.deepEqual(attempts, [{}]);
});

test("temporada sem competicao e ignorada (nao existe estatistica so por temporada)", () => {
  const attempts = buildTeamStatsLookupAttempts({ seasonId: "season-1" });

  assert.deepEqual(attempts, [{}]);
});

test("o ultimo attempt e sempre o fallback global, independente do escopo", () => {
  const withScope = buildTeamStatsLookupAttempts({ competitionId: "comp-1", seasonId: "season-1" });
  const withoutScope = buildTeamStatsLookupAttempts({});

  assert.deepEqual(withScope[withScope.length - 1], {});
  assert.deepEqual(withoutScope[withoutScope.length - 1], {});
});
