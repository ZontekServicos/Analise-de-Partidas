import { Router } from "express";

import { integrationsController } from "./integrations.controller";

export const integrationsRoutes = Router();

integrationsRoutes.get("/football-data/status", integrationsController.getFootballDataStatus);
