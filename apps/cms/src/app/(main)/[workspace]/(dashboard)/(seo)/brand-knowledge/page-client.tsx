"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { Textarea } from "@marble/ui/components/textarea";
import { toast } from "@marble/ui/components/sonner";
import {
  ArrowClockwiseIcon,
  BugIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckIcon,
  GearIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import PageLoader from "@/components/shared/page-loader";
import {
  WorkflowStepper,
  type WorkflowStepItem,
} from "@/components/shared/workflow-stepper";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type BrandKnowledgeWebsiteValues,
  brandKnowledgeWebsiteSchema,
} from "@/lib/validations/seo";
import type {
  WorkflowStep,
  WorkflowLogEntry,
} from "@/lib/workflows/brand-knowledge-state";

const TONE_OPTIONS = [
  "Professional",
  "Humorous",
  "Academic",
  "Persuasive",
  "Conversational",
  "Technical",
] as const;

type BrandKnowledgeDescription =
  | { status: "pending" }
  | { status: "crawling" }
  | { status: "validating" }
  | { status: "summarizing" }
  | { status: "saving" }
  | {
      status: "completed";
      summary: string;
      tone: string;
      audience: string;
    }
  | {
      status: "error";
      error: string;
    };

type BrandKnowledgeWebsite = {
  id: string;
  url: string;
  description: BrandKnowledgeDescription | null;
  createdAt: string;
  updatedAt: string;
};

type WorkflowStatusResponse = {
  status: WorkflowStep | "idle";
  runId?: string;
  websiteUrl?: string;
  startedAt?: number;
  error?: string;
  logs?: WorkflowLogEntry[];
};

const WORKFLOW_STEPS: { step: WorkflowStep; label: string }[] = [
  { step: "crawling", label: "Crawling website" },
  { step: "validating", label: "Validating content" },
  { step: "summarizing", label: "Analyzing brand" },
  { step: "saving", label: "Saving results" },
];

function getStepperItems(currentStep: WorkflowStep): WorkflowStepItem[] {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.step === currentStep);

  return WORKFLOW_STEPS.map((step, index) => {
    let status: WorkflowStepItem["status"] = "pending";

    if (currentStep === "error") {
      status = index <= currentIndex ? "error" : "pending";
    } else if (currentStep === "completed") {
      status = "completed";
    } else if (index < currentIndex) {
      status = "completed";
    } else if (index === currentIndex) {
      status = "active";
    }

    return {
      id: step.step,
      label: step.label,
      status,
    };
  });
}

