import { MatchStatus, PredictionStatus, type MatchResult, type Prediction, type Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../shared/errors/AppError";
import type { CreateResultInput, UpdateResultInput } from "./results.schema";

type MatchOutcome = "HOME_WIN" | "DRAW" | "AWAY_WIN";

type PredictionForComparison = Pick<
  Prediction,
  | "id"
  | "homeWinProbability"
  | "drawProbability"
  | "awayWinProbability"
  | "predictedHomeGoals"
  | "predictedAwayGoals"
  | "modelVersion"
  | "createdAt"
>;

const teamSummarySelect = {
  id: true,
  name: true,
  fifaCode: true,
  confederation: true,
  worldRanking: true
};

const resultInclude = {
  match: {
    include: {
      homeTeam: {
        select: teamSummarySelect
      },
      awayTeam: {
        select: teamSummarySelect
      }
    }
  }
} satisfies Prisma.MatchResultInclude;

const round = (value: number, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const getOutcome = (homeGoals: number, awayGoals: number): MatchOutcome => {
  if (homeGoals > awayGoals) {
    return "HOME_WIN";
  }

  if (awayGoals > homeGoals) {
    return "AWAY_WIN";
  }

  return "DRAW";
};

const getProbabilityForOutcome = (prediction: PredictionForComparison, outcome: MatchOutcome) => {
  if (outcome === "HOME_WIN") {
    return prediction.homeWinProbability;
  }

  if (outcome === "AWAY_WIN") {
    return prediction.awayWinProbability;
  }

  return prediction.drawProbability;
};

const comparePredictionWithResult = (prediction: PredictionForComparison, result: MatchResult) => {
  const realOutcome = getOutcome(result.homeGoals, result.awayGoals);
  const predictedHomeGoals = prediction.predictedHomeGoals ?? 0;
  const predictedAwayGoals = prediction.predictedAwayGoals ?? 0;
  const predictedOutcome = getOutcome(predictedHomeGoals, predictedAwayGoals);
  const homeGoalsError = Math.abs(predictedHomeGoals - result.homeGoals);
  const awayGoalsError = Math.abs(predictedAwayGoals - result.awayGoals);
  const totalGoalsError = homeGoalsError + awayGoalsError;

  return {
    predictionId: prediction.id,
    modelVersion: prediction.modelVersion,
    predictedResult: {
      homeGoals: round(predictedHomeGoals, 2),
      awayGoals: round(predictedAwayGoals, 2),
      outcome: predictedOutcome
    },
    realResult: {
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      outcome: realOutcome
    },
    hitWinner: predictedOutcome === realOutcome && realOutcome !== "DRAW",
    hitDraw: predictedOutcome === "DRAW" && realOutcome === "DRAW",
    homeGoalsError: round(homeGoalsError, 2),
    awayGoalsError: round(awayGoalsError, 2),
    totalGoalsError: round(totalGoalsError, 2),
    probabilityAssignedToCorrectOutcome: getProbabilityForOutcome(prediction, realOutcome),
    createdAt: prediction.createdAt
  };
};

const findResultOrFail = async (id: string) => {
  const result = await prisma.matchResult.findUnique({
    where: { id },
    include: resultInclude
  });

  if (!result) {
    throw new AppError("Result not found", 404);
  }

  return result;
};

const evaluatePredictionsForMatch = async (matchId: string, result: MatchResult) => {
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    orderBy: {
      createdAt: "desc"
    }
  });

  const comparisons = predictions.map((prediction) => comparePredictionWithResult(prediction, result));

  await Promise.all(
    comparisons.map((comparison) =>
      prisma.prediction.update({
        where: { id: comparison.predictionId },
        data: {
          status: PredictionStatus.EVALUATED,
          evaluatedAt: new Date(),
          errorScore: comparison.totalGoalsError
        }
      })
    )
  );

  return comparisons;
};

const getResultByMatchIdOrFail = async (matchId: string) => {
  const result = await prisma.matchResult.findUnique({
    where: { matchId },
    include: resultInclude
  });

  if (!result) {
    throw new AppError("Result not found for match", 404);
  }

  return result;
};

export const resultsService = {
  async create(data: CreateResultInput) {
    const match = await prisma.match.findUnique({
      where: { id: data.matchId },
      include: {
        result: true
      }
    });

    if (!match) {
      throw new AppError("Match not found", 404);
    }

    if (match.result) {
      throw new AppError("Result already exists for this match", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdResult = await tx.matchResult.create({
        data: {
          match: {
            connect: { id: data.matchId }
          },
          homeGoals: data.homeGoals,
          awayGoals: data.awayGoals,
          homePenaltyGoals: data.homePenaltyGoals,
          awayPenaltyGoals: data.awayPenaltyGoals,
          resultSource: data.resultSource,
          confirmedAt: data.confirmedAt ?? new Date()
        },
        include: resultInclude
      });

      await tx.match.update({
        where: { id: data.matchId },
        data: {
          status: MatchStatus.FINISHED
        }
      });

      return createdResult;
    });

    const comparisons = await evaluatePredictionsForMatch(data.matchId, result);

    return {
      result,
      comparisons
    };
  },

  async list() {
    return prisma.matchResult.findMany({
      include: resultInclude,
      orderBy: {
        createdAt: "desc"
      }
    });
  },

  async findById(id: string) {
    return findResultOrFail(id);
  },

  async findByMatchId(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true }
    });

    if (!match) {
      throw new AppError("Match not found", 404);
    }

    const result = await getResultByMatchIdOrFail(matchId);
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      include: {
        factors: {
          orderBy: {
            factorKey: "asc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return {
      result,
      predictions: predictions.map((prediction) => ({
        prediction,
        comparison: comparePredictionWithResult(prediction, result)
      }))
    };
  },

  async update(id: string, data: UpdateResultInput) {
    await findResultOrFail(id);

    const result = await prisma.matchResult.update({
      where: { id },
      data,
      include: resultInclude
    });

    const comparisons = await evaluatePredictionsForMatch(result.matchId, result);

    return {
      result,
      comparisons
    };
  },

  async delete(id: string) {
    const result = await findResultOrFail(id);

    await prisma.$transaction(async (tx) => {
      await tx.matchResult.delete({
        where: { id }
      });

      await tx.match.update({
        where: { id: result.matchId },
        data: {
          status: MatchStatus.SCHEDULED
        }
      });

      await tx.prediction.updateMany({
        where: { matchId: result.matchId },
        data: {
          status: PredictionStatus.LOCKED,
          evaluatedAt: null,
          errorScore: null
        }
      });
    });
  }
};
