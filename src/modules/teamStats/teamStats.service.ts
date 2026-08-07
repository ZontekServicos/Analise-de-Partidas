import type { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../shared/errors/AppError";
import type {
  CreateTeamStatsInput,
  ListTeamStatsQuery,
  UpdateTeamStatsInput
} from "./teamStats.schema";

const teamSummarySelect = {
  id: true,
  name: true,
  fifaCode: true,
  confederation: true,
  worldRanking: true
};

const teamStatsInclude = {
  team: {
    select: teamSummarySelect
  }
};

const ensureTeamExists = async (teamId: string) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true }
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }
};

const findTeamStatsOrFail = async (id: string) => {
  const teamStats = await prisma.teamStats.findUnique({
    where: { id },
    include: teamStatsInclude
  });

  if (!teamStats) {
    throw new AppError("Team stats not found", 404);
  }

  return teamStats;
};

type CurrentTeamStatsTotals = {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  recentMatchesCount: number;
  recentWins: number;
  recentDraws: number;
  recentLosses: number;
  cleanSheets: number;
};

const validateRecordTotals = (data: UpdateTeamStatsInput, current?: CurrentTeamStatsTotals) => {
  const matchesPlayed = data.matchesPlayed ?? current?.matchesPlayed;
  const wins = data.wins ?? current?.wins;
  const draws = data.draws ?? current?.draws;
  const losses = data.losses ?? current?.losses;

  if (
    matchesPlayed !== undefined &&
    wins !== undefined &&
    draws !== undefined &&
    losses !== undefined &&
    wins + draws + losses > matchesPlayed
  ) {
    throw new AppError("wins + draws + losses cannot be greater than matchesPlayed", 400);
  }

  const recentMatchesCount = data.recentMatchesCount ?? current?.recentMatchesCount;
  const recentWins = data.recentWins ?? current?.recentWins;
  const recentDraws = data.recentDraws ?? current?.recentDraws;
  const recentLosses = data.recentLosses ?? current?.recentLosses;

  if (
    recentMatchesCount !== undefined &&
    recentWins !== undefined &&
    recentDraws !== undefined &&
    recentLosses !== undefined &&
    recentWins + recentDraws + recentLosses > recentMatchesCount
  ) {
    throw new AppError("recentWins + recentDraws + recentLosses cannot be greater than recentMatchesCount", 400);
  }

  const cleanSheets = data.cleanSheets ?? current?.cleanSheets;

  if (matchesPlayed !== undefined && cleanSheets !== undefined && cleanSheets > matchesPlayed) {
    throw new AppError("cleanSheets cannot be greater than matchesPlayed", 400);
  }
};

const toPrismaCreateData = (data: CreateTeamStatsInput): Prisma.TeamStatsCreateInput => ({
  team: {
    connect: { id: data.teamId }
  },
  ...(data.competitionId !== undefined ? { competition: { connect: { id: data.competitionId } } } : {}),
  ...(data.seasonId !== undefined ? { season: { connect: { id: data.seasonId } } } : {}),
  referenceDate: data.referenceDate,
  matchesPlayed: data.matchesPlayed,
  wins: data.wins,
  draws: data.draws,
  losses: data.losses,
  goalsFor: data.goalsFor,
  goalsAgainst: data.goalsAgainst,
  xG: data.xG,
  xGA: data.xGA,
  shotsPerGame: data.shotsPerGame,
  shotsAgainstPerGame: data.shotsAgainstPerGame,
  possessionAvg: data.possessionAvg,
  recentFormScore: data.recentFormScore,
  attackStrength: data.attackStrength,
  defenseStrength: data.defenseStrength,
  injuryImpact: data.injuryImpact,
  lineupStrength: data.lineupStrength,
  motivationScore: data.motivation,
  matchImportanceScore: data.matchImportance,
  recentMatchesCount: data.recentMatchesCount,
  recentWins: data.recentWins,
  recentDraws: data.recentDraws,
  recentLosses: data.recentLosses,
  recentGoalsFor: data.recentGoalsFor,
  recentGoalsAgainst: data.recentGoalsAgainst,
  recentXG: data.recentXG,
  recentXGA: data.recentXGA,
  shotsOnTargetPerGame: data.shotsOnTargetPerGame,
  bigChancesPerGame: data.bigChancesPerGame,
  bigChancesConvertedPerGame: data.bigChancesConvertedPerGame,
  cleanSheets: data.cleanSheets,
  shotsOnTargetAgainstPerGame: data.shotsOnTargetAgainstPerGame,
  bigChancesConcededPerGame: data.bigChancesConcededPerGame,
  opponentStrengthScore: data.opponentStrengthScore,
  suspendedPlayersImpact: data.suspendedPlayersImpact,
  keyPlayersAvailability: data.keyPlayersAvailability,
  restDays: data.restDays,
  fatigueScore: data.fatigueScore,
  travelImpact: data.travelImpact,
  yellowCardsPerGame: data.yellowCardsPerGame,
  redCardsPerGame: data.redCardsPerGame,
  foulsPerGame: data.foulsPerGame,
  setPieceGoalsFor: data.setPieceGoalsFor,
  setPieceGoalsAgainst: data.setPieceGoalsAgainst,
  setPieceThreatScore: data.setPieceThreatScore,
  tournamentExperienceScore: data.tournamentExperienceScore,
  knockoutExperienceScore: data.knockoutExperienceScore,
  pressureHandlingScore: data.pressureHandlingScore,
  mustWinScore: data.mustWinScore,
  qualificationPressureScore: data.qualificationPressureScore
});

