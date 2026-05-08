import { z } from "@hono/zod-openapi";

export const buildStatusFilter = (status: "published" | "draft" | "all") =>
  status === "all"
    ? { status: { in: ["published", "draft"] as ("published" | "draft")[] } }
    : { status };

function castFieldValue(
  value: string,
  type: string
): string | number | boolean | string[] | null {
  switch (type) {
    case "number": {
      const num = Number.parseFloat(value);
      return Number.isNaN(num) ? null : num;
    }
    case "boolean":
      return value === "true";
    case "multiselect":
      try {
        return z.array(z.string()).parse(JSON.parse(value));
      } catch {
        return null;
      }
    default:
      return value;
  }
}

export function buildFieldsObject(
  fieldValues: Array<{
    value: string;
    field: { key: string; type: string };
  }>,
  allFields?: Array<{ key: string; type: string }>
): Record<string, string | number | boolean | string[] | null> {
  const result: Record<string, string | number | boolean | string[] | null> =
    {};

  if (allFields) {
    for (const field of allFields) {
      result[field.key] = null;
    }
  }

  for (const fieldValue of fieldValues) {
    result[fieldValue.field.key] = castFieldValue(
      fieldValue.value,
      fieldValue.field.type
    );
  }

  return result;
}
