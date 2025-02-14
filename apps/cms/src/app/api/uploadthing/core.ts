import getServerSession from "@/lib/auth/session";
import db from "@marble/db";
import { type FileRouter, createUploadthing } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter: FileRouter = {
  posts: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const sessionInfo = await getServerSession();
      if (!sessionInfo) throw new UploadThingError("Unauthorized");
      return {
        userId: sessionInfo.user.id,
        orgId: sessionInfo.session.activeOrganizationId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await db.media.create({
          data: {
            name: file.name,
            url: file.url,
            size: file.size,
            workspaceId: metadata.orgId as string,
          },
        });
      } catch (error) {
        console.error("Error saving media to database", error);
      }
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
