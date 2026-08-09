import assert from "node:assert/strict";
import { test } from "node:test";

import {
  mapFootballDataCompetition,
  mapFootballDataCompetitionType,
  mapFootballDataMatch,
  mapFootballDataMatchResult,
  mapFootballDataMatchStatus,
  mapFootballDataSeason,
  mapFootballDataTeam,
  mapFootballDataTeamType
} from "./footballData.mapper";
import { FOOTBALL_DATA_PROVIDER, type FootballDataMatch } from "./footballData.types";

test("mapFootballDataCompetitionType: CUP + area World vira INTERNATIONAL_CUP", () => {
  assert.equal(mapFootballDataCompetitionType("CUP", true), "INTERNATIONAL_CUP");
});

test("mapFootballDataCompetitionType: CUP sem ser internacional vira CUP", () => {
  assert.equal(mapFootballDataCompetitionType("CUP", false), "CUP");
});

test("mapFootballDataCompetitionType: LEAGUE vira LEAGUE, tipo desconhecido vira OTHER", () => {
  assert.equal(mapFootballDataCompetitionType("LEAGUE", false), "LEAGUE");
  assert.equal(mapFootballDataCompetitionType("", false), "OTHER");
  assert.equal(mapFootballDataCompetitionType("SOMETHING_NEW", false), "OTHER");
});

test("mapFootballDataCompetition: competicao mundial vira isInternational=true, country=null", () => {
  const mapped = mapFootballDataCompetition({
    id: 2000,
    name: "FIFA World Cup",
    code: "WC",
    type: "CUP",
    area: { id: 2267, name: "World" }
  });

  assert.equal(mapped.externalId, "2000");
  assert.equal(mapped.externalProvider, FOOTBALL_DATA_PROVIDER);
  assert.equal(mapped.slug, "wc");
  assert.equal(mapped.type, "INTERNATIONAL_CUP");
  assert.equal(mapped.isInternational, true);
  assert.equal(mapped.country, null);
});

test("mapFootballDataCompetition: liga nacional guarda o pais e nao fabrica confederation", () => {
  const mapped = mapFootballDataCompetition({
    id: 2021,
    name: "Premier League",
    code: "PL",
    type: "LEAGUE",
    area: { id: 2072, name: "England" }
  });

  assert.equal(mapped.country, "England");
  assert.equal(mapped.confederation, null);
  assert.equal(mapped.isInternational, false);
});

test("mapFootballDataCompetition: sem area (resumo embutido em Match) nao quebra, so nao classifica internacional", () => {
  const mapped = mapFootballDataCompetition({ id: 2021, name: "Premier League" });

  assert.equal(mapped.isInternational, false);
  assert.equal(mapped.country, null);
  assert.equal(mapped.type, "OTHER");
});

test("mapFootballDataSeason: deriva nome do ano e respeita o hint de isCurrent", () => {
  const sameYear = mapFootballDataSeason(
    { id: 100, startDate: "2025-08-01", endDate: "2025-12-01" },
    false
  );
  assert.equal(sameYear.name, "2025");

  const spanningYears = mapFootballDataSeason(
    { id: 101, startDate: "2025-08-01", endDate: "2026-05-31" },
    true
  );
  assert.equal(spanningYears.name, "2025/2026");
  assert.equal(spanningYears.isCurrent, true);
});

test("mapFootballDataTeam: normaliza strings vazias e usa apenas tipo com evidencia", () => {
  const mapped = mapFootballDataTeam({
    id: 57,
    name: "Arsenal FC",
    crest: "",
    founded: 1886,
    area: { id: 2072, name: "England" },
    type: "CLUB"
  });

  assert.equal(mapped.crestUrl, null);
  assert.equal(mapped.teamType, "CLUB");
  assert.equal(mapped.foundedYear, 1886);
  assert.equal(mapped.country, "England");
});

test("mapFootballDataTeam: aceita o resumo embutido em Match (sem founded/area)", () => {
  const mapped = mapFootballDataTeam({ id: 57, name: "Arsenal FC", crest: "https://crest.png" });

  assert.equal(mapped.crestUrl, "https://crest.png");
  assert.equal(mapped.foundedYear, null);
  assert.equal(mapped.country, null);
  assert.equal(mapped.teamType, "UNKNOWN");
});

