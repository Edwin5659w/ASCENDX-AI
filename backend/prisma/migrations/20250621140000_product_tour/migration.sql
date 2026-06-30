-- Tour guiado post-onboarding (Duolingo-style)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "productTourDone" BOOLEAN NOT NULL DEFAULT false;

-- Usuarios que ya completaron onboarding antes del tour no lo ven de nuevo
UPDATE "User" SET "productTourDone" = true WHERE "onboardingDone" = true AND "productTourDone" = false;
