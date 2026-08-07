import type { Team, TeamStats } from "@prisma/client";

import { DEFAULT_MODEL_VERSION, defaultWeights, type ProbabilityFactorKey } from "./defaultWeights";
import type { MatchEngineContext } from "./matchEngineContext";
import type { ProbabilityEngineResult, ProbabilityFactor } from "./probabilityFactors";
import {
  clamp,
  computeBlockScores,
  computeMatchContext,
  computeTacticalMatchupAdvantage,
  round,
  type BlockScores
} from "./teamStatsMetrics";

// worldRanking so existe de fato para selecoes. Times sem worldRanking (ex.: clubes,
// que nao tem ranking FIFA) caem no fallback de normalizeRankingDiff abaixo, que
// retorna 0 (neutro) quando falta ranking de qualquer lado — ausencia nunca vira
// desempenho ruim nem bom, e nunca gera NaN. Um futuro `clubStrengthRating` podera
// substituir esse fallback sem mudar o contrato do motor.
type TeamWithRanking = Pick<Team, "worldRanking">;

type MatchContext = {
  neutralField: boolean;
};

type CalculateInput = {
  homeTeam: TeamWithRanking;
  awayTeam: TeamWithRanking;
  homeStats: TeamStats;
  awayStats: TeamStats;
  match: MatchContext;
  /**
   * Contexto de competicao/fase (liga, copa, mata-mata, amistoso, grupo...).
   * Aceito e repassado, mas NAO usado nos pesos/formulas desta versao (v2) —
   * ver matchEngineContext.ts. Reservado para uma versao futura do motor.
   */
  context?: MatchEngineContext;
};

/**
 * Ajuste de mando de campo dobrado para dentro do bloco matchContext (v1 tinha
 * um fator "neutralField" proprio de peso 0.03; aqui o efeito e reduzido
 * proporcionalmente para nao inflar o peso maior de matchContext, 0.08).
 */
const NEUTRAL_FIELD_NUDGE = 0.05;

/** Ajuste moderado de forca dos adversarios dentro da forma recente, sem dominar o calculo. */
const OPPONENT_STRENGTH_RECENT_FORM_WEIGHT = 0.25;

const normalizeScoreDiff = (homeValue: number, awayValue: number) =>
  clamp((homeValue - awayValue) / 100, -1, 1);

const normalizeRankingDiff = (homeRanking?: number | null, awayRanking?: number | null) => {
  if (!homeRanking || !awayRanking) {
    return 0;
  }

  return clamp((awayRanking - homeRanking) / 100, -1, 1);
};

const buildFactor = (
  factorKey: ProbabilityFactorKey,
  rawValue: number,
  normalizedValue: number,
  metadata?: Record<string, unknown>
): ProbabilityFactor => {
  const weight = defaultWeights[factorKey];
  const safeNormalizedValue = Number.isFinite(normalizedValue) ? clamp(normalizedValue, -1, 1) : 0;
  const contribution = safeNormalizedValue * weight;

  return {
    factorKey,
    rawValue: Number.isFinite(rawValue) ? round(rawValue) : 0,
    normalizedValue: round(safeNormalizedValue),
    weight,
    contribution: round(contribution),
    ...(metadata ? { metadata } : {})
  };
};

const calculateDrawProbability = (advantageScore: number) => {
  const balance = 1 - clamp(Math.abs(advantageScore), 0, 1);
  return round(clamp(0.18 + balance * 0.12, 0.18, 0.3));
};

const calculateExpectedGoals = (
  attack: number,
  opponentDefense: number,
  form: number,
  unavailabilityPenalty: number
) => {
  const attackComponent = attack / 100;
  const defenseGap = (100 - opponentDefense) / 100;
  const formComponent = form / 100;
  const penaltyComponent = unavailabilityPenalty / 100;

  return round(
    clamp(0.4 + attackComponent * 1.1 + defenseGap * 0.7 + formComponent * 0.4 - penaltyComponent * 0.35, 0.2, 4),
    2
  );
};

const buildBlockFactor = (
  factorKey: Exclude<ProbabilityFactorKey, "tacticalMatchup" | "worldRanking" | "matchContext">,
  home: BlockScores,
  away: BlockScores,
  key: keyof BlockScores
) =>
  buildFactor(factorKey, home[key] - away[key], normalizeScoreDiff(home[key], away[key]), {
    homeScore: home[key],
    awayScore: away[key]
  });

