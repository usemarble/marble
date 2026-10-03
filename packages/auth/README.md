# @marble/auth

Auth runs on the API Worker at `/api/auth/*`. Build `createAuth({ db, env })`
inside the invocation using `dbMiddleware`'s Hyperdrive client and the Worker's
bindings. Never close that client or create a CMS auth instance.

`@marble/auth/client` contains the matching browser client. The CMS sets its
`baseURL` from `NEXT_PUBLIC_API_URL` and includes credentials. Server session
reads use `authClient.getSession({ fetchOptions: { headers: await headers() } })`.

Provider avatars are copied through `STORAGE.put`. User updates go through
Better Auth's internal adapter so its Redis session copies also refresh.

## Staging setup

`apps/api/cloudflare.config.ts` is the source of truth for bindings, vars and
secret names. A deploy deletes undeclared values and requires all declared
secrets. The config sets the API/dashboard origins, sandbox Polar server,
`.marblecms.com` cookie domain, and `marble-staging` cookie prefix. Production
uses `marble`; localhost uses host-only `marble-dev` cookies with SameSite Lax.

Before merging to staging, set these new secrets on `marble-api-staging`:

| Secret | Value |
| --- | --- |
| `BETTER_AUTH_SECRET` | A staging-only auth secret of at least 32 characters |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `GITHUB_ID`, `GITHUB_SECRET` | GitHub OAuth credentials |
| `POLAR_WEBHOOK_SECRET` | Secret for the sandbox webhook below |

Polar product IDs, the checkout success URL and the Databuddy client IDs are
plain values in `cloudflare.config.ts`. `DATABUDDY_API_KEY` is declared only in
production, where registration tracking runs.

The existing `POLAR_ACCESS_TOKEN`, `REDIS_URL`, `REDIS_TOKEN`, `RESEND_API_KEY`
and `SYSTEM_SECRET` remain declared. The Polar token must target the sandbox,
and Redis must be the staging instance.

Set Vercel staging's public values:

```dotenv
NEXT_PUBLIC_API_URL=https://api-staging.marblecms.com
NEXT_PUBLIC_APP_URL=https://staging.marblecms.com
```

OAuth and Polar settings require the owner's approval before changing them:

- Google redirect URI: `https://api-staging.marblecms.com/api/auth/callback/google`
- GitHub callback URL: `https://api-staging.marblecms.com/api/auth/callback/github`
- Polar sandbox webhook: `https://api-staging.marblecms.com/api/auth/polar/webhooks`

Test email/password, OTP, Google, GitHub, invite acceptance, org switching,
sign-out, avatar copy, and sandbox checkout/webhook/portal on staging. The
CMS's legacy S3 upload, media deletion, import and export-download handlers
have been removed; their Worker replacements belong to MAB-201 Step 5.

## Local checks

The API's `.env.example` uses Docker Postgres and Redis. Existing `.env` files
may point to a Neon development branch: explicitly override the Hyperdrive
connection string, `REDIS_URL` and `REDIS_TOKEN` when testing locally. Set the
CMS's `NEXT_PUBLIC_API_URL` to `http://localhost:8787`.

Run `pnpm --filter @marble/auth typecheck`, `lint`, and `test`, plus the API and
CMS checks. `pnpm --filter api exec cf build --mode dev` checks the Worker
bundle without deploying. `cf dev --mode dev` runs it in the Workers runtime.
