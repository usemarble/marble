import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { R2_BUCKET_NAME, r2 } from "@/lib/r2";
import { uploadSchema, validateUpload } from "@/lib/validations/upload";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsedBody = uploadSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { type, fileType, fileSize } = parsedBody.data;

  try {
    validateUpload({ type, fileType });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid file type";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const id = nanoid(6);
  const extension = fileType.split("/")[1];
  const sluggedId = id.toLocaleLowerCase();
  let key: string;

  switch (type) {
    case "avatar":
      key = `avatars/avatar-${sluggedId}.${extension}`;
      break;
    case "logo":
      key = `logos/logo-${sluggedId}.${extension}`;
      break;
    case "media":
      key = `media/media-${sluggedId}.${extension}`;
      break;
    default:
      return NextResponse.json(
        { error: "Invalid upload type" },
        { status: 400 },
      );
  }

  const presignedUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
    }),
    { expiresIn: 3600 },
  );

  return NextResponse.json({ url: presignedUrl, key });
}
