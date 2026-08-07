import { http, type ApiResponse } from "./http";

export type CalibrationRun = {
  id: string;
  sourceModelVersion: string;
  targetModelVersion?: string | null;
  status: string;
  matchesEvaluated: number;
  averageErrorBefore?: number | null;
  factorSuggestions?: unknown;
  analysisSummary?: unknown;
  createdAt: string;
};

export async function runModelCalibration() {
  const response = await http.post<ApiResponse<CalibrationRun>>("/model-calibration/run", {
    sourceModelVersion: "v1",
    targetModelVersion: "v1.1",
    highContributionThreshold: 0.03,
    notes: "Calibracao executada pelo frontend MVP"
  });

  return response.data.data;
}
