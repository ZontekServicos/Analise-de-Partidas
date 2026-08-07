import assert from "node:assert/strict";
import { test } from "node:test";

import { buildMatchEngineContext } from "./matchEngineContext";

test("partida de liga (sem fase de mata-mata) nao marca knockout nem ida-e-volta", () => {
  const context = buildMatchEngineContext({
    competitionType: "LEAGUE",
    isInternational: false,
    stage: "Rodada 12",
    round: null,
    neutralField: false
  });

  assert.equal(context.isKnockout, false);
  assert.equal(context.isTwoLegged, false);
  assert.equal(context.isGroupStage, false);
  assert.equal(context.requiresGoalDifference, false);
  assert.equal(context.isFriendly, false);
});

test("partida de mata-mata (copa) marca knockout e exige saldo/aggregate", () => {
  const context = buildMatchEngineContext({
    competitionType: "CUP",
    stage: "Quartas de final",
    round: "Volta",
    neutralField: false
  });

  assert.equal(context.isKnockout, true);
  assert.equal(context.isTwoLegged, true);
  assert.equal(context.requiresGoalDifference, true);
});

test("fase de grupos marca isGroupStage e exige saldo (desempate)", () => {
  const context = buildMatchEngineContext({
    competitionType: "INTERNATIONAL_CUP",
    isInternational: true,
    stage: "Fase de Grupos",
    round: null,
    neutralField: true
  });

  assert.equal(context.isGroupStage, true);
  assert.equal(context.requiresGoalDifference, true);
  assert.equal(context.isKnockout, false);
});

test("amistoso marca isFriendly e nao marca knockout/grupo", () => {
  const context = buildMatchEngineContext({
    competitionType: "FRIENDLY",
    stage: null,
    round: null,
    neutralField: true
  });

  assert.equal(context.isFriendly, true);
  assert.equal(context.isKnockout, false);
  assert.equal(context.isGroupStage, false);
  assert.equal(context.requiresGoalDifference, false);
});

test("competicao/fase ausentes nao geram excecao nem NaN, tudo cai em false/null", () => {
  const context = buildMatchEngineContext({
    neutralField: true
  });

  assert.equal(context.competitionType, null);
  assert.equal(context.stage, null);
  assert.equal(context.round, null);
  assert.equal(context.isKnockout, false);
  assert.equal(context.isGroupStage, false);
  assert.equal(context.isTwoLegged, false);
  assert.equal(context.isFriendly, false);
});
