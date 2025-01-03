import { setActiveWorkspace } from "@/lib/auth/workspace";
import prisma from "@repo/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;

  const workspace = await prisma.organization.findUnique({
    where: { slug: slug },
    select: { id: true, slug: true, name: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Update the active workspace in cookies
  // setActiveWorkspace(workspace);

  return NextResponse.json(workspace);
}
