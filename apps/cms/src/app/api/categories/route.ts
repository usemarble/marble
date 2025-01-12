import getServerSession from "@/lib/auth/session";
import { getActiveOrganization } from "@/lib/queries/workspace";
import db from "@repo/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const activeOrg = await getActiveOrganization(session.user.id);

  const categories = await db.category.findMany({
    where: { workspaceId: activeOrg?.id },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json(categories, { status: 200 });
}
