import { http, type ApiResponse } from "./http";

export type TeamType = "CLUB" | "NATIONAL_TEAM";

export type Team = {
  id: string;
  name: string;
  teamType: TeamType;
  fifaCode?: string | null;
  confederation?: string | null;
  worldRanking?: number | null;
  country?: string | null;
  city?: string | null;
};

export type ListTeamsQuery = {
  teamType?: TeamType;
  country?: string;
  search?: string;
};

export async function listTeams(query: ListTeamsQuery = {}) {
  const response = await http.get<ApiResponse<Team[]>>("/teams", { params: query });
  return response.data.data;
}
