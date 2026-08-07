import assert from "node:assert/strict";
import { test } from "node:test";

import type { Team, TeamStats } from "@prisma/client";

import { probabilityEngineService } from "./probabilityEngine.service";

const baseStats: TeamStats = {
  id: "stats-id",
  teamId: "team-id",
  referenceDate: new Date("2026-01-01T00:00:00.000Z"),
  matchesPlayed: 10,
  wins: 5,
  draws: 3,
  losses: 2,
  goalsFor: 15,
  goalsAgainst: 12,
  xG: 14,
  xGA: 12,
  shotsPerGame: 12,
  shotsAgainstPerGame: 12,
  possessionAvg: 50,
  recentFormScore: 50,
  attackStrength: 50,
  defenseStrength: 50,
  injuryImpact: 10,
  lineupStrength: 50,
  motivationScore: 50,
  matchImportanceScore: 50,
  recentMatchesCount: 5,
  recentWins: 2,
  recentDraws: 1,
  recentLosses: 2,
  recentGoalsFor: 6,
  recentGoalsAgainst: 6,
  recentXG: 6,
  recentXGA: 6,
  shotsOnTargetPerGame: 4,
  bigChancesPerGame: 2,
  bigChancesConvertedPerGame: 1,
  cleanSheets: 3,
  shotsOnTargetAgainstPerGame: 4,
  bigChancesConcededPerGame: 2,
  opponentStrengthScore: 50,
  suspendedPlayersImpact: 5,
  keyPlayersAvailability: 90,
  restDays: 7,
  fatigueScore: 20,
  travelImpact: 20,
  yellowCardsPerGame: 1.8,
  redCardsPerGame: 0.05,
  foulsPerGame: 12,
  setPieceGoalsFor: 2,
  setPieceGoalsAgainst: 2,
  setPieceThreatScore: 50,
  tournamentExperienceScore: 50,
  knockoutExperienceScore: 50,
  pressureHandlingScore: 50,
  mustWinScore: 50,
  qualificationPressureScore: 50,
  notes: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z")
};

const buildStats = (overrides: Partial<TeamStats> = {}): TeamStats => ({ ...baseStats, ...overrides });

const buildTeam = (worldRanking: number | null = 30): Pick<Team, "worldRanking"> => ({ worldRanking });

const neutralMatch = { neutralField: true };

const strongTeamOverrides: Partial<TeamStats> = {
  attackStrength: 90,
  defenseStrength: 88,
  lineupStrength: 92,
  injuryImpact: 5,
  suspendedPlayersImpact: 2,
  keyPlayersAvailability: 98,
  recentMatchesCount: 5,
  recentWins: 5,
  recentDraws: 0,
  recentLosses: 0,
  recentGoalsFor: 14,
  recentGoalsAgainst: 2,
  recentXG: 13,
  recentXGA: 2.5,
  goalsFor: 26,
  goalsAgainst: 6,
  xG: 24,
  xGA: 7,
  shotsPerGame: 16,
  shotsOnTargetPerGame: 8,
  bigChancesPerGame: 5,
  bigChancesConvertedPerGame: 3,
  cleanSheets: 6,
  shotsOnTargetAgainstPerGame: 2.5,
  bigChancesConcededPerGame: 1,
  setPieceThreatScore: 80,
  fatigueScore: 10,
  travelImpact: 5,
  restDays: 9,
  tournamentExperienceScore: 90,
  knockoutExperienceScore: 88,
  pressureHandlingScore: 85
};

