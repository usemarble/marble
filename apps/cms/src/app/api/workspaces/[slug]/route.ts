import { db } from "@marble/db";
import { NextResponse } from "next/server";
import getServerSession from "@/lib/auth/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;

  const sessionData = await getServerSession();

  if (!sessionData) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspace = await db.organization.findUnique({
    where: { slug: slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      createdAt: true,
      members: {
        select: {
          id: true,
          role: true,
          organizationId: true,
          createdAt: true,
          userId: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      invitations: true,
      subscription: {
        select: {
          id: true,
          status: true,
          plan: true,
        },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json(workspace);
}
