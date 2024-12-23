import { NextResponse } from "next/server";
import prisma from "@repo/db";
import { setActiveWorkspace } from "@/lib/workspace";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const slug = (await params).slug;

  const workspace = await prisma.workspace.findUnique({
    where: { slug: slug },
    select: { id: true, slug: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Update the active workspace in cookies
  setActiveWorkspace(workspace);

  return NextResponse.json(workspace);
}
