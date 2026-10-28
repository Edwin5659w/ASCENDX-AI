-- DropIndex
DROP INDEX "user_achievements_user_id_achievement_code_idx";

-- AlterTable
ALTER TABLE "recurring_transactions" ADD COLUMN     "account_id" UUID,
ADD COLUMN     "anchor_day" SMALLINT;

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_code_key" ON "user_achievements"("user_id", "achievement_code");

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

