import type { NextFunction, Request, Response } from "express";

import { competitionsService } from "./competitions.service";

export const competitionsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const competition = await competitionsService.create(req.body);

      res.status(201).json({
        data: competition
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const competitions = await competitionsService.list(req.query);

      res.status(200).json({
        data: competitions
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const competition = await competitionsService.findById(req.params.id);

      res.status(200).json({
        data: competition
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const competition = await competitionsService.update(req.params.id, req.body);

      res.status(200).json({
        data: competition
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await competitionsService.delete(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
