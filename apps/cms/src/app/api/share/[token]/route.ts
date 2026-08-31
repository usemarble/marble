import { db } from "@marble/drizzle";
import { shareLink } from "@marble/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLinkRow = await db.query.shareLink.findFirst({
    where: and(eq(shareLink.token, token), eq(shareLink.isActive, true)),
    with: {
      post: {
        columns: {
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
        },
        with: {
          authors: {
            with: {
              author: {
                columns: {
                  id: true,
                  name: true,
                  image: true,
                  bio: true,
                },
              },
            },
          },
          category: {
            columns: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            with: {
              tag: {
                columns: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          workspace: {
            columns: {
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

  if (!shareLinkRow) {
    return NextResponse.json(
      { error: "Share link not found" },
      { headers: NO_STORE_HEADERS, status: 404 }
    );
  }

  if (shareLinkRow.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Share link has expired" },
      { headers: NO_STORE_HEADERS, status: 410 }
    );
  }

  const { post: postRow } = shareLinkRow;

  return NextResponse.json(
    {
      post: {
        id: postRow.id,
        title: postRow.title,
        content: postRow.content,
        contentJson: postRow.contentJson,
        description: postRow.description,
        coverImage: postRow.coverImage,
        status: postRow.status,
        createdAt: postRow.createdAt,
        updatedAt: postRow.updatedAt,
        publishedAt: postRow.publishedAt,
        authors: postRow.authors.map((entry) => entry.author),
        category: postRow.category,
        tags: postRow.tags.map((entry) => entry.tag),
        workspace: postRow.workspace,
      },
      expiresAt: shareLinkRow.expiresAt,
    },
    { headers: NO_STORE_HEADERS }
  );
}
