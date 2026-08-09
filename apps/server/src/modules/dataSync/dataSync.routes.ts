import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { requireDataSyncSecret } from "./dataSync.auth";
import { dataSyncController } from "./dataSync.controller";
import {
  competitionExternalIdParamsSchema,
  syncCompetitionMatchesSchema,
  syncCompetitionTeamsSchema,
  syncMatchesByDateRangeSchema
} from "./dataSync.schema";

const validateBody =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      next(new AppError("Validation failed", 400, result.error.flatten()));
      return;
    }

    req.body = result.data;
    next();
  };

const validateParams =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(new AppError("Invalid route params", 400, result.error.flatten()));
      return;
    }

    req.params = result.data;
    next();
  };

export const dataSyncRoutes = Router();

// Protecao provisoria (Etapa 14): todas as rotas deste modulo exigem X-Data-Sync-Secret.
dataSyncRoutes.use(requireDataSyncSecret);

dataSyncRoutes.post("/competitions", dataSyncController.syncCompetitions);

dataSyncRoutes.post(
  "/competitions/:externalId/teams",
  validateParams(competitionExternalIdParamsSchema),
  validateBody(syncCompetitionTeamsSchema),
  dataSyncController.syncCompetitionTeams
);

dataSyncRoutes.post(
  "/competitions/:externalId/matches",
  validateParams(competitionExternalIdParamsSchema),
  validateBody(syncCompetitionMatchesSchema),
  dataSyncController.syncCompetitionMatches
);

dataSyncRoutes.post(
  "/matches",
  validateBody(syncMatchesByDateRangeSchema),
  dataSyncController.syncMatchesByDateRange
);
