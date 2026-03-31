import { z } from "zod";

export const fieldTypeEnum = z.enum([
  "text",
  "number",
  "boolean",
  "date",
  "richtext",
  "select",
  "multiselect",
]);

export const fieldOptionSchema = z.object({
  value: z
    .string()
    .trim()
    .min(1, { message: "Option value cannot be empty" })
    .max(80, { message: "Option value cannot be more than 80 characters" }),
  label: z
    .string()
    .trim()
    .min(1, { message: "Option label cannot be empty" })
    .max(80, { message: "Option label cannot be more than 80 characters" }),
});

export const fieldOptionsSchema = z
  .array(fieldOptionSchema)
  .max(100, { message: "Fields cannot have more than 100 options" });

function validateFieldOptions(
  type: FieldType,
  options: Array<{ value: string; label: string }>,
  ctx: z.RefinementCtx
) {
  const requiresOptions = type === "select" || type === "multiselect";

  if (requiresOptions && options.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select fields must define at least one option",
      path: ["options"],
    });
  }

  if (!requiresOptions && options.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Only select and multiselect fields can define options",
      path: ["options"],
    });
  }

  const seenValues = new Set<string>();

  for (const [index, option] of options.entries()) {
    if (seenValues.has(option.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Option values must be unique",
        path: ["options", index, "value"],
      });
      continue;
    }

    seenValues.add(option.value);
  }
}

export const customFieldSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Name cannot be empty" })
      .max(50, { message: "Name cannot be more than 50 characters" }),
    description: z
      .string()
      .max(280, { message: "Description cannot be more than 280 characters" })
      .optional(),
    key: z
      .string()
      .min(1, { message: "Key cannot be empty" })
      .max(50, { message: "Key cannot be more than 50 characters" })
      .regex(/^[a-z0-9_]+$/, {
        message:
          "Key can only contain lowercase letters, numbers, and underscores",
      }),
    type: fieldTypeEnum,
    required: z.boolean().optional(),
    options: fieldOptionsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    validateFieldOptions(value.type, value.options ?? [], ctx);
  });

export type CustomFieldFormValues = z.infer<typeof customFieldSchema>;

export const customFieldUpdateSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name cannot be empty" })
    .max(50, { message: "Name cannot be more than 50 characters" })
    .optional(),
  description: z
    .string()
    .max(280, { message: "Description cannot be more than 280 characters" })
    .optional(),
  key: z
    .string()
    .min(1, { message: "Key cannot be empty" })
    .max(50, { message: "Key cannot be more than 50 characters" })
    .regex(/^[a-z0-9_]+$/, {
      message:
        "Key can only contain lowercase letters, numbers, and underscores",
    })
    .optional(),
  type: fieldTypeEnum.optional(),
  required: z.boolean().optional(),
  options: fieldOptionsSchema.optional(),
});

export type CustomFieldUpdateValues = z.infer<typeof customFieldUpdateSchema>;

export type FieldType = z.infer<typeof fieldTypeEnum>;
export type FieldOptionInput = z.infer<typeof fieldOptionSchema>;
