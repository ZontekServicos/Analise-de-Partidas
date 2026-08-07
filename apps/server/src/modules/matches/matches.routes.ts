import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { matchesController } from "./matches.controller";
import {
  createMatchSchema,
  listMatchesQuerySchema,
  matchIdParamsSchema,
  updateMatchSchema
} from "./matches.schema";

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

export const matchesRoutes = Router();

matchesRoutes.post("/", validateBody(createMatchSchema), matchesController.create);
matchesRoutes.get("/", validateQuery(listMatchesQuerySchema), matchesController.list);
matchesRoutes.get("/:id", validateParams(matchIdParamsSchema), matchesController.findById);
matchesRoutes.put(
  "/:id",
  validateParams(matchIdParamsSchema),
  validateBody(updateMatchSchema),
  matchesController.update
);
matchesRoutes.delete("/:id", validateParams(matchIdParamsSchema), matchesController.delete);
