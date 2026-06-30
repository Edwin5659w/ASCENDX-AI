-- Retención: bonus diario y recompensa first-steps
ALTER TABLE "User" ADD COLUMN "lastDailyBonusDate" DATE;
ALTER TABLE "User" ADD COLUMN "firstStepsRewardClaimed" BOOLEAN NOT NULL DEFAULT false;
