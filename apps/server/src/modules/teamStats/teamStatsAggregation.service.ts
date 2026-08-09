import { MatchStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";

const DEFAULT_RECENT_WINDOW = 5;

export type TeamMatchRecord = {
  homeTeamId: string;
  awayTeamId: string;
  startsAt: Date;
  homeGoals: number;
  awayGoals: number;
};

export type AggregatedTeamStats = {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  recentMatchesCount: number;
  recentWins: number;
  recentDraws: number;
  recentLosses: number;
  recentGoalsFor: number;
  recentGoalsAgainst: number;
};

/**
 * Agrega partidas finalizadas do NOSSO banco (Match+MatchResult) — nunca chama
 * a football-data.org. So calcula o que da pra sustentar com placar real:
 * jogos/vitorias/empates/derrotas/gols, total e "recente" (ultimas N, mais
 * novas primeiro). Campos como xG, shots, big chances, injuries continuam
 * fora daqui — usam o fallback ja existente do motor v2 (teamStatsMetrics.ts).
 */
export const aggregateTeamStatsFromMatches = (
  teamId: string,
  matches: TeamMatchRecord[],
  recentWindow = DEFAULT_RECENT_WINDOW
): AggregatedTeamStats => {
  const sorted = [...matches].sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

  const stats: AggregatedTeamStats = {
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    recentMatchesCount: 0,
    recentWins: 0,
    recentDraws: 0,
    recentLosses: 0,
    recentGoalsFor: 0,
    recentGoalsAgainst: 0
  };

  sorted.forEach((match, index) => {
    const isHome = match.homeTeamId === teamId;
    const goalsFor = isHome ? match.homeGoals : match.awayGoals;
    const goalsAgainst = isHome ? match.awayGoals : match.homeGoals;
    const outcome = goalsFor > goalsAgainst ? "win" : goalsFor < goalsAgainst ? "loss" : "draw";
    const isRecent = index < recentWindow;

    stats.matchesPlayed += 1;
    stats.goalsFor += goalsFor;
    stats.goalsAgainst += goalsAgainst;

    if (outcome === "win") {
      stats.wins += 1;
    } else if (outcome === "draw") {
      stats.draws += 1;
    } else {
      stats.losses += 1;
    }

    if (isRecent) {
      stats.recentMatchesCount += 1;
      stats.recentGoalsFor += goalsFor;
      stats.recentGoalsAgainst += goalsAgainst;

      if (outcome === "win") {
        stats.recentWins += 1;
      } else if (outcome === "draw") {
        stats.recentDraws += 1;
      } else {
        stats.recentLosses += 1;
      }
    }
  });

  return stats;
};

export type TeamStatsScope = {
  competitionId?: string;
  seasonId?: string;
};

export const teamStatsAggregationService = {
  async aggregate(teamId: string, scope: TeamStatsScope = {}, recentWindow = DEFAULT_RECENT_WINDOW) {
    const matches = await prisma.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        ...(scope.competitionId ? { competitionId: scope.competitionId } : {}),
        ...(scope.seasonId ? { seasonId: scope.seasonId } : {})
      },
      include: { result: true }
    });

    const records: TeamMatchRecord[] = matches
      .filter((match) => match.result)
      .map((match) => ({
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        startsAt: match.startsAt,
        homeGoals: match.result!.homeGoals,
        awayGoals: match.result!.awayGoals
      }));

    return aggregateTeamStatsFromMatches(teamId, records, recentWindow);
  },

  /** Cria/atualiza o TeamStats do escopo (time+competicao+temporada), so os campos agregaveis. */
  async applyToTeamStats(teamId: string, scope: TeamStatsScope = {}, referenceDate: Date = new Date()) {
    const aggregated = await this.aggregate(teamId, scope);

    const existing = await prisma.teamStats.findFirst({
      where: {
        teamId,
        competitionId: scope.competitionId ?? null,
        seasonId: scope.seasonId ?? null
      },
      orderBy: { referenceDate: "desc" }
    });

    if (existing) {
      return prisma.teamStats.update({
        where: { id: existing.id },
        data: { ...aggregated, referenceDate }
      });
    }

    return prisma.teamStats.create({
      data: {
        team: { connect: { id: teamId } },
        ...(scope.competitionId ? { competition: { connect: { id: scope.competitionId } } } : {}),
        ...(scope.seasonId ? { season: { connect: { id: scope.seasonId } } } : {}),
        referenceDate,
        ...aggregated
      }
    });
  }
};
