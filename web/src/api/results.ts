import { http, type ApiResponse } from "./http";

export type CreateResultInput = {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  resultSource?: string;
};

export async function createResult(input: CreateResultInput) {
  const response = await http.post<ApiResponse<unknown>>("/results", input);
  return response.data.data;
}
