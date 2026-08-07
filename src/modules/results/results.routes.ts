import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { resultsController } from "./results.controller";
import {
  createResultSchema,
  resultIdParamsSchema,
  resultMatchIdParamsSchema,
  updateResultSchema
} from "./results.schema";

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

export const resultsRoutes = Router();

resultsRoutes.post("/", validateBody(createResultSchema), resultsController.create);
resultsRoutes.get("/", resultsController.list);
resultsRoutes.get("/match/:matchId", validateParams(resultMatchIdParamsSchema), resultsController.findByMatchId);
resultsRoutes.get("/:id", validateParams(resultIdParamsSchema), resultsController.findById);
resultsRoutes.put(
  "/:id",
  validateParams(resultIdParamsSchema),
  validateBody(updateResultSchema),
  resultsController.update
);
resultsRoutes.delete("/:id", validateParams(resultIdParamsSchema), resultsController.delete);
