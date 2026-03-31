import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { customFieldUpdateSchema } from "@/lib/validations/fields";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });
  }

  const { id } = await params;

  const json = await req.json();
  const body = customFieldUpdateSchema.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: body.error.issues },
      { status: 400 }
    );
  }

  // Verify field exists and belongs to workspace
  const existingField = await db.field.findFirst({
    where: {
      id,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  if (!existingField) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  // If key is being changed, check uniqueness
  if (body.data.key && body.data.key !== existingField.key) {
    const keyConflict = await db.field.findFirst({
      where: {
        workspaceId: session.session.activeOrganizationId,
        key: body.data.key,
        id: { not: id },
      },
    });

    if (keyConflict) {
      return NextResponse.json(
        { error: "A field with this key already exists in your workspace" },
        { status: 409 }
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (body.data.name !== undefined) {
    updateData.name = body.data.name;
  }
  if (body.data.description !== undefined) {
    updateData.description = body.data.description.trim() || null;
  }
  if (body.data.key !== undefined) {
    updateData.key = body.data.key;
  }
  if (body.data.type !== undefined) {
    updateData.type = body.data.type;
  }
  if (body.data.required !== undefined) {
    updateData.required = body.data.required;
  }

  const field = await db.field.update({
    where: {
      id_workspaceId: {
        id,
        workspaceId: session.session.activeOrganizationId,
      },
    },
    data: updateData,
  });

  return NextResponse.json(field, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });
  }

  const { id } = await params;

  const existingField = await db.field.findFirst({
    where: {
      id,
      workspaceId: session.session.activeOrganizationId,
    },
  });

  if (!existingField) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  await db.field.delete({
    where: {
      id_workspaceId: {
        id,
        workspaceId: session.session.activeOrganizationId,
      },
    },
  });

  return NextResponse.json({ id }, { status: 200 });
}
