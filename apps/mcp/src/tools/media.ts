import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  deleteJsonApi,
  readJsonApi,
  uploadMediaApi,
  validateApiKey,
  writeJsonApi,
} from "@/lib/api";
import { toolResult } from "@/lib/mcp";
import {
  assertPrivateApiKey,
  fetchRemoteMedia,
  filenameFromUrl,
} from "@/lib/media";
import {
  destructiveAnnotations,
  paginationInput,
  readOnlyAnnotations,
} from "./shared";

const mediaType = z.enum(["image", "video", "audio", "document"]);

const mediaIdentifierInput = {
  id: z.string().min(1).describe("Media asset ID."),
};

const updateMediaBody = {
  name: z.string().min(1).optional().describe("Updated media display name."),
  alt: z
    .string()
    .nullable()
    .optional()
    .describe("Updated image alt text. Use null to clear it."),
};

export function registerMediaTools(
  server: McpServer,
  apiBaseUrl: string,
  apiKey: string
) {
  server.registerTool(
    "get_media",
    {
      title: "Get Media",
      description: "Get a paginated list of media assets.",
      annotations: readOnlyAnnotations,
      inputSchema: {
        ...paginationInput,
        order: z.enum(["asc", "desc"]).optional().describe("Sort order."),
        type: mediaType.optional().describe("Filter by media type."),
        query: z
          .string()
          .optional()
          .describe("Search by name, alt text, URL, or MIME type."),
      },
    },
    async (params) =>
      toolResult(await readJsonApi(apiBaseUrl, apiKey, "/v1/media", params))
  );

  server.registerTool(
    "get_media_asset",
    {
      title: "Get Media Asset",
      description: "Get a single media asset by ID.",
      annotations: readOnlyAnnotations,
      inputSchema: mediaIdentifierInput,
    },
    async ({ id }) =>
      toolResult(
        await readJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/media/${encodeURIComponent(id)}`
        )
      )
  );

  server.registerTool(
    "upload_media_from_url",
    {
      title: "Upload Media From URL",
      description:
        "Fetch a remote file URL and upload it to Marble. Requires a private Marble API key. The Marble API currently accepts files up to 5 MiB.",
      inputSchema: {
        url: z.url().describe("Remote file URL to fetch and upload."),
        filename: z
          .string()
          .min(1)
          .optional()
          .describe("Optional filename to use for the uploaded asset."),
      },
    },
    async ({ url, filename }) => {
      assertPrivateApiKey(apiKey);
      await validateApiKey(apiBaseUrl, apiKey);

      const blob = await fetchRemoteMedia(url);
      return toolResult(
        await uploadMediaApi(
          apiBaseUrl,
          apiKey,
          blob,
          filename ?? filenameFromUrl(url)
        )
      );
    }
  );

  server.registerTool(
    "update_media",
    {
      title: "Update Media",
      description:
        "Update media asset metadata. Requires a private Marble API key.",
      annotations: destructiveAnnotations,
      inputSchema: {
        ...mediaIdentifierInput,
        body: z.object(updateMediaBody),
      },
    },
    async ({ id, body }) =>
      toolResult(
        await writeJsonApi(
          apiBaseUrl,
          apiKey,
          "PATCH",
          `/v1/media/${encodeURIComponent(id)}`,
          body
        )
      )
  );

  server.registerTool(
    "delete_media",
    {
      title: "Delete Media",
      description:
        "Delete a media asset and its stored file. Requires a private Marble API key.",
      annotations: destructiveAnnotations,
      inputSchema: mediaIdentifierInput,
    },
    async ({ id }) =>
      toolResult(
        await deleteJsonApi(
          apiBaseUrl,
          apiKey,
          `/v1/media/${encodeURIComponent(id)}`
        )
      )
  );
}
