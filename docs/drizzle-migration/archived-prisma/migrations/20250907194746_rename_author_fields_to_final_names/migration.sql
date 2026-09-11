/*
  Rename author fields to final names:
  - Rename newPrimaryAuthorId to primaryAuthorId
  - Update foreign key constraint names
*/

-- Drop the old foreign key constraint
ALTER TABLE "public"."post" DROP CONSTRAINT "post_newPrimaryAuthorId_fkey";

-- Rename the column
ALTER TABLE "public"."post" RENAME COLUMN "newPrimaryAuthorId" TO "primaryAuthorId";

-- Add the new foreign key constraint with the renamed column
ALTER TABLE "public"."post" ADD CONSTRAINT "post_primaryAuthorId_fkey" FOREIGN KEY ("primaryAuthorId") REFERENCES "public"."author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
