import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { ALLOWED_MEDIA_MIME_TYPES, MAX_UPLOAD_SIZE } from "../lib/constants";
import { createDbClient } from "../lib/db";
import {
  extensionFromFile,
  getImageDimensions,
  getMediaType,
  objectKeyFromUrl,
  publicUrl,
  serializeMedia,
} from "../lib/media";
import { requireWorkspaceId } from "../lib/workspace";
import {
  DeleteResponseSchema,
  ErrorSchema,
  ForbiddenSchema,
  NotFoundSchema,
  PageNotFoundSchema,
  ServerErrorSchema,
} from "../schemas/common";
import {
  MediaListResponseSchema,
  MediaParamsSchema,
  MediaQuerySchema,
  MediaResponseSchema,
  UpdateMediaBodySchema,
  UploadMediaBodySchema,
} from "../schemas/media";
import type { ApiKeyApp } from "../types/env";

const media = new OpenAPIHono<ApiKeyApp>();

const listMediaRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Media"],
  summary: "List media assets",
  description: "Retrieve media assets for the authenticated workspace.",
  request: { query: MediaQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: MediaListResponseSchema } },
      description: "Media assets retrieved successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid query parameters",
    },
    404: {
      content: { "application/json": { schema: PageNotFoundSchema } },
      description: "Page number does not exist",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const getMediaRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Media"],
  summary: "Get media asset",
  description: "Retrieve a single media asset by ID.",
  request: { params: MediaParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: MediaResponseSchema } },
      description: "Media asset retrieved successfully",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Media asset not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const updateMediaRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Media"],
  summary: "Update media asset",
  description: "Update media asset metadata. Requires a private API key.",
  request: {
    params: MediaParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateMediaBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: MediaResponseSchema } },
      description: "Media asset updated successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid request body",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Media asset not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const deleteMediaRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Media"],
  summary: "Delete media asset",
  description:
    "Delete a media asset and its R2 object. Requires a private API key.",
  request: { params: MediaParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: DeleteResponseSchema } },
      description: "Media asset deleted successfully",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Media asset not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const uploadMediaRoute = createRoute({
  method: "post",
  path: "/upload",
  tags: ["Media"],
  summary: "Upload media asset",
  description:
    "Upload a media file and create a media asset. Requires a private API key. Maximum file size is 5 MiB.",
  request: {
    body: {
      content: { "multipart/form-data": { schema: UploadMediaBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: MediaResponseSchema } },
      description: "Media asset uploaded successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid upload request",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
    },
    413: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "File exceeds the upload size limit",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

media.openapi(listMediaRoute, async (c) => {
  try {
    const db = createDbClient(c.env);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const query = c.req.valid("query");
    const { limit, page, order, type } = query;
    const skip = (page - 1) * limit;

    const where = {
      workspaceId,
      ...(type ? { type } : {}),
      ...(query.query
        ? {
            OR: [
              { name: { contains: query.query, mode: "insensitive" as const } },
              { alt: { contains: query.query, mode: "insensitive" as const } },
              { url: { contains: query.query, mode: "insensitive" as const } },
              {
                mimeType: {
                  contains: query.query,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const key = cacheKey(workspaceId, "media", "list", hashQueryParams(query));

    const response = await cache.getOrSet(key, async () => {
      const [items, totalItems] = await Promise.all([
        db.media.findMany({
          where,
          orderBy: { createdAt: order },
          skip,
          take: limit,
        }),
        db.media.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);
      return {
        media: items.map(serializeMedia),
        pagination: {
          limit,
          currentPage: page,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
          totalPages,
          totalItems,
        },
      };
    });

    if (
      page > response.pagination.totalPages &&
      response.pagination.totalItems > 0
    ) {
      return c.json(
        {
          error: "Invalid page number" as const,
          details: {
            message: `Page ${page} does not exist.`,
            totalPages: response.pagination.totalPages,
            requestedPage: page,
          },
        },
        404 as const
      );
    }

    return c.json(response, 200 as const);
  } catch (error) {
    console.error("Error fetching media:", error);
    return c.json(
      {
        error: "Failed to fetch media",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

media.openapi(getMediaRoute, async (c) => {
  try {
    const db = createDbClient(c.env);
    const workspaceId = requireWorkspaceId(c);
    const { id } = c.req.valid("param");

    const item = await db.media.findFirst({ where: { id, workspaceId } });
    if (!item) {
      return c.json(
        {
          error: "Media not found",
          message: "The requested media asset does not exist",
        },
        404 as const
      );
    }

    return c.json({ media: serializeMedia(item) }, 200 as const);
  } catch (error) {
    console.error("Error fetching media asset:", error);
    return c.json(
      {
        error: "Failed to fetch media",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

media.openapi(updateMediaRoute, async (c) => {
  try {
    const db = createDbClient(c.env);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");

    const existing = await db.media.findFirst({ where: { id, workspaceId } });
    if (!existing) {
      return c.json(
        {
          error: "Media not found",
          message: "The requested media asset does not exist",
        },
        404 as const
      );
    }

    const updated = await db.media.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.alt !== undefined ? { alt: body.alt } : {}),
      },
    });

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "media"));
    return c.json({ media: serializeMedia(updated) }, 200 as const);
  } catch (error) {
    console.error("Error updating media asset:", error);
    return c.json(
      {
        error: "Failed to update media",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

media.openapi(deleteMediaRoute, async (c) => {
  try {
    const db = createDbClient(c.env);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { id } = c.req.valid("param");

    const existing = await db.media.findFirst({ where: { id, workspaceId } });
    if (!existing) {
      return c.json(
        {
          error: "Media not found",
          message: "The requested media asset does not exist",
        },
        404 as const
      );
    }

    await db.media.delete({ where: { id } });

    const key = objectKeyFromUrl(existing.url);
    if (key) {
      c.executionCtx.waitUntil(c.env.STORAGE.delete(key));
    }
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "media"));

    return c.json({ id }, 200 as const);
  } catch (error) {
    console.error("Error deleting media asset:", error);
    return c.json(
      {
        error: "Failed to delete media",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

media.openapi(uploadMediaRoute, async (c) => {
  try {
    const db = createDbClient(c.env);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const formData = await c.req.formData();
    const file = formData.get("file");
    const isAFile = file instanceof File;

    if (!isAFile) {
      return c.json(
        {
          error: "Invalid upload request",
          message: "A file field is required",
        },
        400 as const
      );
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      return c.json(
        {
          error: "File too large",
          message: `Media uploads are limited to ${MAX_UPLOAD_SIZE / 1024 / 1024} MiB`,
        },
        413 as const
      );
    }

    const contentType = file.type || "application/octet-stream";
    if (
      !(ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(contentType)
    ) {
      return c.json(
        {
          error: "Unsupported file type",
          message: `File type ${contentType} is not allowed`,
        },
        400 as const
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const dimensions = contentType.startsWith("image/")
      ? getImageDimensions(fileBuffer)
      : {};
    const extension = extensionFromFile(file);
    const id = crypto.randomUUID();
    const key = `media/${workspaceId}/${id}.${extension}`;
    const nameField = formData.get("name");
    const altField = formData.get("alt");
    const name =
      typeof nameField === "string" && nameField.trim()
        ? nameField.trim()
        : file.name || `media-${id}`;
    const alt =
      typeof altField === "string" && altField.trim() ? altField.trim() : null;

    await c.env.STORAGE.put(key, fileBuffer, {
      httpMetadata: { contentType },
      customMetadata: {
        workspaceId,
        originalFilename: file.name,
      },
    });

    let created: Awaited<ReturnType<typeof db.media.create>>;
    try {
      created = await db.media.create({
        data: {
          name,
          alt,
          url: publicUrl(c.env.STORAGE_PUBLIC_URL, key),
          size: file.size,
          mimeType: contentType,
          width: dimensions.width,
          height: dimensions.height,
          type: getMediaType(contentType),
          workspaceId,
        },
      });
    } catch (error) {
      await c.env.STORAGE.delete(key);
      throw error;
    }

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "media"));
    return c.json({ media: serializeMedia(created) }, 201 as const);
  } catch (error) {
    console.error("Error uploading media asset:", error);
    return c.json(
      {
        error: "Failed to upload media",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

export default media;
