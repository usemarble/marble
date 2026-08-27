# Better Auth Drizzle adapter soak (Phase 3)

Run after swapping `apps/cms/src/lib/auth/server.ts` from `prismaAdapter` to `drizzleAdapter`.

**Do not flush Redis** — existing sessions must survive the deploy.

## Steps

1. Note an active session on staging before deploy.
2. Deploy CMS with `@better-auth/drizzle-adapter` (`provider: "pg"`, `organization` → `workspace` table).
3. Reload CMS — session still resolves.
4. Login (email/password or OAuth).
5. Email OTP verification flow.
6. Create workspace / new-user Personal org.
7. Invite member and accept invitation.
8. Switch active organization.
9. Checkout — only workspace owners can start Polar checkout.
10. `/get-full-organization` returns members (joins enabled via `advanced.database.joins`).

## Automated placeholder

`packages/drizzle/src/__parity__/auth-soak.test.ts` skips without `DATABASE_URL` and documents these steps for CI.

```bash
cd packages/drizzle
DATABASE_URL=postgres://... pnpm test auth-soak
```