const weakTeamOverrides: Partial<TeamStats> = {
  attackStrength: 35,
  defenseStrength: 30,
  lineupStrength: 30,
  injuryImpact: 35,
  suspendedPlayersImpact: 20,
  keyPlayersAvailability: 55,
  recentMatchesCount: 5,
  recentWins: 0,
  recentDraws: 1,
  recentLosses: 4,
  recentGoalsFor: 2,
  recentGoalsAgainst: 12,
  recentXG: 3,
  recentXGA: 11,
  goalsFor: 7,
  goalsAgainst: 22,
  xG: 8,
  xGA: 20,
  shotsPerGame: 8,
  shotsOnTargetPerGame: 2.5,
  bigChancesPerGame: 1.2,
  bigChancesConvertedPerGame: 0.3,
  cleanSheets: 1,
  shotsOnTargetAgainstPerGame: 7,
  bigChancesConcededPerGame: 4,
  setPieceThreatScore: 30,
  fatigueScore: 55,
  travelImpact: 45,
  restDays: 3,
  tournamentExperienceScore: 20,
  knockoutExperienceScore: 15,
  pressureHandlingScore: 25
};

const assertProbabilitiesAreValid = (result: ReturnType<typeof probabilityEngineService.calculate>) => {
  const { homeWinProbability, drawProbability, awayWinProbability } = result;

  for (const value of [
    homeWinProbability,
    drawProbability,
    awayWinProbability,
    result.predictedHomeGoals,
    result.predictedAwayGoals,
    result.confidence
  ]) {
    assert.ok(Number.isFinite(value), `expected finite value, got ${value}`);
    assert.ok(!Number.isNaN(value), "expected non-NaN value");
  }

  assert.ok(homeWinProbability >= 0 && homeWinProbability <= 1);
  assert.ok(drawProbability >= 0 && drawProbability <= 1);
  assert.ok(awayWinProbability >= 0 && awayWinProbability <= 1);

  const sum = homeWinProbability + drawProbability + awayWinProbability;
  assert.ok(Math.abs(sum - 1) < 1e-3, `probabilities should sum to 1, got ${sum}`);

  for (const factor of result.factors) {
    for (const value of [factor.rawValue, factor.normalizedValue, factor.weight, factor.contribution]) {
      assert.ok(Number.isFinite(value), `factor ${factor.factorKey} produced a non-finite value`);
    }
  }
};

test("equipe claramente superior tem probabilidade de vitoria maior", () => {
  const result = probabilityEngineService.calculate({
    homeTeam: buildTeam(3),
    awayTeam: buildTeam(90),
    homeStats: buildStats(strongTeamOverrides),
    awayStats: buildStats(weakTeamOverrides),
    match: neutralMatch
  });

  assertProbabilitiesAreValid(result);
  assert.ok(result.homeWinProbability > result.awayWinProbability);
  assert.ok(result.homeWinProbability > result.drawProbability);
  assert.ok(result.homeWinProbability > 0.6);
});

test("equipes equilibradas produzem probabilidades proximas e draw maximo", () => {
  const stats = buildStats();
  const result = probabilityEngineService.calculate({
    homeTeam: buildTeam(30),
    awayTeam: buildTeam(30),
    homeStats: stats,
    awayStats: buildStats({ ...stats }),
    match: neutralMatch
  });

  assertProbabilitiesAreValid(result);
  assert.equal(result.homeWinProbability, result.awayWinProbability);
  assert.equal(result.drawProbability, 0.3);
});

test("equipe com muitos desfalques perde vantagem mesmo com estatisticas iguais no resto", () => {
  const injuredHome = buildStats({
    injuryImpact: 70,
    suspendedPlayersImpact: 60,
    keyPlayersAvailability: 20,
    lineupStrength: 40
  });

  const result = probabilityEngineService.calculate({
    homeTeam: buildTeam(30),
    awayTeam: buildTeam(30),
    homeStats: injuredHome,
    awayStats: buildStats(),
    match: neutralMatch
  });

  assertProbabilitiesAreValid(result);
  assert.ok(result.homeWinProbability < result.awayWinProbability);
});

