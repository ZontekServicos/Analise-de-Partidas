import { CompetitionType, MatchStatus, TeamType } from "@prisma/client";

import { slugify } from "../../modules/competitions/competitions.service";
import {
  FOOTBALL_DATA_PROVIDER,
  type FootballDataArea,
  type FootballDataCompetitionSummary,
  type FootballDataMatch,
  type FootballDataSeason,
  type FootballDataTeam
} from "./footballData.types";

/**
 * Aceita tanto o recurso completo de /competitions quanto o resumo embutido em
 * Match (que nao tem `area`) — assim o mesmo mapper serve os dois casos.
 */
export type FootballDataCompetitionLike = FootballDataCompetitionSummary & {
  area?: FootballDataArea | null;
};

export type CompetitionUpsertInput = {
  externalId: string;
  externalProvider: string;
  name: string;
  slug: string;
  type: CompetitionType;
  country: string | null;
  confederation: string | null;
  isInternational: boolean;
};

export type SeasonUpsertInput = {
  externalId: string;
  externalProvider: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
};

export type TeamUpsertInput = {
  externalId: string;
  externalProvider: string;
  name: string;
  teamType: TeamType;
  country: string | null;
  foundedYear: number | null;
  crestUrl: string | null;
};

export type MatchUpsertInput = {
  externalId: string;
  externalProvider: string;
  competition: string;
  stage: string | null;
  round: string | null;
  groupName: string | null;
  startsAt: Date;
  status: MatchStatus;
};

export type MatchResultUpsertInput = {
  homeGoals: number;
  awayGoals: number;
  homePenaltyGoals: number | null;
  awayPenaltyGoals: number | null;
};

const emptyToNull = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const requiredText = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`football-data.org: campo ${field} ausente ou invalido.`);
  }
  return value.trim();
};

const requiredExternalId = (value: unknown, field: string): string => {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") {
    throw new TypeError(`football-data.org: campo ${field} ausente ou invalido.`);
  }
  return String(value);
};

const requiredDate = (value: unknown, field: string): Date => {
  const date = new Date(requiredText(value, field));
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError(`football-data.org: campo ${field} nao e uma data valida.`);
  }
  return date;
};

export const mapFootballDataTeamType = (rawType?: string | null): TeamType => {
  switch (rawType?.trim().toUpperCase()) {
    case "CLUB":
      return TeamType.CLUB;
    case "NATIONAL":
    case "NATIONAL_TEAM":
      return TeamType.NATIONAL_TEAM;
    default:
      return TeamType.UNKNOWN;
  }
};

/**
 * football-data.org so tem type LEAGUE/CUP. Refinamos CUP para INTERNATIONAL_CUP
 * quando a area for "World" (heuristica documentada, nao um dado que a API entrega
 * pronto). Tipo desconhecido cai em OTHER em vez de quebrar o sync.
 */
export const mapFootballDataCompetitionType = (
  rawType: string,
  isInternational: boolean
): CompetitionType => {
  const normalized = rawType?.toUpperCase();

  if (normalized === "CUP") {
    return isInternational ? CompetitionType.INTERNATIONAL_CUP : CompetitionType.CUP;
  }

  if (normalized === "LEAGUE") {
    return CompetitionType.LEAGUE;
  }

  return CompetitionType.OTHER;
};

export const mapFootballDataCompetition = (raw: FootballDataCompetitionLike): CompetitionUpsertInput => {
  const isInternational = raw.area?.name === "World";
  const name = requiredText(raw.name, "competition.name");

  return {
    externalId: requiredExternalId(raw.id, "competition.id"),
    externalProvider: FOOTBALL_DATA_PROVIDER,
    name,
    slug: slugify(raw.code || name),
    type: mapFootballDataCompetitionType(raw.type ?? "", isInternational),
    country: isInternational ? null : emptyToNull(raw.area?.name),
    confederation: null,
    isInternational
  };
};

