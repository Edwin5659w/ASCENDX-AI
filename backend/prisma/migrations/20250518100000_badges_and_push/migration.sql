-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushToken" TEXT;

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed badges (idempotente)
INSERT INTO "Badge" ("id", "title", "subtitle", "sortOrder") VALUES
  ('FIRST_TASK', 'En marcha', 'Primera tarea completada', 1),
  ('STREAK_7', 'Constancia', 'Racha de 7 días o más', 2),
  ('GOALS_3', 'Visionario', '3 o más objetivos creados', 3),
  ('LEVEL_5', 'Ascenso', 'Alcanza el nivel 5', 4),
  ('STEEL', 'Acero', '3 hábitos y racha 3+', 5),
  ('XP_500', 'Veterano', '500 XP totales', 6)
ON CONFLICT ("id") DO NOTHING;

-- Seed catalog badges (idempotent)
INSERT INTO "Badge" ("id", "title", "subtitle", "sortOrder") VALUES
('FIRST_TASK', 'En marcha', 'Primera tarea completada', 1),
('STREAK_7', 'Constancia', 'Racha de 7 días o más', 2),
('GOALS_3', 'Visionario', '3 o más objetivos creados', 3),
('LEVEL_5', 'Ascenso', 'Alcanza el nivel 5', 4),
('STEEL', 'Acero', '3 hábitos y racha 3+', 5),
('XP_500', 'Veterano', '500 XP totales', 6)
ON CONFLICT ("id") DO NOTHING;
