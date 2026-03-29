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

export const customFieldSchema = z.object({
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
});

export type CustomFieldUpdateValues = z.infer<typeof customFieldUpdateSchema>;

export type FieldType = z.infer<typeof fieldTypeEnum>;
