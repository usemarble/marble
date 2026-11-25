import { getIds } from "@databuddy/sdk";
import { env } from "@/env";

export async function saveRegistrationAttribution() {
  try {
    const params = new URLSearchParams(window.location.search);
    const { anonymousId, sessionId } = getIds();
    const attribution = {
      marketingAnonymousId: params.get("anonId"),
      marketingSessionId: params.get("sessionId"),
      appAnonymousId: anonymousId,
      appSessionId: sessionId,
    };
    if (!Object.values(attribution).some(Boolean)) {
      return;
    }

    await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/analytics/registration`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(attribution),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Continue with auth if attribution is unavailable.
  }
}