export const probabilityEngineService = {
  calculate(input: CalculateInput): ProbabilityEngineResult {
    // homeBlocks/awayBlocks vem de TeamStats, que agora pode ser especifico por
    // competicao/temporada (ver predictions/teamStatsLookup.ts). Isso e o que faz
    // competitiveExperience e opponentStrength refletirem o nivel da competicao
    // analisada: bastam TeamStats diferentes por competitionId/seasonId para o
    // mesmo time — nenhuma mudanca de formula e necessaria aqui.
    const homeBlocks = computeBlockScores(input.homeStats);
    const awayBlocks = computeBlockScores(input.awayStats);

    const opponentStrengthDiff = homeBlocks.opponentStrength - awayBlocks.opponentStrength;
    const opponentStrengthAdjustment = clamp(
      (opponentStrengthDiff / 100) * OPPONENT_STRENGTH_RECENT_FORM_WEIGHT,
      -0.3,
      0.3
    );
    const recentPerformanceNormalized = clamp(
      normalizeScoreDiff(homeBlocks.recentPerformance, awayBlocks.recentPerformance) + opponentStrengthAdjustment,
      -1,
      1
    );

    // matchContext (motivacao/importancia/mustWin/pressao de classificacao + mando)
    // ja e generico o bastante para liga, copa, amistoso, grupo ou mata-mata: sao
    // scores manuais por TeamStats + o neutralField da partida, nada aqui assume
    // uma competicao especifica. O MatchEngineContext (input.context) carrega dados
    // adicionais de fase/mata-mata/ida-e-volta para uma versao futura do motor.
    const homeMatchContext = computeMatchContext(input.homeStats);
    const awayMatchContext = computeMatchContext(input.awayStats);
    const neutralFieldNudge = input.match.neutralField ? 0 : NEUTRAL_FIELD_NUDGE;
    const matchContextNormalized = clamp(
      normalizeScoreDiff(homeMatchContext, awayMatchContext) + neutralFieldNudge,
      -1,
      1
    );

    const tacticalMatchupNormalized = computeTacticalMatchupAdvantage(homeBlocks, awayBlocks);

    const factors: ProbabilityFactor[] = [
      buildFactor("recentPerformance", homeBlocks.recentPerformance - awayBlocks.recentPerformance, recentPerformanceNormalized, {
        homeScore: homeBlocks.recentPerformance,
        awayScore: awayBlocks.recentPerformance,
        opponentStrengthAdjustment: round(opponentStrengthAdjustment)
      }),
      buildBlockFactor("offensiveEfficiency", homeBlocks, awayBlocks, "offensiveEfficiency"),
      buildBlockFactor("defensiveSolidity", homeBlocks, awayBlocks, "defensiveSolidity"),
      buildBlockFactor("squadStrength", homeBlocks, awayBlocks, "squadStrength"),
      buildBlockFactor("physicalCondition", homeBlocks, awayBlocks, "physicalCondition"),
      buildBlockFactor("competitiveExperience", homeBlocks, awayBlocks, "competitiveExperience"),
      buildFactor("matchContext", homeMatchContext - awayMatchContext, matchContextNormalized, {
        homeScore: homeMatchContext,
        awayScore: awayMatchContext,
        neutralField: input.match.neutralField,
        neutralFieldNudge: round(neutralFieldNudge)
      }),
      buildFactor(
        "tacticalMatchup",
        round(tacticalMatchupNormalized * 100),
        tacticalMatchupNormalized,
        {
          home: {
            offensiveEfficiency: homeBlocks.offensiveEfficiency,
            defensiveSolidity: homeBlocks.defensiveSolidity,
            setPieceStrength: homeBlocks.setPieceStrength,
            physicalCondition: homeBlocks.physicalCondition,
            squadStrength: homeBlocks.squadStrength
          },
          away: {
            offensiveEfficiency: awayBlocks.offensiveEfficiency,
            defensiveSolidity: awayBlocks.defensiveSolidity,
            setPieceStrength: awayBlocks.setPieceStrength,
            physicalCondition: awayBlocks.physicalCondition,
            squadStrength: awayBlocks.squadStrength
          }
        }
      ),
      buildFactor(
        "worldRanking",
        (input.awayTeam.worldRanking ?? 0) - (input.homeTeam.worldRanking ?? 0),
        normalizeRankingDiff(input.homeTeam.worldRanking, input.awayTeam.worldRanking)
      ),
      buildBlockFactor("opponentStrength", homeBlocks, awayBlocks, "opponentStrength")
    ];

    const advantageScore = round(clamp(factors.reduce((total, factor) => total + factor.contribution, 0), -1, 1));
    const drawProbability = calculateDrawProbability(advantageScore);
    const remainingProbability = 1 - drawProbability;
    const homeShare = clamp(0.5 + advantageScore, 0.05, 0.95);

    const homeWinProbability = round(remainingProbability * homeShare);
    const awayWinProbability = round(1 - drawProbability - homeWinProbability);
    const confidence = round(clamp(0.45 + Math.abs(advantageScore) * 0.8, 0.45, 0.9));

    return {
      modelVersion: DEFAULT_MODEL_VERSION,
      homeWinProbability,
      drawProbability,
      awayWinProbability,
      predictedHomeGoals: calculateExpectedGoals(
        homeBlocks.offensiveEfficiency,
        awayBlocks.defensiveSolidity,
        homeBlocks.recentPerformance,
        100 - homeBlocks.squadStrength
      ),
      predictedAwayGoals: calculateExpectedGoals(
        awayBlocks.offensiveEfficiency,
        homeBlocks.defensiveSolidity,
        awayBlocks.recentPerformance,
        100 - awayBlocks.squadStrength
      ),
      confidence,
      factors
    };
  }
};
