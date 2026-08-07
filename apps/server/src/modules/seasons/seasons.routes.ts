import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { seasonsController } from "./seasons.controller";
import {
  createSeasonSchema,
  listSeasonsQuerySchema,
  seasonIdParamsSchema,
  updateSeasonSchema
} from "./seasons.schema";

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

export const seasonsRoutes = Router();

seasonsRoutes.post("/", validateBody(createSeasonSchema), seasonsController.create);
seasonsRoutes.get("/", validateQuery(listSeasonsQuerySchema), seasonsController.list);
seasonsRoutes.get("/:id", validateParams(seasonIdParamsSchema), seasonsController.findById);
seasonsRoutes.put(
  "/:id",
  validateParams(seasonIdParamsSchema),
  validateBody(updateSeasonSchema),
  seasonsController.update
);
seasonsRoutes.delete("/:id", validateParams(seasonIdParamsSchema), seasonsController.delete);
