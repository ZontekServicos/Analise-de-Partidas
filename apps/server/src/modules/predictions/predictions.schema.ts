import { z } from "zod";

export const predictionIdParamsSchema = z.object({
  id: z.string().uuid("Prediction id must be a valid UUID")
});

export const predictionMatchIdParamsSchema = z.object({
  matchId: z.string().uuid("Match id must be a valid UUID")
});

export const listPredictionsQuerySchema = z.object({
  matchId: z.string().uuid("matchId must be a valid UUID").optional(),
  modelVersion: z.string().trim().min(1).optional()
});

export type ListPredictionsQuery = z.infer<typeof listPredictionsQuerySchema>;
