# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marble is a headless CMS for managing articles, product updates, and changelogs with a beautiful editor and REST API. It's built as a Turborepo monorepo using pnpm workspaces.

## Technology Stack

- **Package Manager**: pnpm (v10.19.0+)
- **Node.js**: v20+
- **Monorepo**: Turborepo
- **Database**: PostgreSQL (Neon serverless) with Prisma ORM
- **Cache/Rate Limiting**: Upstash Redis
- **Authentication**: Better Auth (Google & GitHub OAuth)
- **File Storage**: Cloudflare R2
- **Linting/Formatting**: Biome via ultracite
- **Git Hooks**: Husky with commitlint (conventional commits)

## Repository Structure

```
apps/
├── api/      → Hono REST API (Cloudflare Workers)
├── cms/      → Next.js 16 dashboard (React 19)
└── web/      → Astro marketing site

packages/
├── db/       → Prisma schema + client (shared by api & cms)
├── editor/   → Tiptap-based rich text editor
├── email/    → Email templates
├── parser/   → Content parsing utilities
├── ui/       → shadcn/ui components (shared UI library)
├── utils/    → Shared utilities
└── tsconfig/ → Shared TypeScript configurations
```

## Development Commands

### Global Commands (from root)

```bash
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Start individual apps
pnpm api:dev    # Hono API on Cloudflare Workers
pnpm cms:dev    # Next.js CMS dashboard
pnpm web:dev    # Astro marketing site

# Build all apps
pnpm build

# Linting & formatting
pnpm lint       # Check for issues (ultracite)
pnpm format     # Auto-fix issues (ultracite)

# Testing
pnpm test       # Run all tests
```

### Database Commands

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Create and apply migrations (dev)
pnpm db:deploy    # Apply migrations (production)
pnpm db:push      # Push schema changes without migration
pnpm db:studio    # Open Prisma Studio
```

### Docker Commands (for local Postgres)

```bash
pnpm docker:up      # Start local Postgres
pnpm docker:down    # Stop containers
pnpm docker:clean   # Stop and remove volumes (destroys data)
pnpm docker:logs    # Follow container logs
pnpm docker:ps      # Show container status
```

### Running Tests

- Individual test: Use the test runner specific to each app/package (see their package.json)
- All tests: `pnpm test` from root

## Architecture Overview

### API (`apps/api`)

- **Framework**: Hono (lightweight, fast, edge-first)
- **Runtime**: Cloudflare Workers
- **Entry**: `src/app.ts`
- **Structure**:
  - `src/routes/` - API endpoints (posts, authors, categories, tags, cache)
  - `src/middleware/` - Authorization, rate limiting, analytics, caching
  - `src/validations/` - Zod schemas for request validation
  - `src/lib/` - Utility functions

**API Routing Pattern**:
- New API Key routes: `/v1/{resource}` (e.g., `/v1/posts`)
- Legacy workspace routes: `/v1/{workspaceId}/{resource}` (being deprecated)
- Router dispatches based on first segment after `/v1/`
- Rate limiting and auth middleware differ between patterns

**Key Middleware**:
- `keyAuthorization()` - API key validation
- `authorization()` - Legacy workspace ID validation
- `ratelimit()` - Upstash Redis-based rate limiting (separate limits for API keys vs workspaces)
- `analytics()` / `keyAnalytics()` - Usage tracking
- `cache()` - Response caching
- `systemAuth()` - Internal system routes (cache invalidation)

### CMS (`apps/cms`)

- **Framework**: Next.js 16 (App Router)
- **React**: v19
- **Authentication**: Better Auth with session management
- **State Management**: React Query (@tanstack/react-query)
- **Editor**: Custom Tiptap-based editor (`@marble/editor`)
- **Styling**: Tailwind CSS v4 + shadcn/ui components

**App Structure**:
- `src/app/(auth)` - Authentication pages (sign in, sign up)
- `src/app/(main)/[workspace]` - Main dashboard (workspace-scoped)
- `src/app/(share)` - Public share links
- `src/app/api` - Next.js API routes (auth callbacks, webhooks, S3 uploads)

**Key Features**:
- Multi-workspace support with role-based access
- Real-time post editor with AI assistance (optional)
- Media management with Cloudflare R2
- Webhook delivery system (with QStash for reliability)
- Usage analytics and API key management

### Web (`apps/web`)

- **Framework**: Astro v5
- **Styling**: Tailwind CSS v4
- **Content**: MDX for pages
- Marketing site with blog, docs, and product pages

### Database (`packages/db`)

- **ORM**: Prisma v6 with Neon serverless adapter
- **Schema**: `prisma/schema.prisma`
- **Exports**:
  - `.` - Prisma client + helpers
  - `./client` - Direct Prisma client access
  - `./workers` - Cloudflare Workers-optimized client

**Core Models**:
- `Organization` (workspace) - Multi-tenant container
- `Post` - Articles with status (draft/published), categories, tags, authors
- `Author` - Can be linked to User or standalone
- `Category`, `Tag` - Content organization
- `Media` - File uploads (images, videos, documents)
- `Webhook` - Event delivery configuration
- `ApiKey` - API authentication with scopes and rate limits
- `User`, `Session`, `Account` - Authentication (Better Auth)
- `Subscription` - Polar.sh payment integration
- `UsageEvent` - Analytics tracking

**Important Relationships**:
- Posts can have multiple authors + one primary author
- API keys belong to workspaces and optionally to users
- Scoped rate limiting per API key
- Cascade deletes on workspace removal

### Editor (`packages/editor`)

- **Framework**: Tiptap (ProseMirror-based)
- **Features**: Rich text, code blocks (lowlight), tables, images, embeds (YouTube, Twitter)
- **Extensions**: Custom image handling, file drop, markdown export

## Environment Setup

Each app requires environment variables. Copy `.env.example` files:

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/cms/.env.example apps/cms/.env
cp apps/web/.env.example apps/web/.env
cp packages/db/.env.example packages/db/.env
```

