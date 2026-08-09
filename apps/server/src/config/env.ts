import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional()
);

const optionalUrlWithDefault = (fallback: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().url().default(fallback)
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().url().default("http://localhost:5173"),
  // Integracao football-data.org (opcional): sem essas variaveis o app sobe normalmente,
  // so os endpoints de sync/status ficam indisponiveis/bloqueados.
  FOOTBALL_DATA_API_KEY: optionalTrimmedString,
  FOOTBALL_DATA_BASE_URL: optionalUrlWithDefault("https://api.football-data.org/v4"),
  DATA_SYNC_SECRET: optionalTrimmedString
});

export const env = envSchema.parse(process.env);
