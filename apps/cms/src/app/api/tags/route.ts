import getServerSession from "@/lib/auth/session";
import db from "@marble/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const tags = await db.tag.findMany({
    where: { workspaceId: session.session?.activeOrganizationId as string },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json(tags, { status: 200 });
}
