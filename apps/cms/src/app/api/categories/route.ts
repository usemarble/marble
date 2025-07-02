import { db } from "@marble/db";
import { NextResponse } from "next/server";
import getServerSession from "@/lib/auth/session";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const categories = await db.category.findMany({
    where: { workspaceId: session.session.activeOrganizationId as string },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json(categories, { status: 200 });
}
