import { NextResponse } from "next/server";
import sharp from "sharp";
import { getServerSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const compressedBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .resize(1920, undefined, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .toBuffer();

    return NextResponse.json(compressedBuffer, {
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition": `attachment; filename="${file.name.replace(/\.[^/.]+$/, ".webp")}"`,
      },
    });
  } catch (error) {
    console.error("Compression error:", error);
    return NextResponse.json(
      { error: "Failed to compress image" },
      { status: 500 },
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
