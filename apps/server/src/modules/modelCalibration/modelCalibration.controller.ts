import type { NextFunction, Request, Response } from "express";

import { modelCalibrationService } from "./modelCalibration.service";

export const modelCalibrationController = {
  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const calibrationRun = await modelCalibrationService.run(req.body);

      res.status(201).json({
        data: calibrationRun
      });
    } catch (error) {
      next(error);
    }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const calibrationRuns = await modelCalibrationService.list();

      res.status(200).json({
        data: calibrationRuns
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const calibrationRun = await modelCalibrationService.findById(req.params.id);

      res.status(200).json({
        data: calibrationRun
      });
    } catch (error) {
      next(error);
    }
  }
};
