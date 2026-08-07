import { z } from "zod";

export const seasonIdParamsSchema = z.object({
  id: z.string().uuid("Season id must be a valid UUID")
});

const seasonBaseSchema = z.object({
  competitionId: z.string().uuid("competitionId must be a valid UUID"),
  name: z.string().trim().min(1).max(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().default(false)
});

export const createSeasonSchema = seasonBaseSchema.refine(
  (data) => !data.endDate || data.endDate >= data.startDate,
  {
    message: "endDate cannot be before startDate",
    path: ["endDate"]
  }
);

export const updateSeasonSchema = seasonBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "At least one field must be provided")
  .refine((data) => !data.endDate || !data.startDate || data.endDate >= data.startDate, {
    message: "endDate cannot be before startDate",
    path: ["endDate"]
  });

export const listSeasonsQuerySchema = z.object({
  competitionId: z.string().uuid("competitionId must be a valid UUID").optional(),
  isCurrent: z.coerce.boolean().optional()
});

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonInput = z.infer<typeof updateSeasonSchema>;
export type ListSeasonsQuery = z.infer<typeof listSeasonsQuerySchema>;
