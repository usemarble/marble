# API

API endpoints users can fetch data from.

## Local Development

```txt
pnpm --filter api dev
```

This runs the Worker at `http://localhost:8787` through `cf dev --mode dev`.
Hyperdrive connects to `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`
from `.env`, `STORAGE` uses the remote `marbledev` R2 bucket, and Polar calls
go to the sandbox.

To run the jobs Worker in the same session, so messages sent to
`marble-events` and `marble-tasks` are consumed locally, run from the repo root:

```txt
pnpm workers:dev
```

`cf dev` writes the binding types to `.cloudflare/types`. Regenerate them after
changing `cloudflare.config.ts` without running the dev server:

```txt
pnpm --filter api cf-typegen
```

Deploy:

```txt
pnpm --filter api run deploy
```
