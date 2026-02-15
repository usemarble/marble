# Contributing to Marble

Thanks for your interest in contributing! This guide explains how to get Marble running locally and how to submit high-quality contributions.

## Prerequisites

Before you start, make sure you have the following installed or available:

- **Node.js** ≥ 20.x
- **pnpm** ≥ 10.x (install with `npm i -g pnpm`)
- **PostgreSQL** database (we use [Neon](https://neon.tech) in examples)
- **Redis** database (we use [Upstash](https://upstash.com))
- **Google** and **GitHub** OAuth apps (for authentication)
- **Cloudflare** account with R2 enabled (for media uploads)
- **Optional**: [Polar](https://sandbox.polar.sh) sandbox account if you want to test payments
- **Optional**: [QStash](https://upstash.com/qstash) for reliable webhook delivery

---

## Structure

This repository is a monorepo and is structured as follows:

```text
/
├── apps/
│   ├── api/      → Hono REST API
│   ├── cms/      → Next.js dashboard
│   └── web/      → Astro marketing site
├── packages/
│   ├── db/       → Prisma schema + client (shared by api & cms)
│   ├── editor/   → Tiptap-based rich text editor
│   ├── email/    → Email templates
│   ├── parser/   → Content parsing utilities
│   ├── tsconfig/ → Shared TypeScript configurations
│   ├── ui/       → shadcn/ui components (shared UI library)
│   └── utils/    → Shared utilities
├── .npmrc
├── package.json
├── pnpm-workspace.yaml
├── README.md
└── turbo.json
```

### Apps

This directory contains the source code for all related applications:

- **api**: [Hono](https://hono.dev) REST API for content delivery
- **cms**: [Next.js](https://nextjs.org) app for the dashboard
- **web**: [Astro](https://astro.build) app for the marketing website

### Packages

Packages contain internal shared modules used across different applications:

- **db**: Prisma schema and client shared between the `api` and `cms` apps
- **editor**: Tiptap-based rich text editor used in the CMS
- **email**: Email templates for notifications and transactional emails
- **parser**: Content parsing utilities
- **tsconfig**: TypeScript configurations shared across the monorepo
- **ui**: shadcn/ui components used in the `cms` app
- **utils**: Shared utilities used across apps and packages

## Getting Started

1. [Fork](https://github.com/usemarble/marble/fork/) this repository to your own account

   - Visit Marble repository

   - Click the "Fork" button in the top right

   - [Clone](https://help.github.com/articles/cloning-a-repository/) the fork to your local device.

   ```bash
   git clone https://github.com/YOUR-USERNAME/marble.git
   cd marble
   ```

   - add the original repo as upstream

   ```bash
   git remote add upstream https://github.com/usemarble/marble.git
   ```

2. Install Dependencies

    ```bash
   pnpm install
   ```

3. Configure Environment Variables

   Each app/package that uses environment variables has an example env file. You’ll need to copy and fill those out:

   ```bash
   cp apps/api/.dev.vars.example apps/api/.dev.vars
   cp apps/cms/.env.example apps/cms/.env
   cp apps/web/.env.example apps/web/.env
   cp packages/db/.env.example packages/db/.env
   ```

   You'll need:

   - A Postgres connection string (either neon or use docker to self host)

   - Redis credentials from Upstash (see below)

   - Google and GitHub OAuth credentials (how to get these)

   - A BetterAuth secret

   - Cloudflare R2 credentials for file uploads (see below)

   - Optional: If you want to test payments, set up a [Polar](https://sandbox.polar.sh) sandbox account and fill in the POLAR_* variables.

   - Optional: If you want to test webhook delivery, set up [QStash](https://upstash.com/qstash) and fill in the QSTASH_TOKEN variable.

4. Database Setup

   ### Option 1: Use Neon (Hosted)

   We use Neon for the database. Create a Neon project and copy your connection string for Prisma
   (ensure it includes `sslmode=require`).

   - Paste it into the relevant env files:
   Example:
   ```bash
   DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
   ```
   
   - Paste it into the relevant env files:
   - `apps/api/.dev.vars` → `DATABASE_URL=<YOUR_STRING_HERE>`
   - `apps/cms/.env` → `DATABASE_URL=<YOUR_STRING_HERE>`
   - `packages/db/.env` → `DATABASE_URL=<YOUR_STRING_HERE>`

   - Run migrations:

      ```bash
      pnpm db:migrate
      ```

   ### Option 2: Use Docker (Local)

   Prerequisites: Docker Desktop (macOS/Windows) or Docker Engine + Docker Compose v2 (Linux).

   Start a local Postgres and run migrations:

   ```bash
   # from repo root
   pnpm docker:up
   # wait for the DB to be healthy (one of):
   #   pnpm docker:logs    # watch for "database system is ready to accept connections"
   #   docker compose ps   # ensure STATUS is "healthy"
   ## Alternatively, if your Docker Compose version supports it:
   # docker compose up -d --wait
   pnpm db:migrate
   ```

   If you’re using the local Docker DB, set `DATABASE_URL` in these env files:
   - `apps/api/.dev.vars`
   - `apps/cms/.env`
   - `packages/db/.env`

   Example:
   ```bash
   DATABASE_URL=postgresql://usemarble:justusemarble@localhost:5432/marble
   ```
   Note: These credentials are for local development only. Do not use them in production.

This will:

- Build (if needed) and start the Postgres container defined in `docker-compose.yml`.
- Expose Postgres on port `5432` using the credentials from the compose file.
- Persist data in the `marble_pgdata` Docker volume.
- Note: If you already have a local Postgres on port 5432, stop it or adjust the port mapping in `docker-compose.yml`.
   
   Useful commands:

   ```bash
   pnpm docker:logs    # follow DB logs
   pnpm docker:down    # stop containers
   pnpm docker:clean   # stop and remove volumes (DESTROYS local data)
   ```

### Google OAuth

   Create a project in the Google Cloud Console.
   Follow [the first step](https://www.better-auth.com/docs/authentication/google) in the Better Auth documentation to set up Google OAuth and set the values for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### GitHub OAuth

   If you would rather use github you can follow [the first step](https://www.better-auth.com/docs/authentication/github#get-your-github-credentials) in the better auth docs to setup Github oAuth and set the environment values for `GITHUB_ID` and `GITHUB_SECRET`

### Set up Cloudflare R2 for media uploads

   To use media uploads in Marble, you’ll need to set up a Cloudflare R2 bucket. Here's a step-by-step guide to help you configure everything properly:

- Go to your Cloudflare dashboard

- Select your account and navigate to R2 from the sidebar

- Click "Create Bucket"

- Name your bucket (e.g. marble-media)

- Hit 'Create"

- switch to the settings tab and enable "public development url"

- copy the value to `CLOUDFLARE_PUBLIC_URL`

- Set your bucket name to `CLOUDFLARE_BUCKET_NAME`

- Go back to your R2 buckets overview and click "API"

- from the dropdown select "Use r2 with apis"

- then copy the api url and set to `CLOUDFLARE_S3_ENDPOINT`

- Below the url click "Create api Tokens"

- Select "Create user API Token"

- For permissions select "admin read and write"

- Leave everything else as default and click "Create user API Token"

- Copy the values to `CLOUDFLARE_SECRET_ACCESS_KEY` and `CLOUDFLARE_ACCESS_KEY_ID` respectively

### Set up Upstash Redis

   Marble uses Redis for rate limiting, session caching, and analytics. We use [Upstash](https://upstash.com) for serverless Redis. Here's how to set it up:

- Go to [Upstash Console](https://console.upstash.com) and sign in or create an account

- Click "Create Database"

- Give your database a name (e.g. marble-redis)

- Select a region close to your primary deployment region

- Leave the type as "Regional" (free tier)

- Click "Create"

- Once created, scroll down to the "REST API" section

- Copy the "UPSTASH_REDIS_REST_URL" value and set it to `REDIS_URL` in your environment files

- Copy the "UPSTASH_REDIS_REST_TOKEN" value and set it to `REDIS_TOKEN` in your environment files

   You'll need to add these to:
   - `apps/api/.dev.vars` → `REDIS_URL=<YOUR_URL_HERE>` and `REDIS_TOKEN=<YOUR_TOKEN_HERE>`
   - `apps/cms/.env` → `REDIS_URL=<YOUR_URL_HERE>` and `REDIS_TOKEN=<YOUR_TOKEN_HERE>`

### Set up QStash (Optional)

   QStash provides reliable webhook delivery with automatic retries. This is optional but recommended for production-like webhook testing. QStash is also from [Upstash](https://upstash.com).

- Go to [Upstash Console](https://console.upstash.com) (same account as Redis)

- Click on "QStash" in the sidebar

- If you haven't enabled QStash yet, click "Enable QStash"

- Once enabled, you'll see your QStash dashboard

- Scroll down to the "Request Builder" section and find "Current Signing Keys"

- Copy the signing key token and set it to `QSTASH_TOKEN` in your environment files

   You'll need to add this to:
   - `apps/cms/.env` → `QSTASH_TOKEN=<YOUR_TOKEN_HERE>`

   Note: QStash is used for reliable webhook delivery with automatic retries. Without it, webhooks will still work but won't have retry functionality.

## Running the Apps

From the root you can run all apps

```bash
pnpm dev
```

or just one

```bash
pnpm cms:dev
pnpm api:dev
pnpm web:dev
```

## Making changes

1. Create a new branch for your changes

   ```bash
   git checkout -b feature/your-feature
   ```

2. Before committing your changes make sure to run the lint and format commands (via ultracite/Biome) to catch any issues

   ```bash
   pnpm format
   ```

   or if you would rather fix issues yourself, run the following to list problems without fixing

   ```bash
   pnpm lint
   ```

3. Test your changes and make sure they work and run a build

   ```bash
   pnpm build
   ```

4. If your build succeeds you can go ahead and make a commit using conventional [commit messages](https://www.conventionalcommits.org/en/v1.0.0/)

```bash
git commit -m "fix(cms): fix sidebar overflow issue"
```

## Pull Request Guidelines

- Your PR should reference an issue (if applicable) or clearly describe its impact on the project. [see how to Link a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
- Include a clear description of the changes
- Keep PRs small and focused. Large PRs are harder to review and may be rejected or delayed.
- Ensure consistency with the existing codebase. Use ultracite (Biome) for linting and formatting.
- Include tests if applicable
- Update documentation if your changes affect usage or API behavior.

## Code Style

- Follow the existing code formatting in the project (use ultracite/Biome for consistency).
- Write clear, self-documenting code
- Add comments only when necessary to explain complex logic
- Use meaningful variable and function names

## Reporting Issues

- Use the GitHub issue tracker
- Check if the issue already exists before creating a new one
- Provide a clear description of the issue
- Include steps to reproduce the issue

## Need Help?

Feel free to open an issue for questions or join our [discord](https://discord.gg/gU44Pmwqkx).

Thank you for contributing!
