export const DEFAULT_MODEL_VERSION = "v2";
export const LEGACY_MODEL_VERSION = "v1";

export const defaultWeights = {
  recentPerformance: 0.17,
  offensiveEfficiency: 0.15,
  defensiveSolidity: 0.15,
  squadStrength: 0.13,
  physicalCondition: 0.08,
  competitiveExperience: 0.07,
  matchContext: 0.08,
  tacticalMatchup: 0.09,
  worldRanking: 0.05,
  opponentStrength: 0.03
} as const;

export type ProbabilityFactorKey = keyof typeof defaultWeights;

const WEIGHT_SUM_TOLERANCE = 1e-9;

const weightSum = Object.values(defaultWeights).reduce((total, weight) => total + weight, 0);

if (Math.abs(weightSum - 1) > WEIGHT_SUM_TOLERANCE) {
  throw new Error(`defaultWeights must sum to 1, got ${weightSum}`);
}
