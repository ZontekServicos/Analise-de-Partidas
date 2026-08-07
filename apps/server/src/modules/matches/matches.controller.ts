import type { NextFunction, Request, Response } from "express";

import { matchesService } from "./matches.service";

export const matchesController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const match = await matchesService.create(req.body);

      res.status(201).json({
        data: match
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const matches = await matchesService.list(req.query);

      res.status(200).json({
        data: matches
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const match = await matchesService.findById(req.params.id);

      res.status(200).json({
        data: match
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const match = await matchesService.update(req.params.id, req.body);

      res.status(200).json({
        data: match
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await matchesService.delete(req.params.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
