import type { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../shared/errors/AppError";
import type { CreateMatchInput, ListMatchesQuery, UpdateMatchInput } from "./matches.schema";

const teamSummarySelect = {
  id: true,
  name: true,
  fifaCode: true,
  confederation: true,
  worldRanking: true
};

const matchInclude = {
  homeTeam: {
    select: teamSummarySelect
  },
  awayTeam: {
    select: teamSummarySelect
  },
  competitionRef: true,
  season: true
};

const findMatchOrFail = async (id: string) => {
  const match = await prisma.match.findUnique({
    where: { id },
    include: matchInclude
  });

  if (!match) {
    throw new AppError("Match not found", 404);
  }

  return match;
};

const ensureTeamsExist = async (homeTeamId: string, awayTeamId: string) => {
  if (homeTeamId === awayTeamId) {
    throw new AppError("homeTeamId and awayTeamId must be different", 400);
  }

  const teamsCount = await prisma.team.count({
    where: {
      id: {
        in: [homeTeamId, awayTeamId]
      }
    }
  });

  if (teamsCount !== 2) {
    throw new AppError("One or both teams were not found", 404);
  }
};

const toPrismaCreateData = (data: CreateMatchInput): Prisma.MatchCreateInput => ({
  competition: data.competition,
  stage: data.stage,
  round: data.round,
  groupName: data.group,
  startsAt: data.matchDate,
  neutralField: data.neutralField,
  status: data.status,
  homeTeam: {
    connect: { id: data.homeTeamId }
  },
  awayTeam: {
    connect: { id: data.awayTeamId }
  },
  ...(data.competitionId !== undefined
    ? { competitionRef: { connect: { id: data.competitionId } } }
    : {}),
  ...(data.seasonId !== undefined ? { season: { connect: { id: data.seasonId } } } : {})
});

const toPrismaUpdateData = (data: UpdateMatchInput): Prisma.MatchUpdateInput => ({
  ...(data.competition !== undefined ? { competition: data.competition } : {}),
  ...(data.stage !== undefined ? { stage: data.stage } : {}),
  ...(data.round !== undefined ? { round: data.round } : {}),
  ...(data.group !== undefined ? { groupName: data.group } : {}),
  ...(data.matchDate !== undefined ? { startsAt: data.matchDate } : {}),
  ...(data.neutralField !== undefined ? { neutralField: data.neutralField } : {}),
  ...(data.status !== undefined ? { status: data.status } : {}),
  ...(data.homeTeamId !== undefined
    ? {
        homeTeam: {
          connect: { id: data.homeTeamId }
        }
      }
    : {}),
  ...(data.awayTeamId !== undefined
    ? {
        awayTeam: {
          connect: { id: data.awayTeamId }
        }
      }
    : {}),
  ...(data.competitionId !== undefined
    ? { competitionRef: { connect: { id: data.competitionId } } }
    : {}),
  ...(data.seasonId !== undefined ? { season: { connect: { id: data.seasonId } } } : {})
});

export const matchesService = {
  async create(data: CreateMatchInput) {
    await ensureTeamsExist(data.homeTeamId, data.awayTeamId);

    return prisma.match.create({
      data: toPrismaCreateData(data),
      include: matchInclude
    });
  },

  async list(query: ListMatchesQuery) {
    const where: Prisma.MatchWhereInput = {
      ...(query.competition ? { competition: { contains: query.competition, mode: "insensitive" } } : {}),
      ...(query.competitionId ? { competitionId: query.competitionId } : {}),
      ...(query.seasonId ? { seasonId: query.seasonId } : {}),
      ...(query.teamId ? { OR: [{ homeTeamId: query.teamId }, { awayTeamId: query.teamId }] } : {}),
      ...(query.stage ? { stage: { contains: query.stage, mode: "insensitive" } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            startsAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {})
            }
          }
        : {})
    };

    return prisma.match.findMany({
      where,
      include: matchInclude,
      orderBy: {
        startsAt: "asc"
      }
    });
  },

  async findById(id: string) {
    return findMatchOrFail(id);
  },

  async update(id: string, data: UpdateMatchInput) {
    const currentMatch = await findMatchOrFail(id);
    const homeTeamId = data.homeTeamId ?? currentMatch.homeTeamId;
    const awayTeamId = data.awayTeamId ?? currentMatch.awayTeamId;

    await ensureTeamsExist(homeTeamId, awayTeamId);

    return prisma.match.update({
      where: { id },
      data: toPrismaUpdateData(data),
      include: matchInclude
    });
  },

  async delete(id: string) {
    await findMatchOrFail(id);

    const [predictionsCount, resultCount] = await prisma.$transaction([
      prisma.prediction.count({
        where: { matchId: id }
      }),
      prisma.matchResult.count({
        where: { matchId: id }
      })
    ]);

    if (predictionsCount > 0 || resultCount > 0) {
      throw new AppError("Match cannot be deleted because it has predictions or result linked", 409, {
        predictionsCount,
        resultCount
      });
    }

    await prisma.match.delete({
      where: { id }
    });
  }
};
