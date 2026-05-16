-- Montos financieros con precisión decimal (evita errores de Float)
ALTER TABLE "FinanceRecord" ALTER COLUMN "amount" TYPE DECIMAL(12,2) USING ROUND("amount"::numeric, 2);
