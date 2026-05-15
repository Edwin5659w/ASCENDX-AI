-- =============================================================================
-- ASCENDX AI — Reset completo + esquema para Neon (PostgreSQL)
-- =============================================================================
-- ⚠️  BORRA TODOS LOS DATOS de las tablas listadas.
--
-- Recomendación: en entornos reales suele ser más limpio crear una base/rama
-- vacía en Neon y ejecutar desde backend:  npx prisma migrate deploy
-- Así la tabla _prisma_migrations queda alineada con el historial.
--
-- Usa este archivo si quieres pegar todo en el SQL Editor de Neon de una vez.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) DROP (orden: tablas dependientes primero; luego enums)
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS "UserBadge" CASCADE;
DROP TABLE IF EXISTS "HabitCompletion" CASCADE;
DROP TABLE IF EXISTS "Task" CASCADE;
DROP TABLE IF EXISTS "Goal" CASCADE;
DROP TABLE IF EXISTS "Habit" CASCADE;
DROP TABLE IF EXISTS "PasswordResetToken" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "FinanceRecord" CASCADE;
DROP TABLE IF EXISTS "AIInsight" CASCADE;
DROP TABLE IF EXISTS "Badge" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

DROP TYPE IF EXISTS "AIInsightType" CASCADE;
DROP TYPE IF EXISTS "FinanceType" CASCADE;
DROP TYPE IF EXISTS "HabitFrequency" CASCADE;
DROP TYPE IF EXISTS "Priority" CASCADE;

-- -----------------------------------------------------------------------------
-- 2) CREATE (generado con: prisma migrate diff --from-empty --to-schema-datamodel)
-- -----------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY');

CREATE TYPE "FinanceType" AS ENUM ('INCOME', 'EXPENSE');

CREATE TYPE "AIInsightType" AS ENUM ('MOTIVATION', 'WARNING', 'DAILY_PLAN', 'PROCRASTINATION', 'CHAT');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "pushToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "goalId" TEXT,
    "userId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "HabitFrequency" NOT NULL DEFAULT 'DAILY',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HabitCompletion" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitCompletion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinanceRecord" (
    "id" TEXT NOT NULL,
    "type" "FinanceType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AIInsightType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

CREATE INDEX "Task_userId_idx" ON "Task"("userId");

CREATE INDEX "Task_goalId_idx" ON "Task"("goalId");

CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");

CREATE INDEX "HabitCompletion_userId_idx" ON "HabitCompletion"("userId");

CREATE INDEX "HabitCompletion_habitId_idx" ON "HabitCompletion"("habitId");

CREATE UNIQUE INDEX "HabitCompletion_habitId_completedDate_key" ON "HabitCompletion"("habitId", "completedDate");

CREATE INDEX "FinanceRecord_userId_idx" ON "FinanceRecord"("userId");

CREATE INDEX "AIInsight_userId_idx" ON "AIInsight"("userId");

ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FinanceRecord" ADD CONSTRAINT "FinanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 3) Catálogo de badges (idempotente; alineado con migración del repo)
-- -----------------------------------------------------------------------------

INSERT INTO "Badge" ("id", "title", "subtitle", "sortOrder") VALUES
  ('FIRST_TASK', 'En marcha', 'Primera tarea completada', 1),
  ('STREAK_7', 'Constancia', 'Racha de 7 días o más', 2),
  ('GOALS_3', 'Visionario', '3 o más objetivos creados', 3),
  ('LEVEL_5', 'Ascenso', 'Alcanza el nivel 5', 4),
  ('STEEL', 'Acero', '3 hábitos y racha 3+', 5),
  ('XP_500', 'Veterano', '500 XP totales', 6)
ON CONFLICT ("id") DO NOTHING;
