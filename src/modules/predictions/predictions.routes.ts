import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { predictionsController } from "./predictions.controller";
import {
  listPredictionsQuerySchema,
  predictionIdParamsSchema,
  predictionMatchIdParamsSchema
} from "./predictions.schema";

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

export const predictionsRoutes = Router();

predictionsRoutes.post(
  "/generate/:matchId",
  validateParams(predictionMatchIdParamsSchema),
  predictionsController.generate
);
predictionsRoutes.get("/", validateQuery(listPredictionsQuerySchema), predictionsController.list);
predictionsRoutes.get(
  "/match/:matchId",
  validateParams(predictionMatchIdParamsSchema),
  predictionsController.findByMatchId
);
predictionsRoutes.get("/:id", validateParams(predictionIdParamsSchema), predictionsController.findById);
