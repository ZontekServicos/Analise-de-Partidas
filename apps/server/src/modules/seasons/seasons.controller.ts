import type { NextFunction, Request, Response } from "express";

import { seasonsService } from "./seasons.service";

export const seasonsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const season = await seasonsService.create(req.body);

      res.status(201).json({
        data: season
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const seasons = await seasonsService.list(req.query);

      res.status(200).json({
        data: seasons
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const season = await seasonsService.findById(req.params.id);

      res.status(200).json({
        data: season
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const season = await seasonsService.update(req.params.id, req.body);

      res.status(200).json({
        data: season
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await seasonsService.delete(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
