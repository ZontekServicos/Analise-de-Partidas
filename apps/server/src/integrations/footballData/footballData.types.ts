/**
 * Tipos minimos da football-data.org v4 — so os campos que realmente usamos.
 * Nao tenta cobrir a API inteira (squad, coach, odds, referees, etc ficam de fora).
 */

export const FOOTBALL_DATA_PROVIDER = "football-data.org" as const;

export type FootballDataArea = {
  id: number;
  name: string;
  code?: string | null;
};

export type FootballDataSeason = {
  id: number;
  startDate: string;
  endDate?: string | null;
  currentMatchday?: number | null;
  winner?: { id: number; name: string } | null;
};

export type FootballDataCompetition = {
  id: number;
  name: string;
  code?: string | null;
  type: string;
  emblem?: string | null;
  area?: FootballDataArea | null;
  currentSeason?: FootballDataSeason | null;
};

/** Resumo de competicao embutido dentro de um Match (menos campos que o recurso completo). */
export type FootballDataCompetitionSummary = {
  id: number;
  name: string;
  code?: string | null;
  type?: string | null;
  emblem?: string | null;
};

export type FootballDataTeam = {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
  area?: FootballDataArea | null;
  address?: string | null;
  website?: string | null;
  founded?: number | null;
  clubColors?: string | null;
  type?: string | null;
};

/** Resumo de time embutido dentro de um Match. */
export type FootballDataTeamSummary = {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
  type?: string | null;
};

export type FootballDataScore = {
  winner?: string | null;
  duration?: string | null;
  fullTime?: { home?: number | null; away?: number | null } | null;
  halfTime?: { home: number | null; away: number | null };
  extraTime?: { home: number | null; away: number | null } | null;
  penalties?: { home: number | null; away: number | null } | null;
};

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number | null;
  stage?: string | null;
  group?: string | null;
  lastUpdated?: string;
  homeTeam: FootballDataTeamSummary;
  awayTeam: FootballDataTeamSummary;
  score: FootballDataScore;
  competition: FootballDataCompetitionSummary;
  season: FootballDataSeason;
};

export type FootballDataCompetitionsResponse = {
  count: number;
  competitions: FootballDataCompetition[];
};

export type FootballDataTeamsResponse = {
  count: number;
  competition?: FootballDataCompetitionSummary;
  season?: FootballDataSeason;
  teams: FootballDataTeam[];
};

export type FootballDataMatchesResponse = {
  count?: number;
  resultSet?: { count: number };
  competition?: FootballDataCompetitionSummary;
  matches: FootballDataMatch[];
};

export type FootballDataHeadToHeadResponse = {
  filters?: Record<string, unknown>;
  resultSet?: { count: number };
  aggregates?: unknown;
  matches: FootballDataMatch[];
};

export type SyncMatchesFilters = {
  dateFrom?: string;
  dateTo?: string;
  stage?: string;
  status?: string;
  matchday?: number;
  group?: string;
  season?: string;
};

export type SyncSummary = {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
};