const toPrismaUpdateData = (data: UpdateTeamStatsInput): Prisma.TeamStatsUpdateInput => ({
  ...(data.teamId !== undefined
    ? {
        team: {
          connect: { id: data.teamId }
        }
      }
    : {}),
  ...(data.competitionId !== undefined ? { competition: { connect: { id: data.competitionId } } } : {}),
  ...(data.seasonId !== undefined ? { season: { connect: { id: data.seasonId } } } : {}),
  ...(data.referenceDate !== undefined ? { referenceDate: data.referenceDate } : {}),
  ...(data.matchesPlayed !== undefined ? { matchesPlayed: data.matchesPlayed } : {}),
  ...(data.wins !== undefined ? { wins: data.wins } : {}),
  ...(data.draws !== undefined ? { draws: data.draws } : {}),
  ...(data.losses !== undefined ? { losses: data.losses } : {}),
  ...(data.goalsFor !== undefined ? { goalsFor: data.goalsFor } : {}),
  ...(data.goalsAgainst !== undefined ? { goalsAgainst: data.goalsAgainst } : {}),
  ...(data.xG !== undefined ? { xG: data.xG } : {}),
  ...(data.xGA !== undefined ? { xGA: data.xGA } : {}),
  ...(data.shotsPerGame !== undefined ? { shotsPerGame: data.shotsPerGame } : {}),
  ...(data.shotsAgainstPerGame !== undefined ? { shotsAgainstPerGame: data.shotsAgainstPerGame } : {}),
  ...(data.possessionAvg !== undefined ? { possessionAvg: data.possessionAvg } : {}),
  ...(data.recentFormScore !== undefined ? { recentFormScore: data.recentFormScore } : {}),
  ...(data.attackStrength !== undefined ? { attackStrength: data.attackStrength } : {}),
  ...(data.defenseStrength !== undefined ? { defenseStrength: data.defenseStrength } : {}),
  ...(data.injuryImpact !== undefined ? { injuryImpact: data.injuryImpact } : {}),
  ...(data.lineupStrength !== undefined ? { lineupStrength: data.lineupStrength } : {}),
  ...(data.motivation !== undefined ? { motivationScore: data.motivation } : {}),
  ...(data.matchImportance !== undefined ? { matchImportanceScore: data.matchImportance } : {}),
  ...(data.recentMatchesCount !== undefined ? { recentMatchesCount: data.recentMatchesCount } : {}),
  ...(data.recentWins !== undefined ? { recentWins: data.recentWins } : {}),
  ...(data.recentDraws !== undefined ? { recentDraws: data.recentDraws } : {}),
  ...(data.recentLosses !== undefined ? { recentLosses: data.recentLosses } : {}),
  ...(data.recentGoalsFor !== undefined ? { recentGoalsFor: data.recentGoalsFor } : {}),
  ...(data.recentGoalsAgainst !== undefined ? { recentGoalsAgainst: data.recentGoalsAgainst } : {}),
  ...(data.recentXG !== undefined ? { recentXG: data.recentXG } : {}),
  ...(data.recentXGA !== undefined ? { recentXGA: data.recentXGA } : {}),
  ...(data.shotsOnTargetPerGame !== undefined ? { shotsOnTargetPerGame: data.shotsOnTargetPerGame } : {}),
  ...(data.bigChancesPerGame !== undefined ? { bigChancesPerGame: data.bigChancesPerGame } : {}),
  ...(data.bigChancesConvertedPerGame !== undefined
    ? { bigChancesConvertedPerGame: data.bigChancesConvertedPerGame }
    : {}),
  ...(data.cleanSheets !== undefined ? { cleanSheets: data.cleanSheets } : {}),
  ...(data.shotsOnTargetAgainstPerGame !== undefined
    ? { shotsOnTargetAgainstPerGame: data.shotsOnTargetAgainstPerGame }
    : {}),
  ...(data.bigChancesConcededPerGame !== undefined
    ? { bigChancesConcededPerGame: data.bigChancesConcededPerGame }
    : {}),
  ...(data.opponentStrengthScore !== undefined ? { opponentStrengthScore: data.opponentStrengthScore } : {}),
  ...(data.suspendedPlayersImpact !== undefined ? { suspendedPlayersImpact: data.suspendedPlayersImpact } : {}),
  ...(data.keyPlayersAvailability !== undefined ? { keyPlayersAvailability: data.keyPlayersAvailability } : {}),
  ...(data.restDays !== undefined ? { restDays: data.restDays } : {}),
  ...(data.fatigueScore !== undefined ? { fatigueScore: data.fatigueScore } : {}),
  ...(data.travelImpact !== undefined ? { travelImpact: data.travelImpact } : {}),
  ...(data.yellowCardsPerGame !== undefined ? { yellowCardsPerGame: data.yellowCardsPerGame } : {}),
  ...(data.redCardsPerGame !== undefined ? { redCardsPerGame: data.redCardsPerGame } : {}),
  ...(data.foulsPerGame !== undefined ? { foulsPerGame: data.foulsPerGame } : {}),
  ...(data.setPieceGoalsFor !== undefined ? { setPieceGoalsFor: data.setPieceGoalsFor } : {}),
  ...(data.setPieceGoalsAgainst !== undefined ? { setPieceGoalsAgainst: data.setPieceGoalsAgainst } : {}),
  ...(data.setPieceThreatScore !== undefined ? { setPieceThreatScore: data.setPieceThreatScore } : {}),
  ...(data.tournamentExperienceScore !== undefined
    ? { tournamentExperienceScore: data.tournamentExperienceScore }
    : {}),
  ...(data.knockoutExperienceScore !== undefined ? { knockoutExperienceScore: data.knockoutExperienceScore } : {}),
  ...(data.pressureHandlingScore !== undefined ? { pressureHandlingScore: data.pressureHandlingScore } : {}),
  ...(data.mustWinScore !== undefined ? { mustWinScore: data.mustWinScore } : {}),
  ...(data.qualificationPressureScore !== undefined
    ? { qualificationPressureScore: data.qualificationPressureScore }
    : {})
});

