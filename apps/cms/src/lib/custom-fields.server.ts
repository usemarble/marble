import "server-only";

import type { TransactionClient } from "@marble/db";
import { createRecordId, db } from "@marble/db";
import { field, fieldOption, fieldValue } from "@marble/db/schema";
import { sanitizeRichTextHtml } from "@marble/utils/sanitize";
import { and, asc, eq } from "drizzle-orm";
import { resolveCustomFieldValues } from "@/lib/custom-fields";

export async function buildCustomFieldWrites(
  workspaceId: string,
  input: Record<string, string | null | undefined>
): Promise<ReturnType<typeof resolveCustomFieldValues>> {
  const fields = await db.query.field.findMany({
    where: eq(field.workspaceId, workspaceId),
    columns: {
      id: true,
      key: true,
      name: true,
      type: true,
      required: true,
    },
    with: {
      options: {
        columns: {
          value: true,
          label: true,
        },
        orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
      },
    },
  });

  const normalizedInput: Record<string, string | null | undefined> = {
    ...input,
  };
  for (const fieldRow of fields) {
    if (!(fieldRow.id in normalizedInput)) {
      normalizedInput[fieldRow.id] = undefined;
    }
  }

  return resolveCustomFieldValues(fields, normalizedInput);
}

export async function writeCustomFieldValues(
  tx: TransactionClient,
  workspaceId: string,
  postId: string,
  writes: Extract<
    Awaited<ReturnType<typeof resolveCustomFieldValues>>,
    { success: true }
  >
) {
  if (writes.values.length === 0) {
    return;
  }

  const now = new Date();

  await Promise.all(
    writes.values.map(async ({ fieldId, fieldType, value }) => {
      if (value === null) {
        await tx
          .delete(fieldValue)
          .where(
            and(
              eq(fieldValue.postId, postId),
              eq(fieldValue.fieldId, fieldId),
              eq(fieldValue.workspaceId, workspaceId)
            )
          );
        return;
      }

      const storedValue =
        fieldType === "richtext" ? sanitizeRichTextHtml(value) : value;

      await tx
        .insert(fieldValue)
        .values({
          id: createRecordId(),
          postId,
          fieldId,
          workspaceId,
          value: storedValue,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [fieldValue.postId, fieldValue.fieldId],
          set: {
            workspaceId,
            value: storedValue,
            updatedAt: now,
          },
        });
    })
  );
}
