import { neonConfig, Pool } from "@neondatabase/serverless";
import { createId as createRecordId } from "@paralleldrive/cuid2";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { schema } from "./schema";

neonConfig.webSocketConstructor = ws;

const createClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || typeof connectionString !== "string") {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  return drizzle({ client: pool, schema });
};

type DrizzleDb = ReturnType<typeof createClient>;

declare global {
  var drizzleDb: DrizzleDb | undefined;
}

let db: DrizzleDb;

if (process.env.NODE_ENV === "production") {
  db = createClient();
} else {
  if (!global.drizzleDb) {
    global.drizzleDb = createClient();
  }
  db = global.drizzleDb;
}

export { db, createRecordId };
export type { DrizzleDb };
export type TransactionClient = Parameters<
  Parameters<DrizzleDb["transaction"]>[0]
>[0];

export {
  FIELD_WORKSPACE_KEY_UNIQUE_CONSTRAINT,
  isFieldWorkspaceKeyConflict,
  isPgSerializationFailure,
  isPgUniqueViolation,
} from "./pg-errors";

export type {
  ApiKeyType,
  ApiScope,
  ExportFormat,
  ExportJobStatus,
  FieldType,
  ImportFormat,
  ImportItemStatus,
  ImportJobStatus,
  ImportSource,
  MediaType,
  PayloadFormat,
  PlanType,
  PostStatus,
  SubscriptionRecurringInterval,
  SubscriptionStatus,
  UsageAlertKind,
  UsageEventType,
  WebhookDeliveryStatus,
  WorkspaceEventActorType,
  WorkspaceEventResourceType,
  WorkspaceEventSource,
  WorkspaceEventType,
} from "./types";
