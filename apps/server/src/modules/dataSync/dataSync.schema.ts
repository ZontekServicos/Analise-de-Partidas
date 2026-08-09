import { z } from "zod";

export const competitionExternalIdParamsSchema = z.object({
  externalId: z.string().trim().min(1)
});

export const syncCompetitionTeamsSchema = z.object({
  season: z.string().trim().min(4).max(9).optional()
});

export const syncCompetitionMatchesSchema = z.object({
  dateFrom: z.string().trim().min(1).optional(),
  dateTo: z.string().trim().min(1).optional(),
  stage: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  matchday: z.coerce.number().int().positive().optional(),
  group: z.string().trim().min(1).optional(),
  season: z.string().trim().min(4).max(9).optional()
});

export const syncMatchesByDateRangeSchema = z.object({
  dateFrom: z.string().trim().min(1),
  dateTo: z.string().trim().min(1),
  competitions: z.string().trim().min(1).optional()
});

export type CompetitionExternalIdParams = z.infer<typeof competitionExternalIdParamsSchema>;
export type SyncCompetitionTeamsInput = z.infer<typeof syncCompetitionTeamsSchema>;
export type SyncCompetitionMatchesInput = z.infer<typeof syncCompetitionMatchesSchema>;
export type SyncMatchesByDateRangeInput = z.infer<typeof syncMatchesByDateRangeSchema>;
