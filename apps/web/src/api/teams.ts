import { getApiArrayData, http, type ApiResponse } from "./http";

export type TeamType = "CLUB" | "NATIONAL_TEAM" | "UNKNOWN";

export type Team = {
  id: string;
  name: string;
  teamType: TeamType;
  fifaCode?: string | null;
  confederation?: string | null;
  worldRanking?: number | null;
  country?: string | null;
  city?: string | null;
  crestUrl?: string | null;
};

export type ListTeamsQuery = {
  teamType?: TeamType;
  country?: string;
  search?: string;
};

export async function listTeams(query: ListTeamsQuery = {}) {
  const response = await http.get<ApiResponse<Team[]>>("/api/teams", { params: query });
  return getApiArrayData(response, "times");
}
