import { createClient } from "@marble/db/workers";
import { Hono } from "hono";
import { createPolarClient } from "../lib/polar";
import type { Env } from "../types/env";

const demo = new Hono<{ Bindings: Env }>();

/**
 * Demo route to test API key authentication
 * GET /post - Returns sample post data
 */
demo.get("/", async (c) => {
  const { DATABASE_URL, POLAR_ACCESS_TOKEN, ENVIRONMENT } = c.env;

  // Get workspace ID and API token from context (set by apiKeyAuth middleware)
  const workspaceId = c.get("workspaceId") as string;
  const apiKeyType = c.get("apiKeyType") as string;

  if (!DATABASE_URL) {
    return c.json({ error: "Database configuration error" }, 500);
  }

  try {
    const db = createClient(DATABASE_URL);

    // Get a sample post from the workspace
    const posts = await db.post.findMany({
      where: {
        workspaceId,
        status: "published",
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        publishedAt: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 5,
    });

    // Log usage event to database
    const usageTask = async () => {
      try {
        await db.usageEvent.create({
          data: {
            type: "api_request",
            workspaceId,
            endpoint: "/post",
          },
        });

        // Get customer ID for Polar
        let customerId = workspaceId;
        const organization = await db.organization.findFirst({
          where: { id: workspaceId },
          select: {
            members: {
              where: { role: "owner" },
              select: { userId: true },
            },
          },
        });

        if (organization?.members[0]?.userId) {
          customerId = organization.members[0].userId;
        }

        // Log to Polar
        if (POLAR_ACCESS_TOKEN) {
          const isProduction = ENVIRONMENT === "production";
          const polar = createPolarClient(POLAR_ACCESS_TOKEN, isProduction);
          try {
            await polar.events.ingest({
              events: [
                {
                  name: "api_request",
                  externalCustomerId: customerId,
                  metadata: {
                    endpoint: "/post",
                    method: "GET",
                    apiKeyType,
                  },
                },
              ],
            });
          } catch (polarError) {
            console.error("[Demo] Polar ingestion error:", polarError);
          }
        }
      } catch (err) {
        console.error("[Demo] Usage logging error:", err);
      }
    };

    // Execute usage logging asynchronously
    c.executionCtx?.waitUntil(usageTask());

    return c.json({
      success: true,
      workspace: workspaceId,
      apiKeyType,
      posts,
      meta: {
        count: posts.length,
        endpoint: "/post",
      },
    });
  } catch (error) {
    console.error("[Demo] Error fetching posts:", error);
    return c.json({ error: "Failed to fetch posts" }, 500);
  }
});

export default demo;
