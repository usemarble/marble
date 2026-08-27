import { db } from "@marble/drizzle";
import { field, fieldOption, fieldValue } from "@marble/drizzle/schema";
import { createRecordId } from "@marble/drizzle/create-id";
import {
  isFieldWorkspaceKeyConflict,
  isPgSerializationFailure,
} from "@marble/drizzle/pg-errors";
import { and, asc, count, eq, ne } from "@marble/drizzle/operators";
import { NextResponse } from "next/server";
import {
  areFieldOptionsEqual,
  buildFieldOptionWrites,
} from "@/lib/fields/helpers";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { customFieldUpdateSchema } from "@/lib/validations/fields";

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

  const existingField = await db.query.field.findFirst({
    where: and(eq(field.id, id), eq(field.workspaceId, workspaceId)),
    with: {
      options: {
        orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
      },
    },
  });

  if (!existingField) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  if (body.data.key && body.data.key !== existingField.key) {
    const keyConflict = await db.query.field.findFirst({
      where: and(
        eq(field.workspaceId, workspaceId),
        eq(field.key, body.data.key),
        ne(field.id, id)
      ),
    });

    if (keyConflict) {
      return NextResponse.json(
        { error: "A field with this key already exists in your workspace" },
        { status: 409 }
      );
    }
  }

  const updateData: Partial<typeof field.$inferInsert> = {};
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
    const updatedFieldId = await db.transaction(
      async (tx) => {
        if (typeChanged || optionsChanged) {
          const [fieldValueCount] = await tx
            .select({ value: count() })
            .from(fieldValue)
            .where(
              and(eq(fieldValue.fieldId, id), eq(fieldValue.workspaceId, workspaceId))
            );

          if ((fieldValueCount?.value ?? 0) > 0) {
            return null;
          }
        }

        const now = new Date();
        const shouldRewriteOptions =
          body.data.options !== undefined || !requiresOptions;

        const [updatedField] = await tx
          .update(field)
          .set({
            ...updateData,
            updatedAt: now,
          })
          .where(and(eq(field.id, id), eq(field.workspaceId, workspaceId)))
          .returning({ id: field.id });

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
      where: eq(field.id, updatedFieldId),
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

  const existingField = await db.query.field.findFirst({
    where: and(eq(field.id, id), eq(field.workspaceId, workspaceId)),
  });

  if (!existingField) {
    return NextResponse.json({ error: "Field not found" }, { status: 404 });
  }

  await db
    .delete(field)
    .where(and(eq(field.id, id), eq(field.workspaceId, workspaceId)));

  return NextResponse.json({ id }, { status: 200 });
}
