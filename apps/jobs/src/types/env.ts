export interface Env {
  HYPERDRIVE: { connectionString: string };
  EVENT_QUEUE: Queue;
  WEBHOOK_DELIVERY_QUEUE: Queue;
  RESEND_API_KEY: string;
}
