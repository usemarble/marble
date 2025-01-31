import getServerSession from "@/lib/auth/session";
import db from "@repo/db";
import { NextResponse } from "next/server";

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
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      invitations: true,
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  return NextResponse.json(workspace);
}
