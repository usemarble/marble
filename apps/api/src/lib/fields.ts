import { sanitizeHtml } from "@marble/utils/sanitize";
import { z } from "zod";

export const CustomFieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

export const CustomFieldsBodySchema = z.record(
  z.string(),
  CustomFieldValueSchema
);

export type CustomFieldInputValue = z.infer<typeof CustomFieldValueSchema>;
export type CustomFieldsInput = z.infer<typeof CustomFieldsBodySchema>;

/** Field definition shape required to validate and write post custom fields. */
export interface FieldDefinition {
  id: string;
  key: string;
  name: string;
  type: string;
  required: boolean;
  options?: Array<{
    value: string;
    label: string;
  }>;
}

/** Normalized field value ready to be persisted in the field_value table. */
export interface FieldValueWrite {
  fieldId: string;
  fieldType: string;
  value: string | null;
}

/** Public API error body returned when custom field validation fails. */
export interface CustomFieldValidationError {
  error: string;
  message: string;
  fields?: Array<{
    key: string;
    message: string;
  }>;
  key?: string;
  type?: string;
  invalidValues?: string[];
}

type ResolveMode = "create" | "update";

const DateFieldSchema = z.iso.datetime({ offset: true }).or(z.iso.date());

/** Returns true when rich text HTML has no meaningful visible text content. */
function isRichTextContentEmpty(content: string) {
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

/** Builds a type-specific message for values that do not match a field type. */
function invalidTypeMessage(field: FieldDefinition) {
  switch (field.type) {
    case "number":
      return "Number fields must be numbers.";
    case "boolean":
      return "Boolean fields must be booleans.";
    case "multiselect":
      return "Multiselect fields must be arrays of option values.";
    default:
      return `${field.name} must match the configured field type.`;
  }
}

/**
 * Validates one custom field input value and converts it into the string/null
 * representation stored by FieldValue.
 */
function validateFieldValue(
  field: FieldDefinition,
  rawValue: CustomFieldInputValue | undefined
):
  | { success: true; value: string | null }
  | { success: false; message: string; invalidValues?: string[] } {
  if (rawValue === undefined || rawValue === null) {
    return field.required
      ? { success: false, message: `${field.name} is required.` }
      : { success: true, value: null };
  }

  if (field.type === "multiselect") {
    if (!Array.isArray(rawValue)) {
      return { success: false, message: invalidTypeMessage(field) };
    }

    if (rawValue.length === 0) {
      return field.required
        ? { success: false, message: `${field.name} is required.` }
        : { success: true, value: null };
    }

    const allowedValues = new Set(
      (field.options ?? []).map((option) => option.value)
    );
    const invalidValues = rawValue.filter((value) => !allowedValues.has(value));

    if (invalidValues.length > 0) {
      return {
        success: false,
        message: "Selected values must match the configured options.",
        invalidValues,
      };
    }

    return { success: true, value: JSON.stringify([...new Set(rawValue)]) };
  }

  if (Array.isArray(rawValue)) {
    return { success: false, message: invalidTypeMessage(field) };
  }

  switch (field.type) {
    case "text": {
      if (typeof rawValue !== "string") {
        return { success: false, message: "Text fields must be strings." };
      }

      const value = rawValue.trim();
      if (value === "") {
        return field.required
          ? { success: false, message: `${field.name} is required.` }
          : { success: true, value: null };
      }

      return { success: true, value };
    }
    case "number": {
      if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
        return { success: false, message: invalidTypeMessage(field) };
      }

      return { success: true, value: String(rawValue) };
    }
    case "boolean": {
      if (typeof rawValue !== "boolean") {
        return { success: false, message: invalidTypeMessage(field) };
      }

      return { success: true, value: rawValue ? "true" : "false" };
    }
    case "date": {
      if (typeof rawValue !== "string") {
        return {
          success: false,
          message: "Date fields must be ISO 8601 strings.",
        };
      }

      const value = rawValue.trim();
      if (value === "") {
        return field.required
          ? { success: false, message: `${field.name} is required.` }
          : { success: true, value: null };
      }

      const result = DateFieldSchema.safeParse(value);
      if (!result.success) {
        return {
          success: false,
          message: "Date fields must be ISO 8601 dates or datetimes.",
        };
      }

      return { success: true, value };
    }
    case "richtext": {
      if (typeof rawValue !== "string") {
        return {
          success: false,
          message: "Rich text fields must be HTML strings.",
        };
      }

      const sanitized = sanitizeHtml(rawValue).trim();
      if (sanitized === "" || isRichTextContentEmpty(sanitized)) {
        return field.required
          ? { success: false, message: `${field.name} is required.` }
          : { success: true, value: null };
      }

      return { success: true, value: sanitized };
    }
    case "select": {
      if (typeof rawValue !== "string") {
        return {
          success: false,
          message: "Select fields must be option value strings.",
        };
      }

      const value = rawValue.trim();
      if (value === "") {
        return field.required
          ? { success: false, message: `${field.name} is required.` }
          : { success: true, value: null };
      }

      const allowedValues = new Set(
        (field.options ?? []).map((option) => option.value)
      );
      if (!allowedValues.has(value)) {
        return {
          success: false,
          message: "Selected value must match a configured option.",
          invalidValues: [value],
        };
      }

      return { success: true, value };
    }
    default:
      return {
        success: false,
        message: `${field.name} has an unsupported field type.`,
      };
  }
}

/**
 * Resolves API-provided custom field values by field key.
 *
 * Create mode validates every workspace field so required fields must be
 * present. Update mode validates only provided keys so omitted fields remain
 * unchanged. This function never creates fields or options implicitly.
 */
export function resolveCustomFieldValuesByKey(
  fields: FieldDefinition[],
  input: CustomFieldsInput | undefined,
  mode: ResolveMode
):
  | { success: true; values: FieldValueWrite[] }
  | { success: false; error: CustomFieldValidationError } {
  const values: FieldValueWrite[] = [];
  const json = input ?? {};
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const invalidKeys = Object.keys(json).filter((key) => !fieldsByKey.has(key));

  if (invalidKeys.length > 0) {
    return {
      success: false,
      error: {
        error: "Invalid custom fields",
        message: "One or more custom fields do not exist in this workspace.",
        fields: invalidKeys.map((key) => ({
          key,
          message: "Field does not exist.",
        })),
      },
    };
  }

  const fieldsToValidate =
    mode === "create"
      ? fields
      : Object.keys(json)
          .map((key) => fieldsByKey.get(key))
          .filter((field) => field !== undefined);

  for (const field of fieldsToValidate) {
    const rawValue = Object.hasOwn(json, field.key)
      ? json[field.key]
      : undefined;
    const validation = validateFieldValue(field, rawValue);

    if (!validation.success) {
      return {
        success: false,
        error: {
          error: "Invalid custom field value",
          key: field.key,
          type: field.type,
          message: validation.message,
          ...(validation.invalidValues
            ? { invalidValues: validation.invalidValues }
            : {}),
        },
      };
    }

    values.push({
      fieldId: field.id,
      fieldType: field.type,
      value: validation.value,
    });
  }

  return { success: true, values };
}
