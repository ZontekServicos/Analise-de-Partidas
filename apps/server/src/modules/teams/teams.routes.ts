import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { teamsController } from "./teams.controller";
import {
  createTeamSchema,
  listTeamsQuerySchema,
  teamIdParamsSchema,
  updateTeamSchema
} from "./teams.schema";

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

export const teamsRoutes = Router();

teamsRoutes.post("/", validateBody(createTeamSchema), teamsController.create);
teamsRoutes.get("/", validateQuery(listTeamsQuerySchema), teamsController.list);
teamsRoutes.get("/:id", validateParams(teamIdParamsSchema), teamsController.findById);
teamsRoutes.put(
  "/:id",
  validateParams(teamIdParamsSchema),
  validateBody(updateTeamSchema),
  teamsController.update
);
teamsRoutes.delete("/:id", validateParams(teamIdParamsSchema), teamsController.delete);