**Required Services**:
- PostgreSQL database (Neon or local Docker)
- Upstash Redis (for rate limiting and caching)
- Google/GitHub OAuth apps (for authentication)
- Cloudflare R2 bucket (for media uploads)
- Better Auth secret (`openssl rand -base64 32`)

**Optional Services**:
- Polar.sh (payments)
- QStash (reliable webhook delivery)

## Code Quality Standards

This project uses **ultracite** (Biome-based linter/formatter) with strict rules enforced via `.cursor/rules/ultracite.mdc`. Key principles:

### TypeScript
- Never use `any` or TypeScript enums
- Use `export type` and `import type` for types
- Use `as const` instead of literal type annotations
- Avoid non-null assertions (`!`)
- No namespaces or parameter properties

### React
- Always use arrow functions
- Use `for...of` instead of `.forEach()`
- Hooks must be called at top level
- Always include `key` in iterators (never use array index)
- No nested component definitions
- Use `<>...</>` instead of `<Fragment>`

### Accessibility
- All interactive elements must be keyboard accessible
- Include proper ARIA attributes
- Images need meaningful alt text (no "image", "photo", "picture")
- Always set `type` on `<button>` elements
- Pair `onClick` with keyboard handlers

### Next.js
- Use `next/image` instead of `<img>`
- Use `next/link` instead of `<a>` for internal navigation
- Don't use `next/head` in `pages/_document.js`

### Phosphor Icons
- Always use icon suffix: `UploadSimpleIcon` not `UploadSimple`

## Git Workflow

- **Commits**: Use conventional commits (enforced by commitlint)
  - `feat(cms): add post preview mode`
  - `fix(api): resolve rate limit bypass`
  - `chore: update dependencies`
- **Branches**: Create feature branches from `main`
- **PRs**: Must pass lint and build checks

## Testing Strategy

- API: Integration tests for routes
- CMS: Component tests for UI
- Database: Schema validation
- Run `pnpm build` before committing to catch type errors

## Common Patterns

### API Route Structure
```typescript
// apps/api/src/routes/example.ts
import { Hono } from "hono";
import type { ApiKeyApp } from "../types/env";

const route = new Hono<ApiKeyApp>();

route.get("/", async (c) => {
  const { workspaceId } = c.var.auth;
  const db = c.var.db;

  // Query logic
  const results = await db.model.findMany({
    where: { workspaceId }
  });

  return c.json(results);
});

export default route;
```

### Database Queries (with Neon adapter)
```typescript
import { getPrismaClient } from "@marble/db";
import { neon } from "@neondatabase/serverless";

const sql = neon(DATABASE_URL);
const db = getPrismaClient(sql);

// Use Prisma client as normal
const posts = await db.post.findMany();
```

### CMS Server Actions
```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@marble/db";

export async function createPost(formData: FormData) {
  const session = await auth.api.getSession({ headers });
  if (!session) throw new Error("Unauthorized");

  // Logic here
}
```

## Deployment

- **API**: Deployed to Cloudflare Workers
- **CMS**: Deployed to Vercel (Next.js)
- **Web**: Deployed to Vercel (Astro)
- **Database**: Neon PostgreSQL (serverless)
- **Redis**: Upstash (serverless)

## Key Dependencies

- `better-auth` - Authentication library
- `@polar-sh/sdk` - Payment integration
- `@upstash/ratelimit` - Rate limiting
- `zod` - Schema validation
- `prisma` - ORM
- `hono` - API framework
- `@tiptap/react` - Rich text editor
- `@tanstack/react-query` - Data fetching
- `tailwindcss` - Styling
- `turbo` - Monorepo orchestration

## Troubleshooting

- **Prisma client issues**: Run `pnpm db:generate`
- **Type errors after schema change**: Rebuild with `pnpm build`
- **Docker DB not starting**: Check port 5432 isn't in use
- **API auth failures**: Verify `SYSTEM_SECRET` matches between api and cms
