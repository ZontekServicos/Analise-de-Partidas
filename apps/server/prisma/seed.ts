import { CompetitionType, MatchStatus, PrismaClient, TeamType } from "@prisma/client";

const prisma = new PrismaClient();

const modelVersionV1 = "v1";
const modelVersionV2 = "v2";

const modelWeightsV1 = [
  { factorKey: "recentFormScore", weight: 0.18, description: "Recent team form from latest matches." },
  { factorKey: "attackStrength", weight: 0.18, description: "Attacking strength estimate." },
  { factorKey: "defenseStrength", weight: 0.14, description: "Defensive strength estimate." },
  { factorKey: "worldRanking", weight: 0.12, description: "Relative FIFA ranking signal." },
  { factorKey: "injuryImpact", weight: 0.1, description: "Negative squad availability impact." },
  { factorKey: "lineupStrength", weight: 0.12, description: "Expected lineup quality." },
  { factorKey: "motivation", weight: 0.08, description: "Contextual motivation score." },
  { factorKey: "matchImportance", weight: 0.05, description: "Importance of the match context." },
  { factorKey: "neutralField", weight: 0.03, description: "Home advantage adjustment when field is not neutral." }
];

const modelWeightsV2 = [
  { factorKey: "recentPerformance", weight: 0.17, description: "Weighted recent form, moderated by opponent strength." },
  { factorKey: "offensiveEfficiency", weight: 0.15, description: "Finishing efficiency, goals per game and shot creation." },
  { factorKey: "defensiveSolidity", weight: 0.15, description: "Goals/xG conceded, clean sheets and shots faced, inverted." },
  { factorKey: "squadStrength", weight: 0.13, description: "Expected lineup quality combined with squad availability." },
  { factorKey: "physicalCondition", weight: 0.08, description: "Rest days, fatigue and travel impact, inverted where relevant." },
  { factorKey: "competitiveExperience", weight: 0.07, description: "Manual tournament/knockout/pressure experience scores." },
  { factorKey: "matchContext", weight: 0.08, description: "Motivation, importance, must-win and qualification pressure, plus home advantage nudge." },
  { factorKey: "tacticalMatchup", weight: 0.09, description: "Cross-team attack vs defense, set pieces, physical and squad edge." },
  { factorKey: "worldRanking", weight: 0.05, description: "Relative FIFA ranking signal." },
  { factorKey: "opponentStrength", weight: 0.03, description: "Average strength of opponents faced in the reference sample." }
];

// ---------- Competicoes e temporadas ----------

const competitions = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    name: "Copa do Mundo 2026",
    slug: "copa-do-mundo-2026",
    type: CompetitionType.INTERNATIONAL_CUP,
    country: null,
    confederation: null,
    isInternational: true
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    name: "Liga de Teste",
    slug: "liga-de-teste",
    type: CompetitionType.LEAGUE,
    country: "Brasil",
    confederation: null,
    isInternational: false
  }
];

const seasons = [
  {
    id: "c0000000-0000-4000-8000-000000000011",
    competitionSlug: "copa-do-mundo-2026",
    name: "2026",
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: new Date("2026-12-31T00:00:00.000Z"),
    isCurrent: true
  },
  {
    id: "c0000000-0000-4000-8000-000000000012",
    competitionSlug: "liga-de-teste",
    name: "Temporada de Teste 2026",
    startDate: new Date("2026-02-01T00:00:00.000Z"),
    endDate: new Date("2026-11-30T00:00:00.000Z"),
    isCurrent: true
  }
];

// ---------- Cenario internacional (selecoes) ----------

