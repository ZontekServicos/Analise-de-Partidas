import assert from "node:assert/strict";
import { mock, test } from "node:test";

import { prisma } from "../../config/prisma";
import { footballDataClient } from "./footballData.client";
import { footballDataService } from "./footballData.service";
import type { FootballDataMatch } from "./footballData.types";

const providerWhereId = (where: Record<string, any>) =>
  where.externalProvider_externalId?.externalId as string | undefined;

const stubPrismaMethod = (t: any, target: any, name: string, implementation: (...args: any[]) => any) => {
  const original = target[name];
  target[name] = implementation;
  t.after(() => {
    target[name] = original;
  });
};

test("sync de competicoes com client HTTP mockado cria e depois atualiza sem duplicar", async (t) => {
  let competition: any = null;
  let createCalls = 0;

  t.mock.method(footballDataClient, "get", async () => ({
    count: 1,
    competitions: [
      { id: 2021, name: "Premier League", code: "PL", type: "LEAGUE", area: { id: 1, name: "England" } }
    ]
  }));
  stubPrismaMethod(t, prisma.competition, "findUnique", async ({ where }: any) => {
    if (providerWhereId(where)) return competition;
    return competition?.slug === where.slug ? { id: competition.id } : null;
  });
  stubPrismaMethod(t, prisma.competition, "create", async ({ data }: any) => {
    createCalls += 1;
    competition = { id: "competition-1", ...data };
    return competition;
  });
  stubPrismaMethod(t, prisma.competition, "update", async ({ data }: any) => {
    competition = { ...competition, ...data };
    return competition;
  });

  const first = await footballDataService.syncCompetitions();
  const second = await footballDataService.syncCompetitions();

  assert.deepEqual(first, { fetched: 1, created: 1, updated: 0, skipped: 0, failed: 0 });
  assert.deepEqual(second, { fetched: 1, created: 0, updated: 1, skipped: 0, failed: 0 });
  assert.equal(createCalls, 1);
});

test("sync SCHEDULED -> FINISHED -> FINISHED e idempotente para match, resultado e prediction", async (t) => {
  const baseMatch: FootballDataMatch = {
    id: 9001,
    utcDate: "2026-08-20T19:00:00Z",
    status: "SCHEDULED",
    matchday: 1,
    stage: "REGULAR_SEASON",
    group: null,
    competition: { id: 2021, name: "Premier League", code: "PL", type: "LEAGUE" },
    season: { id: 500, startDate: "2026-08-01", endDate: "2027-05-31" },
    homeTeam: { id: 10, name: "Home FC", type: "CLUB" },
    awayTeam: { id: 20, name: "Away FC", type: "CLUB" },
    score: { winner: null, fullTime: { home: null, away: null } }
  };
  let rawMatch: FootballDataMatch = baseMatch;
  let competition: any = null;
  let season: any = null;
  const teams = new Map<string, any>();
  let matchRow: any = null;
  let resultRow: any = null;
  let predictionStatus = "LOCKED";
  let resultCreates = 0;
  let predictionUpdates = 0;

  t.mock.method(footballDataClient, "get", async () => ({ matches: [rawMatch] }));
  stubPrismaMethod(t, prisma.competition, "findUnique", async ({ where }: any) => {
    if (providerWhereId(where)) return competition;
    return null;
  });
  stubPrismaMethod(t, prisma.competition, "create", async ({ data }: any) =>
    (competition = { id: "competition-1", ...data })
  );
  stubPrismaMethod(t, prisma.competition, "update", async ({ data }: any) =>
    (competition = { ...competition, ...data })
  );
  stubPrismaMethod(t, prisma.season, "findUnique", async () => season);
  stubPrismaMethod(t, prisma.season, "create", async ({ data }: any) => (season = { id: "season-1", ...data }));
  stubPrismaMethod(t, prisma.season, "update", async ({ data }: any) => (season = { ...season, ...data }));
  stubPrismaMethod(t, prisma.team, "findUnique", async ({ where }: any) => teams.get(providerWhereId(where) ?? "") ?? null);
  stubPrismaMethod(t, prisma.team, "create", async ({ data }: any) => {
    const row = { id: `team-${data.externalId}`, ...data };
    teams.set(data.externalId, row);
    return row;
  });
  stubPrismaMethod(t, prisma.team, "update", async ({ where, data }: any) => {
    const row = [...teams.values()].find((team) => team.id === where.id);
    Object.assign(row, data);
    return row;
  });
  stubPrismaMethod(t, prisma.match, "findUnique", async () => matchRow);
  stubPrismaMethod(t, prisma.match, "create", async ({ data }: any) => (matchRow = { id: "match-1", ...data }));
  stubPrismaMethod(t, prisma.match, "update", async ({ data }: any) => (matchRow = { ...matchRow, ...data }));
  stubPrismaMethod(t, prisma.matchResult, "findUnique", async () => resultRow);
  stubPrismaMethod(t, prisma.prediction, "findMany", async ({ where }: any) => {
    if (where.status && predictionStatus === "EVALUATED") return [];
    return [
      {
        id: "prediction-1",
        matchId: "match-1",
        modelVersion: "v2",
        status: predictionStatus,
        homeWinProbability: 50,
        drawProbability: 25,
        awayWinProbability: 25,
        predictedHomeGoals: 1,
        predictedAwayGoals: 0,
        createdAt: new Date()
      }
    ];
  });
  stubPrismaMethod(t, prisma.prediction, "update", async ({ data }: any) => {
    predictionUpdates += 1;
    predictionStatus = data.status;
    return { id: "prediction-1", ...data };
  });
  stubPrismaMethod(t, prisma, "$transaction", async (callback: any) =>
    callback({
      matchResult: {
        create: async ({ data }: any) => {
          resultCreates += 1;
          resultRow = { id: "result-1", ...data, createdAt: new Date(), updatedAt: new Date() };
          return resultRow;
        },
        update: async ({ data }: any) => (resultRow = { ...resultRow, ...data })
      },
      match: { update: async ({ data }: any) => (matchRow = { ...matchRow, ...data }) }
    })
  );

  const scheduled = await footballDataService.syncMatchesByDateRange("2026-08-20", "2026-08-20");
  rawMatch = {
    ...baseMatch,
    status: "FINISHED",
    score: { winner: "HOME_TEAM", fullTime: { home: 2, away: 1 } }
  };
  const finished = await footballDataService.syncMatchesByDateRange("2026-08-20", "2026-08-20");
  const repeated = await footballDataService.syncMatchesByDateRange("2026-08-20", "2026-08-20");

  assert.equal(scheduled.created, 1);
  assert.equal(finished.updated, 1);
  assert.equal(repeated.updated, 1);
  assert.equal(resultCreates, 1);
  assert.equal(resultRow.resultSource, "football-data.org");
  assert.equal(predictionUpdates, 1, "prediction ja avaliada nao deve ser tocada no segundo FINISHED");
  assert.equal(predictionStatus, "EVALUATED");
});
