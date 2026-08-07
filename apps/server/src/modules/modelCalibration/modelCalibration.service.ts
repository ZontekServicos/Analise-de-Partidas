import { CalibrationStatus, PredictionStatus, type Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../shared/errors/AppError";
import { DEFAULT_MODEL_VERSION } from "../probabilityEngine/defaultWeights";
import type { RunModelCalibrationInput } from "./modelCalibration.schema";

type FactorAnalysis = {
  factorKey: string;
  samples: number;
  highContributionSamples: number;
  averageContribution: number;
  averageAbsoluteContribution: number;
  averageErrorWhenHighContribution: number | null;
  suggestion: "INCREASE_WEIGHT" | "REDUCE_WEIGHT" | "KEEP_WEIGHT";
  reason: string;
};

const round = (value: number, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const average = (values: number[]) => {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

const getSuggestion = (
  factorKey: string,
  highContributionAverageError: number | null,
  overallAverageError: number,
  highContributionSamples: number
): Pick<FactorAnalysis, "suggestion" | "reason"> => {
  if (highContributionSamples < 3 || highContributionAverageError === null) {
    return {
      suggestion: "KEEP_WEIGHT",
      reason: `Not enough evaluated high-contribution samples for ${factorKey}.`
    };
  }

  if (highContributionAverageError > overallAverageError * 1.15) {
    return {
      suggestion: "REDUCE_WEIGHT",
      reason: `High ${factorKey} contribution correlated with error above the overall average.`
    };
  }

  if (highContributionAverageError < overallAverageError * 0.85) {
    return {
      suggestion: "INCREASE_WEIGHT",
      reason: `High ${factorKey} contribution correlated with error below the overall average.`
    };
  }

  return {
    suggestion: "KEEP_WEIGHT",
    reason: `${factorKey} performance is close to the overall average error.`
  };
};

const calibrationRunSelect = {
  id: true,
  sourceModelVersion: true,
  targetModelVersion: true,
  status: true,
  matchesEvaluated: true,
  averageErrorBefore: true,
  averageErrorAfter: true,
  analysisSummary: true,
  factorSuggestions: true,
  notes: true,
  createdAt: true,
  appliedAt: true
} satisfies Prisma.ModelCalibrationRunSelect;

export const modelCalibrationService = {
  async run(input: RunModelCalibrationInput) {
    const sourceModelVersion = input.sourceModelVersion ?? DEFAULT_MODEL_VERSION;
    const highContributionThreshold = input.highContributionThreshold;

    const predictions = await prisma.prediction.findMany({
      where: {
        status: PredictionStatus.EVALUATED,
        modelVersion: sourceModelVersion,
        errorScore: {
          not: null
        }
      },
      include: {
        factors: true
      }
    });

    if (predictions.length === 0) {
      throw new AppError("No evaluated predictions found for calibration", 400, {
        sourceModelVersion
      });
    }

    const errorScores = predictions
      .map((prediction) => prediction.errorScore)
      .filter((errorScore): errorScore is number => errorScore !== null);
    const overallAverageError = average(errorScores) ?? 0;
    const factorGroups = new Map<string, { contributions: number[]; absoluteContributions: number[]; highContributionErrors: number[] }>();

    for (const prediction of predictions) {
      for (const factor of prediction.factors) {
        const group =
          factorGroups.get(factor.factorKey) ??
          {
            contributions: [],
            absoluteContributions: [],
            highContributionErrors: []
          };

        group.contributions.push(factor.contribution);
        group.absoluteContributions.push(Math.abs(factor.contribution));

        if (Math.abs(factor.contribution) >= highContributionThreshold && prediction.errorScore !== null) {
          group.highContributionErrors.push(prediction.errorScore);
        }

        factorGroups.set(factor.factorKey, group);
      }
    }

    const factorSuggestions: FactorAnalysis[] = Array.from(factorGroups.entries())
      .map(([factorKey, group]) => {
        const averageContribution = average(group.contributions) ?? 0;
        const averageAbsoluteContribution = average(group.absoluteContributions) ?? 0;
        const highContributionAverageError = average(group.highContributionErrors);
        const suggestion = getSuggestion(
          factorKey,
          highContributionAverageError,
          overallAverageError,
          group.highContributionErrors.length
        );

        return {
          factorKey,
          samples: group.contributions.length,
          highContributionSamples: group.highContributionErrors.length,
          averageContribution: round(averageContribution),
          averageAbsoluteContribution: round(averageAbsoluteContribution),
          averageErrorWhenHighContribution:
            highContributionAverageError === null ? null : round(highContributionAverageError),
          ...suggestion
        };
      })
      .sort((a, b) => b.averageAbsoluteContribution - a.averageAbsoluteContribution);

    const analysisSummary = {
      sourceModelVersion,
      targetModelVersion: input.targetModelVersion ?? null,
      evaluatedPredictions: predictions.length,
      highContributionThreshold,
      overallAverageError: round(overallAverageError),
      generatedAt: new Date().toISOString(),
      safetyNote: "Suggestions are informational only. ModelWeight records were not changed."
    };

    return prisma.modelCalibrationRun.create({
      data: {
        sourceModelVersion,
        targetModelVersion: input.targetModelVersion,
        status: CalibrationStatus.PENDING,
        matchesEvaluated: predictions.length,
        averageErrorBefore: round(overallAverageError),
        averageErrorAfter: null,
        analysisSummary,
        factorSuggestions,
        notes: input.notes
      },
      select: calibrationRunSelect
    });
  },

  async list() {
    return prisma.modelCalibrationRun.findMany({
      select: calibrationRunSelect,
      orderBy: {
        createdAt: "desc"
      }
    });
  },

  async findById(id: string) {
    const calibrationRun = await prisma.modelCalibrationRun.findUnique({
      where: { id },
      select: calibrationRunSelect
    });

    if (!calibrationRun) {
      throw new AppError("Model calibration run not found", 404);
    }

    return calibrationRun;
  }
};
