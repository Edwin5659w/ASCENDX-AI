-- Plan freemium, referidos, escudos de racha y foco diario
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');

ALTER TABLE "User" ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE';
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredById" TEXT;
ALTER TABLE "User" ADD COLUMN "streakShields" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN "dailyFocus" TEXT;
ALTER TABLE "User" ADD COLUMN "dailyFocusDate" DATE;

UPDATE "User" SET "referralCode" = UPPER(SUBSTRING(REPLACE("id", '-', ''), 1, 8)) WHERE "referralCode" IS NULL;

ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey"
  FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_referredById_idx" ON "User"("referredById");
