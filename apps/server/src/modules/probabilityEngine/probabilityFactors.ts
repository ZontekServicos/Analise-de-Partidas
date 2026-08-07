import type { ProbabilityFactorKey } from "./defaultWeights";

export type ProbabilityFactor = {
  factorKey: ProbabilityFactorKey;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
  metadata?: Record<string, unknown>;
};

export type ProbabilityEngineResult = {
  modelVersion: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedHomeGoals: number;
  predictedAwayGoals: number;
  confidence: number;
  factors: ProbabilityFactor[];
};
