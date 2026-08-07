import type { TeamStats } from "@prisma/client";

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const round = (value: number, decimals = 4) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const safeDiv = (numerator: number, denominator: number, fallback = 0) =>
  denominator > 0 ? numerator / denominator : fallback;

const clamp01 = (value: number) => clamp(value, 0, 1);

export type BlockScores = {
  recentPerformance: number;
  offensiveEfficiency: number;
  defensiveSolidity: number;
  squadAvailability: number;
  squadStrength: number;
  physicalCondition: number;
  disciplineScore: number;
  setPieceStrength: number;
  competitiveExperience: number;
  matchContext: number;
  opponentStrength: number;
};

/**
 * Forma recente ponderada. Sem partidas individuais armazenadas nesta versao,
 * o "peso maior para jogos mais novos" fica limitado ao agregado dos ultimos
 * `recentMatchesCount` jogos (nao ha granularidade por partida para ponderar
 * cada resultado individualmente). Se nao houver dados granulares, cai para
 * o `recentFormScore` legado em vez de assumir desempenho medio.
 */
export const computeRecentPerformanceScore = (stats: TeamStats): number => {
  if (stats.recentMatchesCount <= 0) {
    return clamp(stats.recentFormScore, 0, 100);
  }

  const winRate = clamp01(
    safeDiv(stats.recentWins + stats.recentDraws * 0.5, stats.recentMatchesCount)
  );
  const goalsDiffPerGame = safeDiv(stats.recentGoalsFor - stats.recentGoalsAgainst, stats.recentMatchesCount);
  const goalsComponent = clamp01(0.5 + goalsDiffPerGame / 6);
  const xgDiffPerGame = safeDiv(stats.recentXG - stats.recentXGA, stats.recentMatchesCount);
  const xgComponent = clamp01(0.5 + xgDiffPerGame / 4);

  return round(clamp01(winRate * 0.5 + goalsComponent * 0.3 + xgComponent * 0.2) * 100, 2);
};

/** Eficiencia ofensiva: gols/jogo, conversao de finalizacoes, xG overperformance, grandes chances. */
export const computeOffensiveEfficiency = (stats: TeamStats): number => {
  const goalsPerGame = safeDiv(stats.goalsFor, stats.matchesPlayed);
  const goalsComponent = clamp01(goalsPerGame / 3);
  const shotConversion = clamp01(safeDiv(goalsPerGame, stats.shotsPerGame));
  const bigChanceConversion = clamp01(safeDiv(stats.bigChancesConvertedPerGame, stats.bigChancesPerGame));
  const shotsOnTargetComponent = clamp01(stats.shotsOnTargetPerGame / 8);
  const xgOverperformancePerGame = safeDiv(stats.goalsFor - stats.xG, stats.matchesPlayed);
  const xgComponent = clamp01(0.5 + xgOverperformancePerGame / 2);

  return round(
    clamp01(
      goalsComponent * 0.25 +
        shotConversion * 0.2 +
        bigChanceConversion * 0.2 +
        shotsOnTargetComponent * 0.15 +
        xgComponent * 0.2
    ) * 100,
    2
  );
};

/**
 * Solidez defensiva. Todas as metricas de "quanto sofre" sao invertidas
 * explicitamente (valor menor = melhor desempenho = componente maior).
 */
export const computeDefensiveSolidity = (stats: TeamStats): number => {
  const goalsAgainstPerGame = safeDiv(stats.goalsAgainst, stats.matchesPlayed);
  const goalsAgainstComponent = clamp01(1 - goalsAgainstPerGame / 3);
  const xgaPerGame = safeDiv(stats.xGA, stats.matchesPlayed);
  const xgaComponent = clamp01(1 - xgaPerGame / 3);
  const shotsAgainstComponent = clamp01(1 - stats.shotsAgainstPerGame / 20);
  const shotsOnTargetAgainstComponent = clamp01(1 - stats.shotsOnTargetAgainstPerGame / 8);
  const bigChancesConcededComponent = clamp01(1 - stats.bigChancesConcededPerGame / 5);
  const cleanSheetRate = clamp01(safeDiv(stats.cleanSheets, stats.matchesPlayed));
  const goalsPreventedPerGame = safeDiv(stats.xGA - stats.goalsAgainst, stats.matchesPlayed);
  const overperformanceComponent = clamp01(0.5 + goalsPreventedPerGame / 2);

  return round(
    clamp01(
      goalsAgainstComponent * 0.25 +
        xgaComponent * 0.15 +
        shotsAgainstComponent * 0.1 +
        shotsOnTargetAgainstComponent * 0.1 +
        bigChancesConcededComponent * 0.15 +
        cleanSheetRate * 0.1 +
        overperformanceComponent * 0.15
    ) * 100,
    2
  );
};

/**
 * Disponibilidade do elenco: combina injuryImpact, suspendedPlayersImpact
 * (ambos 0-100, maior = pior, invertidos aqui) e keyPlayersAvailability
 * (0-100, maior = melhor). E o UNICO lugar onde esses tres crus se combinam,
 * para nao gerar dupla penalizacao em outros pontos do motor.
 */
export const computeSquadAvailabilityScore = (stats: TeamStats): number => {
  const injuryComponent = clamp01(1 - stats.injuryImpact / 100);
  const suspensionComponent = clamp01(1 - stats.suspendedPlayersImpact / 100);
  const keyPlayersComponent = clamp01(stats.keyPlayersAvailability / 100);

  return round(clamp01(injuryComponent * 0.35 + suspensionComponent * 0.25 + keyPlayersComponent * 0.4) * 100, 2);
};

