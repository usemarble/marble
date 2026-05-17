import { db } from "@marble/db";
import { NextResponse } from "next/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLink = await db.shareLink.findFirst({
    where: {
      token,
      isActive: true,
    },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          content: true,
          contentJson: true,
          description: true,
          coverImage: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          authors: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          workspace: {
            select: {
              id: true,
              name: true,
              logo: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!shareLink) {
    return NextResponse.json(
      { error: "Share link not found" },
      { headers: NO_STORE_HEADERS, status: 404 }
    );
  }

  if (shareLink.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Share link has expired" },
      { headers: NO_STORE_HEADERS, status: 410 }
    );
  }

  return NextResponse.json(
    {
      post: shareLink.post,
      expiresAt: shareLink.expiresAt,
    },
    { headers: NO_STORE_HEADERS }
  );
}
