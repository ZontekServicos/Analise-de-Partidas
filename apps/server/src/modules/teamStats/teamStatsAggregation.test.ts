import assert from "node:assert/strict";
import { test } from "node:test";

import { aggregateTeamStatsFromMatches, type TeamMatchRecord } from "./teamStatsAggregation.service";

const TEAM_ID = "team-1";
const OPPONENT_ID = "team-2";

const buildMatch = (
  daysAgo: number,
  homeGoals: number,
  awayGoals: number,
  isHome = true
): TeamMatchRecord => ({
  homeTeamId: isHome ? TEAM_ID : OPPONENT_ID,
  awayTeamId: isHome ? OPPONENT_ID : TEAM_ID,
  startsAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
  homeGoals,
  awayGoals
});

test("aggregateTeamStatsFromMatches: sem partidas retorna tudo zerado, sem NaN", () => {
  const stats = aggregateTeamStatsFromMatches(TEAM_ID, []);

  assert.equal(stats.matchesPlayed, 0);
  assert.equal(stats.wins, 0);
  assert.equal(stats.recentMatchesCount, 0);

  for (const value of Object.values(stats)) {
    assert.ok(Number.isFinite(value));
  }
});

test("aggregateTeamStatsFromMatches: conta vitoria/empate/derrota corretamente jogando em casa e fora", () => {
  const matches: TeamMatchRecord[] = [
    buildMatch(1, 2, 0, true), // vitoria em casa
    buildMatch(2, 1, 1, true), // empate em casa
    buildMatch(3, 3, 1, false), // derrota fora (time marcou o "away" = 1, sofreu 3)
    buildMatch(4, 0, 2, false) // vitoria fora
  ];

  const stats = aggregateTeamStatsFromMatches(TEAM_ID, matches);

  assert.equal(stats.matchesPlayed, 4);
  assert.equal(stats.wins, 2);
  assert.equal(stats.draws, 1);
  assert.equal(stats.losses, 1);
  assert.equal(stats.goalsFor, 2 + 1 + 1 + 2);
  assert.equal(stats.goalsAgainst, 0 + 1 + 3 + 0);
});

test("aggregateTeamStatsFromMatches: janela recente respeita o limite e prioriza os jogos mais novos", () => {
  const matches: TeamMatchRecord[] = [
    buildMatch(1, 1, 0), // mais novo -> vitoria
    buildMatch(2, 1, 0), // vitoria
    buildMatch(3, 1, 0), // vitoria
    buildMatch(4, 0, 0), // empate
    buildMatch(5, 0, 1), // derrota
    buildMatch(30, 0, 5) // fora da janela recente, so entra no total
  ];

  const stats = aggregateTeamStatsFromMatches(TEAM_ID, matches, 5);

  assert.equal(stats.matchesPlayed, 6);
  assert.equal(stats.recentMatchesCount, 5);
  assert.equal(stats.recentWins, 3);
  assert.equal(stats.recentDraws, 1);
  assert.equal(stats.recentLosses, 1);
  assert.equal(stats.losses, 2); // inclui a derrota antiga fora da janela
});

test("aggregateTeamStatsFromMatches: ordem de entrada nao importa, a funcao ordena por data", () => {
  const recentWin = buildMatch(1, 1, 0);
  const oldLoss = buildMatch(10, 0, 3);

  const inOrder = aggregateTeamStatsFromMatches(TEAM_ID, [recentWin, oldLoss], 1);
  const reversed = aggregateTeamStatsFromMatches(TEAM_ID, [oldLoss, recentWin], 1);

  assert.deepEqual(inOrder, reversed);
  assert.equal(inOrder.recentWins, 1);
  assert.equal(inOrder.recentLosses, 0);
});
