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

Both queues are configured with a matching dead-letter queue in
`wrangler.jsonc`:

- `marble-events-dlq`
- `marble-webhook-deliveries-dlq`

## Event Flow

1. API or CMS creates a `workspaceEvent`.
2. The event ID is sent to `marble-events`.
3. The jobs worker loads the event and finds matching webhook endpoints.
4. For each endpoint, the worker upserts a `webhookDelivery` row and enqueues
   the delivery ID to `marble-webhook-deliveries`.
5. The delivery consumer atomically claims pending/retrying deliveries before
   sending, signs the payload, stores a `webhookDeliveryAttempt`, and marks the
   delivery as `success`, `retrying`, or `failed`.

Fan-out is idempotent through the unique `(eventId, webhookEndpointId)` delivery
constraint. If an event message is retried after a partial fan-out, existing
delivery rows are reused instead of duplicated.

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

Generate Cloudflare binding types after changing `wrangler.jsonc`:

```txt
pnpm --filter jobs cf-typegen
```

Type-check the worker:

```txt
pnpm exec tsc -p apps/jobs/tsconfig.json --noEmit
```

Deploy:

```txt
pnpm --filter jobs deploy
```

## Configuration

Required bindings and secrets:

- `HYPERDRIVE`: database connection through Cloudflare Hyperdrive.
- `EVENT_QUEUE`: producer binding for `marble-events`.
- `WEBHOOK_DELIVERY_QUEUE`: producer binding for `marble-webhook-deliveries`.
- `RESEND_API_KEY`: used for usage alert emails.
