import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

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
    },
  });

  return NextResponse.json(media, { status: 200 });
}
