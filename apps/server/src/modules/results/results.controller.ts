import type { NextFunction, Request, Response } from "express";

import { resultsService } from "./results.service";

export const resultsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resultsService.create(req.body);

      res.status(201).json({
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const results = await resultsService.list();

      res.status(200).json({
        data: results
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resultsService.findById(req.params.id);

      res.status(200).json({
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async findByMatchId(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resultsService.findByMatchId(req.params.matchId);

      res.status(200).json({
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await resultsService.update(req.params.id, req.body);

      res.status(200).json({
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await resultsService.delete(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
