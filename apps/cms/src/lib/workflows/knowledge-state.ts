import { redis } from "@/lib/redis";

export type WorkflowStep =
  | "pending"
  | "scraping"
  | "crawling"
  | "validating"
  | "summarizing"
  | "saving"
  | "completed"
  | "error";

export type WorkflowLogEntry = {
  timestamp: number;
  step: WorkflowStep;
  message: string;
  level: "info" | "error" | "warn";
};

export type KnowledgeWorkflowState = {
  runId: string;
  workspaceId: string;
  websiteUrl: string;
  currentStep: WorkflowStep;
  startedAt: number;
  error?: string;
  logs: WorkflowLogEntry[];
};

const REDIS_KEY_PREFIX = "knowledge:workflow:";
const TTL_SECONDS = 3600;

export function getWorkflowKey(workspaceId: string): string {
  return `${REDIS_KEY_PREFIX}${workspaceId}`;
}

export async function getWorkflowState(
  workspaceId: string
): Promise<KnowledgeWorkflowState | null> {
  const key = getWorkflowKey(workspaceId);
  const state = await redis.get<KnowledgeWorkflowState>(key);
  return state;
}

export async function setWorkflowState(
  state: KnowledgeWorkflowState
): Promise<void> {
  const key = getWorkflowKey(state.workspaceId);
  await redis.set(key, state, { ex: TTL_SECONDS });
}

export async function addWorkflowLog(
  workspaceId: string,
  message: string,
  level: "info" | "error" | "warn" = "info"
): Promise<void> {
  const state = await getWorkflowState(workspaceId);
  if (state) {
    state.logs.push({
      timestamp: Date.now(),
      step: state.currentStep,
      message,
      level,
    });
    await setWorkflowState(state);
  }
}

export async function updateWorkflowStep(
  workspaceId: string,
  step: WorkflowStep,
  error?: string
): Promise<void> {
  const state = await getWorkflowState(workspaceId);
  if (state) {
    state.currentStep = step;
    state.logs.push({
      timestamp: Date.now(),
      step,
      message: error || `Step changed to: ${step}`,
      level: error ? "error" : "info",
    });
    if (error) {
      state.error = error;
    }
    await setWorkflowState(state);
  }
}

export async function clearWorkflowState(workspaceId: string): Promise<void> {
  const key = getWorkflowKey(workspaceId);
  await redis.del(key);
}

export const WORKFLOW_STEPS: { step: WorkflowStep; label: string }[] = [
  { step: "scraping", label: "Scraping" },
  { step: "crawling", label: "Crawling" },
  { step: "summarizing", label: "Analyzing" },
  { step: "saving", label: "Saving" },
];

export function getStepIndex(step: WorkflowStep): number {
  if (step === "pending") { return -1; }
  if (step === "completed") { return WORKFLOW_STEPS.length; }
  if (step === "error") { return -1; }
  return WORKFLOW_STEPS.findIndex((s) => s.step === step);
}
