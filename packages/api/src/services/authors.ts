import { createRecordId } from "@marble/db/id";
import {
  authorSocial,
  author as authorTable,
  subscription,
} from "@marble/db/schema";
import { toAuthorPayload, withChanges } from "@marble/events";
import { getWorkspacePlan, PLAN_LIMITS } from "@marble/utils";
import { and, asc, count, desc, eq, gt, ne, or } from "drizzle-orm";
import type { ServiceContext } from "../context";
import { authorSchema } from "../lib/author-validation";
import { transact } from "../lib/transaction";

export class AuthorError extends Error {
  readonly status: 400 | 403 | 404 | 409 | 500;
  readonly data?: Record<string, unknown>;
  constructor(
    status: 400 | 403 | 404 | 409 | 500,
    message: string,
    data?: Record<string, unknown>
  ) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
function parseAuthor(input: unknown) {
  const body = authorSchema.safeParse(input);
  if (!body.success) {
    throw new AuthorError(400, "Invalid request body", {
      details: body.error.issues,
    });
  }
  return body.data;
}
function authorFailure(
  ctx: ServiceContext,
  error: unknown,
  message: string
): never {
  if (error instanceof AuthorError) {
    throw error;
  }
  ctx.log.error(error instanceof Error ? error : new Error(String(error)));
  throw new AuthorError(500, message);
}

export async function listAuthors(ctx: ServiceContext, workspaceId: string) {
  try {
    const authors = await ctx.db.query.author.findMany({
      where: and(
        eq(authorTable.workspaceId, workspaceId),
        eq(authorTable.isActive, true)
      ),
      columns: {
        id: true,
        name: true,
        image: true,
        role: true,
        bio: true,
        slug: true,
        email: true,
        userId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        socials: {
          columns: {
            id: true,
            url: true,
            platform: true,
          },
        },
      },
      orderBy: asc(authorTable.name),
    });

    return authors;
  } catch (error) {
    authorFailure(ctx, error, "Failed to fetch authors");
  }
}

export async function createAuthor(
  ctx: ServiceContext,
  workspaceId: string,
  actor: { id: string },
  input: unknown
) {
  try {
    const subscriptions = await ctx.db
      .select({
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
      })
      .from(subscription)
      .where(
        and(
          eq(subscription.workspaceId, workspaceId),
          or(
            eq(subscription.status, "active"),
            eq(subscription.status, "trialing"),
            and(
              eq(subscription.status, "canceled"),
              eq(subscription.cancelAtPeriodEnd, true),
              gt(subscription.currentPeriodEnd, new Date())
            )
          )
        )
      )
      .orderBy(desc(subscription.createdAt))
      .limit(1);

    const activeSubscription = subscriptions[0] || null;
    const currentPlan = getWorkspacePlan(activeSubscription);

    const planLimits = PLAN_LIMITS[currentPlan];
    if (planLimits.maxAuthors !== Number.MAX_SAFE_INTEGER) {
      const [authorsCount] = await ctx.db
        .select({ value: count() })
        .from(authorTable)
        .where(
          and(
            eq(authorTable.workspaceId, workspaceId),
            eq(authorTable.isActive, true)
          )
        );

      const existingAuthorsCount = authorsCount?.value ?? 0;

      if (existingAuthorsCount >= planLimits.maxAuthors) {
        throw new AuthorError(
          403,
          `Author limit reached. Your current plan allows ${planLimits.maxAuthors} author${planLimits.maxAuthors === 1 ? "" : "s"}.`
        );
      }
    }

    const values = parseAuthor(input);
    const { name, bio, role, email, image, slug, socials } = values;
    const validEmail = email === "" ? null : email;
    const existing = await ctx.db.query.author.findFirst({
      where: and(
        eq(authorTable.workspaceId, workspaceId),
        eq(authorTable.slug, slug)
      ),
    });
    if (existing) {
      throw new AuthorError(409, "Author with this name already exists");
    }
    return await transact(ctx, async ({ tx, emitEvent, invalidate }) => {
      const [authorRow] = await tx
        .insert(authorTable)
        .values({
          id: createRecordId(),
          name,
          slug,
          bio,
          role,
          email: validEmail,
          image,
          workspaceId,
          updatedAt: new Date(),
        })
        .returning();
      if (!authorRow) {
        throw new Error("Failed to create author");
      }
      const socialRows =
        socials && socials.length > 0
          ? await tx
              .insert(authorSocial)
              .values(
                socials.map((social) => ({
                  id: createRecordId(),
                  authorId: authorRow.id,
                  url: social.url,
                  platform: social.platform,
                  updatedAt: new Date(),
                }))
              )
              .returning()
          : [];
      const createdAuthor = { ...authorRow, socials: socialRows };
      await emitEvent({
        type: "author_created",
        workspaceId,
        source: "dashboard",
        resourceType: "author",
        resourceId: createdAuthor.id,
        actorType: "user",
        actorId: actor.id,
        payload: toAuthorPayload(createdAuthor),
      });
      invalidate(workspaceId, "authors");
      return createdAuthor;
    });
  } catch (error) {
    authorFailure(ctx, error, "Failed to create author");
  }
}

export async function updateAuthor(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actor: { id: string },
  input: unknown
) {
  try {
    const values = parseAuthor(input);
    const { name, bio, role, email, image, slug, socials } = values;
    const validEmail = email === "" ? null : email;
    const existing = await ctx.db.query.author.findFirst({
      where: and(
        eq(authorTable.id, id),
        eq(authorTable.workspaceId, workspaceId)
      ),
    });
    if (!existing) {
      throw new AuthorError(404, "Author not found");
    }
    const existingSlug = await ctx.db.query.author.findFirst({
      where: and(
        eq(authorTable.slug, slug),
        eq(authorTable.workspaceId, workspaceId),
        ne(authorTable.id, id)
      ),
    });
    if (existingSlug) {
      throw new AuthorError(409, "Slug already in use");
    }
    return await transact(ctx, async ({ tx, emitEvent, invalidate }) => {
      const [authorRow] = await tx
        .update(authorTable)
        .set({
          name,
          bio,
          role,
          email: validEmail,
          image,
          slug,
          updatedAt: new Date(),
        })
        .where(
          and(eq(authorTable.id, id), eq(authorTable.workspaceId, workspaceId))
        )
        .returning();
      if (!authorRow) {
        throw new Error("Author not found");
      }
      let socialRows: (typeof authorSocial.$inferSelect)[];
      if (typeof socials !== "undefined") {
        await tx.delete(authorSocial).where(eq(authorSocial.authorId, id));
        socialRows =
          socials.length > 0
            ? await tx
                .insert(authorSocial)
                .values(
                  socials.map((social) => ({
                    id: createRecordId(),
                    authorId: id,
                    url: social.url,
                    platform: social.platform,
                    updatedAt: new Date(),
                  }))
                )
                .returning()
            : [];
      } else {
        socialRows = await tx
          .select()
          .from(authorSocial)
          .where(eq(authorSocial.authorId, id));
      }
      const updatedAuthor = { ...authorRow, socials: socialRows };
      await emitEvent({
        type: "author_updated",
        workspaceId,
        source: "dashboard",
        resourceType: "author",
        resourceId: updatedAuthor.id,
        actorType: "user",
        actorId: actor.id,
        payload: withChanges(
          toAuthorPayload(updatedAuthor),
          Object.keys(values)
        ),
      });
      invalidate(workspaceId, "authors");
      return updatedAuthor;
    });
  } catch (error) {
    authorFailure(ctx, error, "Failed to update author");
  }
}

export async function deleteAuthor(
  ctx: ServiceContext,
  workspaceId: string,
  id: string,
  actor: { id: string }
) {
  if (!id) {
    throw new AuthorError(400, "Author ID is required");
  }
  try {
    const existing = await ctx.db.query.author.findFirst({
      where: and(
        eq(authorTable.id, id),
        eq(authorTable.workspaceId, workspaceId)
      ),
      with: { socials: true },
    });
    if (!existing) {
      throw new AuthorError(404, "Author not found");
    }
    return await transact(ctx, async ({ tx, emitEvent, invalidate }) => {
      const [deletedAuthor] = await tx
        .delete(authorTable)
        .where(
          and(eq(authorTable.id, id), eq(authorTable.workspaceId, workspaceId))
        )
        .returning();
      if (!deletedAuthor) {
        throw new AuthorError(404, "Author not found");
      }
      await emitEvent({
        type: "author_deleted",
        workspaceId,
        source: "dashboard",
        resourceType: "author",
        resourceId: id,
        actorType: "user",
        actorId: actor.id,
        payload: toAuthorPayload(existing),
      });
      invalidate(workspaceId, "authors");
      return deletedAuthor.id;
    });
  } catch (error) {
    authorFailure(ctx, error, "Failed to delete author");
  }
}