export function BrandKnowledgeWebsiteSheet({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandKnowledgeWebsiteValues>({
    resolver: zodResolver(brandKnowledgeWebsiteSchema),
    defaultValues: {
      websiteUrl: "",
    },
  });

  const { mutate: saveWebsite, isPending } = useMutation({
    mutationFn: async (data: BrandKnowledgeWebsiteValues) => {
      const res = await fetch("/api/ai/brand-knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start workflow");
      }

      return (await res.json()) as { runId: string; status: string };
    },
    onSuccess: () => {
      toast.success("Workflow started");
      reset();
      setOpen(false);
      onSuccess?.();
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.BRAND_KNOWLEDGE(workspaceId),
        });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to start workflow";
      toast.error(message);
    },
  });

  const onSubmit = (data: BrandKnowledgeWebsiteValues) => {
    saveWebsite(data);
  };

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)} type="button">
        <LinkSimpleIcon className="size-4" />
        Link website
      </Button>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="p-8 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center font-medium">
              Link your website
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add your website URL so Marble can learn about your brand.
            </DialogDescription>
          </DialogHeader>
          <form
            className="mt-2 flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid flex-1 gap-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                placeholder="https://your-website.com"
                {...register("websiteUrl")}
              />
              {errors.websiteUrl && (
                <p className="text-destructive text-sm">
                  {errors.websiteUrl.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <AsyncButton
                className="w-full"
                isLoading={isPending}
                type="submit"
              >
                Analyze website
              </AsyncButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DebugPanel({ logs }: { logs: WorkflowLogEntry[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed bg-muted/30">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <BugIcon className="size-4" />
          Debug Logs ({logs.length})
        </span>
        {isExpanded ? (
          <CaretUpIcon className="size-4 text-muted-foreground" />
        ) : (
          <CaretDownIcon className="size-4 text-muted-foreground" />
        )}
      </button>
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto border-t px-4 py-3">
          <div className="space-y-2 font-mono text-xs">
            {logs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className="flex items-start gap-2"
              >
                <span className="shrink-0 text-muted-foreground">
                  {format(new Date(log.timestamp), "HH:mm:ss")}
                </span>
                <span
                  className={
                    log.level === "error"
                      ? "text-destructive"
                      : log.level === "warn"
                        ? "text-amber-500"
                        : "text-foreground"
                  }
                >
                  {log.level === "error" && (
                    <WarningCircleIcon className="mr-1 inline size-3" />
                  )}
                  [{log.step}] {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkflowProgress({
  websiteUrl,
  currentStep,
  logs = [],
  error,
}: {
  websiteUrl: string;
  currentStep: WorkflowStep;
  logs?: WorkflowLogEntry[];
  error?: string;
}) {
  const steps = getStepperItems(currentStep);

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-6 flex flex-col gap-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {currentStep === "error" ? "Failed" : "Analyzing"}
          </p>
          <p className="truncate text-sm font-medium">{websiteUrl}</p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <WorkflowStepper steps={steps} />
        <DebugPanel logs={logs} />
      </div>
    </div>
  );
}

function EditableKnowledge({
  website,
  onCancel,
  onSave,
}: {
  website: BrandKnowledgeWebsite;
  onCancel: () => void;
  onSave: () => void;
}) {
  const description = website.description as {
    status: "completed";
    summary: string;
    tone: string;
    audience: string;
  };

  const [companyDescription, setCompanyDescription] = useState(
    description.summary
  );
  const [tone, setTone] = useState(description.tone);
  const [audience, setAudience] = useState(description.audience);

  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: saveChanges, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/brand-knowledge", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyDescription,
          tone,
          audience,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save changes");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Changes saved");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.BRAND_KNOWLEDGE(workspaceId),
        });
      }
      onSave();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to save changes";
      toast.error(message);
    },
  });

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Website
          </p>
          <p className="text-sm font-medium">{website.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onCancel}
            size="sm"
            type="button"
            variant="outline"
          >
            <XIcon className="size-4" />
            Cancel
          </Button>
          <AsyncButton
            isLoading={isPending}
            onClick={() => saveChanges()}
            size="sm"
            type="button"
          >
            <CheckIcon className="size-4" />
            Save changes
          </AsyncButton>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <div className="grid gap-2">
          <Label htmlFor="tone">Tone</Label>
          <Select onValueChange={setTone} value={tone}>
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="companyDescription">Company Description</Label>
          <Textarea
            id="companyDescription"
            onChange={(e) => setCompanyDescription(e.target.value)}
            placeholder="Describe your company..."
            rows={4}
            value={companyDescription}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="audience">Target Audience</Label>
          <Textarea
            id="audience"
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Describe your target audience..."
            rows={2}
            value={audience}
          />
        </div>
      </div>
    </div>
  );
}

