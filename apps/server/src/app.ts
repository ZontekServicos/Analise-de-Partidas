import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { competitionsRoutes } from "./modules/competitions/competitions.routes";
import { dataSyncRoutes } from "./modules/dataSync/dataSync.routes";
import { integrationsRoutes } from "./modules/integrations/integrations.routes";
import { matchesRoutes } from "./modules/matches/matches.routes";
import { modelCalibrationRoutes } from "./modules/modelCalibration/modelCalibration.routes";
import { predictionsRoutes } from "./modules/predictions/predictions.routes";
import { reportsRoutes } from "./modules/reports/reports.routes";
import { resultsRoutes } from "./modules/results/results.routes";
import { seasonsRoutes } from "./modules/seasons/seasons.routes";
import { teamStatsRoutes } from "./modules/teamStats/teamStats.routes";
import { teamsRoutes } from "./modules/teams/teams.routes";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "football-match-predictor-api"
  });
});

const resourceRoutes: Array<[string, express.Router]> = [
  ["/competitions", competitionsRoutes],
  ["/seasons", seasonsRoutes],
  ["/teams", teamsRoutes],
  ["/matches", matchesRoutes],
  ["/team-stats", teamStatsRoutes],
  ["/predictions", predictionsRoutes],
  ["/results", resultsRoutes],
  ["/model-calibration", modelCalibrationRoutes],
  ["/reports", reportsRoutes]
];

for (const [path, router] of resourceRoutes) {
  app.use(`/api${path}`, router);
}

// Rotas novas da integracao football-data.org — so no path /api, sem alias legado.
app.use("/api/data-sync", dataSyncRoutes);
app.use("/api/integrations", integrationsRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);
