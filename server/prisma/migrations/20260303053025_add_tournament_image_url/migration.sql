/*
  Warnings:

  - You are about to drop the column `skillLevels` on the `Tournament` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "TournamentSkillLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillLevel" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    CONSTRAINT "TournamentSkillLevel_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tournament" ("city", "createdAt", "description", "endDate", "id", "location", "name", "source", "sourceUrl", "startDate", "state", "updatedAt") SELECT "city", "createdAt", "description", "endDate", "id", "location", "name", "source", "sourceUrl", "startDate", "state", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE UNIQUE INDEX "Tournament_sourceUrl_key" ON "Tournament"("sourceUrl");
CREATE INDEX "Tournament_city_state_startDate_idx" ON "Tournament"("city", "state", "startDate");
CREATE INDEX "Tournament_startDate_idx" ON "Tournament"("startDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TournamentSkillLevel_skillLevel_idx" ON "TournamentSkillLevel"("skillLevel");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentSkillLevel_tournamentId_skillLevel_key" ON "TournamentSkillLevel"("tournamentId", "skillLevel");
