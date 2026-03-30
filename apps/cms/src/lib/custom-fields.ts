import { z } from "zod";
import type { FieldType } from "@/lib/validations/fields";

export const customFieldsPayloadSchema = z.record(
  z.string(),
  z.union([z.string(), z.null(), z.undefined()])
);

export type CustomFieldPayload = z.infer<typeof customFieldsPayloadSchema>;

export interface CustomFieldValidationDefinition {
  id: string;
  key: string;
  name: string;
  type: FieldType;
  required: boolean;
}

export const SUPPORTED_CUSTOM_FIELD_TYPES = new Set<FieldType>([
  "text",
  "number",
  "boolean",
  "date",
  "richtext",
]);

export function isRichTextContentEmpty(content: string) {
  const plainText = content
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?(p|div|li|ul|ol)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return plainText.length === 0;
}

const fieldValueSchemas = {
  text: z.string(),
  number: z.coerce.number(),
  boolean: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => value === "true" || value === "false", {
      message: "Boolean fields must be true or false",
    })
    .transform((value) => value === "true"),
  date: z.iso.datetime({ offset: true }).or(z.iso.date()),
  richtext: z.string(),
  select: z.string(),
  multiselect: z.string(),
} as const satisfies Record<FieldType, z.ZodType>;

export function normalizeCustomFieldValue(
  type: FieldType,
  value: string
): { success: true; value: string } | { success: false; message: string } {
  const result = fieldValueSchemas[type].safeParse(value);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? "Invalid field value",
    };
  }

  if (type === "number") {
    return { success: true, value: String(result.data) };
  }

  if (type === "boolean") {
    return { success: true, value: result.data ? "true" : "false" };
  }

  return { success: true, value: String(result.data).trim() };
}

export function validateCustomFieldValue(
  field: CustomFieldValidationDefinition,
  rawValue: string | null | undefined
):
  | { success: true; value: string | null }
  | { success: false; message: string } {
  if (rawValue == null) {
    return field.required
      ? { success: false, message: `${field.name} is required` }
      : { success: true, value: null };
  }

  const trimmedValue = rawValue.trim();

  if (
    trimmedValue === "" ||
    (field.type === "richtext" && isRichTextContentEmpty(trimmedValue))
  ) {
    return field.required
      ? { success: false, message: `${field.name} is required` }
      : { success: true, value: null };
  }

  const normalized = normalizeCustomFieldValue(field.type, trimmedValue);

  if (!normalized.success) {
    return normalized;
  }

  return { success: true, value: normalized.value };
}

export function resolveCustomFieldValues(
  fields: CustomFieldValidationDefinition[],
  input: Record<string, string | null | undefined>
):
  | {
      success: true;
      values: Array<{
        fieldId: string;
        fieldType: FieldType;
        value: string | null;
      }>;
    }
  | { success: false; error: Record<string, unknown> } {
  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const fieldIds = Object.keys(input);
  const invalidIds = fieldIds.filter((fieldId) => !fieldsById.has(fieldId));

  if (invalidIds.length > 0) {
    return {
      success: false,
      error: {
        error: "Invalid field IDs",
        invalidIds,
      },
    };
  }

  const values: Array<{
    fieldId: string;
    fieldType: FieldType;
    value: string | null;
  }> = [];

  for (const fieldId of fieldIds) {
    const field = fieldsById.get(fieldId);

    if (!field) {
      continue;
    }

    const validation = validateCustomFieldValue(field, input[fieldId]);

    if (!validation.success) {
      return {
        success: false,
        error: {
          error: "Invalid field value",
          fieldId,
          key: field.key,
          name: field.name,
          type: field.type,
          message: validation.message,
        },
      };
    }

    values.push({
      fieldId,
      fieldType: field.type,
      value: validation.value,
    });
  }

  return { success: true, values };
}
