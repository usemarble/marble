import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

  try {
    const metrics = await db.$transaction(async (tx) => {
      const [totalPosts, publishedPosts, drafts, tags, categories] =
        await Promise.all([
          tx.post.count({
            where: { workspaceId },
          }),
          tx.post.count({
            where: {
              workspaceId,
              status: "published",
            },
          }),
          tx.post.count({
            where: {
              workspaceId,
              status: "draft",
            },
          }),
          tx.tag.count({
            where: { workspaceId },
          }),
          tx.category.count({
            where: { workspaceId },
          }),
        ]);

      return {
        totalPosts,
        publishedPosts,
        drafts,
        tags,
        categories,
      };
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching workspace metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace metrics" },
      { status: 500 },
    );
  }
}
