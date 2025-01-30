import db from "@repo/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;

  const workspace = await db.organization.findUnique({
    where: { slug: slug },
    include: {
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
