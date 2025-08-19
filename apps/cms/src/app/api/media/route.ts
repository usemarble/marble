import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

const ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME;
const ENDPOINT = process.env.CLOUDFLARE_S3_ENDPOINT;

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME || !ENDPOINT) {
  throw new Error("Missing Cloudflare R2 environment variables");
}

const bucketName = BUCKET_NAME;
const endpoint = ENDPOINT;

const s3Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const media = await db.media.findMany({
    where: { workspaceId: sessionData.session?.activeOrganizationId as string },
    select: {
      id: true,
      name: true,
      url: true,
      createdAt: true,
      type: true,
      size: true,
    },
  });

  return NextResponse.json(media, { status: 200 });
}

export async function DELETE(request: Request) {
  const sessionInfo = await getServerSession();
  if (!sessionInfo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mediaId } = await request.json();

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
  }

  try {
    const media = await db.media.findUnique({
      where: {
        id: mediaId,
        workspaceId: sessionInfo.session.activeOrganizationId as string,
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: media.name,
      }),
    );

    const deletedMedia = await db.media.delete({
      where: {
        id: mediaId,
      },
    });

    return NextResponse.json({ success: true, id: deletedMedia.id });
  } catch (error) {
    console.error("Error deleting media:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete media";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
