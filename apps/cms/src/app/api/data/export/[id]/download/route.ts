import {
  GetObjectCommand,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
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

function streamToResponseBody(stream: unknown): ReadableStream {
  if (stream instanceof ReadableStream) {
    return stream;
  }

  if (
    stream &&
    typeof stream === "object" &&
    "transformToWebStream" in stream &&
    typeof stream.transformToWebStream === "function"
  ) {
    return stream.transformToWebStream();
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

  let object: GetObjectCommandOutput;

  try {
    object = await r2.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: job.storageKey,
      })
    );
  } catch (error) {
    console.error("[Exports] Failed to fetch export file:", error);
    return NextResponse.json(
      { error: "Failed to fetch export file" },
      { headers: { "cache-control": "no-store" }, status: 500 }
    );
  }

  if (!object.Body) {
    return NextResponse.json({ error: "Export file missing" }, { status: 404 });
  }

  const body = streamToResponseBody(object.Body);
  const createdAt = job.createdAt.toISOString().slice(0, 10);
  const filename = `marble-${job.workspace.slug}-export-${createdAt}.zip`;
  const headers = new Headers({
    "cache-control": "no-store",
    "content-disposition": `attachment; filename="${filename}"`,
    "content-type": "application/zip",
  });

  if (object.ContentLength != null) {
    headers.set("content-length", String(object.ContentLength));
  }

  return new Response(body, { headers });
}