const deriveSeasonName = (startDate: Date, endDate: Date | null): string => {
  const startYear = startDate.getUTCFullYear();
  const endYear = endDate?.getUTCFullYear() ?? startYear;
  return startYear === endYear ? String(startYear) : `${startYear}/${endYear}`;
};

export const mapFootballDataSeason = (raw: FootballDataSeason, isCurrent: boolean): SeasonUpsertInput => {
  const startDate = requiredDate(raw.startDate, "season.startDate");
  const endDate = raw.endDate ? requiredDate(raw.endDate, "season.endDate") : null;

  return {
    externalId: requiredExternalId(raw.id, "season.id"),
    externalProvider: FOOTBALL_DATA_PROVIDER,
    name: deriveSeasonName(startDate, endDate),
    startDate,
    endDate,
    isCurrent
  };
};

export const mapFootballDataTeam = (raw: FootballDataTeam): TeamUpsertInput => ({
  externalId: requiredExternalId(raw.id, "team.id"),
  externalProvider: FOOTBALL_DATA_PROVIDER,
  name: requiredText(raw.name, "team.name"),
  teamType: mapFootballDataTeamType(raw.type),
  country: emptyToNull(raw.area?.name),
  foundedYear: raw.founded ?? null,
  crestUrl: emptyToNull(raw.crest)
});

/**
 * Nosso MatchStatus e mais grosso que o da football-data.org — normalizacao com perda
 * documentada: SCHEDULED/TIMED->SCHEDULED, IN_PLAY/PAUSED->IN_PROGRESS,
 * FINISHED/AWARDED->FINISHED, SUSPENDED/POSTPONED/CANCELLED->CANCELLED.
 * Status desconhecido cai em SCHEDULED (nunca quebra o sync).
 */
export const mapFootballDataMatchStatus = (rawStatus: string): MatchStatus => {
  const normalized = rawStatus?.toUpperCase();

  switch (normalized) {
    case "SCHEDULED":
    case "TIMED":
      return MatchStatus.SCHEDULED;
    case "IN_PLAY":
    case "PAUSED":
      return MatchStatus.IN_PROGRESS;
    case "FINISHED":
    case "AWARDED":
      return MatchStatus.FINISHED;
    case "SUSPENDED":
    case "POSTPONED":
    case "CANCELLED":
      return MatchStatus.CANCELLED;
    default:
      return MatchStatus.SCHEDULED;
  }
};

export const mapFootballDataMatch = (raw: FootballDataMatch): MatchUpsertInput => ({
  externalId: requiredExternalId(raw.id, "match.id"),
  externalProvider: FOOTBALL_DATA_PROVIDER,
  competition: requiredText(raw.competition?.name, "match.competition.name"),
  stage: emptyToNull(raw.stage),
  round: raw.matchday !== null && raw.matchday !== undefined ? String(raw.matchday) : null,
  groupName: emptyToNull(raw.group),
  startsAt: requiredDate(raw.utcDate, "match.utcDate"),
  status: mapFootballDataMatchStatus(raw.status)
});

/**
 * So retorna um resultado quando o status mapeado for FINISHED e o placar cheio
 * estiver presente — nunca fabrica valor quando a API nao entrega o placar.
 */
export const mapFootballDataMatchResult = (raw: FootballDataMatch): MatchResultUpsertInput | null => {
  const status = mapFootballDataMatchStatus(raw.status);

  if (status !== MatchStatus.FINISHED) {
    return null;
  }

  const home = raw.score?.fullTime?.home;
  const away = raw.score?.fullTime?.away;

  if (home === null || home === undefined || away === null || away === undefined) {
    return null;
  }

  return {
    homeGoals: home,
    awayGoals: away,
    homePenaltyGoals: raw.score.penalties?.home ?? null,
    awayPenaltyGoals: raw.score.penalties?.away ?? null
  };
};
