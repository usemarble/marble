import { getDemoPostPublishedPayload } from "@marble/events";
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = session.session.activeOrganizationId;

  if (!workspaceId) {
    return NextResponse.json({ error: "No active workspace" }, { status: 400 });
  }

  const apiUrl = process.env.MARBLE_API_URL;
  const systemSecret = process.env.SYSTEM_SECRET;

  if (!apiUrl || !systemSecret) {
    return NextResponse.json(
      { error: "Webhook test delivery is not configured" },
      { status: 500 }
    );
  }

  const { id } = await params;
  let response: Response;

  try {
    response = await fetch(`${apiUrl}/internal/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-System-Secret": systemSecret,
      },
      body: JSON.stringify({
        type: "post_published",
        workspaceId,
        source: "dashboard",
        resourceType: "post",
        resourceId: "test",
        actorType: "user",
        actorId: session.user.id,
        payload: getDemoPostPublishedPayload(),
        isTest: true,
        targetWebhookEndpointId: id,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to send test webhook",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json(
      result ?? { error: "Failed to send test webhook" },
      { status: response.status }
    );
  }

  return NextResponse.json(result, { status: 202 });
}
