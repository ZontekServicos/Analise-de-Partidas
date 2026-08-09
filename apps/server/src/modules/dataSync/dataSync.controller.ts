import type { NextFunction, Request, Response } from "express";

import { dataSyncService } from "./dataSync.service";

export const dataSyncController = {
  async syncCompetitions(_req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dataSyncService.syncCompetitions();

      res.status(200).json({ data: summary });
    } catch (error) {
      next(error);
    }
  },

  async syncCompetitionTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dataSyncService.syncCompetitionTeams(req.params.externalId, req.body);

      res.status(200).json({ data: summary });
    } catch (error) {
      next(error);
    }
  },

  async syncCompetitionMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dataSyncService.syncCompetitionMatches(req.params.externalId, req.body);

      res.status(200).json({ data: summary });
    } catch (error) {
      next(error);
    }
  },

  async syncMatchesByDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dataSyncService.syncMatchesByDateRange(req.body);

      res.status(200).json({ data: summary });
    } catch (error) {
      next(error);
    }
  }
};
