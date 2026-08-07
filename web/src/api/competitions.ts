import { http, type ApiResponse } from "./http";

export type CompetitionType = "LEAGUE" | "CUP" | "INTERNATIONAL_CUP" | "QUALIFIERS" | "FRIENDLY" | "OTHER";

export type Competition = {
  id: string;
  name: string;
  slug: string;
  type: CompetitionType;
  country?: string | null;
  confederation?: string | null;
  isInternational: boolean;
};

export type ListCompetitionsQuery = {
  type?: CompetitionType;
  country?: string;
  isInternational?: boolean;
};

export async function listCompetitions(query: ListCompetitionsQuery = {}) {
  const response = await http.get<ApiResponse<Competition[]>>("/competitions", { params: query });
  return response.data.data;
}
