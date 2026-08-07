export type TeamStatsScope = {
  competitionId?: string | null;
  seasonId?: string | null;
};

export type TeamStatsLookupAttempt = {
  competitionId?: string;
  seasonId?: string;
};

/**
 * Ordem de fallback para achar o TeamStats mais especifico disponivel para um
 * time: competicao+temporada da partida -> so competicao -> qualquer stats do
 * time (comportamento global, igual ao motor v1/v2 antes desta generalizacao).
 * Isso e o que permite um clube ter TeamStats diferentes em duas competicoes
 * na mesma temporada, sem quebrar times que ainda nao tem stats por competicao.
 */
export const buildTeamStatsLookupAttempts = (scope: TeamStatsScope): TeamStatsLookupAttempt[] => {
  const attempts: TeamStatsLookupAttempt[] = [];

  if (scope.competitionId && scope.seasonId) {
    attempts.push({ competitionId: scope.competitionId, seasonId: scope.seasonId });
  }

  if (scope.competitionId) {
    attempts.push({ competitionId: scope.competitionId });
  }

  attempts.push({});

  return attempts;
};
