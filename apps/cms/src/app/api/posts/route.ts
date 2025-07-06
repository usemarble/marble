import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const posts = await db.post.findMany({
    where: { workspaceId: sessionData.session?.activeOrganizationId as string },
    select: {
      id: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(posts, { status: 200 });
}
