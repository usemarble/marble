import "server-only";

import { Databuddy } from "@databuddy/sdk/node";

const MARKETING_WEBSITE_ID = process.env.NEXT_PUBLIC_DATABUDDY_WEB_CLIENT_ID;
const DASHBOARD_WEBSITE_ID = process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID;

function cookieValue(header: string | null | undefined, name: string) {
  const value = header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (!value) {
    return;
  }

  try {
    const decoded = decodeURIComponent(value);
    return /^[a-zA-Z0-9_-]{8,128}$/.test(decoded) ? decoded : undefined;
  } catch {
    return;
  }
}

export async function trackRegistrationCompleted({
  userId,
  cookieHeader,
  method,
}: {
  userId: string;
  cookieHeader?: string | null;
  method: "email" | "google" | "github" | "unknown";
}) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const apiKey = process.env.DATABUDDY_API_KEY?.trim();
  if (!apiKey) {
    console.warn("DATABUDDY_API_KEY is missing; registration was not tracked");
    return;
  }

  const marketingAnonymousId = cookieValue(cookieHeader, "marble_marketing_id");
  const marketingSessionId = cookieValue(
    cookieHeader,
    "marble_marketing_session"
  );
  const appAnonymousId = cookieValue(cookieHeader, "marble_app_id");
  const appSessionId = cookieValue(cookieHeader, "marble_app_session");
  const dashboardWebsiteId = DASHBOARD_WEBSITE_ID;
  const destinations = [
    ...(dashboardWebsiteId
      ? [
          {
            websiteId: dashboardWebsiteId,
            anonymousId: appAnonymousId,
            sessionId: appSessionId,
          },
        ]
      : []),
    ...(marketingAnonymousId && MARKETING_WEBSITE_ID
      ? [
          {
            websiteId: MARKETING_WEBSITE_ID,
            anonymousId: marketingAnonymousId,
            sessionId: marketingSessionId,
          },
        ]
      : []),
  ];
  if (destinations.length === 0) {
    return;
  }

  const client = new Databuddy({
    apiKey,
    enableBatching: false,
    source: "auth",
  });
  await Promise.all(
    destinations.map(async ({ websiteId, anonymousId, sessionId }) => {
      try {
        const result = await client.track({
          websiteId,
          name: "registration_completed",
          eventId: `registration:${websiteId}:${userId}`,
          anonymousId,
          sessionId,
          properties: { method },
        });
        if (!result.success) {
          console.error("Databuddy registration event failed", result.error);
        }
      } catch (error) {
        console.error("Databuddy registration event failed", error);
      }
    })
  );
}
