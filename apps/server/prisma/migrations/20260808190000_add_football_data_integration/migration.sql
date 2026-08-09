-- Additive provider identifiers. Nullable columns preserve every existing row.
ALTER TYPE "TeamType" ADD VALUE IF NOT EXISTS 'UNKNOWN';

ALTER TABLE "Competition"
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "externalProvider" TEXT;

ALTER TABLE "Season"
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "externalProvider" TEXT;

ALTER TABLE "Team"
  ADD COLUMN "crestUrl" TEXT,
  ADD COLUMN "externalProvider" TEXT;

ALTER TABLE "Match"
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "externalProvider" TEXT;

-- A display name is not a stable identity. Provider + external ID is.
DROP INDEX IF EXISTS "Team_name_key";
DROP INDEX IF EXISTS "Team_externalId_key";

CREATE UNIQUE INDEX "Competition_externalProvider_externalId_key"
  ON "Competition"("externalProvider", "externalId");
CREATE UNIQUE INDEX "Season_externalProvider_externalId_key"
  ON "Season"("externalProvider", "externalId");
CREATE UNIQUE INDEX "Team_externalProvider_externalId_key"
  ON "Team"("externalProvider", "externalId");
CREATE UNIQUE INDEX "Match_externalProvider_externalId_key"
  ON "Match"("externalProvider", "externalId");