test("boa forma contra adversarios fracos e moderada pelo opponentStrengthScore, sem dominar", () => {
  const goodFormOverrides: Partial<TeamStats> = {
    recentMatchesCount: 5,
    recentWins: 5,
    recentDraws: 0,
    recentLosses: 0,
    recentGoalsFor: 15,
    recentGoalsAgainst: 1,
    recentXG: 14,
    recentXGA: 2
  };

  const weakOpponents = probabilityEngineService.calculate({
    homeTeam: buildTeam(30),
    awayTeam: buildTeam(30),
    homeStats: buildStats({ ...goodFormOverrides, opponentStrengthScore: 15 }),
    awayStats: buildStats(),
    match: neutralMatch
  });

  const strongOpponents = probabilityEngineService.calculate({
    homeTeam: buildTeam(30),
    awayTeam: buildTeam(30),
    homeStats: buildStats({ ...goodFormOverrides, opponentStrengthScore: 90 }),
    awayStats: buildStats(),
    match: neutralMatch
  });

  assertProbabilitiesAreValid(weakOpponents);
  assertProbabilitiesAreValid(strongOpponents);

  assert.ok(
    weakOpponents.homeWinProbability > weakOpponents.awayWinProbability,
    "boa forma ainda deve favorecer o mandante"
  );
  assert.ok(
    weakOpponents.homeWinProbability < strongOpponents.homeWinProbability,
    "forca dos adversarios enfrentados deve moderar a vantagem de forma recente"
  );
});

test("boa defesa reduz a vitoria esperada de um ataque forte adversario", () => {
  const strongAttackAway: Partial<TeamStats> = {
    attackStrength: 90,
    goalsFor: 26,
    xG: 24,
    shotsPerGame: 16,
    shotsOnTargetPerGame: 8,
    bigChancesPerGame: 5,
    bigChancesConvertedPerGame: 3
  };

  const weakDefenseHome = probabilityEngineService.calculate({
    homeTeam: buildTeam(30),
    awayTeam: buildTeam(30),
    homeStats: buildStats({ defenseStrength: 20, goalsAgainst: 25, xGA: 24, shotsAgainstPerGame: 20 }),
    awayStats: buildStats(strongAttackAway),
    match: neutralMatch
  });

  const strongDefenseHome = probabilityEngineService.calculate({
    homeTeam: buildTeam(30),
    awayTeam: buildTeam(30),
    homeStats: buildStats({
      cleanSheets: 7,
      goalsAgainst: 4,
      xGA: 5,
      shotsAgainstPerGame: 6,
      shotsOnTargetAgainstPerGame: 2,
      bigChancesConcededPerGame: 0.5
    }),
    awayStats: buildStats(strongAttackAway),
    match: neutralMatch
  });

  assertProbabilitiesAreValid(weakDefenseHome);
  assertProbabilitiesAreValid(strongDefenseHome);

  assert.ok(strongDefenseHome.awayWinProbability < weakDefenseHome.awayWinProbability);
  assert.ok(strongDefenseHome.predictedAwayGoals < weakDefenseHome.predictedAwayGoals);
});

test("partida em campo neutro reduz a vantagem de mando em relacao a campo nao neutro", () => {
  const stats = buildStats();

  const neutral = probabilityEngineService.calculate({
    homeTeam: buildTeam(30),
    awayTeam: buildTeam(30),
    homeStats: stats,
    awayStats: buildStats({ ...stats }),
    match: { neutralField: true }
  });

  const homeAdvantage = probabilityEngineService.calculate({
    homeTeam: buildTeam(30),
    awayTeam: buildTeam(30),
    homeStats: stats,
    awayStats: buildStats({ ...stats }),
    match: { neutralField: false }
  });

  assertProbabilitiesAreValid(neutral);
  assertProbabilitiesAreValid(homeAdvantage);
  assert.ok(homeAdvantage.homeWinProbability > neutral.homeWinProbability);
});

