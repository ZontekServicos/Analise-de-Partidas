import type { CompetitionType } from "@prisma/client";

/**
 * Contrato de contexto da partida (tipo de competicao, fase, mando, etc.).
 *
 * IMPORTANTE: nesta versao (v2) nenhum destes campos entra nos pesos ou nas
 * formulas do motor, com excecao de `neutralField` (ja usado antes desta
 * generalizacao, dentro do bloco matchContext). Os demais campos apenas
 * organizam o dado para que uma versao futura do motor possa usa-los sem
 * precisar redesenhar o contrato de entrada. Ver probabilityEngine.service.ts.
 */
export type MatchEngineContext = {
  competitionType: CompetitionType | null;
  isInternational: boolean;
  stage: string | null;
  round: string | null;
  neutralField: boolean;
  isGroupStage: boolean;
  isKnockout: boolean;
  isTwoLegged: boolean;
  requiresGoalDifference: boolean;
  isFriendly: boolean;
};

type BuildMatchEngineContextInput = {
  competitionType?: CompetitionType | null;
  isInternational?: boolean;
  stage?: string | null;
  round?: string | null;
  neutralField: boolean;
};

const KNOCKOUT_KEYWORDS = [
  "oitavas",
  "quartas",
  "semifinal",
  "final",
  "playoff",
  "play-off",
  "mata-mata",
  "knockout",
  "round of",
  "quarterfinal"
];
const GROUP_KEYWORDS = ["grupo", "group"];
const TWO_LEGGED_KEYWORDS = ["ida", "volta", "leg 1", "leg 2", "first leg", "second leg", "1st leg", "2nd leg"];

const textIncludesAny = (text: string, keywords: string[]) => {
  if (!text.trim()) {
    return false;
  }

  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

export const buildMatchEngineContext = (input: BuildMatchEngineContextInput): MatchEngineContext => {
  const competitionType = input.competitionType ?? null;
  const stage = input.stage ?? null;
  const round = input.round ?? null;
  const combinedText = `${stage ?? ""} ${round ?? ""}`;

  const isKnockout = textIncludesAny(combinedText, KNOCKOUT_KEYWORDS);
  const isGroupStage = textIncludesAny(combinedText, GROUP_KEYWORDS);
  const isTwoLegged = textIncludesAny(combinedText, TWO_LEGGED_KEYWORDS);
  const isFriendly = competitionType === "FRIENDLY";

  return {
    competitionType,
    isInternational: input.isInternational ?? false,
    stage,
    round,
    neutralField: input.neutralField,
    isGroupStage,
    isKnockout,
    isTwoLegged,
    // Saldo de gols/aggregate importa em confrontos de ida-e-volta e em desempates de fase de grupos.
    requiresGoalDifference: isTwoLegged || isGroupStage,
    isFriendly
  };
};
