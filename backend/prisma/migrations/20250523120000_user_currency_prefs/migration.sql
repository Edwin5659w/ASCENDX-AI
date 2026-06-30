-- Moneda preferida y diario de trading opcional por usuario
ALTER TABLE "User" ADD COLUMN "preferredCurrency" TEXT NOT NULL DEFAULT 'COP';
ALTER TABLE "User" ADD COLUMN "tradingJournalEnabled" BOOLEAN NOT NULL DEFAULT false;
