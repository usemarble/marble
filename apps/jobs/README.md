# Marble Jobs

Cloudflare Worker for background jobs that should not run in the API or CMS
request path. It currently owns webhook event fan-out, webhook delivery
attempts, dead-letter queue handling, and scheduled cleanup.

## Queues

The worker consumes two primary queues:

- `marble-events`: receives persisted `workspaceEvent` IDs and fans them out to
  matching webhook endpoints.
- `marble-webhook-deliveries`: receives `webhookDelivery` IDs and performs the
  outbound HTTP POST.

Both queues, and `marble-tasks`, send failed messages to the `marble-dlq`
dead-letter queue, configured in `cloudflare.config.ts`.

## Event Flow

1. API or CMS creates a `workspaceEvent` (in the same transaction as the change
   it describes, for the API's writes).
2. After the commit, the event ID is sent to `marble-events` and the row is
   stamped `enqueuedAt`. A cron every five minutes re-sends events that are
   still unstamped after a minute (see "Outbox sweep" below).
3. The jobs worker loads the event and finds matching webhook endpoints.
4. For each endpoint, the worker upserts a `webhookDelivery` row and enqueues
   the delivery ID to `marble-webhook-deliveries`.
5. The delivery consumer atomically claims pending/retrying deliveries before
   sending, signs the payload, stores a `webhookDeliveryAttempt`, and marks the
   delivery as `success`, `retrying`, or `failed`.

Fan-out is idempotent through the unique `(eventId, webhookEndpointId)` delivery
constraint. If an event message is retried after a partial fan-out, existing
delivery rows are reused instead of duplicated.

## Outbox sweep

The `*/5 * * * *` cron calls `sweepEvents` from `@marble/api`: it re-sends
workspace events that were committed but never reached the queue (the send
failed, or the Worker was recycled before it ran) and have not been processed.
Delivery is therefore at-least-once; the fan-out is idempotent. The hourly cron
keeps running cleanup. Both expressions live in `src/crons.ts`.

Queue batches are dispatched on the per-mode queue names, which
`cloudflare.config.ts` provides as `QUEUE_EVENTS`, `QUEUE_WEBHOOK_DELIVERIES`,
`QUEUE_TASKS` and `QUEUE_DLQ` (staging and dev queues carry a `-staging` or
`-dev` suffix).

## Webhook Delivery Behavior

Outbound webhook requests include:

- `x-marble-event`
- `x-marble-event-id`
- `x-marble-delivery-id`
- `x-marble-timestamp`
- `x-marble-signature`

The signature is the customer-facing verification primitive. The event,
delivery, and timestamp headers are included for receiver routing, replay
protection, and debugging.

Deliveries use a 15 second fetch timeout. Network errors, timeouts, and non-2xx
responses are recorded as attempts. Failed deliveries are retried by the queue
until the delivery reaches `maxAttempts`.

## Usage Alerts

Successful non-test webhook deliveries record `usageEvent` rows. The worker
checks usage before sending and can emit one usage email per billing period for
each semantic alert kind:

- `warning`
- `critical`
- `exhausted`

The current percentage mapping lives in `src/lib/usage.ts`, not in the database
schema. That lets us move the warning threshold later without sending a second
alert for the same billing period.

## Local Development

```txt
pnpm --filter jobs dev
```

This runs the Worker through `cf dev --mode dev`. Hyperdrive connects to
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` from `.env`, and
`STORAGE` uses the remote `marbledev` R2 bucket. Trigger the hourly cron with:

```txt
curl -X POST "http://localhost:5173/cdn-cgi/local/explorer/api/local/scheduled?worker=marble-jobs-dev" \
  -H "content-type: application/json" -d '{"cron":"0 * * * *"}'
```

`cf dev` writes the binding types to `.cloudflare/types`. Regenerate them after
changing `cloudflare.config.ts` without running the dev server:

```txt
pnpm --filter jobs cf-typegen
```

Type-check the worker:

```txt
pnpm exec tsc -p apps/jobs/tsconfig.json --noEmit
```

Deploy:

```txt
pnpm --filter jobs run deploy
```

## Configuration

Required bindings and secrets:

- `HYPERDRIVE`: database connection through Cloudflare Hyperdrive.
- `EVENT_QUEUE`: producer binding for `marble-events`.
- `WEBHOOK_DELIVERY_QUEUE`: producer binding for `marble-webhook-deliveries`.
- `RESEND_API_KEY`: used for usage alert emails.
