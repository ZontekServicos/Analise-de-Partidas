import type { NextFunction, Request, Response } from "express";

import { footballDataService } from "../../integrations/footballData/footballData.service";

export const integrationsController = {
  getFootballDataStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      // Le so o cache em memoria do client — nunca dispara uma chamada nova a football-data.org.
      const status = footballDataService.getStatus();

      res.status(200).json({ data: status });
    } catch (error) {
      next(error);
    }
  }
};
