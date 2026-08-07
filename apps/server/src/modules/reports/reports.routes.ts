import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { z, type ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { reportsController } from "./reports.controller";

const matchIdParamsSchema = z.object({
  matchId: z.string().uuid("Match id must be a valid UUID")
});

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

export const reportsRoutes = Router();

reportsRoutes.get("/match/:matchId", validateParams(matchIdParamsSchema), reportsController.getMatchReport);
reportsRoutes.get("/model-performance", reportsController.getModelPerformanceReport);