function CompletedKnowledge({ website }: { website: BrandKnowledgeWebsite }) {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const description = website.description as {
    status: "completed";
    summary: string;
    tone: string;
    audience: string;
  };

  const lastUpdated = formatDistanceToNow(new Date(website.updatedAt), {
    addSuffix: true,
  });

  const { mutate: refreshKnowledge, isPending: isRefreshing } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/brand-knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteUrl: website.url }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to refresh");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Refreshing brand knowledge...");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.BRAND_KNOWLEDGE(workspaceId),
        });
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to refresh";
      toast.error(message);
    },
  });

  if (isEditing) {
    return (
      <EditableKnowledge
        onCancel={() => setIsEditing(false)}
        onSave={() => setIsEditing(false)}
        website={website}
      />
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Website
          </p>
          <p className="text-sm font-medium">{website.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Updated {lastUpdated}
          </span>
          <AsyncButton
            isLoading={isRefreshing}
            onClick={() => refreshKnowledge()}
            size="sm"
            type="button"
            variant="outline"
          >
            <ArrowClockwiseIcon className="size-4" />
            Refresh
          </AsyncButton>
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <PencilSimpleIcon className="size-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
            Tone
          </p>
          <span className="inline-flex rounded-full border bg-muted px-3 py-1 text-xs font-medium">
            {description.tone}
          </span>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Company Description
          </p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {description.summary}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Target Audience
          </p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {description.audience}
          </p>
        </div>
      </div>
    </div>
  );
}

function PageClient() {
  const workspaceId = useWorkspaceId();
  const [isPolling, setIsPolling] = useState(false);

  const { data, isLoading, refetch } = useQuery<{
    website: BrandKnowledgeWebsite | null;
    workflowState?: {
      currentStep: WorkflowStep;
      websiteUrl: string;
      logs?: WorkflowLogEntry[];
      error?: string;
    };
  }>({
    queryKey: QUERY_KEYS.BRAND_KNOWLEDGE(workspaceId ?? ""),
    enabled: !!workspaceId,
    staleTime: 1000 * 60,
    refetchInterval: isPolling ? 2000 : false,
    queryFn: async () => {
      const res = await fetch("/api/ai/brand-knowledge");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load brand knowledge");
      }
      return res.json();
    },
  });

  const { data: statusData } = useQuery<WorkflowStatusResponse>({
    queryKey: [...QUERY_KEYS.BRAND_KNOWLEDGE(workspaceId ?? ""), "status"],
    enabled: !!workspaceId && isPolling,
    refetchInterval: isPolling ? 2000 : false,
    queryFn: async () => {
      const res = await fetch("/api/ai/brand-knowledge/status");
      if (!res.ok) {
        return { status: "idle" as const, logs: [] };
      }
      return res.json();
    },
  });

  const website = data?.website;
  const workflowState = data?.workflowState;
  const description = website?.description;

  const isWorkflowActive =
    workflowState &&
    workflowState.currentStep !== "completed" &&
    workflowState.currentStep !== "error";

  const isInProgress =
    description?.status &&
    !["completed", "error"].includes(description.status);

  const logs = statusData?.logs ?? workflowState?.logs ?? [];
  const workflowError = statusData?.error ?? workflowState?.error;

  useEffect(() => {
    setIsPolling(Boolean(isWorkflowActive || isInProgress));
  }, [isWorkflowActive, isInProgress]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isWorkflowActive && workflowState) {
    return (
      <WorkspacePageWrapper className="grid h-full place-content-center">
        <WorkflowProgress
          currentStep={workflowState.currentStep}
          error={workflowError}
          logs={logs}
          websiteUrl={workflowState.websiteUrl}
        />
      </WorkspacePageWrapper>
    );
  }

  if (website && description?.status === "completed") {
    return (
      <WorkspacePageWrapper className="grid h-full place-content-center">
        <CompletedKnowledge website={website} />
      </WorkspacePageWrapper>
    );
  }

  if (website && isInProgress && description) {
    return (
      <WorkspacePageWrapper className="grid h-full place-content-center">
        <WorkflowProgress
          currentStep={description.status as WorkflowStep}
          error={workflowError}
          logs={logs}
          websiteUrl={website.url}
        />
      </WorkspacePageWrapper>
    );
  }

  if (website && description?.status === "error") {
    return (
      <WorkspacePageWrapper className="grid h-full place-content-center">
        <div className="flex max-w-md flex-col items-center gap-4">
          <WorkflowProgress
            currentStep="error"
            error={
              workflowError ||
              (description as { error?: string }).error ||
              "An error occurred while analyzing your website."
            }
            logs={logs}
            websiteUrl={website.url}
          />
          <BrandKnowledgeWebsiteSheet onSuccess={() => refetch()} />
        </div>
      </WorkspacePageWrapper>
    );
  }

  return (
    <WorkspacePageWrapper className="grid h-full place-content-center">
      <div className="flex max-w-80 flex-col items-center gap-4">
        <div className="p-2">
          <GearIcon className="size-16" />
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm">
            Configure your brand knowledge settings to improve SEO and content
            quality.
          </p>
          <BrandKnowledgeWebsiteSheet onSuccess={() => refetch()} />
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;
