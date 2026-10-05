import { createRecordId } from "@marble/db/id";
import {
  isFieldWorkspaceKeyConflict,
  isPgSerializationFailure,
} from "@marble/db/pg-errors";
import { field, fieldOption, fieldValue } from "@marble/db/schema";
import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import type { ServiceContext } from "../context";
import type {
  CustomFieldFormValues,
  CustomFieldUpdateValues,
} from "../lib/field-validation";
import { transact } from "../lib/transaction";

export class FieldError extends Error {
  status: 400 | 404 | 409 | 500;
  constructor(status: 400 | 404 | 409 | 500, message: string) {
    super(message);
    this.status = status;
  }
}

const keyConflict = "A field with this key already exists in your workspace";
const orderOptions = [asc(fieldOption.position), asc(fieldOption.createdAt)];

function dto(
  row: typeof field.$inferSelect & {
    options: (typeof fieldOption.$inferSelect)[];
  }
) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    key: row.key,
    type: row.type,
    required: row.required,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    options: row.options.map((option) => ({
      id: option.id,
      fieldId: option.fieldId,
      workspaceId: option.workspaceId,
      value: option.value,
      label: option.label,
      position: option.position,
      createdAt: option.createdAt.toISOString(),
      updatedAt: option.updatedAt.toISOString(),
    })),
  };
}

export async function listFields(ctx: ServiceContext, workspaceId: string) {
  const [rows, counts] = await Promise.all([
    ctx.db.query.field.findMany({
      where: eq(field.workspaceId, workspaceId),
      with: { options: { orderBy: orderOptions } },
      orderBy: [asc(field.position), asc(field.createdAt)],
    }),
    ctx.db
      .select({ fieldId: fieldValue.fieldId, count: count() })
      .from(fieldValue)
      .where(eq(fieldValue.workspaceId, workspaceId))
      .groupBy(fieldValue.fieldId),
  ]);
  const values = new Map(counts.map((entry) => [entry.fieldId, entry.count]));
  return rows.map((row) => ({
    ...dto(row),
    hasValues: (values.get(row.id) ?? 0) > 0,
  }));
}

async function getField(ctx: ServiceContext, workspaceId: string, id: string) {
  const row = await ctx.db.query.field.findFirst({
    where: and(eq(field.id, id), eq(field.workspaceId, workspaceId)),
    with: { options: { orderBy: orderOptions } },
  });
  if (!row) {
    throw new FieldError(404, "Field not found");
  }
  return row;
}

function optionWrites(
  options: Array<{ value: string; label: string }>,
  fieldId: string,
  workspaceId: string,
  now: Date
) {
  return options.map((option, position) => ({
    id: createRecordId(),
    fieldId,
    workspaceId,
    value: option.value,
    label: option.label,
    position,
    updatedAt: now,
  }));
}

export async function createField(
  ctx: ServiceContext,
  workspaceId: string,
  body: CustomFieldFormValues
) {
  const existing = await ctx.db.query.field.findFirst({
    where: and(eq(field.workspaceId, workspaceId), eq(field.key, body.key)),
  });
  if (existing) {
    throw new FieldError(409, keyConflict);
  }
  const [maxRow] = await ctx.db
    .select({ position: field.position })
    .from(field)
    .where(eq(field.workspaceId, workspaceId))
    .orderBy(desc(field.position))
    .limit(1);
  const id = createRecordId();
  const now = new Date();
  try {
    await transact(ctx, async ({ tx, invalidate }) => {
      await tx.insert(field).values({
        id,
        name: body.name,
        description: body.description?.trim() || null,
        key: body.key,
        type: body.type,
        required: body.required ?? false,
        position: (maxRow?.position ?? -1) + 1,
        workspaceId,
        updatedAt: now,
      });
      const options = optionWrites(body.options ?? [], id, workspaceId, now);
      if (options.length) {
        await tx.insert(fieldOption).values(options);
      }
      invalidate(workspaceId, "fields");
    });
  } catch (error) {
    if (isFieldWorkspaceKeyConflict(error)) {
      throw new FieldError(409, keyConflict);
    }
    throw error;
  }
  return dto(await getField(ctx, workspaceId, id));
}

export async function updateField(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  body: CustomFieldUpdateValues
) {
  const current = await getField(ctx, workspaceId, id);
  if (body.key && body.key !== current.key) {
    const conflict = await ctx.db.query.field.findFirst({
      where: and(
        eq(field.workspaceId, workspaceId),
        eq(field.key, body.key),
        ne(field.id, id)
      ),
    });
    if (conflict) {
      throw new FieldError(409, keyConflict);
    }
  }
  const type = body.type ?? current.type;
  const options = body.options ?? current.options;
  const needsOptions = type === "select" || type === "multiselect";
  if (needsOptions && options.length === 0) {
    throw new FieldError(400, "Select fields must define at least one option");
  }
  if (!needsOptions && options.length > 0) {
    throw new FieldError(
      400,
      "Only select and multiselect fields can define options"
    );
  }
  const typeChanged = body.type !== undefined && body.type !== current.type;
  const optionsChanged =
    body.options !== undefined &&
    (body.options.length !== current.options.length ||
      body.options.some(
        (option, i) =>
          option.value !== current.options[i]?.value ||
          option.label !== current.options[i]?.label
      ));
  try {
    const result = await transact(ctx, async ({ tx, invalidate }) => {
      await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
      if (typeChanged || optionsChanged) {
        const [values] = await tx
          .select({ value: count() })
          .from(fieldValue)
          .where(
            and(
              eq(fieldValue.fieldId, id),
              eq(fieldValue.workspaceId, workspaceId)
            )
          );
        if ((values?.value ?? 0) > 0) {
          return false;
        }
      }
      const now = new Date();
      const [updated] = await tx
        .update(field)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && {
            description: body.description.trim() || null,
          }),
          ...(body.key !== undefined && { key: body.key }),
          ...(body.type !== undefined && { type: body.type }),
          ...(body.required !== undefined && { required: body.required }),
          updatedAt: now,
        })
        .where(and(eq(field.id, id), eq(field.workspaceId, workspaceId)))
        .returning({ id: field.id });
      if (!updated) {
        return false;
      }
      if (body.options !== undefined || !needsOptions) {
        await tx
          .delete(fieldOption)
          .where(
            and(
              eq(fieldOption.fieldId, id),
              eq(fieldOption.workspaceId, workspaceId)
            )
          );
        const next = needsOptions
          ? optionWrites(body.options ?? [], id, workspaceId, now)
          : [];
        if (next.length) {
          await tx.insert(fieldOption).values(next);
        }
      }
      invalidate(workspaceId, "fields");
      return true;
    });
    if (!result) {
      throw new FieldError(
        400,
        "This field already has saved values. You can't change its type or options."
      );
    }
  } catch (error) {
    if (isFieldWorkspaceKeyConflict(error)) {
      throw new FieldError(409, keyConflict);
    }
    if (isPgSerializationFailure(error)) {
      throw new FieldError(
        409,
        "This field was updated concurrently. Please retry your changes."
      );
    }
    throw error;
  }
  return dto(await getField(ctx, workspaceId, id));
}

export async function deleteField(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  await getField(ctx, workspaceId, id);
  await transact(ctx, async ({ tx, invalidate }) => {
    await tx
      .delete(field)
      .where(and(eq(field.id, id), eq(field.workspaceId, workspaceId)));
    invalidate(workspaceId, "fields");
  });
  return { id };
}
