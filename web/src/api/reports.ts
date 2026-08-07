import { http, type ApiResponse } from "./http";
import type { Match } from "./matches";
import type { Prediction, PredictionFactor } from "./predictions";

export type MatchResult = {
  id: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  resultSource?: string | null;
  confirmedAt?: string | null;
};

export type PredictionComparison = {
  predictedResult: {
    homeGoals: number;
    awayGoals: number;
    outcome: string;
  };
  realResult: {
    homeGoals: number;
    awayGoals: number;
    outcome: string;
  };
  hitWinner: boolean;
  hitDraw: boolean;
  homeGoalsError: number;
  awayGoalsError: number;
  totalGoalsError: number;
  probabilityAssignedToCorrectOutcome: number;
};

export type MatchReport = {
  match: Match & {
    group?: string | null;
    matchDate?: string;
  };
  latestStats: {
    homeTeam: Record<string, unknown> | null;
    awayTeam: Record<string, unknown> | null;
  };
  latestPrediction: Prediction | null;
  predictionFactors: PredictionFactor[];
  result: MatchResult | null;
  comparison: PredictionComparison | null;
};

export type ModelVersionPerformance = {
  modelVersion: string;
  totalPredictions: number;
  evaluatedPredictions: number;
  winnerHitRate: number;
  averageHomeGoalsError: number;
  averageAwayGoalsError: number;
  averageTotalGoalsError: number;
  averageConfidence: number;
};

export type ModelPerformance = Omit<ModelVersionPerformance, "modelVersion"> & {
  performanceByModelVersion: ModelVersionPerformance[];
};

export async function getMatchReport(matchId: string) {
  const response = await http.get<ApiResponse<MatchReport>>(`/reports/match/${matchId}`);
  return response.data.data;
}

export async function getModelPerformance() {
  const response = await http.get<ApiResponse<ModelPerformance>>("/reports/model-performance");
  return response.data.data;
}
