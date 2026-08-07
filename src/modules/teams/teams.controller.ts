import type { NextFunction, Request, Response } from "express";

import { teamsService } from "./teams.service";

export const teamsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamsService.create(req.body);

      res.status(201).json({
        data: team
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const teams = await teamsService.list(req.query);

      res.status(200).json({
        data: teams
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamsService.findById(req.params.id);

      res.status(200).json({
        data: team
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await teamsService.update(req.params.id, req.body);

      res.status(200).json({
        data: team
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await teamsService.delete(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
