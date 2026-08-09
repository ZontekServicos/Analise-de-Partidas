import { http, type ApiResponse } from "./http";
import type { Match } from "./matches";

export type PredictionFactor = {
  id: string;
  factorKey: string;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
};

export type Prediction = {
  id: string;
  matchId: string;
  match?: Match;
  modelVersion: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  predictedHomeGoals?: number | null;
  predictedAwayGoals?: number | null;
  confidenceScore?: number | null;
  createdAt: string;
  factors: PredictionFactor[];
};

export async function generatePrediction(matchId: string) {
  const response = await http.post<ApiResponse<Prediction>>(`/api/predictions/generate/${matchId}`);
  return response.data.data;
}
