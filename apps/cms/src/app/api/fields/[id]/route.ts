import { db } from "@marble/db";
import { Prisma } from "@marble/db/browser";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
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

function areFieldOptionsEqual(
  nextOptions: Array<{ value: string; label: string }>,
  currentOptions: Array<{ value: string; label: string }>
) {
  if (nextOptions.length !== currentOptions.length) {
    return false;
  }

  return nextOptions.every((option, index) => {
    const currentOption = currentOptions[index];
    return (
      currentOption !== undefined &&
      option.value === currentOption.value &&
      option.label === currentOption.label
    );
  });
}

function isUniqueConstraintError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Error & {
    code?: string;
    meta?: { target?: unknown };
  };

  if (candidate.code !== "P2002") {
    return false;
  }

  const target = candidate.meta?.target;

  return (
    Array.isArray(target) &&
    target.includes("workspaceId") &&
    target.includes("key")
  );
}

function isTransactionConflict(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { code?: string }).code === "P2034"
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

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
      workspaceId,
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
        workspaceId,
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
  const existingOptions = existingField.options.map((option) => ({
    value: option.value,
    label: option.label,
  }));
  const typeChanged =
    body.data.type !== undefined && body.data.type !== existingField.type;
  const optionsChanged =
    body.data.options !== undefined &&
    !areFieldOptionsEqual(body.data.options, existingOptions);

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

  try {
    const field = await db.$transaction(
      async (tx) => {
        if (typeChanged || optionsChanged) {
          const fieldValueCount = await tx.fieldValue.count({
            where: {
              fieldId: id,
              workspaceId,
            },
          });

          if (fieldValueCount > 0) {
            return null;
          }
        }

        return tx.field.update({
          where: {
            id_workspaceId: {
              id,
              workspaceId,
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (!field) {
      return NextResponse.json(
        {
          error:
            "This field already has saved values. You can't change its type or options.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(field, { status: 200 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "A field with this key already exists in your workspace" },
        { status: 409 }
      );
    }

    if (isTransactionConflict(error)) {
      return NextResponse.json(
        {
          error:
            "This field was updated concurrently. Please retry your changes.",
        },
        { status: 409 }
      );
    }

    throw error;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { workspaceId } = accessData;

  const { id } = await params;

  const existingField = await db.field.findFirst({
    where: {
      id,
      workspaceId,
    },
  });

  if (!existingField) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  await db.field.delete({
    where: {
      id_workspaceId: {
        id,
        workspaceId,
      },
    },
  });

  return NextResponse.json({ id }, { status: 200 });
}