export const teamStatsService = {
  async create(data: CreateTeamStatsInput) {
    await ensureTeamExists(data.teamId);

    return prisma.teamStats.create({
      data: toPrismaCreateData(data),
      include: teamStatsInclude
    });
  },

  async list(query: ListTeamStatsQuery) {
    const where: Prisma.TeamStatsWhereInput = {
      ...(query.teamId ? { teamId: query.teamId } : {}),
      ...(query.competitionId ? { competitionId: query.competitionId } : {}),
      ...(query.seasonId ? { seasonId: query.seasonId } : {}),
      ...(query.referenceDate ? { referenceDate: query.referenceDate } : {})
    };

    return prisma.teamStats.findMany({
      where,
      include: teamStatsInclude,
      orderBy: {
        referenceDate: "desc"
      }
    });
  },

  async findById(id: string) {
    return findTeamStatsOrFail(id);
  },

  async findByTeamId(teamId: string) {
    await ensureTeamExists(teamId);

    return prisma.teamStats.findMany({
      where: { teamId },
      include: teamStatsInclude,
      orderBy: {
        referenceDate: "desc"
      }
    });
  },

  async update(id: string, data: UpdateTeamStatsInput) {
    const currentTeamStats = await findTeamStatsOrFail(id);

    if (data.teamId) {
      await ensureTeamExists(data.teamId);
    }

    validateRecordTotals(data, currentTeamStats);

    return prisma.teamStats.update({
      where: { id },
      data: toPrismaUpdateData(data),
      include: teamStatsInclude
    });
  },

  async delete(id: string) {
    await findTeamStatsOrFail(id);

    await prisma.teamStats.delete({
      where: { id }
    });
  }
};
