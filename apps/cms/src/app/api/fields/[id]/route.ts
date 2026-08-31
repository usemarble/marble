import {
  createRecordId,
  db,
  isFieldWorkspaceKeyConflict,
  isPgSerializationFailure,
} from "@marble/drizzle";
import {
  fieldOption,
  field as fieldTable,
  fieldValue,
} from "@marble/drizzle/schema";
import { and, asc, count, eq, ne } from "drizzle-orm";
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

  const field = await db.query.field.findFirst({
    where: and(eq(fieldTable.id, id), eq(fieldTable.workspaceId, workspaceId)),
    with: {
      options: {
        orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
      },
    },
  });

  if (!field) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  if (body.data.key && body.data.key !== field.key) {
    const keyConflict = await db.query.field.findFirst({
      where: and(
        eq(fieldTable.workspaceId, workspaceId),
        eq(fieldTable.key, body.data.key),
        ne(fieldTable.id, id)
      ),
    });

    if (keyConflict) {
      return NextResponse.json(
        { error: "A field with this key already exists in your workspace" },
        { status: 409 }
      );
    }
  }

  const updateData: Partial<typeof fieldTable.$inferInsert> = {};
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

  const effectiveType = body.data.type ?? field.type;
  const effectiveOptions = body.data.options ?? field.options;
  const requiresOptions =
    effectiveType === "select" || effectiveType === "multiselect";
  const existingOptions = field.options.map((option) => ({
    value: option.value,
    label: option.label,
  }));
  const typeChanged =
    body.data.type !== undefined && body.data.type !== field.type;
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
    const updatedFieldId = await db.transaction(
      async (tx) => {
        if (typeChanged || optionsChanged) {
          const [fieldValueCount] = await tx
            .select({ value: count() })
            .from(fieldValue)
            .where(
              and(
                eq(fieldValue.fieldId, id),
                eq(fieldValue.workspaceId, workspaceId)
              )
            );

          if ((fieldValueCount?.value ?? 0) > 0) {
            return null;
          }
        }

        const now = new Date();
        const shouldRewriteOptions =
          body.data.options !== undefined || !requiresOptions;

        const [updatedField] = await tx
          .update(fieldTable)
          .set({
            ...updateData,
            updatedAt: now,
          })
          .where(
            and(eq(fieldTable.id, id), eq(fieldTable.workspaceId, workspaceId))
          )
          .returning({ id: fieldTable.id });

        if (!updatedField) {
          return null;
        }

        if (shouldRewriteOptions) {
          await tx.delete(fieldOption).where(eq(fieldOption.fieldId, id));

          const nextOptions = requiresOptions
            ? buildFieldOptionWrites(body.data.options ?? [])
            : [];

          if (nextOptions.length > 0) {
            await tx.insert(fieldOption).values(
              nextOptions.map((option) => ({
                id: createRecordId(),
                fieldId: id,
                workspaceId,
                value: option.value,
                label: option.label,
                position: option.position,
                updatedAt: now,
              }))
            );
          }
        }

        return updatedField.id;
      },
      { isolationLevel: "serializable" }
    );

    if (!updatedFieldId) {
      return NextResponse.json(
        {
          error:
            "This field already has saved values. You can't change its type or options.",
        },
        { status: 400 }
      );
    }

    const fieldWithOptions = await db.query.field.findFirst({
      where: eq(fieldTable.id, updatedFieldId),
      with: {
        options: {
          orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
        },
      },
    });

    if (!fieldWithOptions) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json(fieldWithOptions, { status: 200 });
  } catch (error) {
    if (isFieldWorkspaceKeyConflict(error)) {
      return NextResponse.json(
        { error: "A field with this key already exists in your workspace" },
        { status: 409 }
      );
    }

    if (isPgSerializationFailure(error)) {
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

  const field = await db.query.field.findFirst({
    where: and(eq(fieldTable.id, id), eq(fieldTable.workspaceId, workspaceId)),
  });

  if (!field) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  await db
    .delete(fieldTable)
    .where(and(eq(fieldTable.id, id), eq(fieldTable.workspaceId, workspaceId)));

  return NextResponse.json({ id }, { status: 200 });
}
