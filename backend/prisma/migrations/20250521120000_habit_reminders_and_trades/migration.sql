-- Habit reminders
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "reminderEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "reminderHour" INTEGER;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "reminderMinute" INTEGER;

-- Trading journal
CREATE TYPE "TradeSide" AS ENUM ('BUY', 'SELL');

CREATE TABLE IF NOT EXISTS "Trade" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "quantity" DECIMAL(18,8) NOT NULL,
    "price" DECIMAL(18,8) NOT NULL,
    "pnl" DECIMAL(12,2),
    "emotionTag" TEXT,
    "note" TEXT,
    "tradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Trade_userId_idx" ON "Trade"("userId");
CREATE INDEX IF NOT EXISTS "Trade_tradedAt_idx" ON "Trade"("tradedAt");

ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
