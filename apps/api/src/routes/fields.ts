import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createCacheClient } from "@/lib/cache";
import { createDbClient } from "@/lib/db";
import { requireWorkspaceId } from "@/lib/workspace";
import {
  ConflictSchema,
  DeleteResponseSchema,
  ErrorSchema,
  ForbiddenSchema,
  IdentifierParamSchema,
  NotFoundSchema,
  ServerErrorSchema,
} from "@/schemas/common";
import {
  CreateFieldBodySchema,
  FieldResponseSchema,
  FieldsListResponseSchema,
  UpdateFieldBodySchema,
} from "@/schemas/fields";
import type { ApiKeyApp } from "@/types/env";

function formatValidationPath(path: PropertyKey[]) {
  return path.length > 0 ? path.join(".") : "body";
}

const fields = new OpenAPIHono<ApiKeyApp>({
  defaultHook: (result, c) => {
    if (result.success) {
      return;
    }

    return c.json(
      {
        error: "Invalid request body",
        message: "Validation failed",
        details: result.error.issues.map((issue) => ({
          field: formatValidationPath(issue.path),
          message: issue.message,
        })),
      },
      400
    );
  },
});

const FieldParamsSchema = z.object({
  identifier: IdentifierParamSchema.openapi({
    example: "audience",
    description: "Field ID or key",
  }),
});

function buildFieldOptionWrites(
  options: Array<{ value: string; label: string }>
) {
  return options.map((option, index) => ({
    value: option.value,
    label: option.label,
    position: index,
  }));
}

function areFieldOptionsEqual(
  nextOptions: Array<{ value: string; label: string }>,
  currentOptions: Array<{ value: string; label: string }>
) {
  if (nextOptions.length !== currentOptions.length) {
    return false;
  }

  return nextOptions.every((option, index) => {
    const currentOption = currentOptions[index];
    return (
      currentOption !== undefined &&
      option.value === currentOption.value &&
      option.label === currentOption.label
    );
  });
}

function isUniqueFieldKeyConflict(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { code?: string }).code === "P2002"
  );
}

const listFieldsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Fields"],
  summary: "List fields",
  description: "Get all custom field definitions for the workspace.",
  responses: {
    200: {
      content: { "application/json": { schema: FieldsListResponseSchema } },
      description: "List of custom field definitions",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const getFieldRoute = createRoute({
  method: "get",
  path: "/{identifier}",
  tags: ["Fields"],
  summary: "Get field",
  description: "Get a single custom field definition by ID or key.",
  request: {
    params: FieldParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: FieldResponseSchema } },
      description: "The requested field definition",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Field not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const createFieldRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Fields"],
  summary: "Create field",
  description: "Create a custom field definition. Requires a private API key.",
  request: {
    body: {
      content: { "application/json": { schema: CreateFieldBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: FieldResponseSchema } },
      description: "Field created successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid request body",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "API key missing the required field write scope",
    },
    409: {
      content: { "application/json": { schema: ConflictSchema } },
      description: "Field with this key already exists",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const updateFieldRoute = createRoute({
  method: "patch",
  path: "/{identifier}",
  tags: ["Fields"],
  summary: "Update field",
  description:
    "Update a custom field definition by ID or key. Type and options cannot be changed after values have been saved.",
  request: {
    params: FieldParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateFieldBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: FieldResponseSchema } },
      description: "Field updated successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid request body or unsafe schema change",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "API key missing the required field write scope",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Field not found",
    },
    409: {
      content: { "application/json": { schema: ConflictSchema } },
      description: "Field key conflict",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const deleteFieldRoute = createRoute({
  method: "delete",
  path: "/{identifier}",
  tags: ["Fields"],
  summary: "Delete field",
  description:
    "Delete a custom field definition by ID or key. Requires a private API key.",
  request: {
    params: FieldParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeleteResponseSchema } },
      description: "Field deleted successfully",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "API key missing the required field write scope",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Field not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

fields.openapi(listFieldsRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = createDbClient(c.env);

    const fieldList = await db.field.findMany({
      where: { workspaceId },
      include: {
        options: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    return c.json({ fields: fieldList }, 200 as const);
  } catch (error) {
    console.error("Error fetching fields:", error);
    return c.json(
      {
        error: "Failed to fetch fields",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

fields.openapi(getFieldRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = createDbClient(c.env);
    const { identifier } = c.req.valid("param");

    const field = await db.field.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { key: identifier }],
      },
      include: {
        options: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!field) {
      return c.json(
        {
          error: "Field not found",
          message: "The requested custom field does not exist",
        },
        404 as const
      );
    }

    return c.json({ field }, 200 as const);
  } catch (error) {
    console.error("Error fetching field:", error);
    return c.json({ error: "Failed to fetch field" }, 500 as const);
  }
});

fields.openapi(createFieldRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = createDbClient(c.env);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const body = c.req.valid("json");

    const existing = await db.field.findFirst({
      where: {
        workspaceId,
        key: body.key,
      },
    });

    if (existing) {
      return c.json(
        {
          error: "Field key already in use",
          message: "A field with this key already exists in this workspace",
        },
        409 as const
      );
    }

    const maxPosition = await db.field.aggregate({
      where: { workspaceId },
      _max: { position: true },
    });

    const field = await db.field.create({
      data: {
        key: body.key,
        name: body.name,
        description: body.description?.trim() || null,
        type: body.type,
        required: body.required ?? false,
        position: (maxPosition._max.position ?? -1) + 1,
        workspaceId,
        options:
          (body.options ?? []).length > 0
            ? { create: buildFieldOptionWrites(body.options ?? []) }
            : undefined,
      },
      include: {
        options: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "fields"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    return c.json({ field }, 201 as const);
  } catch (error) {
    if (isUniqueFieldKeyConflict(error)) {
      return c.json(
        {
          error: "Field key already in use",
          message: "A field with this key already exists in this workspace",
        },
        409 as const
      );
    }

    console.error("Error creating field:", error);
    return c.json(
      {
        error: "Failed to create field",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

fields.openapi(updateFieldRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = createDbClient(c.env);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");
    const body = c.req.valid("json");

    const existingField = await db.field.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { key: identifier }],
      },
      include: {
        options: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!existingField) {
      return c.json(
        {
          error: "Field not found",
          message: "The requested custom field does not exist",
        },
        404 as const
      );
    }

    const effectiveType = body.type ?? existingField.type;
    const existingOptions = existingField.options.map((option) => ({
      value: option.value,
      label: option.label,
    }));
    const effectiveOptions = body.options ?? existingOptions;
    const requiresOptions =
      effectiveType === "select" || effectiveType === "multiselect";

    if (requiresOptions && effectiveOptions.length === 0) {
      return c.json(
        {
          error: "Invalid field options",
          message: "Select fields must define at least one option",
        },
        400 as const
      );
    }

    if (!requiresOptions && effectiveOptions.length > 0) {
      return c.json(
        {
          error: "Invalid field options",
          message: "Only select and multiselect fields can define options",
        },
        400 as const
      );
    }

    const typeChanged =
      body.type !== undefined && body.type !== existingField.type;
    const optionsChanged =
      body.options !== undefined &&
      !areFieldOptionsEqual(body.options, existingOptions);

    if (body.key && body.key !== existingField.key) {
      const keyConflict = await db.field.findFirst({
        where: {
          workspaceId,
          key: body.key,
          id: { not: existingField.id },
        },
      });

      if (keyConflict) {
        return c.json(
          {
            error: "Field key already in use",
            message: "A field with this key already exists in this workspace",
          },
          409 as const
        );
      }
    }

    const field = await db.$transaction(async (tx) => {
      if (typeChanged || optionsChanged) {
        const fieldValueCount = await tx.fieldValue.count({
          where: {
            fieldId: existingField.id,
            workspaceId,
          },
        });

        if (fieldValueCount > 0) {
          return null;
        }
      }

      return tx.field.update({
        where: {
          id_workspaceId: {
            id: existingField.id,
            workspaceId,
          },
        },
        data: {
          ...(body.key !== undefined ? { key: body.key } : {}),
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.description !== undefined
            ? { description: body.description?.trim() || null }
            : {}),
          ...(body.type !== undefined ? { type: body.type } : {}),
          ...(body.required !== undefined ? { required: body.required } : {}),
          options:
            body.options !== undefined || !requiresOptions
              ? {
                  deleteMany: {},
                  create: requiresOptions
                    ? buildFieldOptionWrites(effectiveOptions)
                    : [],
                }
              : undefined,
        },
        include: {
          options: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          },
        },
      });
    });

    if (!field) {
      return c.json(
        {
          error: "Unsafe field change",
          message:
            "This field already has saved values. You can't change its type or options.",
        },
        400 as const
      );
    }

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "fields"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    return c.json({ field }, 200 as const);
  } catch (error) {
    if (isUniqueFieldKeyConflict(error)) {
      return c.json(
        {
          error: "Field key already in use",
          message: "A field with this key already exists in this workspace",
        },
        409 as const
      );
    }

    console.error("Error updating field:", error);
    return c.json(
      {
        error: "Failed to update field",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

fields.openapi(deleteFieldRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = createDbClient(c.env);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");

    const existingField = await db.field.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { key: identifier }],
      },
      select: { id: true },
    });

    if (!existingField) {
      return c.json(
        {
          error: "Field not found",
          message: "The requested custom field does not exist",
        },
        404 as const
      );
    }

    await db.field.delete({
      where: {
        id_workspaceId: {
          id: existingField.id,
          workspaceId,
        },
      },
    });

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "fields"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    return c.json({ id: existingField.id }, 200 as const);
  } catch (error) {
    console.error("Error deleting field:", error);
    return c.json(
      {
        error: "Failed to delete field",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

export default fields;
