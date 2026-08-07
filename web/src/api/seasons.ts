import { http, type ApiResponse } from "./http";
import type { Competition } from "./competitions";

export type Season = {
  id: string;
  competitionId: string;
  competition?: Competition;
  name: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
};

export type ListSeasonsQuery = {
  competitionId?: string;
  isCurrent?: boolean;
};

export async function listSeasons(query: ListSeasonsQuery = {}) {
  const response = await http.get<ApiResponse<Season[]>>("/seasons", { params: query });
  return response.data.data;
}
