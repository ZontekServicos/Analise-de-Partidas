import { z } from "zod";

export const teamStatsIdParamsSchema = z.object({
  id: z.string().uuid("Team stats id must be a valid UUID")
});

export const teamStatsTeamIdParamsSchema = z.object({
  teamId: z.string().uuid("Team id must be a valid UUID")
});

const nonNegativeInt = z.number().int().nonnegative();
const nonNegativeNumber = z.number().nonnegative();
const score = z.number().min(0).max(100);

const teamStatsBaseSchema = z.object({
  teamId: z.string().uuid("teamId must be a valid UUID"),
  competitionId: z.string().uuid("competitionId must be a valid UUID").optional(),
  seasonId: z.string().uuid("seasonId must be a valid UUID").optional(),
  referenceDate: z.coerce.date(),
  matchesPlayed: nonNegativeInt.default(0),
  wins: nonNegativeInt.default(0),
  draws: nonNegativeInt.default(0),
  losses: nonNegativeInt.default(0),
  goalsFor: nonNegativeInt.default(0),
  goalsAgainst: nonNegativeInt.default(0),
  xG: nonNegativeNumber.default(0),
  xGA: nonNegativeNumber.default(0),
  shotsPerGame: nonNegativeNumber.default(0),
  shotsAgainstPerGame: nonNegativeNumber.default(0),
  possessionAvg: score.default(0),
  recentFormScore: score.default(0),
  attackStrength: score.default(0),
  defenseStrength: score.default(0),
  injuryImpact: score.default(0),
  lineupStrength: score.default(0),
  motivation: score.default(0),
  matchImportance: score.default(0),

  // Forma recente ponderada
  recentMatchesCount: nonNegativeInt.default(0),
  recentWins: nonNegativeInt.default(0),
  recentDraws: nonNegativeInt.default(0),
  recentLosses: nonNegativeInt.default(0),
  recentGoalsFor: nonNegativeInt.default(0),
  recentGoalsAgainst: nonNegativeInt.default(0),
  recentXG: nonNegativeNumber.default(0),
  recentXGA: nonNegativeNumber.default(0),

  // Eficiencia ofensiva
  shotsOnTargetPerGame: nonNegativeNumber.default(0),
  bigChancesPerGame: nonNegativeNumber.default(0),
  bigChancesConvertedPerGame: nonNegativeNumber.default(0),

  // Solidez defensiva
  cleanSheets: nonNegativeInt.default(0),
  shotsOnTargetAgainstPerGame: nonNegativeNumber.default(0),
  bigChancesConcededPerGame: nonNegativeNumber.default(0),

  // Forca dos adversarios enfrentados
  opponentStrengthScore: score.default(0),

  // Disponibilidade do elenco
  suspendedPlayersImpact: score.default(0),
  keyPlayersAvailability: score.default(100),

  // Descanso e desgaste fisico
  restDays: z.number().int().min(0).max(30).default(7),
  fatigueScore: score.default(0),
  travelImpact: score.default(0),

  // Disciplina
  yellowCardsPerGame: nonNegativeNumber.default(0),
  redCardsPerGame: nonNegativeNumber.default(0),
  foulsPerGame: nonNegativeNumber.default(0),

  // Bolas paradas
  setPieceGoalsFor: nonNegativeInt.default(0),
  setPieceGoalsAgainst: nonNegativeInt.default(0),
  setPieceThreatScore: score.default(0),

  // Experiencia competitiva
  tournamentExperienceScore: score.default(0),
  knockoutExperienceScore: score.default(0),
  pressureHandlingScore: score.default(0),

  // Contexto da partida
  mustWinScore: score.default(0),
  qualificationPressureScore: score.default(0)
});

export const createTeamStatsSchema = teamStatsBaseSchema
  .refine((data) => data.wins + data.draws + data.losses <= data.matchesPlayed, {
    message: "wins + draws + losses cannot be greater than matchesPlayed",
    path: ["matchesPlayed"]
  })
  .refine((data) => data.recentWins + data.recentDraws + data.recentLosses <= data.recentMatchesCount, {
    message: "recentWins + recentDraws + recentLosses cannot be greater than recentMatchesCount",
    path: ["recentMatchesCount"]
  })
  .refine((data) => data.cleanSheets <= data.matchesPlayed, {
    message: "cleanSheets cannot be greater than matchesPlayed",
    path: ["cleanSheets"]
  });

export const updateTeamStatsSchema = teamStatsBaseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided"
);

export const listTeamStatsQuerySchema = z.object({
  teamId: z.string().uuid("teamId must be a valid UUID").optional(),
  competitionId: z.string().uuid("competitionId must be a valid UUID").optional(),
  seasonId: z.string().uuid("seasonId must be a valid UUID").optional(),
  referenceDate: z.coerce.date().optional()
});

export type CreateTeamStatsInput = z.infer<typeof createTeamStatsSchema>;
export type UpdateTeamStatsInput = z.infer<typeof updateTeamStatsSchema>;
export type ListTeamStatsQuery = z.infer<typeof listTeamStatsQuerySchema>;
