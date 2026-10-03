import "server-only";

import { db } from "@marble/db";
import { field, fieldOption, fieldValue } from "@marble/db/schema";
import { asc, count, eq } from "drizzle-orm";
import type { CustomField } from "@/types/fields";

export async function getDashboardCustomFields(
  workspaceId: string
): Promise<CustomField[]> {
  const [fields, valueCounts] = await Promise.all([
    db.query.field.findMany({
      where: eq(field.workspaceId, workspaceId),
      with: {
        options: {
          orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
        },
      },
      orderBy: [asc(field.position), asc(field.createdAt)],
    }),
    db
      .select({
        fieldId: fieldValue.fieldId,
        count: count(),
      })
      .from(fieldValue)
      .where(eq(fieldValue.workspaceId, workspaceId))
      .groupBy(fieldValue.fieldId),
  ]);

  const valueCountByFieldId = new Map(
    valueCounts.map((entry) => [entry.fieldId, entry.count])
  );

  return fields.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    key: entry.key,
    type: entry.type,
    required: entry.required,
    position: entry.position,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    options: entry.options.map((option) => ({
      ...option,
      createdAt: option.createdAt.toISOString(),
      updatedAt: option.updatedAt.toISOString(),
    })),
    hasValues: (valueCountByFieldId.get(entry.id) ?? 0) > 0,
  }));
}
