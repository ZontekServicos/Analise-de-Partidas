import { TeamType, type Competition, type Match, type Season, type Team } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { evaluatePredictionsForMatch } from "../../modules/results/results.service";
import { footballDataClient, getFootballDataQuotaState } from "./footballData.client";
import {
  mapFootballDataCompetition,
  mapFootballDataMatch,
  mapFootballDataMatchResult,
  mapFootballDataSeason,
  mapFootballDataTeam,
  type FootballDataCompetitionLike
} from "./footballData.mapper";
import {
  FOOTBALL_DATA_PROVIDER,
  type FootballDataCompetition,
  type FootballDataCompetitionsResponse,
  type FootballDataHeadToHeadResponse,
  type FootballDataMatch,
  type FootballDataMatchesResponse,
  type FootballDataSeason,
  type FootballDataTeam,
  type FootballDataTeamsResponse,
  type SyncMatchesFilters,
  type SyncSummary
} from "./footballData.types";

const createEmptySummary = (): SyncSummary => ({ fetched: 0, created: 0, updated: 0, skipped: 0, failed: 0 });

export const requireResponseArray = <T>(value: unknown, field: string): T[] => {
  if (!Array.isArray(value)) {
    throw new TypeError(`football-data.org: resposta invalida; ${field} nao e uma lista.`);
  }
  return value as T[];
};

/** Exportada para teste puro: um sync so pode sobrescrever um resultado que ele mesmo criou. */
export const shouldSkipResultSync = (existingResultSource: string | null | undefined): boolean =>
  Boolean(existingResultSource) && existingResultSource !== FOOTBALL_DATA_PROVIDER;

/** Exportada para teste puro: evita reavaliar previsoes quando o placar nao mudou (idempotencia). */
export const hasResultChanged = (
  existing: { homeGoals: number; awayGoals: number; homePenaltyGoals?: number | null; awayPenaltyGoals?: number | null } | null,
  incoming: { homeGoals: number; awayGoals: number; homePenaltyGoals?: number | null; awayPenaltyGoals?: number | null }
): boolean =>
  !existing ||
  existing.homeGoals !== incoming.homeGoals ||
  existing.awayGoals !== incoming.awayGoals ||
  (existing.homePenaltyGoals ?? null) !== (incoming.homePenaltyGoals ?? null) ||
  (existing.awayPenaltyGoals ?? null) !== (incoming.awayPenaltyGoals ?? null);

const externalWhere = (externalId: string) => ({
  externalProvider_externalId: { externalProvider: FOOTBALL_DATA_PROVIDER, externalId }
});

/**
 * Resolve um slug livre pra uma nova competicao vinda do sync, sem abortar o
 * lote inteiro por causa de uma colisao pontual (ex.: mesmo nome cadastrado
 * manualmente no seed) — sufixa "-2", "-3"... ate achar um livre.
 */
