-- ASCENDX AI — Migración inicial para PostgreSQL (Neon)
-- Ejecutar con: npx prisma migrate deploy
-- O pegar este SQL en el SQL Editor de Neon

-- Enums
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "HabitFrequency" AS ENUM ('DAILY', 'WEEKLY');
CREATE TYPE "FinanceType" AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE "AIInsightType" AS ENUM ('MOTIVATION', 'WARNING', 'DAILY_PLAN', 'PROCRASTINATION', 'CHAT');

-- User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_email_key" UNIQUE ("email"),
    CONSTRAINT "User_name_length" CHECK (char_length("name") >= 2),
    CONSTRAINT "User_xp_non_negative" CHECK ("xp" >= 0),
    CONSTRAINT "User_level_positive" CHECK ("level" >= 1)
);

-- RefreshToken
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RefreshToken_token_key" UNIQUE ("token"),
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- Goal
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Goal_title_length" CHECK (char_length("title") >= 3),
    CONSTRAINT "Goal_progress_range" CHECK ("progress" >= 0 AND "progress" <= 100)
);

CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- Task
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "goalId" TEXT,
    "userId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_title_not_empty" CHECK (char_length(trim("title")) >= 1),
    CONSTRAINT "Task_streak_non_negative" CHECK ("streakCount" >= 0)
);

CREATE INDEX "Task_userId_idx" ON "Task"("userId");
CREATE INDEX "Task_goalId_idx" ON "Task"("goalId");

-- Habit
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "frequency" "HabitFrequency" NOT NULL DEFAULT 'DAILY',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Habit_name_not_empty" CHECK (char_length(trim("name")) >= 1),
    CONSTRAINT "Habit_streak_non_negative" CHECK ("streak" >= 0)
);

CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");

-- FinanceRecord
CREATE TABLE "FinanceRecord" (
    "id" TEXT NOT NULL,
    "type" "FinanceType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "note" VARCHAR(500),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FinanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FinanceRecord_amount_positive" CHECK ("amount" > 0),
    CONSTRAINT "FinanceRecord_category_not_empty" CHECK (char_length(trim("category")) >= 1)
);

CREATE INDEX "FinanceRecord_userId_idx" ON "FinanceRecord"("userId");

-- AIInsight
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AIInsightType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AIInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIInsight_message_not_empty" CHECK (char_length(trim("message")) >= 1)
);

CREATE INDEX "AIInsight_userId_idx" ON "AIInsight"("userId");
