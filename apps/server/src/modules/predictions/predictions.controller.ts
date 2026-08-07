import type { NextFunction, Request, Response } from "express";

import { predictionsService } from "./predictions.service";

export const predictionsController = {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const prediction = await predictionsService.generate(req.params.matchId);

      res.status(201).json({
        data: prediction
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const predictions = await predictionsService.list(req.query);

      res.status(200).json({
        data: predictions
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const prediction = await predictionsService.findById(req.params.id);

      res.status(200).json({
        data: prediction
      });
    } catch (error) {
      next(error);
    }
  },

  async findByMatchId(req: Request, res: Response, next: NextFunction) {
    try {
      const predictions = await predictionsService.findByMatchId(req.params.matchId);

      res.status(200).json({
        data: predictions
      });
    } catch (error) {
      next(error);
    }
  }
};
