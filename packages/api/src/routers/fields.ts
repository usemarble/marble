import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import {
  customFieldSchema,
  customFieldUpdateSchema,
} from "../lib/field-validation";
import {
  createField,
  deleteField,
  FieldError,
  listFields,
  updateField,
} from "../services/fields";

const base = z.object({ workspaceId: z.string().min(1) });
const resource = base.extend({ id: z.string().min(1) });
const optionDto = z.object({
  id: z.string(),
  fieldId: z.string(),
  workspaceId: z.string(),
  value: z.string(),
  label: z.string(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const fieldDto = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  key: z.string(),
  type: z.enum([
    "text",
    "number",
    "boolean",
    "date",
    "richtext",
    "select",
    "multiselect",
  ]),
  required: z.boolean(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  options: z.array(optionDto),
});
const fieldProcedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof FieldError) {
      const code =
        error.status === 404
          ? "NOT_FOUND"
          : error.status === 409
            ? "CONFLICT"
            : error.status === 400
              ? "BAD_REQUEST"
              : "INTERNAL_SERVER_ERROR";
      throw new ORPCError(code, { message: error.message, cause: error });
    }
    throw error;
  }
});

export const fieldsRouter = {
  list: fieldProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/fields",
      tags: ["Fields"],
    })
    .input(base)
    .output(z.array(fieldDto.extend({ hasValues: z.boolean() })))
    .handler(({ context }) => listFields(context, context.workspaceId)),
  create: fieldProcedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/fields",
      tags: ["Fields"],
    })
    .input(customFieldSchema.safeExtend(base.shape))
    .output(fieldDto)
    .handler(({ context, input }) =>
      createField(context, context.workspaceId, input)
    ),
  update: fieldProcedure
    .route({
      method: "PATCH",
      path: "/workspaces/{workspaceId}/fields/{id}",
      tags: ["Fields"],
    })
    .input(customFieldUpdateSchema.safeExtend(resource.shape))
    .output(fieldDto)
    .handler(({ context, input }) =>
      updateField(context, context.workspaceId, input.id, input)
    ),
  delete: fieldProcedure
    .route({
      method: "DELETE",
      path: "/workspaces/{workspaceId}/fields/{id}",
      tags: ["Fields"],
    })
    .input(resource)
    .output(z.object({ id: z.string() }))
    .handler(({ context, input }) =>
      deleteField(context, context.workspaceId, input.id)
    ),
};