const resolveAvailableSlug = async (baseSlug: string): Promise<string> => {
  let candidate = baseSlug;
  let suffix = 2;

  while (await prisma.competition.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const ensureCompetition = async (
  raw: FootballDataCompetitionLike
): Promise<{ row: Competition; created: boolean }> => {
  const mapped = mapFootballDataCompetition(raw);

  const existing = await prisma.competition.findUnique({ where: externalWhere(mapped.externalId) });

  if (existing) {
    const row = await prisma.competition.update({
      where: { id: existing.id },
      data: {
        name: mapped.name,
        ...(raw.type != null ? { type: mapped.type } : {}),
        ...(raw.area !== undefined
          ? { country: mapped.country, isInternational: mapped.isInternational }
          : {})
      }
    });
    return { row, created: false };
  }

  const slug = await resolveAvailableSlug(mapped.slug);
  const row = await prisma.competition.create({ data: { ...mapped, slug } });
  return { row, created: true };
};

const ensureSeason = async (raw: FootballDataSeason, competitionId: string, isCurrent: boolean): Promise<Season> => {
  const mapped = mapFootballDataSeason(raw, isCurrent);

  const existing = await prisma.season.findUnique({ where: externalWhere(mapped.externalId) });

  if (existing) {
    return prisma.season.update({
      where: { id: existing.id },
      data: {
        name: mapped.name,
        startDate: mapped.startDate,
        endDate: mapped.endDate,
        isCurrent: mapped.isCurrent
      }
    });
  }

  return prisma.season.create({
    data: { ...mapped, competition: { connect: { id: competitionId } } }
  });
};

const ensureTeam = async (raw: FootballDataTeam): Promise<{ row: Team; created: boolean }> => {
  const mapped = mapFootballDataTeam(raw);

  const existing = await prisma.team.findUnique({ where: externalWhere(mapped.externalId) });

  if (existing) {
    const row = await prisma.team.update({
      where: { id: existing.id },
      data: {
        name: mapped.name,
        ...(mapped.teamType !== TeamType.UNKNOWN ? { teamType: mapped.teamType } : {}),
        ...(raw.area !== undefined ? { country: mapped.country } : {}),
        ...(raw.founded !== undefined ? { foundedYear: mapped.foundedYear } : {}),
        ...(raw.crest !== undefined ? { crestUrl: mapped.crestUrl } : {})
      }
    });
    return { row, created: false };
  }

  const row = await prisma.team.create({ data: mapped });
  return { row, created: true };
};

const upsertMatchResultIfFinished = async (matchId: string, raw: FootballDataMatch) => {
  const mappedResult = mapFootballDataMatchResult(raw);

  if (!mappedResult) {
    return;
  }

  const existing = await prisma.matchResult.findUnique({ where: { matchId } });

  if (existing && shouldSkipResultSync(existing.resultSource)) {
    return;
  }

  if (existing && !hasResultChanged(existing, mappedResult)) {
    // Recupera previsoes que possam ter ficado pendentes se um processo anterior
    // caiu depois de salvar o resultado. Previsoes ja avaliadas nao sao tocadas.
    await evaluatePredictionsForMatch(matchId, existing, { onlyPending: true });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const savedResult = existing
      ? await tx.matchResult.update({
          where: { id: existing.id },
          data: { ...mappedResult, resultSource: FOOTBALL_DATA_PROVIDER, confirmedAt: new Date() }
        })
      : await tx.matchResult.create({
          data: { matchId, ...mappedResult, resultSource: FOOTBALL_DATA_PROVIDER, confirmedAt: new Date() }
        });

    await tx.match.update({ where: { id: matchId }, data: { status: "FINISHED" } });

    return savedResult;
  });

  await evaluatePredictionsForMatch(matchId, result);
};

type UpsertMatchOutcome = { outcome: "created" | "updated" | "skipped"; match?: Match };

const upsertMatchFromExternal = async (
  raw: FootballDataMatch,
  currentSeasonExternalId?: string
): Promise<UpsertMatchOutcome> => {
  try {
    const { row: competition } = await ensureCompetition(raw.competition);
    const season = await ensureSeason(
      raw.season,
      competition.id,
      currentSeasonExternalId !== undefined && String(raw.season.id) === currentSeasonExternalId
    );
    const { row: homeTeam } = await ensureTeam(raw.homeTeam);
    const { row: awayTeam } = await ensureTeam(raw.awayTeam);

    const mapped = mapFootballDataMatch(raw);
    const existing = await prisma.match.findUnique({ where: externalWhere(mapped.externalId) });

    const match = existing
      ? await prisma.match.update({
          where: { id: existing.id },
          data: {
            competition: mapped.competition,
            competitionId: competition.id,
            seasonId: season.id,
            stage: mapped.stage,
            round: mapped.round,
            groupName: mapped.groupName,
            startsAt: mapped.startsAt,
            status: mapped.status,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id
          }
        })
      : await prisma.match.create({
          data: {
            ...mapped,
            competitionRef: { connect: { id: competition.id } },
            season: { connect: { id: season.id } },
            homeTeam: { connect: { id: homeTeam.id } },
            awayTeam: { connect: { id: awayTeam.id } }
          }
        });

    await upsertMatchResultIfFinished(match.id, raw);

    return { outcome: existing ? "updated" : "created", match };
  } catch (error) {
    console.error(`[footballData] Falha ao sincronizar partida externa ${raw.id}:`, (error as Error).message);
    return { outcome: "skipped" };
  }
};

export const footballDataService = {
  async syncCompetitions(): Promise<SyncSummary> {
    const summary = createEmptySummary();
    const response = await footballDataClient.get<FootballDataCompetitionsResponse>("competitions");

    const competitions = requireResponseArray<FootballDataCompetition>(response?.competitions, "competitions");
    summary.fetched = competitions.length;

    for (const raw of competitions) {
      try {
        const { created } = await ensureCompetition(raw);
        summary[created ? "created" : "updated"] += 1;
      } catch (error) {
        console.error(`[footballData] Falha ao sincronizar competicao ${raw.id}:`, (error as Error).message);
        summary.failed += 1;
      }
    }

    return summary;
  },

  async syncCompetitionTeams(competitionExternalId: string, season?: string): Promise<SyncSummary> {
    const summary = createEmptySummary();
    const rawCompetition = await footballDataClient.get<FootballDataCompetition>(
      `competitions/${competitionExternalId}`
    );
    await ensureCompetition(rawCompetition);
    const response = await footballDataClient.get<FootballDataTeamsResponse>(
      `competitions/${competitionExternalId}/teams`,
      season ? { season } : undefined
    );

    const teams = requireResponseArray<FootballDataTeam>(response?.teams, "teams");
    summary.fetched = teams.length;

    for (const raw of teams) {
      try {
        const { created } = await ensureTeam(raw);
        summary[created ? "created" : "updated"] += 1;
      } catch (error) {
        console.error(`[footballData] Falha ao sincronizar time ${raw.id}:`, (error as Error).message);
        summary.failed += 1;
      }
    }

    return summary;
  },

  async syncCompetitionMatches(competitionExternalId: string, filters: SyncMatchesFilters = {}): Promise<SyncSummary> {
    const summary = createEmptySummary();
    const rawCompetition = await footballDataClient.get<FootballDataCompetition>(
      `competitions/${competitionExternalId}`
    );
    await ensureCompetition(rawCompetition);
    const currentSeasonExternalId = rawCompetition.currentSeason
      ? String(rawCompetition.currentSeason.id)
      : undefined;

    const response = await footballDataClient.get<FootballDataMatchesResponse>(
      `competitions/${competitionExternalId}/matches`,
      {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        stage: filters.stage,
        status: filters.status,
        matchday: filters.matchday,
        group: filters.group,
        season: filters.season
      }
    );

    const matches = requireResponseArray<FootballDataMatch>(response?.matches, "matches");
    summary.fetched = matches.length;

    for (const raw of matches) {
      const result = await upsertMatchFromExternal(raw, currentSeasonExternalId);
      summary[result.outcome] += 1;
    }

    return summary;
  },

  async syncMatchesByDateRange(dateFrom: string, dateTo: string, competitions?: string): Promise<SyncSummary> {
    const summary = createEmptySummary();
    const response = await footballDataClient.get<FootballDataMatchesResponse>("matches", {
      dateFrom,
      dateTo,
      competitions
    });

    const matches = requireResponseArray<FootballDataMatch>(response?.matches, "matches");
    summary.fetched = matches.length;

    for (const raw of matches) {
      const result = await upsertMatchFromExternal(raw);
      summary[result.outcome] += 1;
    }

    return summary;
  },

  async getTeamMatches(
    teamExternalId: string,
    options: {
      dateFrom?: string;
      dateTo?: string;
      season?: string;
      competitions?: string;
      status?: string;
      venue?: string;
      limit?: number;
    } = {}
  ): Promise<SyncSummary> {
    const summary = createEmptySummary();
    const response = await footballDataClient.get<FootballDataMatchesResponse>(`teams/${teamExternalId}/matches`, {
      dateFrom: options.dateFrom,
      dateTo: options.dateTo,
      season: options.season,
      competitions: options.competitions,
      status: options.status,
      venue: options.venue,
      limit: options.limit
    });

    const matches = requireResponseArray<FootballDataMatch>(response?.matches, "matches");
    summary.fetched = matches.length;

    for (const raw of matches) {
      const result = await upsertMatchFromExternal(raw);
      summary[result.outcome] += 1;
    }

    return summary;
  },

  async getHeadToHead(
    externalMatchId: string,
    options: { limit?: number; competitions?: string; dateFrom?: string; dateTo?: string } = {}
  ): Promise<FootballDataHeadToHeadResponse> {
    return footballDataClient.get<FootballDataHeadToHeadResponse>(`matches/${externalMatchId}/head2head`, options);
  },

  getStatus() {
    const quota = getFootballDataQuotaState();

    return {
      provider: "football-data.org",
      configured: footballDataClient.isConfigured(),
      reachable: quota.lastReachable,
      apiVersion: quota.apiVersion ?? "v4",
      requestsAvailable: quota.requestsAvailable,
      requestCounterReset: quota.requestCounterReset,
      lastCheckedAt: quota.lastCheckedAt
    };
  }
};
