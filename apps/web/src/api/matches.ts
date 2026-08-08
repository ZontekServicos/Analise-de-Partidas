import { getApiArrayData, http, type ApiResponse } from "./http";
import type { Competition } from "./competitions";
import type { Season } from "./seasons";

export type TeamSummary = {
  id: string;
  name: string;
  fifaCode?: string | null;
  confederation?: string | null;
  worldRanking?: number | null;
};

export type Match = {
  id: string;
  competition: string;
  competitionId?: string | null;
  competitionRef?: Competition | null;
  seasonId?: string | null;
  season?: Season | null;
  stage?: string | null;
  round?: string | null;
  groupName?: string | null;
  startsAt: string;
  neutralField: boolean;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
};

export type ListMatchesQuery = {
  competitionId?: string;
  seasonId?: string;
  teamId?: string;
  status?: string;
};

export async function listMatches(query: ListMatchesQuery = {}) {
  const response = await http.get<ApiResponse<Match[]>>("/matches", { params: query });
  return getApiArrayData(response, "partidas");
}
