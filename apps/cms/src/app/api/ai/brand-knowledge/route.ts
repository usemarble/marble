import { db } from "@marble/db";
import { type NextRequest, NextResponse } from "next/server";
import { start } from "workflow/api";
import { getServerSession } from "@/lib/auth/session";
import { brandKnowledgeWebsiteSchema } from "@/lib/validations/seo";
import {
  getWorkflowState,
  setWorkflowState,
} from "@/lib/workflows/brand-knowledge-state";
import { brandKnowledgeWorkflow } from "@/workflows/brand-knowledge";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const sessionData = await getServerSession();

  if (!sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

  const body = await req.json();
  const parsedBody = brandKnowledgeWebsiteSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsedBody.error.issues },
      { status: 400 }
    );
  }

  const { websiteUrl } = parsedBody.data;

  const existingWorkflow = await getWorkflowState(workspaceId);
  if (
    existingWorkflow &&
    existingWorkflow.currentStep !== "completed" &&
    existingWorkflow.currentStep !== "error"
  ) {
    return NextResponse.json(
      { error: "A workflow is already in progress" },
      { status: 409 }
    );
  }

  const run = await start(brandKnowledgeWorkflow, [{ workspaceId, websiteUrl }]);

  await setWorkflowState({
    runId: run.runId,
    workspaceId,
    websiteUrl,
    currentStep: "pending",
    startedAt: Date.now(),
    logs: [
      {
        timestamp: Date.now(),
        step: "pending",
        message: `Workflow started for ${websiteUrl}`,
        level: "info",
      },
    ],
  });

  return NextResponse.json({
    runId: run.runId,
    status: "started",
  });
}

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

  const workflowState = await getWorkflowState(workspaceId);

  if (
    workflowState &&
    workflowState.currentStep !== "completed" &&
    workflowState.currentStep !== "error"
  ) {
    return NextResponse.json({
      website: {
        id: workflowState.runId,
        url: workflowState.websiteUrl,
        description: {
          status: workflowState.currentStep,
        },
        createdAt: new Date(workflowState.startedAt).toISOString(),
        updatedAt: new Date(workflowState.startedAt).toISOString(),
      },
      workflowState,
    });
  }

  const brandKnowledge = await db.brandKnowledge.findFirst({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });

  if (!brandKnowledge) {
    return NextResponse.json({ website: null });
  }

  return NextResponse.json({
    website: {
      id: brandKnowledge.id,
      url: brandKnowledge.url,
      description: brandKnowledge.description,
      createdAt: brandKnowledge.createdAt.toISOString(),
      updatedAt: brandKnowledge.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const sessionData = await getServerSession();

  if (!sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

  const body = await req.json();

  const { companyDescription, tone, audience } = body as {
    companyDescription?: string;
    tone?: string;
    audience?: string;
  };

  const existing = await db.brandKnowledge.findFirst({
    where: { workspaceId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "No brand knowledge found to update" },
      { status: 404 }
    );
  }

  const currentDescription = existing.description as Record<string, unknown>;

  const updated = await db.brandKnowledge.update({
    where: { id: existing.id },
    data: {
      description: {
        ...currentDescription,
        status: "completed",
        ...(companyDescription !== undefined && { summary: companyDescription }),
        ...(tone !== undefined && { tone }),
        ...(audience !== undefined && { audience }),
      },
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    website: {
      id: updated.id,
      url: updated.url,
      description: updated.description,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}
