import { describe, it } from "vitest";

/**
 * Better Auth + Drizzle adapter soak (Phase 3 exit gate).
 *
 * Skips without `DATABASE_URL`. Run manually against staging after swapping
 * `prismaAdapter` → `drizzleAdapter` in `apps/cms/src/lib/auth/server.ts`.
 *
 * ## Soak steps (do not flush Redis)
 *
 * 1. **Before deploy** — note an active session cookie / user id on staging.
 * 2. **Deploy** CMS with `@better-auth/drizzle-adapter` (provider `"pg"`, organization→`workspace`).
 * 3. **Session survival** — reload CMS; existing session must still resolve (`/get-session`).
 * 4. **Login** — email/password or OAuth sign-in creates session in DB + Redis secondary storage.
 * 5. **OTP** — sign-up / verify email flow completes.
 * 6. **Org create** — new user gets Personal workspace; owner member row exists.
 * 7. **Invite** — send invitation; accept link creates member + author hook.
 * 8. **Org switch** — change active organization; session `activeOrganizationId` updates.
 * 9. **Checkout guard** — non-owner cannot start Polar checkout for a workspace.
 * 10. **Joins** — `/get-full-organization` returns members without N+1 (requires `advanced.database.joins: true`).
 *
 * ```bash
 * cd packages/drizzle
 * DATABASE_URL=postgres://... pnpm test auth-soak
 * ```
 */
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabaseUrl)("Better Auth Drizzle adapter soak", () => {
  it("documents manual soak — implement live checks when DATABASE_URL is set", async () => {
    // Placeholder: wire HTTP calls to staging CMS auth routes or direct DB asserts.
    // Keeps CI green; soak is manual until automated golden-path harness lands.
  });
});

describe("auth soak harness (offline)", () => {
  it("documents that live soak requires DATABASE_URL", () => {
    if (!hasDatabaseUrl) {
      return;
    }
  });
});