const teams = [
  {
    name: "Brasil",
    teamType: TeamType.NATIONAL_TEAM,
    fifaCode: "BRA",
    confederation: "CONMEBOL",
    worldRanking: 5,
    country: "Brasil"
  },
  {
    name: "Escocia",
    teamType: TeamType.NATIONAL_TEAM,
    fifaCode: "SCO",
    confederation: "UEFA",
    worldRanking: 39,
    country: "Escocia"
  },
  {
    name: "Africa do Sul",
    teamType: TeamType.NATIONAL_TEAM,
    fifaCode: "RSA",
    confederation: "CAF",
    worldRanking: 57,
    country: "Africa do Sul"
  },
  {
    name: "Coreia do Sul",
    teamType: TeamType.NATIONAL_TEAM,
    fifaCode: "KOR",
    confederation: "AFC",
    worldRanking: 23,
    country: "Coreia do Sul"
  },
  {
    name: "Republica Tcheca",
    teamType: TeamType.NATIONAL_TEAM,
    fifaCode: "CZE",
    confederation: "UEFA",
    worldRanking: 36,
    country: "Republica Tcheca"
  },
  {
    name: "Mexico",
    teamType: TeamType.NATIONAL_TEAM,
    fifaCode: "MEX",
    confederation: "CONCACAF",
    worldRanking: 14,
    country: "Mexico"
  },
  // ---------- Cenario de clubes (dados ficticios) ----------
  {
    name: "FC Vitoria",
    teamType: TeamType.CLUB,
    externalId: "club-fc-vitoria",
    country: "Brasil",
    city: "Porto Novo",
    foundedYear: 1932
  },
  {
    name: "Estrela Atletico",
    teamType: TeamType.CLUB,
    externalId: "club-estrela-atletico",
    country: "Brasil",
    city: "Vale Verde",
    foundedYear: 1947
  },
  {
    name: "Uniao Central",
    teamType: TeamType.CLUB,
    externalId: "club-uniao-central",
    country: "Brasil",
    city: "Serra Alta",
    foundedYear: 1958
  },
  {
    name: "Atletico Serrano",
    teamType: TeamType.CLUB,
    externalId: "club-atletico-serrano",
    country: "Brasil",
    city: "Torres",
    foundedYear: 1965
  }
];

