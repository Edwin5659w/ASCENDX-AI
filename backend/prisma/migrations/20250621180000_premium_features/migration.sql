-- Premium features: ascend score support, accountability, OAuth, recurring tasks, trial
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themePreference" TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountabilityCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "morningRitualDoneDate" DATE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "proTrialEndsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_accountabilityCode_key" ON "User"("accountabilityCode");

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurrenceDays" TEXT;

CREATE TABLE IF NOT EXISTS "AccountabilityLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountabilityLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccountabilityLink_userId_partnerId_key" ON "AccountabilityLink"("userId", "partnerId");
CREATE INDEX IF NOT EXISTS "AccountabilityLink_userId_idx" ON "AccountabilityLink"("userId");
CREATE INDEX IF NOT EXISTS "AccountabilityLink_partnerId_idx" ON "AccountabilityLink"("partnerId");

DO $$ BEGIN
  ALTER TABLE "AccountabilityLink" ADD CONSTRAINT "AccountabilityLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AccountabilityLink" ADD CONSTRAINT "AccountabilityLink_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
