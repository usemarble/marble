import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { customFieldUpdateSchema } from "@/lib/validations/fields";

function buildFieldOptionWrites(
  options: Array<{ value: string; label: string }>
) {
  return options.map((option, index) => ({
    value: option.value,
    label: option.label,
    position: index,
  }));
}

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
    include: {
      options: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
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

  const effectiveType = body.data.type ?? existingField.type;
  const effectiveOptions = body.data.options ?? existingField.options;
  const requiresOptions =
    effectiveType === "select" || effectiveType === "multiselect";

  if (requiresOptions && effectiveOptions.length === 0) {
    return NextResponse.json(
      { error: "Select fields must define at least one option" },
      { status: 400 }
    );
  }

  if (!requiresOptions && effectiveOptions.length > 0) {
    return NextResponse.json(
      { error: "Only select and multiselect fields can define options" },
      { status: 400 }
    );
  }

  const field = await db.field.update({
    where: {
      id_workspaceId: {
        id,
        workspaceId: session.session.activeOrganizationId,
      },
    },
    data: {
      ...updateData,
      options:
        body.data.options !== undefined || !requiresOptions
          ? {
              deleteMany: {},
              create: requiresOptions
                ? buildFieldOptionWrites(body.data.options ?? [])
                : [],
            }
          : undefined,
    },
    include: {
      options: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
    },
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
