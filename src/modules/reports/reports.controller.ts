import type { NextFunction, Request, Response } from "express";

import { reportsService } from "./reports.service";

export const reportsController = {
  async getMatchReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportsService.getMatchReport(req.params.matchId);

      res.status(200).json({
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  async getModelPerformanceReport(_req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportsService.getModelPerformanceReport();

      res.status(200).json({
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
};
