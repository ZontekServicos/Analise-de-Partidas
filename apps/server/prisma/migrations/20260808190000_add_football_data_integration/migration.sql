-- Initial database migration generated from prisma/schema.prisma.
-- This repository had no baseline migration before the football-data integration,
-- so the first migration must create the base schema before using its enums/tables.

BEGIN;

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ANALYST', 'VIEWER');
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');
CREATE TYPE "PredictionStatus" AS ENUM ('DRAFT', 'LOCKED', 'EVALUATED');
CREATE TYPE "CalibrationStatus" AS ENUM ('PENDING', 'APPLIED', 'REJECTED');
CREATE TYPE "CompetitionType" AS ENUM ('LEAGUE', 'CUP', 'INTERNATIONAL_CUP', 'QUALIFIERS', 'FRIENDLY', 'OTHER');
CREATE TYPE "TeamType" AS ENUM ('CLUB', 'NATIONAL_TEAM', 'UNKNOWN');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ANALYST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "CompetitionType" NOT NULL,
    "country" TEXT,
    "confederation" TEXT,
    "isInternational" BOOLEAN NOT NULL DEFAULT false,
    "externalId" TEXT,
    "externalProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "externalId" TEXT,
    "externalProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teamType" "TeamType" NOT NULL DEFAULT 'NATIONAL_TEAM',
    "fifaCode" TEXT,
    "confederation" TEXT,
    "worldRanking" INTEGER,
    "country" TEXT,
    "city" TEXT,
    "foundedYear" INTEGER,
    "crestUrl" TEXT,
    "externalId" TEXT,
    "externalProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "competition" TEXT NOT NULL,
    "competitionId" TEXT,
    "seasonId" TEXT,
    "stage" TEXT,
    "round" TEXT,
    "groupName" TEXT,
    "venue" TEXT,
    "city" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "neutralField" BOOLEAN NOT NULL DEFAULT true,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "externalId" TEXT,
    "externalProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamStats" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "competitionId" TEXT,
    "seasonId" TEXT,
    "referenceDate" TIMESTAMP(3) NOT NULL,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "xG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "xGA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shotsPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shotsAgainstPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "possessionAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recentFormScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attackStrength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defenseStrength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "injuryImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lineupStrength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "motivationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "matchImportanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recentMatchesCount" INTEGER NOT NULL DEFAULT 0,
    "recentWins" INTEGER NOT NULL DEFAULT 0,
    "recentDraws" INTEGER NOT NULL DEFAULT 0,
    "recentLosses" INTEGER NOT NULL DEFAULT 0,
    "recentGoalsFor" INTEGER NOT NULL DEFAULT 0,
    "recentGoalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "recentXG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recentXGA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shotsOnTargetPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bigChancesPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bigChancesConvertedPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cleanSheets" INTEGER NOT NULL DEFAULT 0,
    "shotsOnTargetAgainstPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bigChancesConcededPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "opponentStrengthScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "suspendedPlayersImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keyPlayersAvailability" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "restDays" INTEGER NOT NULL DEFAULT 7,
    "fatigueScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "travelImpact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yellowCardsPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "redCardsPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "foulsPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "setPieceGoalsFor" INTEGER NOT NULL DEFAULT 0,
    "setPieceGoalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "setPieceThreatScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tournamentExperienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "knockoutExperienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pressureHandlingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mustWinScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualificationPressureScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamStats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "modelVersion" TEXT NOT NULL,
    "status" "PredictionStatus" NOT NULL DEFAULT 'LOCKED',
    "homeWinProbability" DOUBLE PRECISION NOT NULL,
    "drawProbability" DOUBLE PRECISION NOT NULL,
    "awayWinProbability" DOUBLE PRECISION NOT NULL,
    "predictedHomeGoals" DOUBLE PRECISION,
    "predictedAwayGoals" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION,
    "evaluatedAt" TIMESTAMP(3),
    "errorScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PredictionFactor" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "factorKey" TEXT NOT NULL,
    "rawValue" DOUBLE PRECISION NOT NULL,
    "normalizedValue" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "contribution" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PredictionFactor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "homeGoals" INTEGER NOT NULL,
    "awayGoals" INTEGER NOT NULL,
    "homePenaltyGoals" INTEGER,
    "awayPenaltyGoals" INTEGER,
    "resultSource" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModelWeight" (
    "id" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "factorKey" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ModelWeight_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModelCalibrationRun" (
    "id" TEXT NOT NULL,
    "sourceModelVersion" TEXT NOT NULL,
    "targetModelVersion" TEXT,
    "status" "CalibrationStatus" NOT NULL DEFAULT 'PENDING',
    "matchesEvaluated" INTEGER NOT NULL DEFAULT 0,
    "averageErrorBefore" DOUBLE PRECISION,
    "averageErrorAfter" DOUBLE PRECISION,
    "analysisSummary" JSONB,
    "factorSuggestions" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    CONSTRAINT "ModelCalibrationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");