test("mapFootballDataTeamType: nao deduz clube ou selecao sem evidencia", () => {
  assert.equal(mapFootballDataTeamType("CLUB"), "CLUB");
  assert.equal(mapFootballDataTeamType("NATIONAL"), "NATIONAL_TEAM");
  assert.equal(mapFootballDataTeamType(null), "UNKNOWN");
  assert.equal(mapFootballDataTeamType("novo-tipo"), "UNKNOWN");
});

test("mapFootballDataMatchStatus: normalizacao com perda documentada", () => {
  assert.equal(mapFootballDataMatchStatus("SCHEDULED"), "SCHEDULED");
  assert.equal(mapFootballDataMatchStatus("TIMED"), "SCHEDULED");
  assert.equal(mapFootballDataMatchStatus("IN_PLAY"), "IN_PROGRESS");
  assert.equal(mapFootballDataMatchStatus("PAUSED"), "IN_PROGRESS");
  assert.equal(mapFootballDataMatchStatus("FINISHED"), "FINISHED");
  assert.equal(mapFootballDataMatchStatus("AWARDED"), "FINISHED");
  assert.equal(mapFootballDataMatchStatus("SUSPENDED"), "CANCELLED");
  assert.equal(mapFootballDataMatchStatus("POSTPONED"), "CANCELLED");
  assert.equal(mapFootballDataMatchStatus("CANCELLED"), "CANCELLED");
});

test("mapFootballDataMatchStatus: status desconhecido cai em SCHEDULED sem quebrar", () => {
  assert.equal(mapFootballDataMatchStatus("SOMETHING_NEW"), "SCHEDULED");
});

const buildRawMatch = (overrides: Partial<FootballDataMatch> = {}): FootballDataMatch => ({
  id: 500,
  utcDate: "2026-06-15T19:00:00Z",
  status: "SCHEDULED",
  matchday: 3,
  stage: "GROUP_STAGE",
  group: "Group A",
  homeTeam: { id: 1, name: "Home FC" },
  awayTeam: { id: 2, name: "Away FC" },
  score: { fullTime: { home: null, away: null } },
  competition: { id: 2000, name: "FIFA World Cup" },
  season: { id: 100, startDate: "2026-01-01", endDate: "2026-12-31" },
  ...overrides
});

test("mapFootballDataMatch: matchday vira round como string, group/stage preservados", () => {
  const mapped = mapFootballDataMatch(buildRawMatch());

  assert.equal(mapped.round, "3");
  assert.equal(mapped.stage, "GROUP_STAGE");
  assert.equal(mapped.groupName, "Group A");
  assert.equal(mapped.competition, "FIFA World Cup");
  assert.equal(mapped.status, "SCHEDULED");
});

test("mapFootballDataMatch: matchday ausente vira round=null (sem fabricar 0)", () => {
  const mapped = mapFootballDataMatch(buildRawMatch({ matchday: null }));
  assert.equal(mapped.round, null);
});

test("mapFootballDataMatchResult: so retorna resultado quando FINISHED e placar presente", () => {
  const finished = buildRawMatch({
    status: "FINISHED",
    score: { fullTime: { home: 2, away: 1 } }
  });

  const result = mapFootballDataMatchResult(finished);
  assert.deepEqual(result, { homeGoals: 2, awayGoals: 1, homePenaltyGoals: null, awayPenaltyGoals: null });
});

test("mapFootballDataMatchResult: FINISHED sem placar cheio nao fabrica valor, retorna null", () => {
  const finishedNoScore = buildRawMatch({
    status: "FINISHED",
    score: { fullTime: { home: null, away: null } }
  });

  assert.equal(mapFootballDataMatchResult(finishedNoScore), null);
});

test("mapFootballDataMatchResult: score/fullTime ausentes nao quebram", () => {
  assert.equal(mapFootballDataMatchResult(buildRawMatch({ status: "FINISHED", score: {} })), null);
});

test("mapFootballDataMatchResult: partida agendada nunca retorna resultado", () => {
  assert.equal(mapFootballDataMatchResult(buildRawMatch({ status: "SCHEDULED" })), null);
});

test("mapFootballDataMatchResult: penaltis sao mapeados quando presentes (mata-mata)", () => {
  const withPenalties = buildRawMatch({
    status: "AWARDED",
    score: {
      fullTime: { home: 1, away: 1 },
      penalties: { home: 4, away: 3 }
    }
  });

  const result = mapFootballDataMatchResult(withPenalties);
  assert.deepEqual(result, { homeGoals: 1, awayGoals: 1, homePenaltyGoals: 4, awayPenaltyGoals: 3 });
});
