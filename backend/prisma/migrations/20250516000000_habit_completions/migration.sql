-- Habit completions + onboarding flag
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingDone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "lastCompletedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "HabitCompletion" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HabitCompletion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HabitCompletion_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE,
    CONSTRAINT "HabitCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "HabitCompletion_habitId_completedDate_key" ON "HabitCompletion"("habitId", "completedDate");
CREATE INDEX IF NOT EXISTS "HabitCompletion_userId_idx" ON "HabitCompletion"("userId");
CREATE INDEX IF NOT EXISTS "HabitCompletion_habitId_idx" ON "HabitCompletion"("habitId");
