-- AlterTable
ALTER TABLE "ai_messages" ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "app_settings" ADD COLUMN     "ai_monthly_token_limit" INTEGER NOT NULL DEFAULT 2000000;

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "provider" VARCHAR(30) NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_user_id_kind_created_at_idx" ON "ai_usage"("user_id", "kind", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage"("created_at");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
