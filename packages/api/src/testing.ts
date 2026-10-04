import type { Session } from "@marble/auth";
import type { DbClient } from "@marble/db";
import { createRecordId } from "@marble/db/id";
import { member, user, workspace } from "@marble/db/schema";
import type { EventMessage, TaskMessage } from "@marble/events";
import { createRequestLogger } from "evlog";
import type { Context, QueuePublisher } from "./context";

/** The Redis HTTP proxy from the root docker-compose.yml. */
export const testEnv = {
  APP_URL: "http://localhost:3000",
  REDIS_URL: "http://localhost:8079",
  REDIS_TOKEN: "justusemarble",
};

/** A queue that records what it was sent, and can be made to fail. */
export function createTestQueue<T>() {
  const sent: T[] = [];
  const queue: QueuePublisher<T> & { failing: boolean } = {
    failing: false,
    send(message) {
      if (queue.failing) {
        return Promise.reject(new Error("queue unavailable"));
      }
      sent.push(message);
      return Promise.resolve();
    },
  };
  return { queue, sent };
}

/**
 * A request context over a real database. `flush()` waits for everything the
 * code under test passed to `defer`, which is what `waitUntil` does after the
 * response in the Worker.
 */
export function createTestContext(
  db: DbClient,
  overrides: Partial<Context> = {}
) {
  const events = createTestQueue<EventMessage>();
  const tasks = createTestQueue<TaskMessage>();
  const deferred: Promise<unknown>[] = [];

  const context: Context = {
    db,
    log: createRequestLogger({}),
    env: testEnv,
    queues: { events: events.queue, tasks: tasks.queue },
    defer: (work) => {
      deferred.push(work);
    },
    session: null,
    ...overrides,
  };

  return {
    context,
    events,
    flush: () => Promise.all(deferred.splice(0)),
  };
}

export async function seedUser(db: DbClient, emailVerified = true) {
  const id = createRecordId();
  const [row] = await db
    .insert(user)
    .values({
      id,
      name: "Test User",
      email: `${id}@staging.invalid`,
      emailVerified,
    })
    .returning();
  if (!row) {
    throw new Error("could not seed a user");
  }
  return row;
}

export async function seedWorkspace(db: DbClient, ownerId?: string) {
  const id = createRecordId();
  const [row] = await db
    .insert(workspace)
    .values({ id, name: "Test Workspace", slug: `ws-${id}` })
    .returning();
  if (!row) {
    throw new Error("could not seed a workspace");
  }
  if (ownerId) {
    await seedMember(db, row.id, ownerId, "owner");
  }
  return row;
}

export async function seedMember(
  db: DbClient,
  workspaceId: string,
  userId: string,
  role: string
) {
  await db.insert(member).values({
    id: createRecordId(),
    organizationId: workspaceId,
    userId,
    role,
  });
}

/** A session for `authUser`; only the fields the procedures read are real. */
export function sessionFor(authUser: {
  id: string;
  emailVerified: boolean;
}): Session {
  return {
    user: {
      ...authUser,
      name: "Test User",
      email: `${authUser.id}@staging.invalid`,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: createRecordId(),
      userId: authUser.id,
      token: createRecordId(),
      expiresAt: new Date(Date.now() + 3_600_000),
      createdAt: new Date(),
      updatedAt: new Date(),
      activeOrganizationId: null,
    },
  } as Session;
}
