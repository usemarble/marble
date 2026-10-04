import type { Session } from "@marble/auth";
import type { DbClient } from "@marble/db";
import type { EventMessage, TaskMessage } from "@marble/events";
import type { RequestLogger } from "evlog";
import type { ApiEnv } from "./env";

/** The part of a Cloudflare `Queue` binding that services use. */
export interface QueuePublisher<T> {
  send(message: T): Promise<unknown>;
}

/** The transaction handle Drizzle passes to `db.transaction`. */
export type DbTransaction = Parameters<
  Parameters<DbClient["transaction"]>[0]
>[0];

/**
 * What a service needs, built once per request by the Worker. Services never
 * read a Hono `c` or a global `db`.
 */
export interface ServiceContext {
  /** The request's Hyperdrive client. Never close it. */
  db: DbClient;
  /**
   * The request's wide-event logger. It is sealed once the response is sent,
   * so work passed to `defer` logs through evlog's standalone `log` instead.
   */
  log: RequestLogger;
  env: ApiEnv;
  queues: {
    events: QueuePublisher<EventMessage>;
    tasks: QueuePublisher<TaskMessage>;
  };
  /** Keeps post-commit work alive after the response (`waitUntil`). */
  defer: (work: Promise<unknown>) => void;
}

/** The oRPC context: a service context plus the caller's session. */
export interface Context extends ServiceContext {
  session: Session | null;
  /** Injected by oRPC's response headers plugin at the HTTP boundary. */
  resHeaders?: Headers;
}
