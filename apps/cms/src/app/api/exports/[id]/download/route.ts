import { GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { R2_BUCKET_NAME, r2 } from "@/lib/r2";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function streamToArrayBuffer(stream: unknown): Promise<ArrayBuffer> {
  if (stream instanceof ReadableStream) {
    return new Response(stream).arrayBuffer();
  }

  if (
    stream &&
    typeof stream === "object" &&
    "transformToByteArray" in stream &&
    typeof stream.transformToByteArray === "function"
  ) {
    const bytes = await stream.transformToByteArray();
    return bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );
  }

  throw new Error("Unsupported export body stream");
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token");

  const job = await db.exportJob.findUnique({
    where: { id },
    include: {
      workspace: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (!job || job.status !== "ready" || !job.storageKey) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }

  if (job.expiresAt && job.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Export expired" }, { status: 410 });
  }

  if (token) {
    if (
      !job.downloadTokenHash ||
      (await sha256Hex(token)) !== job.downloadTokenHash
    ) {
      return NextResponse.json(
        { error: "Invalid download token" },
        { status: 403 }
      );
    }
  } else {
    const accessData = await requireActiveWorkspaceAccess();

    if (!accessData.ok) {
      return accessData.response;
    }

    if (accessData.workspaceId !== job.workspaceId) {
      return NextResponse.json({ error: "Export not found" }, { status: 404 });
    }
  }

  const object = await r2.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: job.storageKey,
    })
  );

  if (!object.Body) {
    return NextResponse.json({ error: "Export file missing" }, { status: 404 });
  }

  const body = await streamToArrayBuffer(object.Body);
  const createdAt = job.createdAt.toISOString().slice(0, 10);
  const filename = `marble-${job.workspace.slug}-export-${createdAt}.zip`;

  return new Response(body, {
    headers: {
      "content-disposition": `attachment; filename="${filename}"`,
      "content-length": String(body.byteLength),
      "content-type": "application/zip",
    },
  });
}
