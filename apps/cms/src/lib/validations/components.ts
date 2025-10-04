import { z } from "zod";
import { MAX_COMPONENT_PROPERTIES } from "../constants";

const propertyTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "date",
  "email",
  "url",
  "textarea",
  "select",
]);

const selectOptionSchema = z.object({
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
});

const componentPropertySchema = z.object({
  name: z
    .string()
    .min(1, "Property name is required")
    .max(50, "Property name is too long"),
  type: propertyTypeSchema,
  required: z.boolean().default(false),
  defaultValue: z.string().max(500, "Default value is too long").optional(),
  options: z.array(selectOptionSchema).optional(),
});

export const componentSchema = z.object({
  name: z
    .string()
    .min(1, "Component name is required")
    .max(100, "Component name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  properties: z
    .array(componentPropertySchema)
    .max(
      MAX_COMPONENT_PROPERTIES,
      `Maximum of ${MAX_COMPONENT_PROPERTIES} properties allowed per component`
    ),
});

export const componentUpdateSchema = componentSchema.partial();

export type ComponentValues = z.infer<typeof componentSchema>;
export type ComponentPropertyValues = z.infer<typeof componentPropertySchema>;
