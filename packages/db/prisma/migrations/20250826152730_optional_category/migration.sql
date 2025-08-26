-- DropForeignKey
ALTER TABLE "post" DROP CONSTRAINT "post_categoryId_fkey";

-- AlterTable
ALTER TABLE "post" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