const teamStats = [
  {
    teamName: "Brasil",
    id: "11111111-1111-4111-8111-111111111111",
    competitionSlug: "copa-do-mundo-2026",
    seasonName: "2026",
    matchesPlayed: 10,
    wins: 7,
    draws: 2,
    losses: 1,
    goalsFor: 24,
    goalsAgainst: 8,
    xG: 22.8,
    xGA: 9.4,
    shotsPerGame: 15.2,
    shotsAgainstPerGame: 7.1,
    possessionAvg: 59,
    recentFormScore: 84,
    attackStrength: 88,
    defenseStrength: 82,
    injuryImpact: 10,
    lineupStrength: 90,
    motivationScore: 88,
    matchImportanceScore: 80,
    recentMatchesCount: 5,
    recentWins: 4,
    recentDraws: 1,
    recentLosses: 0,
    recentGoalsFor: 12,
    recentGoalsAgainst: 3,
    recentXG: 11.2,
    recentXGA: 3.8,
    shotsOnTargetPerGame: 7.2,
    bigChancesPerGame: 4.5,
    bigChancesConvertedPerGame: 2.6,
    cleanSheets: 5,
    shotsOnTargetAgainstPerGame: 2.8,
    bigChancesConcededPerGame: 1.4,
    opponentStrengthScore: 78,
    suspendedPlayersImpact: 5,
    keyPlayersAvailability: 92,
    restDays: 6,
    fatigueScore: 22,
    travelImpact: 15,
    yellowCardsPerGame: 1.6,
    redCardsPerGame: 0.05,
    foulsPerGame: 10.5,
    setPieceGoalsFor: 4,
    setPieceGoalsAgainst: 1,
    setPieceThreatScore: 78,
    tournamentExperienceScore: 95,
    knockoutExperienceScore: 92,
    pressureHandlingScore: 88,
    mustWinScore: 60,
    qualificationPressureScore: 50
  },
  {
    teamName: "Escocia",
    id: "22222222-2222-4222-8222-222222222222",
    competitionSlug: "copa-do-mundo-2026",
    seasonName: "2026",
    matchesPlayed: 10,
    wins: 4,
    draws: 3,
    losses: 3,
    goalsFor: 13,
    goalsAgainst: 12,
    xG: 12.6,
    xGA: 13.8,
    shotsPerGame: 10.4,
    shotsAgainstPerGame: 11.3,
    possessionAvg: 48,
    recentFormScore: 61,
    attackStrength: 58,
    defenseStrength: 64,
    injuryImpact: 18,
    lineupStrength: 66,
    motivationScore: 82,
    matchImportanceScore: 79,
    recentMatchesCount: 5,
    recentWins: 1,
    recentDraws: 2,
    recentLosses: 2,
    recentGoalsFor: 5,
    recentGoalsAgainst: 7,
    recentXG: 5.2,
    recentXGA: 6.9,
    shotsOnTargetPerGame: 3.9,
    bigChancesPerGame: 2.2,
    bigChancesConvertedPerGame: 0.8,
    cleanSheets: 2,
    shotsOnTargetAgainstPerGame: 4.9,
    bigChancesConcededPerGame: 2.9,
    opponentStrengthScore: 58,
    suspendedPlayersImpact: 12,
    keyPlayersAvailability: 80,
    restDays: 5,
    fatigueScore: 38,
    travelImpact: 20,
    yellowCardsPerGame: 2.4,
    redCardsPerGame: 0.12,
    foulsPerGame: 14.5,
    setPieceGoalsFor: 2,
    setPieceGoalsAgainst: 4,
    setPieceThreatScore: 55,
    tournamentExperienceScore: 50,
    knockoutExperienceScore: 40,
    pressureHandlingScore: 52,
    mustWinScore: 75,
    qualificationPressureScore: 80
  },
  {
    teamName: "Africa do Sul",
    id: "33333333-3333-4333-8333-333333333333",
    competitionSlug: "copa-do-mundo-2026",
    seasonName: "2026",
    matchesPlayed: 10,
    wins: 5,
    draws: 3,
    losses: 2,
    goalsFor: 15,
    goalsAgainst: 9,
    xG: 14.2,
    xGA: 10.5,
    shotsPerGame: 11.8,
    shotsAgainstPerGame: 9.4,
    possessionAvg: 51,
    recentFormScore: 70,
    attackStrength: 67,
    defenseStrength: 72,
    injuryImpact: 12,
    lineupStrength: 71,
    motivationScore: 86,
    matchImportanceScore: 76,
    recentMatchesCount: 5,
    recentWins: 2,
    recentDraws: 2,
    recentLosses: 1,
    recentGoalsFor: 6,
    recentGoalsAgainst: 5,
    recentXG: 5.9,
    recentXGA: 5.3,
    shotsOnTargetPerGame: 4.6,
    bigChancesPerGame: 2.6,
    bigChancesConvertedPerGame: 1.1,
    cleanSheets: 4,
    shotsOnTargetAgainstPerGame: 3.9,
    bigChancesConcededPerGame: 2.0,
    opponentStrengthScore: 60,
    suspendedPlayersImpact: 7,
    keyPlayersAvailability: 87,
    restDays: 7,
    fatigueScore: 27,
    travelImpact: 22,
    yellowCardsPerGame: 1.8,
    redCardsPerGame: 0.06,
    foulsPerGame: 11.8,
    setPieceGoalsFor: 2,
    setPieceGoalsAgainst: 2,
    setPieceThreatScore: 58,
    tournamentExperienceScore: 55,
    knockoutExperienceScore: 45,
    pressureHandlingScore: 58,
    mustWinScore: 70,
    qualificationPressureScore: 75
  },
  {
    teamName: "Coreia do Sul",
    id: "44444444-4444-4444-8444-444444444444",
    competitionSlug: "copa-do-mundo-2026",
    seasonName: "2026",
    matchesPlayed: 10,
    wins: 6,
    draws: 2,
    losses: 2,
    goalsFor: 18,
    goalsAgainst: 10,
    xG: 17.4,
    xGA: 11.1,
    shotsPerGame: 13.1,
    shotsAgainstPerGame: 9.8,
    possessionAvg: 54,
    recentFormScore: 75,
    attackStrength: 74,
    defenseStrength: 70,
    injuryImpact: 14,
    lineupStrength: 78,
    motivationScore: 84,
    matchImportanceScore: 78,
    recentMatchesCount: 5,
    recentWins: 3,
    recentDraws: 1,
    recentLosses: 1,
    recentGoalsFor: 8,
    recentGoalsAgainst: 5,
    recentXG: 7.6,
    recentXGA: 5.4,
    shotsOnTargetPerGame: 5.4,
    bigChancesPerGame: 3.2,
    bigChancesConvertedPerGame: 1.6,
    cleanSheets: 3,
    shotsOnTargetAgainstPerGame: 4.0,
    bigChancesConcededPerGame: 2.2,
    opponentStrengthScore: 66,
    suspendedPlayersImpact: 6,
    keyPlayersAvailability: 90,
    restDays: 6,
    fatigueScore: 30,
    travelImpact: 25,
    yellowCardsPerGame: 2.0,
    redCardsPerGame: 0.05,
    foulsPerGame: 12.5,
    setPieceGoalsFor: 2,
    setPieceGoalsAgainst: 2,
    setPieceThreatScore: 62,
    tournamentExperienceScore: 70,
    knockoutExperienceScore: 65,
    pressureHandlingScore: 68,
    mustWinScore: 65,
    qualificationPressureScore: 68
  },
  {
    teamName: "Republica Tcheca",
    id: "55555555-5555-4555-8555-555555555555",
    competitionSlug: "copa-do-mundo-2026",
    seasonName: "2026",
    matchesPlayed: 10,
    wins: 5,
    draws: 2,
    losses: 3,
    goalsFor: 16,
    goalsAgainst: 12,
    xG: 15.8,
    xGA: 12.7,
    shotsPerGame: 12.7,
    shotsAgainstPerGame: 10.9,
    possessionAvg: 50,
    recentFormScore: 68,
    attackStrength: 70,
    defenseStrength: 68,
    injuryImpact: 16,
    lineupStrength: 72,
    motivationScore: 80,
    matchImportanceScore: 77,
    recentMatchesCount: 5,
    recentWins: 2,
    recentDraws: 1,
    recentLosses: 2,
    recentGoalsFor: 7,
    recentGoalsAgainst: 6,
    recentXG: 6.8,
    recentXGA: 6.2,
    shotsOnTargetPerGame: 5.0,
    bigChancesPerGame: 2.9,
    bigChancesConvertedPerGame: 1.3,
    cleanSheets: 3,
    shotsOnTargetAgainstPerGame: 4.3,
    bigChancesConcededPerGame: 2.4,
    opponentStrengthScore: 64,
    suspendedPlayersImpact: 10,
    keyPlayersAvailability: 84,
    restDays: 5,
    fatigueScore: 34,
    travelImpact: 18,
    yellowCardsPerGame: 2.2,
    redCardsPerGame: 0.1,
    foulsPerGame: 13.5,
    setPieceGoalsFor: 3,
    setPieceGoalsAgainst: 3,
    setPieceThreatScore: 66,
    tournamentExperienceScore: 75,
    knockoutExperienceScore: 70,
    pressureHandlingScore: 72,
    mustWinScore: 68,
    qualificationPressureScore: 70
  },
  {
    teamName: "Mexico",
    id: "66666666-6666-4666-8666-666666666666",
    competitionSlug: "copa-do-mundo-2026",
    seasonName: "2026",
    matchesPlayed: 10,
    wins: 6,
    draws: 3,
    losses: 1,
    goalsFor: 19,
    goalsAgainst: 9,
    xG: 18.6,
    xGA: 10.2,
    shotsPerGame: 13.6,
    shotsAgainstPerGame: 8.9,
    possessionAvg: 56,
    recentFormScore: 78,
    attackStrength: 76,
    defenseStrength: 74,
    injuryImpact: 11,
    lineupStrength: 79,
    motivationScore: 85,
    matchImportanceScore: 81,
    recentMatchesCount: 5,
    recentWins: 3,
    recentDraws: 1,
    recentLosses: 1,
    recentGoalsFor: 9,
    recentGoalsAgainst: 4,
    recentXG: 8.4,
    recentXGA: 4.6,
    shotsOnTargetPerGame: 6.0,
    bigChancesPerGame: 3.6,
    bigChancesConvertedPerGame: 1.9,
    cleanSheets: 4,
    shotsOnTargetAgainstPerGame: 3.6,
    bigChancesConcededPerGame: 1.9,
    opponentStrengthScore: 70,
    suspendedPlayersImpact: 8,
    keyPlayersAvailability: 88,
    restDays: 7,
    fatigueScore: 28,
    travelImpact: 20,
    yellowCardsPerGame: 1.9,
    redCardsPerGame: 0.08,
    foulsPerGame: 12.0,
    setPieceGoalsFor: 3,
    setPieceGoalsAgainst: 2,
    setPieceThreatScore: 68,
    tournamentExperienceScore: 85,
    knockoutExperienceScore: 78,
    pressureHandlingScore: 76,
    mustWinScore: 62,
    qualificationPressureScore: 55
  },
  // ---------- TeamStats dos clubes (Liga de Teste), diferenciados por forca ----------
  {
    teamName: "FC Vitoria",
    id: "d0000000-0000-4000-8000-000000000001",
    competitionSlug: "liga-de-teste",
    seasonName: "Temporada de Teste 2026",
    matchesPlayed: 12,
    wins: 8,
    draws: 2,
    losses: 2,
    goalsFor: 26,
    goalsAgainst: 12,
    xG: 24.5,
    xGA: 13.2,
    shotsPerGame: 14.0,
    shotsAgainstPerGame: 9.5,
    possessionAvg: 57,
    recentFormScore: 80,
    attackStrength: 82,
    defenseStrength: 75,
    injuryImpact: 12,
    lineupStrength: 84,
    motivationScore: 78,
    matchImportanceScore: 65,
    recentMatchesCount: 5,
    recentWins: 4,
    recentDraws: 0,
    recentLosses: 1,
    recentGoalsFor: 11,
    recentGoalsAgainst: 5,
    recentXG: 10.2,
    recentXGA: 5.6,
    shotsOnTargetPerGame: 6.4,
    bigChancesPerGame: 3.8,
    bigChancesConvertedPerGame: 2.0,
    cleanSheets: 4,
    shotsOnTargetAgainstPerGame: 3.6,
    bigChancesConcededPerGame: 1.8,
    opponentStrengthScore: 62,
    suspendedPlayersImpact: 6,
    keyPlayersAvailability: 90,
    restDays: 6,
    fatigueScore: 26,
    travelImpact: 18,
    yellowCardsPerGame: 1.9,
    redCardsPerGame: 0.07,
    foulsPerGame: 12.4,
    setPieceGoalsFor: 3,
    setPieceGoalsAgainst: 2,
    setPieceThreatScore: 66,
    tournamentExperienceScore: 60,
    knockoutExperienceScore: 55,
    pressureHandlingScore: 62,
    mustWinScore: 55,
    qualificationPressureScore: 60
  },
  {
    teamName: "Estrela Atletico",
    id: "d0000000-0000-4000-8000-000000000002",
    competitionSlug: "liga-de-teste",
    seasonName: "Temporada de Teste 2026",
    matchesPlayed: 12,
    wins: 6,
    draws: 3,
    losses: 3,
    goalsFor: 20,
    goalsAgainst: 15,
    xG: 19.0,
    xGA: 15.8,
    shotsPerGame: 12.2,
    shotsAgainstPerGame: 10.6,
    possessionAvg: 53,
    recentFormScore: 68,
    attackStrength: 70,
    defenseStrength: 64,
    injuryImpact: 15,
    lineupStrength: 72,
    motivationScore: 74,
    matchImportanceScore: 60,
    recentMatchesCount: 5,
    recentWins: 2,
    recentDraws: 2,
    recentLosses: 1,
    recentGoalsFor: 7,
    recentGoalsAgainst: 6,
    recentXG: 6.8,
    recentXGA: 6.4,
    shotsOnTargetPerGame: 5.1,
    bigChancesPerGame: 2.9,
    bigChancesConvertedPerGame: 1.3,
    cleanSheets: 3,
    shotsOnTargetAgainstPerGame: 4.2,
    bigChancesConcededPerGame: 2.3,
    opponentStrengthScore: 58,
    suspendedPlayersImpact: 9,
    keyPlayersAvailability: 85,
    restDays: 6,
    fatigueScore: 32,
    travelImpact: 22,
    yellowCardsPerGame: 2.1,
    redCardsPerGame: 0.09,
    foulsPerGame: 13.2,
    setPieceGoalsFor: 2,
    setPieceGoalsAgainst: 3,
    setPieceThreatScore: 58,
    tournamentExperienceScore: 48,
    knockoutExperienceScore: 42,
    pressureHandlingScore: 50,
    mustWinScore: 58,
    qualificationPressureScore: 62
  },
  {
    teamName: "Uniao Central",
    id: "d0000000-0000-4000-8000-000000000003",
    competitionSlug: "liga-de-teste",
    seasonName: "Temporada de Teste 2026",
    matchesPlayed: 12,
    wins: 4,
    draws: 4,
    losses: 4,
    goalsFor: 16,
    goalsAgainst: 17,
    xG: 15.2,
    xGA: 17.6,
    shotsPerGame: 10.8,
    shotsAgainstPerGame: 11.9,
    possessionAvg: 49,
    recentFormScore: 55,
    attackStrength: 58,
    defenseStrength: 55,
    injuryImpact: 20,
    lineupStrength: 60,
    motivationScore: 70,
    matchImportanceScore: 55,
    recentMatchesCount: 5,
    recentWins: 1,
    recentDraws: 2,
    recentLosses: 2,
    recentGoalsFor: 5,
    recentGoalsAgainst: 7,
    recentXG: 5.4,
    recentXGA: 7.1,
    shotsOnTargetPerGame: 4.2,
    bigChancesPerGame: 2.3,
    bigChancesConvertedPerGame: 0.9,
    cleanSheets: 2,
    shotsOnTargetAgainstPerGame: 4.8,
    bigChancesConcededPerGame: 2.7,
    opponentStrengthScore: 55,
    suspendedPlayersImpact: 13,
    keyPlayersAvailability: 78,
    restDays: 5,
    fatigueScore: 40,
    travelImpact: 26,
    yellowCardsPerGame: 2.4,
    redCardsPerGame: 0.11,
    foulsPerGame: 14.0,
    setPieceGoalsFor: 2,
    setPieceGoalsAgainst: 3,
    setPieceThreatScore: 52,
    tournamentExperienceScore: 38,
    knockoutExperienceScore: 32,
    pressureHandlingScore: 44,
    mustWinScore: 62,
    qualificationPressureScore: 66
  },
  {
    teamName: "Atletico Serrano",
    id: "d0000000-0000-4000-8000-000000000004",
    competitionSlug: "liga-de-teste",
    seasonName: "Temporada de Teste 2026",
    matchesPlayed: 12,
    wins: 3,
    draws: 3,
    losses: 6,
    goalsFor: 13,
    goalsAgainst: 22,
    xG: 12.6,
    xGA: 21.4,
    shotsPerGame: 9.2,
    shotsAgainstPerGame: 13.4,
    possessionAvg: 45,
    recentFormScore: 40,
    attackStrength: 46,
    defenseStrength: 42,
    injuryImpact: 26,
    lineupStrength: 48,
    motivationScore: 68,
    matchImportanceScore: 58,
    recentMatchesCount: 5,
    recentWins: 0,
    recentDraws: 2,
    recentLosses: 3,
    recentGoalsFor: 3,
    recentGoalsAgainst: 9,
    recentXG: 3.6,
    recentXGA: 8.8,
    shotsOnTargetPerGame: 3.1,
    bigChancesPerGame: 1.6,
    bigChancesConvertedPerGame: 0.5,
    cleanSheets: 1,
    shotsOnTargetAgainstPerGame: 5.6,
    bigChancesConcededPerGame: 3.4,
    opponentStrengthScore: 52,
    suspendedPlayersImpact: 18,
    keyPlayersAvailability: 68,
    restDays: 5,
    fatigueScore: 48,
    travelImpact: 30,
    yellowCardsPerGame: 2.7,
    redCardsPerGame: 0.15,
    foulsPerGame: 15.3,
    setPieceGoalsFor: 1,
    setPieceGoalsAgainst: 4,
    setPieceThreatScore: 44,
    tournamentExperienceScore: 25,
    knockoutExperienceScore: 20,
    pressureHandlingScore: 32,
    mustWinScore: 70,
    qualificationPressureScore: 72
  }
];

