import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validations/workspace";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();

  if (!sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const json = await req.json();
  const body = categorySchema.parse(json);

  const category = await db.category.update({
    where: {
      id,
      workspaceId: sessionData.session.activeOrganizationId,
    },
    data: {
      name: body.name,
      slug: body.slug,
    },
  });

  return NextResponse.json(category, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionData = await getServerSession();

  if (!sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const deletedCategory = await db.category.delete({
    where: {
      id,
      workspaceId: sessionData.session.activeOrganizationId,
    },
  });

  return NextResponse.json(deletedCategory.id, { status: 204 });
}
