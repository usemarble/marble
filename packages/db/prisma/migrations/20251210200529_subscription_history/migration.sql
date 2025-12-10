/*
  Warnings:

  - The values [team] on the enum `PlanType` will be removed. If these variants are still used in the database, this will fail.

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
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."SubscriptionStatus" ADD VALUE 'incomplete';
ALTER TYPE "public"."SubscriptionStatus" ADD VALUE 'incomplete_expired';
ALTER TYPE "public"."SubscriptionStatus" ADD VALUE 'unpaid';
ALTER TYPE "public"."SubscriptionStatus" ADD VALUE 'canceled';

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
