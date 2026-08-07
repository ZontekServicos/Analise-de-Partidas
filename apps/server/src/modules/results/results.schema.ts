import { z } from "zod";

export const resultIdParamsSchema = z.object({
  id: z.string().uuid("Result id must be a valid UUID")
});

export const resultMatchIdParamsSchema = z.object({
  matchId: z.string().uuid("Match id must be a valid UUID")
});

export const createResultSchema = z.object({
  matchId: z.string().uuid("matchId must be a valid UUID"),
  homeGoals: z.number().int().nonnegative(),
  awayGoals: z.number().int().nonnegative(),
  homePenaltyGoals: z.number().int().nonnegative().optional(),
  awayPenaltyGoals: z.number().int().nonnegative().optional(),
  resultSource: z.string().trim().min(2).max(100).optional(),
  confirmedAt: z.coerce.date().optional()
});

export const updateResultSchema = createResultSchema
  .omit({ matchId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field must be provided");

export type CreateResultInput = z.infer<typeof createResultSchema>;
export type UpdateResultInput = z.infer<typeof updateResultSchema>;