const matches = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    homeTeamName: "Brasil",
    awayTeamName: "Escocia",
    competitionSlug: "copa-do-mundo-2026",
    seasonName: "2026",
    competition: "Copa do Mundo 2026",
    stage: "Fase de Grupos",
    groupName: "Grupo A",
    neutralField: true,
    startsAt: new Date("2026-06-15T19:00:00.000Z")
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    homeTeamName: "Africa do Sul",
    awayTeamName: "Coreia do Sul",
    competitionSlug: "copa-do-mundo-2026",
    seasonName: "2026",
    competition: "Copa do Mundo 2026",
    stage: "Fase de Grupos",
    groupName: "Grupo B",
    neutralField: true,
    startsAt: new Date("2026-06-16T16:00:00.000Z")
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    homeTeamName: "Republica Tcheca",
    awayTeamName: "Mexico",
    competitionSlug: "copa-do-mundo-2026",
    seasonName: "2026",
    competition: "Copa do Mundo 2026",
    stage: "Fase de Grupos",
    groupName: "Grupo C",
    neutralField: true,
    startsAt: new Date("2026-06-17T22:00:00.000Z")
  },
  // ---------- Partidas da Liga de Teste (clubes) ----------
  {
    id: "d0000000-0000-4000-8000-000000000101",
    homeTeamName: "FC Vitoria",
    awayTeamName: "Uniao Central",
    competitionSlug: "liga-de-teste",
    seasonName: "Temporada de Teste 2026",
    competition: "Liga de Teste",
    stage: "Rodada 1",
    groupName: null,
    neutralField: false,
    startsAt: new Date("2026-03-01T19:00:00.000Z")
  },
  {
    id: "d0000000-0000-4000-8000-000000000102",
    homeTeamName: "Estrela Atletico",
    awayTeamName: "Atletico Serrano",
    competitionSlug: "liga-de-teste",
    seasonName: "Temporada de Teste 2026",
    competition: "Liga de Teste",
    stage: "Rodada 1",
    groupName: null,
    neutralField: false,
    startsAt: new Date("2026-03-01T21:30:00.000Z")
  }
];

