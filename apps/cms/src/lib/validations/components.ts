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
  technicalName: z
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

export function createPropertyValueSchema(
  propertyType: z.infer<typeof propertyTypeSchema>,
  isRequired: boolean
) {
  let schema: z.ZodTypeAny;

  switch (propertyType) {
    case "boolean":
      schema = z.boolean({
        required_error: "Boolean value is required",
        invalid_type_error: "Value must be a boolean",
      });
      break;

    case "number":
      schema = z.coerce
        .number({
          required_error: "Number is required",
          invalid_type_error: "Value must be a number",
        })
        .finite("Number must be finite");
      break;

    case "date":
      schema = z.coerce.date({
        required_error: "Date is required",
        invalid_type_error: "Value must be a valid date",
      });
      break;

    case "email":
      schema = z
        .string({
          required_error: "Email is required",
          invalid_type_error: "Value must be a string",
        })
        .email("Value must be a valid email address");
      break;

    case "url":
      schema = z
        .string({
          required_error: "URL is required",
          invalid_type_error: "Value must be a string",
        })
        .url("Value must be a valid URL");
      break;

    default:
      schema = z.string({
        required_error: "Value is required",
        invalid_type_error: "Value must be a string",
      });
      break;
  }

  return isRequired ? schema : schema.optional();
}

export function validatePropertyValue(
  value: unknown,
  propertyType: z.infer<typeof propertyTypeSchema>,
  isRequired: boolean
) {
  const schema = createPropertyValueSchema(propertyType, isRequired);
  return schema.safeParse(value);
}

export function validateComponentProperties(
  properties: Array<{ name: string; type: string; required: boolean }>,
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const property of properties) {
    const value = values[property.name];
    const result = validatePropertyValue(
      value,
      property.type as z.infer<typeof propertyTypeSchema>,
      property.required
    );

    if (!result.success) {
      errors[property.name] =
        result.error.issues[0]?.message ?? "Invalid value";
    }
  }

  return errors;
}