/** Bloco squadStrength = qualidade esperada do time (lineupStrength) + disponibilidade do elenco. */
export const computeSquadStrength = (stats: TeamStats): number => {
  const squadAvailability = computeSquadAvailabilityScore(stats);
  return round(clamp(stats.lineupStrength, 0, 100) * 0.5 + squadAvailability * 0.5, 2);
};

/** Condicao fisica: descanso, fadiga (invertida) e impacto de viagem (invertido). */
export const computePhysicalCondition = (stats: TeamStats): number => {
  const restComponent = clamp01(stats.restDays / 10);
  const fatigueComponent = clamp01(1 - stats.fatigueScore / 100);
  const travelComponent = clamp01(1 - stats.travelImpact / 100);

  return round(clamp01(restComponent * 0.3 + fatigueComponent * 0.4 + travelComponent * 0.3) * 100, 2);
};

/** Disciplina: cartoes e faltas por jogo, todos invertidos (menos cartoes/faltas = melhor). Peso baixo no motor. */
export const computeDisciplineScore = (stats: TeamStats): number => {
  const yellowComponent = clamp01(1 - stats.yellowCardsPerGame / 5);
  const redComponent = clamp01(1 - stats.redCardsPerGame / 1);
  const foulsComponent = clamp01(1 - stats.foulsPerGame / 25);

  return round(clamp01(yellowComponent * 0.4 + redComponent * 0.4 + foulsComponent * 0.2) * 100, 2);
};

/** Bolas paradas: capacidade ofensiva e vulnerabilidade defensiva (invertida) + avaliacao manual de ameaca. */
export const computeSetPieceStrength = (stats: TeamStats): number => {
  const forComponent = clamp01(safeDiv(stats.setPieceGoalsFor, stats.matchesPlayed));
  const againstComponent = clamp01(1 - safeDiv(stats.setPieceGoalsAgainst, stats.matchesPlayed));
  const threatComponent = clamp01(stats.setPieceThreatScore / 100);

  return round(clamp01(forComponent * 0.35 + againstComponent * 0.35 + threatComponent * 0.3) * 100, 2);
};

/** Experiencia competitiva: dados manuais (0-100). Peso do bloco no motor ja e baixo para evitar dominar. */
export const computeCompetitiveExperience = (stats: TeamStats): number =>
  round(
    clamp(stats.tournamentExperienceScore, 0, 100) * 0.3 +
      clamp(stats.knockoutExperienceScore, 0, 100) * 0.4 +
      clamp(stats.pressureHandlingScore, 0, 100) * 0.3,
    2
  );

/**
 * Contexto da partida (por equipe): motivacao, importancia, "precisa vencer" e
 * pressao de classificacao. O ajuste de campo neutro e aplicado pelo motor,
 * pois depende da partida, nao de uma unica equipe.
 */
export const computeMatchContext = (stats: TeamStats): number =>
  round(
    clamp(stats.motivationScore, 0, 100) * 0.3 +
      clamp(stats.matchImportanceScore, 0, 100) * 0.3 +
      clamp(stats.mustWinScore, 0, 100) * 0.2 +
      clamp(stats.qualificationPressureScore, 0, 100) * 0.2,
    2
  );

export const computeBlockScores = (stats: TeamStats): BlockScores => ({
  recentPerformance: computeRecentPerformanceScore(stats),
  offensiveEfficiency: computeOffensiveEfficiency(stats),
  defensiveSolidity: computeDefensiveSolidity(stats),
  squadAvailability: computeSquadAvailabilityScore(stats),
  squadStrength: computeSquadStrength(stats),
  physicalCondition: computePhysicalCondition(stats),
  disciplineScore: computeDisciplineScore(stats),
  setPieceStrength: computeSetPieceStrength(stats),
  competitiveExperience: computeCompetitiveExperience(stats),
  matchContext: computeMatchContext(stats),
  opponentStrength: clamp(stats.opponentStrengthScore, 0, 100)
});

/**
 * Encaixe tatico entre as duas equipes (-1..1, positivo favorece o mandante).
 * Cruza ataque de uma equipe com a defesa da outra, bola parada ofensiva
 * contra vulnerabilidade em bola parada, condicao fisica e forca de elenco.
 * Nao e persistido em TeamStats por depender das duas equipes ao mesmo tempo.
 */
export const computeTacticalMatchupAdvantage = (home: BlockScores, away: BlockScores): number => {
  const homeAttackEdge = home.offensiveEfficiency / 100 - away.defensiveSolidity / 100;
  const awayAttackEdge = away.offensiveEfficiency / 100 - home.defensiveSolidity / 100;
  const attackDefenseEdge = clamp(homeAttackEdge - awayAttackEdge, -1, 1);
  const setPieceEdge = clamp((home.setPieceStrength - away.setPieceStrength) / 100, -1, 1);
  const physicalEdge = clamp((home.physicalCondition - away.physicalCondition) / 100, -1, 1);
  const squadEdge = clamp((home.squadStrength - away.squadStrength) / 100, -1, 1);

  return round(clamp(attackDefenseEdge * 0.5 + setPieceEdge * 0.2 + physicalEdge * 0.15 + squadEdge * 0.15, -1, 1));
};
