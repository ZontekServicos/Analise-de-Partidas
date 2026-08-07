import type { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../shared/errors/AppError";
import { buildMatchEngineContext } from "../probabilityEngine/matchEngineContext";
import { probabilityEngineService } from "../probabilityEngine/probabilityEngine.service";
import type { ListPredictionsQuery } from "./predictions.schema";
import { buildTeamStatsLookupAttempts, type TeamStatsScope } from "./teamStatsLookup";

const teamSummarySelect = {
  id: true,
  name: true,
  fifaCode: true,
  confederation: true,
  worldRanking: true
};

const predictionInclude = {
  match: {
    include: {
      homeTeam: {
        select: teamSummarySelect
      },
      awayTeam: {
        select: teamSummarySelect
      }
    }
  },
  factors: {
    orderBy: {
      factorKey: "asc"
    }
  }
} satisfies Prisma.PredictionInclude;

const findPredictionOrFail = async (id: string) => {
  const prediction = await prisma.prediction.findUnique({
    where: { id },
    include: predictionInclude
  });

  if (!prediction) {
    throw new AppError("Prediction not found", 404);
  }

  return prediction;
};

const findLatestTeamStatsOrFail = async (teamId: string, label: "home" | "away", scope: TeamStatsScope) => {
  const attempts = buildTeamStatsLookupAttempts(scope);

  for (const attempt of attempts) {
    const stats = await prisma.teamStats.findFirst({
      where: { teamId, ...attempt },
      orderBy: {
        referenceDate: "desc"
      }
    });

    if (stats) {
      return stats;
    }
  }

  throw new AppError(`Latest TeamStats not found for ${label} team`, 400);
};

export const predictionsService = {
  async generate(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        result: true,
        competitionRef: true
      }
    });

    if (!match) {
      throw new AppError("Match not found", 404);
    }

    if (match.result) {
      throw new AppError("Cannot generate prediction for a match that already has a result", 409);
    }

    const scope: TeamStatsScope = { competitionId: match.competitionId, seasonId: match.seasonId };

    const [homeStats, awayStats] = await Promise.all([
      findLatestTeamStatsOrFail(match.homeTeamId, "home", scope),
      findLatestTeamStatsOrFail(match.awayTeamId, "away", scope)
    ]);

    const context = buildMatchEngineContext({
      competitionType: match.competitionRef?.type ?? null,
      isInternational: match.competitionRef?.isInternational ?? false,
      stage: match.stage,
      round: match.round,
      neutralField: match.neutralField
    });

    const engineResult = probabilityEngineService.calculate({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeStats,
      awayStats,
      match: {
        neutralField: match.neutralField
      },
      context
    });

    return prisma.prediction.create({
      data: {
        match: {
          connect: { id: match.id }
        },
        modelVersion: engineResult.modelVersion,
        homeWinProbability: engineResult.homeWinProbability,
        drawProbability: engineResult.drawProbability,
        awayWinProbability: engineResult.awayWinProbability,
        predictedHomeGoals: engineResult.predictedHomeGoals,
        predictedAwayGoals: engineResult.predictedAwayGoals,
        confidenceScore: engineResult.confidence,
        factors: {
          create: engineResult.factors.map((factor) => ({
            factorKey: factor.factorKey,
            rawValue: factor.rawValue,
            normalizedValue: factor.normalizedValue,
            weight: factor.weight,
            contribution: factor.contribution,
            metadata: (factor.metadata as Prisma.InputJsonValue | undefined) ?? undefined
          }))
        }
      },
      include: predictionInclude
    });
  },

  async list(query: ListPredictionsQuery) {
    const where: Prisma.PredictionWhereInput = {
      ...(query.matchId ? { matchId: query.matchId } : {}),
      ...(query.modelVersion ? { modelVersion: query.modelVersion } : {})
    };

    return prisma.prediction.findMany({
      where,
      include: predictionInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  },

  async findById(id: string) {
    return findPredictionOrFail(id);
  },

  async findByMatchId(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true }
    });

    if (!match) {
      throw new AppError("Match not found", 404);
    }

    return prisma.prediction.findMany({
      where: { matchId },
      include: predictionInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  }
};