test("ausencia parcial de metricas nao gera NaN/Infinity e usa fallback documentado", () => {
  const partialStats = buildStats({
    matchesPlayed: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    xG: 0,
    xGA: 0,
    shotsPerGame: 0,
    shotsAgainstPerGame: 0,
    recentMatchesCount: 0,
    recentWins: 0,
    recentDraws: 0,
    recentLosses: 0,
    bigChancesPerGame: 0,
    bigChancesConvertedPerGame: 0,
    setPieceGoalsFor: 0,
    setPieceGoalsAgainst: 0,
    recentFormScore: 42
  });

  const result = probabilityEngineService.calculate({
    homeTeam: buildTeam(null),
    awayTeam: buildTeam(null),
    homeStats: partialStats,
    awayStats: buildStats(),
    match: neutralMatch
  });

  assertProbabilitiesAreValid(result);

  const recentPerformanceFactor = result.factors.find((factor) => factor.factorKey === "recentPerformance");
  assert.ok(recentPerformanceFactor);
  assert.equal(recentPerformanceFactor?.metadata?.homeScore, 42);
});

test("probabilidades sempre somam 100% em varios cenarios", () => {
  const scenarios: Array<[Partial<TeamStats>, Partial<TeamStats>]> = [
    [strongTeamOverrides, weakTeamOverrides],
    [weakTeamOverrides, strongTeamOverrides],
    [{}, {}],
    [strongTeamOverrides, strongTeamOverrides],
    [weakTeamOverrides, weakTeamOverrides]
  ];

  for (const [homeOverrides, awayOverrides] of scenarios) {
    const result = probabilityEngineService.calculate({
      homeTeam: buildTeam(30),
      awayTeam: buildTeam(30),
      homeStats: buildStats(homeOverrides),
      awayStats: buildStats(awayOverrides),
      match: neutralMatch
    });

    assertProbabilitiesAreValid(result);
  }
});

test("nenhuma saida contem NaN ou Infinity mesmo em cenarios extremos", () => {
  const extremeStats = buildStats({
    matchesPlayed: 0,
    recentMatchesCount: 0,
    shotsPerGame: 0,
    bigChancesPerGame: 0,
    restDays: 0,
    fatigueScore: 100,
    travelImpact: 100,
    injuryImpact: 100,
    suspendedPlayersImpact: 100,
    keyPlayersAvailability: 0
  });

  const result = probabilityEngineService.calculate({
    homeTeam: buildTeam(undefined as unknown as number | null),
    awayTeam: buildTeam(undefined as unknown as number | null),
    homeStats: extremeStats,
    awayStats: extremeStats,
    match: neutralMatch
  });

  assertProbabilitiesAreValid(result);
});

test("mesma entrada produz exatamente a mesma saida (determinismo)", () => {
  const input = {
    homeTeam: buildTeam(12),
    awayTeam: buildTeam(45),
    homeStats: buildStats(strongTeamOverrides),
    awayStats: buildStats(weakTeamOverrides),
    match: { neutralField: false }
  };

  const first = probabilityEngineService.calculate(input);
  const second = probabilityEngineService.calculate(input);

  assert.deepEqual(first, second);
});

test("clube contra clube funciona igual a selecao contra selecao (motor e agnostico a teamType)", () => {
  // O motor nunca recebe teamType, so TeamStats/Team.worldRanking/match.neutralField.
  // Times de clube tipicamente nao tem worldRanking (ranking FIFA e so de selecoes).
  const result = probabilityEngineService.calculate({
    homeTeam: buildTeam(null),
    awayTeam: buildTeam(null),
    homeStats: buildStats(strongTeamOverrides),
    awayStats: buildStats(weakTeamOverrides),
    match: { neutralField: false }
  });

  assertProbabilitiesAreValid(result);
  assert.ok(result.homeWinProbability > result.awayWinProbability);
});

test("ausencia de ranking FIFA dos dois lados (clubes) cai em fallback neutro, nao penaliza", () => {
  const result = probabilityEngineService.calculate({
    homeTeam: buildTeam(null),
    awayTeam: buildTeam(null),
    homeStats: buildStats(),
    awayStats: buildStats(),
    match: neutralMatch
  });

  assertProbabilitiesAreValid(result);

  const worldRankingFactor = result.factors.find((factor) => factor.factorKey === "worldRanking");
  assert.ok(worldRankingFactor);
  assert.equal(worldRankingFactor?.normalizedValue, 0);
  assert.equal(worldRankingFactor?.contribution, 0);
});
