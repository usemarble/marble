import { auth } from "@/lib/auth/auth";
import getServerSession from "@/lib/auth/session";
import { getActiveOrganization } from "@/lib/queries/workspace";
import db from "@marble/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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
