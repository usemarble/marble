/*
  Warnings:

  - The values [team] on the enum `PlanType` will be removed. If these variants are still used in the database, this will fail.
  - The values [cancelled] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."SubscriptionRecurringInterval" AS ENUM ('day', 'week', 'month', 'year');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PlanType_new" AS ENUM ('hobby', 'pro');
ALTER TABLE "public"."subscription" ALTER COLUMN "plan" TYPE "public"."PlanType_new" USING ("plan"::text::"public"."PlanType_new");
ALTER TYPE "public"."PlanType" RENAME TO "PlanType_old";
ALTER TYPE "public"."PlanType_new" RENAME TO "PlanType";
DROP TYPE "public"."PlanType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."SubscriptionStatus_new" AS ENUM ('active', 'expired', 'trialing', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'canceled');
ALTER TABLE "public"."subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."subscription" ALTER COLUMN "status" TYPE "public"."SubscriptionStatus_new" USING ("status"::text::"public"."SubscriptionStatus_new");
ALTER TYPE "public"."SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "public"."SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "public"."SubscriptionStatus_old";
COMMIT;

-- DropIndex
DROP INDEX "public"."subscription_workspaceId_key";

-- AlterTable
ALTER TABLE "public"."invitation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."subscription" ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "discountId" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "recurringInterval" "public"."SubscriptionRecurringInterval" NOT NULL DEFAULT 'month',
ADD COLUMN     "startedAt" TIMESTAMP(3),
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "cancelAtPeriodEnd" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "subscription_workspaceId_status_idx" ON "public"."subscription"("workspaceId", "status");
