import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { competitionsRoutes } from "./modules/competitions/competitions.routes";
import { matchesRoutes } from "./modules/matches/matches.routes";
import { modelCalibrationRoutes } from "./modules/modelCalibration/modelCalibration.routes";
import { predictionsRoutes } from "./modules/predictions/predictions.routes";
import { reportsRoutes } from "./modules/reports/reports.routes";
import { resultsRoutes } from "./modules/results/results.routes";
import { seasonsRoutes } from "./modules/seasons/seasons.routes";
import { teamStatsRoutes } from "./modules/teamStats/teamStats.routes";
import { teamsRoutes } from "./modules/teams/teams.routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "football-match-predictor-api"
  });
});

// Cada recurso responde tanto no path legado (compatibilidade com o frontend/testes
// atuais) quanto sob /api/<recurso> (convencao pedida na generalizacao da plataforma).
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
  app.use(path, router);
  app.use(`/api${path}`, router);
}

app.use(errorHandler);
