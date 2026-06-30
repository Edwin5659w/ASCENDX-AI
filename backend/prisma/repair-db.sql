-- Idempotent repair: sync Neon DB with current Prisma schema (safe for existing data)

DO $$ BEGIN
  CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" "Plan" NOT NULL DEFAULT 'FREE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "streakShields" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyFocus" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyFocusDate" DATE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastDailyBonusDate" DATE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstStepsRewardClaimed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingDone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredCurrency" TEXT NOT NULL DEFAULT 'COP';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tradingJournalEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionPeriodEnd" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "productTourDone" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "referralCode" = UPPER(SUBSTRING(REPLACE("id"::text, '-', ''), 1, 8))
WHERE "referralCode" IS NULL;

DO $$ BEGIN
  ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "User_referredById_idx" ON "User"("referredById");

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey"
    FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmailLog_userId_template_idx" ON "EmailLog"("userId", "template");
CREATE INDEX IF NOT EXISTS "EmailLog_sentAt_idx" ON "EmailLog"("sentAt");

DO $$ BEGIN
  ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Premium features (2025-06-21)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "appleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "themePreference" TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountabilityCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "morningRitualDoneDate" DATE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "proTrialEndsAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailOptIn" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_appleId_key" ON "User"("appleId");
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
