import { CompetitionType } from "@prisma/client";
import { z } from "zod";

export const competitionIdParamsSchema = z.object({
  id: z.string().uuid("Competition id must be a valid UUID")
});

export const createCompetitionSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(160).optional(),
  type: z.nativeEnum(CompetitionType),
  country: z.string().trim().min(2).max(80).optional(),
  confederation: z.string().trim().min(2).max(50).optional(),
  isInternational: z.boolean().default(false)
});

export const updateCompetitionSchema = createCompetitionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided"
);

export const listCompetitionsQuerySchema = z.object({
  type: z.nativeEnum(CompetitionType).optional(),
  country: z.string().trim().min(1).optional(),
  isInternational: z.coerce.boolean().optional()
});

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>;
export type UpdateCompetitionInput = z.infer<typeof updateCompetitionSchema>;
export type ListCompetitionsQuery = z.infer<typeof listCompetitionsQuerySchema>;
