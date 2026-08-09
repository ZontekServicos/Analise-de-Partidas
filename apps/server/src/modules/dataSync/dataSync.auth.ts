import { timingSafeEqual } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env";
import { AppError } from "../../shared/errors/AppError";

const SECRET_HEADER = "x-data-sync-secret";

/**
 * Exportada para teste puro. Comparacao em tempo constante — nao vaza timing
 * sobre onde a string diverge. Retorna false pra tamanhos diferentes sem lancar.
 */
export const isValidDataSyncSecret = (provided: string | undefined, configured: string | undefined): boolean => {
  if (!configured || !provided) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const configuredBuffer = Buffer.from(configured);

  if (providedBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, configuredBuffer);
};

/**
 * Protecao provisoria ate existir autenticacao real (Etapa 14). Fail-closed:
 * se DATA_SYNC_SECRET nao estiver configurado, as rotas ficam bloqueadas em vez
 * de abertas por engano.
 */
export const requireDataSyncSecret = (req: Request, _res: Response, next: NextFunction) => {
  if (!env.DATA_SYNC_SECRET) {
    next(new AppError("Data sync not configured (DATA_SYNC_SECRET is not set)", 503));
    return;
  }

  const provided = req.header(SECRET_HEADER);

  if (!isValidDataSyncSecret(provided, env.DATA_SYNC_SECRET)) {
    next(new AppError("Invalid or missing X-Data-Sync-Secret header", 401));
    return;
  }

  next();
};
