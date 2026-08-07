import { TeamType } from "@prisma/client";
import { z } from "zod";

export const teamIdParamsSchema = z.object({
  id: z.string().uuid("Team id must be a valid UUID")
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(2).max(100),
  teamType: z.nativeEnum(TeamType).default(TeamType.NATIONAL_TEAM),
  fifaCode: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase())
    .optional(),
  confederation: z.string().trim().min(2).max(50).optional(),
  worldRanking: z.number().int().positive().optional(),
  country: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  foundedYear: z.number().int().min(1850).max(2100).optional(),
  externalId: z.string().trim().min(1).max(100).optional()
});

export const updateTeamSchema = createTeamSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided"
);

export const listTeamsQuerySchema = z.object({
  teamType: z.nativeEnum(TeamType).optional(),
  country: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional()
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
