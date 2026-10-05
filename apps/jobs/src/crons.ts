/**
 * Cron expressions for the jobs Worker. cloudflare.config.ts registers them and
 * the scheduled handler dispatches on them, so they live in one place.
 */
export const CLEANUP_CRON = "0 * * * *";

/**
 * How often the outbox sweep re-sends workspace events that were committed but
 * never reached the queue. A lost send therefore delays a webhook by at most
 * this interval plus the sweep's grace period.
 */
export const OUTBOX_SWEEP_CRON = "*/5 * * * *";
