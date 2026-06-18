import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { deleteJsonApi, readJsonApi, writeJsonApi } from "@/lib/api";
import { toolResult } from "@/lib/mcp";
import {
  destructiveAnnotations,
  identifierInput,
  readOnlyAnnotations,
} from "./shared";

const fieldType = z.enum([
  "text",
  "number",
  "boolean",
  "date",
  "richtext",
  "select",
  "multiselect",
]);

const fieldOption = z.object({
  value: z
    .string()
    .min(1)
    .describe("Stable option value used in post field payloads."),
  label: z.string().min(1).describe("Human-readable option label."),
});

const fieldBody = {
  key: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .describe(
      "Stable field key, using lowercase letters, numbers, and underscores."
    ),
  name: z.string().min(1).describe("Display name."),
  description: z.string().optional().describe("Optional field description."),
  type: fieldType.describe("Custom field type."),
  required: z
    .boolean()
    .optional()
    .describe("Whether posts must set this field."),
  options: z
    .array(fieldOption)
    .optional()
    .describe(
      "Required for select and multiselect fields. Not allowed for other field types."
    ),
};

const updateFieldBody = {
  key: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .optional()
    .describe("Updated stable field key."),
  name: z.string().min(1).optional().describe("Updated display name."),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("Updated field description. Use null to clear it."),
  type: fieldType.optional().describe("Updated field type."),
  required: z.boolean().optional().describe("Updated required flag."),
  options: z
    .array(fieldOption)
    .optional()
    .describe("Replacement options for select and multiselect fields."),
};

export function registerFieldTools(
  server: McpServer,
  apiBaseUrl: string,
  apiKey: string
) {
  server.registerTool(
    "get_fields",
    {
      title: "Get Fields",
      description:
        "Get all custom field definitions. Use this before writing post fields so you can use valid field keys and option values.",
      annotations: readOnlyAnnotations,
      inputSchema: {},
    },
    async () => toolResult(await readJsonApi(apiBaseUrl, apiKey, "/v1/fields"))
  );

  server.registerTool(
    "get_field",
    {
      title: "Get Field",
      description: "Get a single custom field definition by ID or key.",
      annotations: readOnlyAnnotations,
      inputSchema: identifierInput,
    },
    async ({ identifier }) =>
      toolResult(
        await readJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/fields/${encodeURIComponent(identifier)}`
        )
      )
  );

  server.registerTool(
    "create_field",
    {
      title: "Create Field",
      description:
        "Create a custom field definition. Requires a private Marble API key. Create fields before using their keys in create_post or update_post.",
      inputSchema: {
        body: z.object(fieldBody),
      },
    },
    async ({ body }) =>
      toolResult(
        await writeJsonApi(apiBaseUrl, apiKey, "POST", "/v1/fields", body)
      )
  );

  server.registerTool(
    "update_field",
    {
      title: "Update Field",
      description:
        "Update a custom field by ID or key. Type and options cannot be changed after values have been saved. Requires a private Marble API key.",
      annotations: destructiveAnnotations,
      inputSchema: {
        ...identifierInput,
        body: z.object(updateFieldBody),
      },
    },
    async ({ identifier, body }) =>
      toolResult(
        await writeJsonApi(
          apiBaseUrl,
          apiKey,
          "PATCH",
          `/v1/fields/${encodeURIComponent(identifier)}`,
          body
        )
      )
  );

  server.registerTool(
    "delete_field",
    {
      title: "Delete Field",
      description:
        "Delete a custom field by ID or key. This also deletes saved values for that field. Requires a private Marble API key.",
      annotations: destructiveAnnotations,
      inputSchema: identifierInput,
    },
    async ({ identifier }) =>
      toolResult(
        await deleteJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/fields/${encodeURIComponent(identifier)}`
        )
      )
  );
}
