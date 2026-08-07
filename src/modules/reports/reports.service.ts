import type { MatchResult, Prediction, Prisma, TeamStats } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../shared/errors/AppError";
import { computeBlockScores } from "../probabilityEngine/teamStatsMetrics";

type MatchOutcome = "HOME_WIN" | "DRAW" | "AWAY_WIN";

type PredictionForComparison = Pick<
  Prediction,
  | "id"
  | "homeWinProbability"
  | "drawProbability"
  | "awayWinProbability"
  | "predictedHomeGoals"
  | "predictedAwayGoals"
  | "confidenceScore"
  | "modelVersion"
  | "createdAt"
>;

type PerformanceAccumulator = {
  totalPredictions: number;
  evaluatedPredictions: number;
  winnerHits: number;
  homeGoalsErrorTotal: number;
  awayGoalsErrorTotal: number;
  totalGoalsErrorTotal: number;
  confidenceTotal: number;
  confidenceSamples: number;
};

const teamSummarySelect = {
  id: true,
  name: true,
  fifaCode: true,
  confederation: true,
  worldRanking: true
};

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

const createAccumulator = (): PerformanceAccumulator => ({
  totalPredictions: 0,
  evaluatedPredictions: 0,
  winnerHits: 0,
  homeGoalsErrorTotal: 0,
  awayGoalsErrorTotal: 0,
  totalGoalsErrorTotal: 0,
  confidenceTotal: 0,
  confidenceSamples: 0
});

const addPredictionToPerformance = (
  accumulator: PerformanceAccumulator,
  prediction: PredictionForComparison,
  result?: MatchResult | null
) => {
  accumulator.totalPredictions += 1;

  if (prediction.confidenceScore !== null) {
    accumulator.confidenceTotal += prediction.confidenceScore;
    accumulator.confidenceSamples += 1;
  }

  if (!result) {
    return;
  }

  const comparison = comparePredictionWithResult(prediction, result);

  accumulator.evaluatedPredictions += 1;
  accumulator.winnerHits += comparison.hitWinner || comparison.hitDraw ? 1 : 0;
  accumulator.homeGoalsErrorTotal += comparison.homeGoalsError;
  accumulator.awayGoalsErrorTotal += comparison.awayGoalsError;
  accumulator.totalGoalsErrorTotal += comparison.totalGoalsError;
};

const formatPerformance = (accumulator: PerformanceAccumulator) => ({
  totalPredictions: accumulator.totalPredictions,
  evaluatedPredictions: accumulator.evaluatedPredictions,
  winnerHitRate:
    accumulator.evaluatedPredictions === 0
      ? 0
      : round(accumulator.winnerHits / accumulator.evaluatedPredictions),
  averageHomeGoalsError:
    accumulator.evaluatedPredictions === 0
      ? 0
      : round(accumulator.homeGoalsErrorTotal / accumulator.evaluatedPredictions, 2),
  averageAwayGoalsError:
    accumulator.evaluatedPredictions === 0
      ? 0
      : round(accumulator.awayGoalsErrorTotal / accumulator.evaluatedPredictions, 2),
  averageTotalGoalsError:
    accumulator.evaluatedPredictions === 0
      ? 0
      : round(accumulator.totalGoalsErrorTotal / accumulator.evaluatedPredictions, 2),
  averageConfidence:
    accumulator.confidenceSamples === 0 ? 0 : round(accumulator.confidenceTotal / accumulator.confidenceSamples)
});

const latestTeamStatsOrder = {
  referenceDate: "desc"
} satisfies Prisma.TeamStatsOrderByWithRelationInput;

const buildComputedBlocks = (stats: TeamStats | null) => (stats ? computeBlockScores(stats) : null);

export const reportsService = {
  async getMatchReport(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          select: teamSummarySelect
        },
        awayTeam: {
          select: teamSummarySelect
        },
        result: true,
        predictions: {
          include: {
            factors: {
              orderBy: {
                factorKey: "asc"
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    });

    if (!match) {
      throw new AppError("Match not found", 404);
    }

    const [homeTeamStats, awayTeamStats] = await Promise.all([
      prisma.teamStats.findFirst({
        where: { teamId: match.homeTeamId },
        orderBy: latestTeamStatsOrder
      }),
      prisma.teamStats.findFirst({
        where: { teamId: match.awayTeamId },
        orderBy: latestTeamStatsOrder
      })
    ]);

    const latestPrediction = match.predictions[0] ?? null;
    const comparison =
      latestPrediction && match.result ? comparePredictionWithResult(latestPrediction, match.result) : null;

    return {
      match: {
        id: match.id,
        competition: match.competition,
        stage: match.stage,
        group: match.groupName,
        matchDate: match.startsAt,
        neutralField: match.neutralField,
        status: match.status,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam
      },
      latestStats: {
        homeTeam: homeTeamStats,
        awayTeam: awayTeamStats
      },
      computedBlocks: {
        homeTeam: buildComputedBlocks(homeTeamStats),
        awayTeam: buildComputedBlocks(awayTeamStats)
      },
      latestPrediction,
      predictionFactors: latestPrediction?.factors ?? [],
      result: match.result,
      comparison
    };
  },

  async getModelPerformanceReport() {
    const predictions = await prisma.prediction.findMany({
      include: {
        match: {
          include: {
            result: true
          }
        }
      }
    });

    const overall = createAccumulator();
    const byModelVersion = new Map<string, PerformanceAccumulator>();

    for (const prediction of predictions) {
      const modelAccumulator = byModelVersion.get(prediction.modelVersion) ?? createAccumulator();

      addPredictionToPerformance(overall, prediction, prediction.match.result);
      addPredictionToPerformance(modelAccumulator, prediction, prediction.match.result);

      byModelVersion.set(prediction.modelVersion, modelAccumulator);
    }

    return {
      ...formatPerformance(overall),
      performanceByModelVersion: Array.from(byModelVersion.entries())
        .map(([modelVersion, accumulator]) => ({
          modelVersion,
          ...formatPerformance(accumulator)
        }))
        .sort((a, b) => a.modelVersion.localeCompare(b.modelVersion))
    };
  }
};
