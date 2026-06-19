import { z } from "@hono/zod-openapi";

export const FieldTypeSchema = z
  .enum([
    "text",
    "number",
    "boolean",
    "date",
    "richtext",
    "select",
    "multiselect",
  ])
  .openapi("FieldType");

export const FieldOptionSchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp9012ab34cdefghij" }),
    value: z.string().openapi({ example: "developers" }),
    label: z.string().openapi({ example: "Developers" }),
    position: z.number().int().openapi({ example: 0 }),
    createdAt: z.iso.datetime().openapi({ example: "2024-01-15T10:00:00Z" }),
    updatedAt: z.iso.datetime().openapi({ example: "2024-01-16T12:00:00Z" }),
  })
  .openapi("FieldOption");

export const FieldSchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp7890yz12abcdefg" }),
    key: z.string().openapi({ example: "audience" }),
    name: z.string().openapi({ example: "Audience" }),
    description: z
      .string()
      .nullable()
      .openapi({ example: "Who this post is for" }),
    type: FieldTypeSchema,
    required: z.boolean().openapi({ example: false }),
    position: z.number().int().openapi({ example: 0 }),
    options: z.array(FieldOptionSchema),
    createdAt: z.iso.datetime().openapi({ example: "2024-01-15T10:00:00Z" }),
    updatedAt: z.iso.datetime().openapi({ example: "2024-01-16T12:00:00Z" }),
  })
  .openapi("Field");

export const FieldsListResponseSchema = z
  .object({
    fields: z.array(FieldSchema),
  })
  .openapi("FieldsListResponse");

export const FieldResponseSchema = z
  .object({
    field: FieldSchema,
  })
  .openapi("FieldResponse");

export const FieldOptionInputSchema = z
  .object({
    value: z
      .string()
      .trim()
      .min(1, "Option value cannot be empty")
      .max(80, "Option value cannot be more than 80 characters")
      .openapi({ example: "developers" }),
    label: z
      .string()
      .trim()
      .min(1, "Option label cannot be empty")
      .max(80, "Option label cannot be more than 80 characters")
      .openapi({ example: "Developers" }),
  })
  .openapi("FieldOptionInput");

export const FieldOptionsInputSchema = z
  .array(FieldOptionInputSchema)
  .max(100, "Fields cannot have more than 100 options");

function validateUniqueOptionValues(
  options: Array<{ value: string; label: string }>,
  ctx: z.RefinementCtx
) {
  const seenValues = new Set<string>();

  for (const [index, option] of options.entries()) {
    if (seenValues.has(option.value)) {
      ctx.addIssue({
        code: "custom",
        message: "Option values must be unique",
        path: ["options", index, "value"],
      });
      continue;
    }

    seenValues.add(option.value);
  }
}

function validateFieldOptions(
  type: z.infer<typeof FieldTypeSchema>,
  options: Array<{ value: string; label: string }>,
  ctx: z.RefinementCtx
) {
  const requiresOptions = type === "select" || type === "multiselect";

  if (requiresOptions && options.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Select fields must define at least one option",
      path: ["options"],
    });
  }

  if (!requiresOptions && options.length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "Only select and multiselect fields can define options",
      path: ["options"],
    });
  }

  validateUniqueOptionValues(options, ctx);
}

export const CreateFieldBodySchema = z
  .object({
    key: z
      .string()
      .min(1, "Key cannot be empty")
      .max(50, "Key cannot be more than 50 characters")
      .regex(/^[a-z0-9_]+$/, {
        message:
          "Key can only contain lowercase letters, numbers, and underscores",
      })
      .openapi({ example: "audience" }),
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(50, "Name cannot be more than 50 characters")
      .openapi({ example: "Audience" }),
    description: z
      .string()
      .max(280, "Description cannot be more than 280 characters")
      .optional()
      .openapi({ example: "Who this post is for" }),
    type: FieldTypeSchema,
    required: z.boolean().optional().openapi({ example: false }),
    options: FieldOptionsInputSchema.optional().openapi({
      description:
        "Required for select and multiselect fields. Not allowed for other field types.",
      example: [
        { value: "developers", label: "Developers" },
        { value: "founders", label: "Founders" },
      ],
    }),
  })
  .superRefine((value, ctx) => {
    validateFieldOptions(value.type, value.options ?? [], ctx);
  })
  .openapi("CreateFieldBody");

export const UpdateFieldBodySchema = z
  .object({
    key: z
      .string()
      .min(1, "Key cannot be empty")
      .max(50, "Key cannot be more than 50 characters")
      .regex(/^[a-z0-9_]+$/, {
        message:
          "Key can only contain lowercase letters, numbers, and underscores",
      })
      .optional()
      .openapi({ example: "audience" }),
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(50, "Name cannot be more than 50 characters")
      .optional()
      .openapi({ example: "Audience" }),
    description: z
      .string()
      .max(280, "Description cannot be more than 280 characters")
      .nullable()
      .optional()
      .openapi({ example: "Who this post is for" }),
    type: FieldTypeSchema.optional(),
    required: z.boolean().optional().openapi({ example: false }),
    options: FieldOptionsInputSchema.optional().openapi({
      description:
        "Replacement option list. Only valid for select and multiselect fields.",
      example: [
        { value: "developers", label: "Developers" },
        { value: "founders", label: "Founders" },
      ],
    }),
  })
  .superRefine((value, ctx) => {
    if (value.options !== undefined) {
      validateUniqueOptionValues(value.options, ctx);
    }
  })
  .openapi("UpdateFieldBody");
