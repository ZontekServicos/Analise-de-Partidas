import type { NextFunction, Request, Response } from "express";

import { teamStatsService } from "./teamStats.service";

export const teamStatsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const teamStats = await teamStatsService.create(req.body);

      res.status(201).json({
        data: teamStats
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const teamStats = await teamStatsService.list(req.query);

      res.status(200).json({
        data: teamStats
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const teamStats = await teamStatsService.findById(req.params.id);

      res.status(200).json({
        data: teamStats
      });
    } catch (error) {
      next(error);
    }
  },

  async findByTeamId(req: Request, res: Response, next: NextFunction) {
    try {
      const teamStats = await teamStatsService.findByTeamId(req.params.teamId);

      res.status(200).json({
        data: teamStats
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const teamStats = await teamStatsService.update(req.params.id, req.body);

      res.status(200).json({
        data: teamStats
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await teamStatsService.delete(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