CREATE INDEX "Competition_type_idx" ON "Competition"("type");
CREATE INDEX "Competition_country_idx" ON "Competition"("country");
CREATE UNIQUE INDEX "Competition_externalProvider_externalId_key" ON "Competition"("externalProvider", "externalId");
CREATE INDEX "Season_competitionId_idx" ON "Season"("competitionId");
CREATE INDEX "Season_isCurrent_idx" ON "Season"("isCurrent");
CREATE UNIQUE INDEX "Season_competitionId_name_key" ON "Season"("competitionId", "name");
CREATE UNIQUE INDEX "Season_externalProvider_externalId_key" ON "Season"("externalProvider", "externalId");
CREATE UNIQUE INDEX "Team_fifaCode_key" ON "Team"("fifaCode");
CREATE INDEX "Team_teamType_idx" ON "Team"("teamType");
CREATE INDEX "Team_country_idx" ON "Team"("country");
CREATE UNIQUE INDEX "Team_externalProvider_externalId_key" ON "Team"("externalProvider", "externalId");
CREATE INDEX "Match_startsAt_idx" ON "Match"("startsAt");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE INDEX "Match_homeTeamId_idx" ON "Match"("homeTeamId");
CREATE INDEX "Match_awayTeamId_idx" ON "Match"("awayTeamId");
CREATE INDEX "Match_competitionId_idx" ON "Match"("competitionId");
CREATE INDEX "Match_seasonId_idx" ON "Match"("seasonId");
CREATE UNIQUE INDEX "Match_externalProvider_externalId_key" ON "Match"("externalProvider", "externalId");
CREATE INDEX "TeamStats_teamId_idx" ON "TeamStats"("teamId");
CREATE INDEX "TeamStats_referenceDate_idx" ON "TeamStats"("referenceDate");
CREATE INDEX "TeamStats_competitionId_idx" ON "TeamStats"("competitionId");
CREATE INDEX "TeamStats_seasonId_idx" ON "TeamStats"("seasonId");
CREATE INDEX "TeamStats_teamId_competitionId_seasonId_idx" ON "TeamStats"("teamId", "competitionId", "seasonId");
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");
CREATE INDEX "Prediction_modelVersion_idx" ON "Prediction"("modelVersion");
CREATE INDEX "Prediction_status_idx" ON "Prediction"("status");
CREATE INDEX "PredictionFactor_predictionId_idx" ON "PredictionFactor"("predictionId");
CREATE INDEX "PredictionFactor_factorKey_idx" ON "PredictionFactor"("factorKey");
CREATE UNIQUE INDEX "MatchResult_matchId_key" ON "MatchResult"("matchId");
CREATE INDEX "ModelWeight_modelVersion_idx" ON "ModelWeight"("modelVersion");
CREATE INDEX "ModelWeight_isActive_idx" ON "ModelWeight"("isActive");
CREATE UNIQUE INDEX "ModelWeight_modelVersion_factorKey_key" ON "ModelWeight"("modelVersion", "factorKey");

ALTER TABLE "Season" ADD CONSTRAINT "Season_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeamStats" ADD CONSTRAINT "TeamStats_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeamStats" ADD CONSTRAINT "TeamStats_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamStats" ADD CONSTRAINT "TeamStats_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PredictionFactor" ADD CONSTRAINT "PredictionFactor_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
