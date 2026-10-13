import { createRecordId } from "@marble/db/id";
import {
  member,
  user,
  webhookDelivery,
  webhookDeliveryAttempt,
  webhookEndpoint,
  webhookNotification,
  workspace,
  workspaceEvent,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import type { sendWebhookFailureEmail } from "@marble/email";
import { eq, sql } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  recordWebhookEndpointOutcome,
  WEBHOOK_FAILURE_DISABLE_MS,
  WEBHOOK_FAILURE_WARNING_MS,
} from "./webhook-health";
import {
  queueWebhookFailureNotifications,
  sendPendingWebhookNotifications,
} from "./webhook-notifications";

// PostgreSQL executes the actual migrations, transactions and row predicates.
// Only the email provider is mocked; no database query returns scripted rows.
const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn<typeof sendWebhookFailureEmail>(),
}));
vi.mock("@marble/email", () => ({
  sendWebhookFailureEmail: mocks.sendEmail,
}));

const APP_URL = "https://app.staging.invalid";
let testDb: TestDatabase;

beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});
beforeEach(async () => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  await testDb.db.delete(workspace);
  mocks.sendEmail.mockResolvedValue({
    data: { id: "provider-email-1" },
    error: null,
    headers: {},
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

async function fixture() {
  const [owner] = await testDb.db
    .insert(user)
    .values({
      name: "Owner",
      email: `${createRecordId()}@staging.invalid`,
      emailVerified: true,
    })
    .returning();
  if (!owner) {
    throw new Error("Could not seed owner");
  }
  const [organization] = await testDb.db
    .insert(workspace)
    .values({ name: "Test Workspace", slug: createRecordId() })
    .returning();
  if (!organization) {
    throw new Error("Could not seed workspace");
  }
  await testDb.db.insert(member).values({
    organizationId: organization.id,
    userId: owner.id,
    role: "owner",
  });
  const [endpoint] = await testDb.db
    .insert(webhookEndpoint)
    .values({
      name: "Receiver",
      url: `https://receiver.staging.invalid/${createRecordId()}`,
      secret: "test-secret",
      workspaceId: organization.id,
      events: ["tag_created"],
    })
    .returning();
  if (!endpoint) {
    throw new Error("Could not seed endpoint");
  }
  return { endpoint, owner, organization };
}

async function failingFixture() {
  const result = await fixture();
  const failureStartedAt = new Date(Date.now() - 15 * 60_000);
  const incidentId = createRecordId();
  await testDb.db
    .update(webhookEndpoint)
    .set({
      consecutiveFailures: 10,
      failureStartedAt,
      lastFailureAt: new Date(),
      failureIncidentId: incidentId,
    })
    .where(eq(webhookEndpoint.id, result.endpoint.id));
  const [event] = await testDb.db
    .insert(workspaceEvent)
    .values({ workspaceId: result.organization.id, type: "tag_created" })
    .returning();
  if (!event) {
    throw new Error("Could not seed event");
  }
  const [delivery] = await testDb.db
    .insert(webhookDelivery)
    .values({
      eventId: event.id,
      webhookEndpointId: result.endpoint.id,
      workspaceId: result.organization.id,
      url: result.endpoint.url,
      status: "failed",
      attemptCount: 1,
    })
    .returning();
  if (!delivery) {
    throw new Error("Could not seed delivery");
  }
  await testDb.db.insert(webhookDeliveryAttempt).values({
    deliveryId: delivery.id,
    attemptNumber: 1,
    success: false,
    statusCode: 503,
    responseBody: '{"error":"receiver unavailable"}',
  });
  return { ...result, failureStartedAt, incidentId };
}

function findEndpoint(id: string) {
  return testDb.db.query.webhookEndpoint.findFirst({
    where: eq(webhookEndpoint.id, id),
  });
}
function findNotifications(id: string) {
  return testDb.db.query.webhookNotification.findMany({
    where: eq(webhookNotification.webhookEndpointId, id),
  });
}

describe("webhook failure notifications against PostgreSQL", () => {
  it("counts actual failures with UTC timestamps and excludes stale, URL-mismatched and failed test outcomes", async () => {
    const f = await fixture();
    const observedAt = new Date("2026-10-13T12:00:00.000Z");
    const outcome = {
      endpointId: f.endpoint.id,
      url: f.endpoint.url,
      observedAt,
      success: false,
      isTest: false,
    };
    await testDb.db.transaction((tx) =>
      recordWebhookEndpointOutcome(tx, outcome)
    );
    const recorded = await findEndpoint(f.endpoint.id);
    expect(recorded).toMatchObject({
      consecutiveFailures: 1,
      failureStartedAt: observedAt,
      lastFailureAt: observedAt,
      lastDeliveryOutcomeAt: observedAt,
      failureIncidentId: expect.any(String),
    });
    for (const ignored of [
      { ...outcome, isTest: true, observedAt: new Date() },
      {
        ...outcome,
        success: true,
        observedAt: new Date(observedAt.getTime() - 1000),
      },
      { ...outcome, url: "https://replaced.staging.invalid" },
    ]) {
      await testDb.db.transaction((tx) =>
        recordWebhookEndpointOutcome(tx, ignored)
      );
    }
    expect(await findEndpoint(f.endpoint.id)).toEqual(recorded);
  });

  it("reserves one warning per incident with receiver details and owner/admin recipients", async () => {
    const f = await failingFixture();
    const [regularMember, admin] = await testDb.db
      .insert(user)
      .values([
        {
          name: "Member",
          email: `${createRecordId()}@staging.invalid`,
          emailVerified: true,
        },
        {
          name: "Admin",
          email: `${createRecordId()}@staging.invalid`,
          emailVerified: true,
        },
      ])
      .returning();
    if (!(regularMember && admin)) {
      throw new Error("Could not seed members");
    }
    await testDb.db.insert(member).values([
      {
        organizationId: f.organization.id,
        userId: regularMember.id,
        role: "member",
      },
      {
        organizationId: f.organization.id,
        userId: admin.id,
        role: "admin",
      },
    ]);
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    const notices = await findNotifications(f.endpoint.id);
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatchObject({
      kind: "warning",
      status: "pending",
      incidentId: f.incidentId,
      recipientEmails: [f.owner.email, admin.email].sort(),
      payload: {
        latestStatusCode: 503,
        latestError: '{"error":"receiver unavailable"}',
        dashboardUrl: `${APP_URL}/${f.organization.slug}/settings/webhooks/${f.endpoint.id}`,
      },
    });
    expect((await findEndpoint(f.endpoint.id))?.lastFailureEmailAt).toBeNull();
  });

  it("requires both ten failures and ten minutes before reserving a warning", async () => {
    const f = await failingFixture();
    const now = new Date();
    await testDb.db
      .update(webhookEndpoint)
      .set({ consecutiveFailures: 9 })
      .where(eq(webhookEndpoint.id, f.endpoint.id));
    await queueWebhookFailureNotifications(testDb.db, APP_URL, now);
    expect(await findNotifications(f.endpoint.id)).toEqual([]);
    await testDb.db
      .update(webhookEndpoint)
      .set({
        consecutiveFailures: 10,
        failureStartedAt: new Date(now.getTime() - 60_000),
      })
      .where(eq(webhookEndpoint.id, f.endpoint.id));
    await queueWebhookFailureNotifications(testDb.db, APP_URL, now);
    expect(await findNotifications(f.endpoint.id)).toEqual([]);
    await queueWebhookFailureNotifications(
      testDb.db,
      APP_URL,
      new Date(now.getTime() + WEBHOOK_FAILURE_WARNING_MS)
    );
    expect(await findNotifications(f.endpoint.id)).toHaveLength(1);
  });

  it("does not let more than 100 quiet warned or queued incidents starve a new warning", async () => {
    const f = await failingFixture();
    const now = new Date();
    const earlyFailure = new Date(now.getTime() - 4 * 86_400_000);
    const quietEndpoints = Array.from({ length: 110 }, (_, index) => ({
      id: createRecordId(),
      name: `Quiet ${index}`,
      url: `https://receiver.staging.invalid/quiet-${index}`,
      secret: "test-secret",
      workspaceId: f.organization.id,
      events: ["tag_created" as const],
      consecutiveFailures: 10,
      failureStartedAt: earlyFailure,
      lastFailureAt: earlyFailure,
      lastFailureEmailAt: new Date(earlyFailure.getTime() + 60_000),
      failureIncidentId: createRecordId(),
    }));
    await testDb.db.insert(webhookEndpoint).values(quietEndpoints);
    const queuedEndpoints = Array.from({ length: 110 }, (_, index) => ({
      ...quietEndpoints[0],
      id: createRecordId(),
      name: `Queued ${index}`,
      url: `https://receiver.staging.invalid/queued-${index}`,
      lastFailureEmailAt: null,
      failureIncidentId: createRecordId(),
    }));
    await testDb.db.insert(webhookEndpoint).values(queuedEndpoints);
    await testDb.db.insert(webhookNotification).values(
      queuedEndpoints.map((endpoint) => ({
        webhookEndpointId: endpoint.id,
        workspaceId: f.organization.id,
        incidentId: endpoint.failureIncidentId,
        kind: "warning" as const,
        recipientEmails: [f.owner.email],
        payload: {
          endpointName: endpoint.name,
          endpointUrl: endpoint.url,
          workspaceName: f.organization.name,
          dashboardUrl: APP_URL,
          consecutiveFailures: 10,
          failureStartedAt: earlyFailure.toISOString(),
          latestStatusCode: 503,
          latestError: null,
          disableGraceDays: 3,
        },
      }))
    );
    await queueWebhookFailureNotifications(testDb.db, APP_URL, now);
    expect(await findNotifications(f.endpoint.id)).toHaveLength(1);
    expect((await findEndpoint(quietEndpoints[0]?.id ?? ""))?.enabled).toBe(
      true
    );
  });

  it("retains provider failures for an idempotent retry and starts grace only after successful sending", async () => {
    const f = await failingFixture();
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    await sendPendingWebhookNotifications(testDb.db, undefined);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(
      (await findNotifications(f.endpoint.id))[0]?.firstAttemptAt
    ).toBeNull();
    mocks.sendEmail.mockResolvedValueOnce({
      data: null,
      error: {
        name: "application_error",
        message: "Provider unavailable",
        statusCode: 500,
      },
      headers: {},
    });
    await sendPendingWebhookNotifications(testDb.db, "test-key");
    const [failed] = await findNotifications(f.endpoint.id);
    expect(failed).toMatchObject({
      status: "pending",
      attemptCount: 1,
      lastError: "application_error: Provider unavailable",
    });
    expect(failed?.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
    expect((await findEndpoint(f.endpoint.id))?.lastFailureEmailAt).toBeNull();
    if (!failed) {
      throw new Error("Warning not queued");
    }
    await sendPendingWebhookNotifications(
      testDb.db,
      "test-key",
      new Date(failed.nextAttemptAt.getTime() + 1000)
    );
    expect((await findNotifications(f.endpoint.id))[0]).toMatchObject({
      status: "sent",
      attemptCount: 2,
      lastError: null,
      sentAt: expect.any(Date),
    });
    expect(
      (await findEndpoint(f.endpoint.id))?.lastFailureEmailAt
    ).toBeInstanceOf(Date);
    expect(mocks.sendEmail.mock.calls[0]?.[2]).toBe(
      `webhook-failure/${failed.id}`
    );
    expect(mocks.sendEmail.mock.calls[1]?.[2]).toBe(
      mocks.sendEmail.mock.calls[0]?.[2]
    );
    await sendPendingWebhookNotifications(
      testDb.db,
      "test-key",
      new Date(Date.now() + 86_400_000)
    );
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
  });

  it("starts the retry window at the first provider attempt and stops before its idempotency key expires", async () => {
    const f = await failingFixture();
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    const [notice] = await findNotifications(f.endpoint.id);
    if (!notice) {
      throw new Error("Warning not queued");
    }
    const firstAttemptAt = new Date();
    await testDb.db
      .update(webhookNotification)
      .set({ createdAt: new Date(firstAttemptAt.getTime() - 30 * 3_600_000) })
      .where(eq(webhookNotification.id, notice.id));
    await sendPendingWebhookNotifications(testDb.db, undefined, firstAttemptAt);
    expect((await findNotifications(f.endpoint.id))[0]).toMatchObject({
      status: "pending",
      firstAttemptAt: null,
      attemptCount: 0,
    });
    mocks.sendEmail.mockResolvedValue({
      data: null,
      error: {
        name: "application_error",
        message: "Provider unavailable",
        statusCode: 500,
      },
      headers: {},
    });
    await sendPendingWebhookNotifications(
      testDb.db,
      "test-key",
      firstAttemptAt
    );
    expect((await findNotifications(f.endpoint.id))[0]).toMatchObject({
      status: "pending",
      firstAttemptAt,
      attemptCount: 1,
    });
    await sendPendingWebhookNotifications(
      testDb.db,
      "test-key",
      new Date(firstAttemptAt.getTime() + 3_600_000)
    );
    expect((await findNotifications(f.endpoint.id))[0]).toMatchObject({
      status: "pending",
      firstAttemptAt,
      attemptCount: 2,
    });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    await sendPendingWebhookNotifications(
      testDb.db,
      "test-key",
      new Date(firstAttemptAt.getTime() + 23 * 3_600_000)
    );
    expect((await findNotifications(f.endpoint.id))[0]).toMatchObject({
      status: "failed",
      firstAttemptAt,
      claimedAt: null,
      lastError: expect.stringContaining("automatic retries stopped"),
    });
    expect((await findEndpoint(f.endpoint.id))?.lastFailureEmailAt).toBeNull();
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    await sendPendingWebhookNotifications(
      testDb.db,
      "test-key",
      new Date(firstAttemptAt.getTime() + 48 * 3_600_000)
    );
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(await findNotifications(f.endpoint.id)).toHaveLength(1);
  });

  it("requires a new failure after the warning grace and atomically reserves disablement", async () => {
    const f = await failingFixture();
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    await sendPendingWebhookNotifications(testDb.db, "test-key");
    const warnedAt = new Date(Date.now() - WEBHOOK_FAILURE_DISABLE_MS - 60_000);
    await testDb.db
      .update(webhookEndpoint)
      .set({
        lastFailureEmailAt: warnedAt,
        lastFailureAt: new Date(warnedAt.getTime() + 1000),
      })
      .where(eq(webhookEndpoint.id, f.endpoint.id));
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    expect((await findEndpoint(f.endpoint.id))?.enabled).toBe(true);
    await testDb.db
      .update(webhookEndpoint)
      .set({ lastFailureAt: new Date() })
      .where(eq(webhookEndpoint.id, f.endpoint.id));
    await testDb.db.execute(
      sql`CREATE FUNCTION reject_disabled_notice() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind = 'disabled' THEN RAISE EXCEPTION 'forced notification failure'; END IF; RETURN NEW; END $$`
    );
    await testDb.db.execute(
      sql`CREATE TRIGGER reject_disabled_notice BEFORE INSERT ON webhook_notification FOR EACH ROW EXECUTE FUNCTION reject_disabled_notice()`
    );
    try {
      await queueWebhookFailureNotifications(testDb.db, APP_URL);
      expect((await findEndpoint(f.endpoint.id))?.enabled).toBe(true);
      expect(await findNotifications(f.endpoint.id)).toHaveLength(1);
    } finally {
      await testDb.db.execute(
        sql`DROP TRIGGER reject_disabled_notice ON webhook_notification`
      );
      await testDb.db.execute(sql`DROP FUNCTION reject_disabled_notice()`);
    }
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    expect(await findEndpoint(f.endpoint.id)).toMatchObject({
      enabled: false,
      disabledAt: expect.any(Date),
      disabledReason: expect.stringContaining("HTTP 503"),
    });
    const notices = await findNotifications(f.endpoint.id);
    expect(notices).toHaveLength(2);
    expect(notices.find((notice) => notice.kind === "disabled")).toMatchObject({
      status: "pending",
    });
    await sendPendingWebhookNotifications(testDb.db, "test-key");
    expect(mocks.sendEmail.mock.calls[1]?.[1].stage).toBe("disabled");
  });

  it("clears recovered incidents and cancels pending warnings before sending", async () => {
    const f = await failingFixture();
    await queueWebhookFailureNotifications(testDb.db, APP_URL);
    await testDb.db.transaction((tx) =>
      recordWebhookEndpointOutcome(tx, {
        endpointId: f.endpoint.id,
        url: f.endpoint.url,
        observedAt: new Date(),
        success: true,
        isTest: false,
      })
    );
    expect(await findEndpoint(f.endpoint.id)).toMatchObject({
      consecutiveFailures: 0,
      failureStartedAt: null,
      failureIncidentId: null,
      lastFailureEmailAt: null,
    });
    expect((await findNotifications(f.endpoint.id))[0]?.status).toBe(
      "cancelled"
    );
    await sendPendingWebhookNotifications(testDb.db, "test-key");
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
