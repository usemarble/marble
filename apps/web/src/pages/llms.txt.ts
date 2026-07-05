export const prerender = false;

const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

const content = `# Marble

> Marble is an open-source headless CMS for writers and developers. It provides a hosted workspace for creating content, managing blog posts, authors, categories, tags, custom fields, and media, then serving that content to websites and apps through a REST API, TypeScript SDK, and remote MCP server.

Use this file as a compact guide to Marble's public product documentation and machine-readable integration surfaces. Do not treat it as an authorization document: API and MCP access require a scoped Marble API key created in a Marble workspace.

## Core Documentation

- [What is Marble](https://docs.marblecms.com/introduction): Product overview, core concepts, and who Marble is built for.
- [Set Up Your Workspace](https://docs.marblecms.com/quickstart): Sign up, create a workspace, explore the dashboard, and publish a first post.
- [What Is a Headless CMS?](https://docs.marblecms.com/concepts/headless-cms): Explains headless CMS concepts and where Marble fits.
- [Workspaces and Teams](https://docs.marblecms.com/concepts/workspaces): Workspace isolation, members, authors, roles, and API keys.
- [Content Model](https://docs.marblecms.com/concepts/content-model): How posts, authors, categories, tags, media, and custom fields relate.

## API and Machine-Readable Surfaces

- [Marble REST API Introduction](https://docs.marblecms.com/api/introduction): Base URL, API key authentication, scopes, response format, and errors.
- [API Authentication](https://docs.marblecms.com/api/quickstart): Create public or private API keys and make an authenticated request.
- [OpenAPI document](https://api.marblecms.com/openapi.json): Machine-readable OpenAPI 3.1 specification for the Marble REST API.
- [Root OpenAPI document](https://marblecms.com/openapi.json): Root-domain alias for the Marble OpenAPI document.
- [Integrations manifest](https://marblecms.com/.well-known/integrations.json): Owner-published integration surfaces and shared credential metadata.

## AI and Developer Tools

- [Marble MCP Server](https://docs.marblecms.com/tools/mcp): Connect Claude, Cursor, VS Code, Codex, and other MCP clients to a Marble workspace.
- [MCP server card](https://marblecms.com/.well-known/mcp/server-card.json): Root-domain server card for the Marble remote MCP server.
- [Remote MCP endpoint](https://mcp.marblecms.com/mcp): Streamable HTTP MCP endpoint. Requires a Marble API key in a supported header.
- [Marble TypeScript SDK](https://docs.marblecms.com/tools/sdk): Official SDK with type safety, retries, pagination helpers, and framework-agnostic access.

## Features

- [Marble's Editor](https://docs.marblecms.com/features/editor): Writing interface, embeds, metadata, and readability analysis.
- [Media and Image Hosting](https://docs.marblecms.com/features/media): Upload and serve images, video, audio, and documents through Marble's media library and CDN.
- [Custom Fields](https://docs.marblecms.com/features/custom-fields): Add structured workspace-specific metadata to posts.
- [Webhooks](https://docs.marblecms.com/features/webhooks): Revalidate static sites, automate workflows, verify signatures, and inspect deliveries.
- [Importing Content](https://docs.marblecms.com/features/import): Bring Markdown and MDX files into Marble as draft posts.
- [Exporting Content](https://docs.marblecms.com/features/export): Export workspace content and metadata as JSON archives.

## Framework Integrations

- [Next.js Integration](https://docs.marblecms.com/integrations/nextjs): Use Marble with Next.js App Router and ISR.
- [Astro Integration](https://docs.marblecms.com/integrations/astro): Use Marble with Astro Content Collections and typed routes.
- [TanStack Start Integration](https://docs.marblecms.com/integrations/tanstack): Fetch Marble content in TanStack Start route loaders.
- [Framer Integration](https://docs.marblecms.com/integrations/framer): Sync Marble posts into Framer CMS collections.

## Optional

- [Pricing](https://marblecms.com/pricing): Marble plan information.
- [Blog](https://marblecms.com/blog): Product guides, integration walkthroughs, and release posts.
- [Changelog](https://marblecms.com/changelog): Product release history.
- [GitHub repository](https://github.com/usemarble/marble): Marble source code.
- [Community Discord](https://discord.marblecms.com): Community support and discussion.
`;

export function GET() {
  return new Response(content, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
