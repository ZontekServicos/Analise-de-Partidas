import { MatchStatus } from "@prisma/client";
import { z } from "zod";

export const matchIdParamsSchema = z.object({
  id: z.string().uuid("Match id must be a valid UUID")
});

const matchBaseSchema = z.object({
  homeTeamId: z.string().uuid("homeTeamId must be a valid UUID"),
  awayTeamId: z.string().uuid("awayTeamId must be a valid UUID"),
  matchDate: z.coerce.date(),
  competition: z.string().trim().min(2).max(100),
  competitionId: z.string().uuid("competitionId must be a valid UUID").optional(),
  seasonId: z.string().uuid("seasonId must be a valid UUID").optional(),
  stage: z.string().trim().min(2).max(100).optional(),
  round: z.string().trim().min(1).max(60).optional(),
  group: z.string().trim().min(1).max(30).optional(),
  neutralField: z.boolean().default(true),
  status: z.nativeEnum(MatchStatus).default(MatchStatus.SCHEDULED)
});

export const createMatchSchema = matchBaseSchema.refine(
  (data) => data.homeTeamId !== data.awayTeamId,
  {
    message: "homeTeamId and awayTeamId must be different",
    path: ["awayTeamId"]
  }
);

export const updateMatchSchema = matchBaseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided"
);

export const listMatchesQuerySchema = z.object({
  competition: z.string().trim().min(1).optional(),
  competitionId: z.string().uuid("competitionId must be a valid UUID").optional(),
  seasonId: z.string().uuid("seasonId must be a valid UUID").optional(),
  teamId: z.string().uuid("teamId must be a valid UUID").optional(),
  stage: z.string().trim().min(1).optional(),
  status: z.nativeEnum(MatchStatus).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional()
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
