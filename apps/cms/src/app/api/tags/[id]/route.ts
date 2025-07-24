import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { tagSchema } from "@/lib/validations/workspace";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const json = await req.json();
  const body = tagSchema.parse(json);

  const tag = await db.tag.update({
    where: {
      id: id,
      workspaceId: sessionData.session.activeOrganizationId,
    },
    data: {
      name: body.name,
      slug: body.slug,
    },
  });

  return NextResponse.json(tag, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionData = await getServerSession();

  if (!sessionData || !sessionData.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const deletedTag = await db.tag.delete({
    where: {
      id: id,
      workspaceId: sessionData.session.activeOrganizationId,
    },
  });

  return NextResponse.json(deletedTag.id, { status: 204 });
}