async function main() {
  const competitionsBySlug = new Map<string, { id: string }>();

  for (const competition of competitions) {
    const { id, ...data } = competition;

    const createdCompetition = await prisma.competition.upsert({
      where: { slug: competition.slug },
      update: data,
      create: { id, ...data },
      select: { id: true, slug: true }
    });

    competitionsBySlug.set(createdCompetition.slug, createdCompetition);
  }

  const seasonsByKey = new Map<string, { id: string }>();

  for (const season of seasons) {
    const competition = competitionsBySlug.get(season.competitionSlug);

    if (!competition) {
      throw new Error(`Competition not found for slug ${season.competitionSlug}`);
    }

    const createdSeason = await prisma.season.upsert({
      where: {
        competitionId_name: {
          competitionId: competition.id,
          name: season.name
        }
      },
      update: {
        startDate: season.startDate,
        endDate: season.endDate,
        isCurrent: season.isCurrent
      },
      create: {
        id: season.id,
        competitionId: competition.id,
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        isCurrent: season.isCurrent
      },
      select: { id: true }
    });

    seasonsByKey.set(`${season.competitionSlug}::${season.name}`, createdSeason);
  }

  const createdTeams = new Map<string, { id: string }>();

  for (const team of teams) {
    const createdTeam = await prisma.team.upsert({
      where: { name: team.name },
      update: team,
      create: team,
      select: { id: true, name: true }
    });

    createdTeams.set(createdTeam.name, createdTeam);
  }

  for (const stats of teamStats) {
    const team = createdTeams.get(stats.teamName);

    if (!team) {
      throw new Error(`Team not found for name ${stats.teamName}`);
    }

    const competition = competitionsBySlug.get(stats.competitionSlug);
    const season = seasonsByKey.get(`${stats.competitionSlug}::${stats.seasonName}`);

    if (!competition || !season) {
      throw new Error(`Competition/season not found for TeamStats of ${stats.teamName}`);
    }

    const { teamName: _teamName, id, competitionSlug: _competitionSlug, seasonName: _seasonName, ...statsFields } =
      stats;

    await prisma.teamStats.upsert({
      where: {
        id
      },
      update: {
        teamId: team.id,
        competitionId: competition.id,
        seasonId: season.id,
        referenceDate: new Date("2026-06-01T00:00:00.000Z"),
        ...statsFields,
        notes: "Seed ficticio para testes do MVP."
      },
      create: {
        id,
        teamId: team.id,
        competitionId: competition.id,
        seasonId: season.id,
        referenceDate: new Date("2026-06-01T00:00:00.000Z"),
        ...statsFields,
        notes: "Seed ficticio para testes do MVP."
      }
    });
  }

  for (const match of matches) {
    const homeTeam = createdTeams.get(match.homeTeamName);
    const awayTeam = createdTeams.get(match.awayTeamName);
    const competition = competitionsBySlug.get(match.competitionSlug);
    const season = seasonsByKey.get(`${match.competitionSlug}::${match.seasonName}`);

    if (!homeTeam || !awayTeam) {
      throw new Error(`Teams not found for match ${match.homeTeamName} x ${match.awayTeamName}`);
    }

    if (!competition || !season) {
      throw new Error(`Competition/season not found for match ${match.homeTeamName} x ${match.awayTeamName}`);
    }

    await prisma.match.upsert({
      where: {
        id: match.id
      },
      update: {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        competitionId: competition.id,
        seasonId: season.id,
        competition: match.competition,
        stage: match.stage,
        groupName: match.groupName,
        startsAt: match.startsAt,
        neutralField: match.neutralField,
        status: MatchStatus.SCHEDULED
      },
      create: {
        id: match.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        competitionId: competition.id,
        seasonId: season.id,
        competition: match.competition,
        stage: match.stage,
        groupName: match.groupName,
        startsAt: match.startsAt,
        neutralField: match.neutralField,
        status: MatchStatus.SCHEDULED
      }
    });
  }

  const modelWeightSets = [
    { modelVersion: modelVersionV1, weights: modelWeightsV1 },
    { modelVersion: modelVersionV2, weights: modelWeightsV2 }
  ];

  for (const { modelVersion, weights } of modelWeightSets) {
    for (const modelWeight of weights) {
      await prisma.modelWeight.upsert({
        where: {
          modelVersion_factorKey: {
            modelVersion,
            factorKey: modelWeight.factorKey
          }
        },
        update: {
          weight: modelWeight.weight,
          description: modelWeight.description,
          isActive: true
        },
        create: {
          modelVersion,
          factorKey: modelWeight.factorKey,
          weight: modelWeight.weight,
          description: modelWeight.description,
          isActive: true
        }
      });
    }
  }

  console.log(
    "Seed completed: competitions, seasons, teams (national + club), team stats, matches and model weights are ready."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
