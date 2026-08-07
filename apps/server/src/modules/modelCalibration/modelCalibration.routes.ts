import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { ZodSchema } from "zod";

import { AppError } from "../../shared/errors/AppError";
import { modelCalibrationController } from "./modelCalibration.controller";
import {
  modelCalibrationIdParamsSchema,
  runModelCalibrationSchema
} from "./modelCalibration.schema";

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

export const modelCalibrationRoutes = Router();

modelCalibrationRoutes.post("/run", validateBody(runModelCalibrationSchema), modelCalibrationController.run);
modelCalibrationRoutes.get("/", modelCalibrationController.list);
modelCalibrationRoutes.get(
  "/:id",
  validateParams(modelCalibrationIdParamsSchema),
  modelCalibrationController.findById
);
