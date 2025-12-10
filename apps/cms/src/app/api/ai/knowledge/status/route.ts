import { NextResponse } from "next/server";
import { getRun } from "workflow/api";
import { getServerSession } from "@/lib/auth/session";
import {
  getWorkflowState,
  updateWorkflowStep,
  addWorkflowLog,
} from "@/lib/workflows/knowledge-state";

export async function GET() {
  const sessionData = await getServerSession();

  if (!sessionData?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = sessionData.session.activeOrganizationId;

  const workflowState = await getWorkflowState(workspaceId);

  if (!workflowState) {
    return NextResponse.json({ status: "idle", logs: [] });
  }

  if (
    workflowState.currentStep !== "completed" &&
    workflowState.currentStep !== "error"
  ) {
    try {
      const run = getRun(workflowState.runId);
      const status = await run.status;

      if (status === "failed") {
        await addWorkflowLog(workspaceId, "Workflow failed unexpectedly", "error");
        await updateWorkflowStep(workspaceId, "error", "Workflow failed");
        const updatedState = await getWorkflowState(workspaceId);
        return NextResponse.json({
          status: "error",
          runId: workflowState.runId,
          websiteUrl: workflowState.websiteUrl,
          startedAt: workflowState.startedAt,
          error: "Workflow failed. Please try again.",
          logs: updatedState?.logs ?? [],
        });
      }
    } catch {
      // ignore - getRun may fail if run doesn't exist
    }
  }

  return NextResponse.json({
    status: workflowState.currentStep,
    runId: workflowState.runId,
    websiteUrl: workflowState.websiteUrl,
    startedAt: workflowState.startedAt,
    error: workflowState.error,
    logs: workflowState.logs ?? [],
  });
}

