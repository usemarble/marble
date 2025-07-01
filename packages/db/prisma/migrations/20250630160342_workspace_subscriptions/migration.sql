/*
  Warnings:

  - The values [FREE,STARTER,PRO] on the enum `PlanType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,CANCELLED,EXPIRED] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `expiresAt` on the `subscription` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workspaceId]` on the table `subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[polarId]` on the table `subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currentPeriodEnd` to the `subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currentPeriodStart` to the `subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `polarId` to the `subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlanType_new" AS ENUM ('team', 'pro');
ALTER TABLE "subscription" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "subscription" ALTER COLUMN "plan" TYPE "PlanType_new" USING ("plan"::text::"PlanType_new");
ALTER TYPE "PlanType" RENAME TO "PlanType_old";
ALTER TYPE "PlanType_new" RENAME TO "PlanType";
DROP TYPE "PlanType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('active', 'cancelled', 'expired');
ALTER TABLE "subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";
ALTER TABLE "subscription" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- DropIndex
DROP INDEX "subscription_userId_key";

-- AlterTable
ALTER TABLE "subscription" DROP COLUMN "expiresAt",
DROP COLUMN "startedAt",
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canceledAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "currentPeriodStart" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "polarId" TEXT NOT NULL,
ADD COLUMN     "workspaceId" TEXT NOT NULL,
ALTER COLUMN "plan" DROP DEFAULT,
ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateIndex
CREATE UNIQUE INDEX "subscription_workspaceId_key" ON "subscription"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_polarId_key" ON "subscription"("polarId");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
