import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { competitionsController } from "./competitions.controller";
import {
  competitionIdParamsSchema,
  createCompetitionSchema,
  listCompetitionsQuerySchema,
  updateCompetitionSchema
} from "./competitions.schema";

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

export const competitionsRoutes = Router();

competitionsRoutes.post("/", validateBody(createCompetitionSchema), competitionsController.create);
competitionsRoutes.get("/", validateQuery(listCompetitionsQuerySchema), competitionsController.list);
competitionsRoutes.get(
  "/:id",
  validateParams(competitionIdParamsSchema),
  competitionsController.findById
);
competitionsRoutes.put(
  "/:id",
  validateParams(competitionIdParamsSchema),
  validateBody(updateCompetitionSchema),
  competitionsController.update
);
competitionsRoutes.delete(
  "/:id",
  validateParams(competitionIdParamsSchema),
  competitionsController.delete
);
