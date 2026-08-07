import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { teamStatsController } from "./teamStats.controller";
import {
  createTeamStatsSchema,
  listTeamStatsQuerySchema,
  teamStatsIdParamsSchema,
  teamStatsTeamIdParamsSchema,
  updateTeamStatsSchema
} from "./teamStats.schema";

const validateBody =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

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

const validateQuery =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(new AppError("Invalid query params", 400, result.error.flatten()));
      return;
    }

    req.query = result.data;
    next();
  };

export const teamStatsRoutes = Router();

teamStatsRoutes.post("/", validateBody(createTeamStatsSchema), teamStatsController.create);
teamStatsRoutes.get("/", validateQuery(listTeamStatsQuerySchema), teamStatsController.list);
teamStatsRoutes.get("/team/:teamId", validateParams(teamStatsTeamIdParamsSchema), teamStatsController.findByTeamId);
teamStatsRoutes.get("/:id", validateParams(teamStatsIdParamsSchema), teamStatsController.findById);
teamStatsRoutes.put(
  "/:id",
  validateParams(teamStatsIdParamsSchema),
  validateBody(updateTeamStatsSchema),
  teamStatsController.update
);
teamStatsRoutes.delete("/:id", validateParams(teamStatsIdParamsSchema), teamStatsController.delete);
