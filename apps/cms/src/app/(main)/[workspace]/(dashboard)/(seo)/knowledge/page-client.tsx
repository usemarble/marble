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
import { toast } from "@marble/ui/components/sonner";
import { Textarea } from "@marble/ui/components/textarea";
import { cn } from "@marble/ui/lib/utils";
import {
  ArrowClockwiseIcon,
  ArrowRightIcon,
  BugIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CheckIcon,
  GearIcon,
  GlobeIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { WorkspacePageWrapper } from "@/components/layout/wrapper";
import {
  type HorizontalStepItem,
  HorizontalStepper,
} from "@/components/shared/horizontal-stepper";
import PageLoader from "@/components/shared/page-loader";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type KnowledgeWebsiteValues,
  knowledgeWebsiteSchema,
} from "@/lib/validations/seo";
import type {
  WorkflowLogEntry,
  WorkflowStep,
} from "@/lib/workflows/knowledge-state";
import { getDomain, getFaviconUrl } from "@/utils/favicon";

const TONE_OPTIONS = [
  "Professional",
  "Humorous",
  "Academic",
  "Persuasive",
  "Conversational",
  "Technical",
] as const;

type KnowledgeDescription =
  | { status: "pending" }
  | { status: "scraping" }
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

type KnowledgeWebsite = {
  id: string;
  url: string;
  description: KnowledgeDescription | null;
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
  { step: "scraping", label: "Scraping" },
  { step: "crawling", label: "Crawling" },
  { step: "summarizing", label: "Analyzing" },
  { step: "saving", label: "Saving" },
];

function getStepperItems(currentStep: WorkflowStep): HorizontalStepItem[] {
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.step === currentStep);

  return WORKFLOW_STEPS.map((step, index) => {
    let status: HorizontalStepItem["status"] = "pending";

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

type ModalStep = "url" | "progress" | "complete";

function WebsiteFavicon({
  url,
  size = 32,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const faviconUrl = getFaviconUrl(url);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-muted",
          className
        )}
        style={{ width: size, height: size }}
      >
        <GlobeIcon className="size-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      alt=""
      className={cn("rounded-lg", className)}
      height={size}
      onError={() => setError(true)}
      src={faviconUrl}
      width={size}
    />
  );
}

export function KnowledgeWebsiteModal({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("url");
  const [isPolling, setIsPolling] = useState(false);
  const [submittedUrl, setSubmittedUrl] = useState<string>("");

  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<KnowledgeWebsiteValues>({
    resolver: zodResolver(knowledgeWebsiteSchema),
    defaultValues: {
      websiteUrl: "",
      additionalUrls: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "additionalUrls" as never,
  });

  const { data: statusData, refetch: refetchStatus } =
    useQuery<WorkflowStatusResponse>({
      queryKey: [...QUERY_KEYS.KNOWLEDGE(workspaceId ?? ""), "status"],
      enabled: !!workspaceId && isPolling,
      refetchInterval: isPolling ? 2000 : false,
      queryFn: async () => {
        const res = await fetch("/api/ai/knowledge/status");
        if (!res.ok) {
          return { status: "idle" as const, logs: [] };
        }
        return res.json();
      },
    });

  const { mutate: saveWebsite, isPending } = useMutation({
    mutationFn: async (data: KnowledgeWebsiteValues) => {
      const res = await fetch("/api/ai/knowledge", {
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
    onSuccess: (_result, variables) => {
      setSubmittedUrl(variables.websiteUrl);
      setModalStep("progress");
      setIsPolling(true);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to start workflow";
      toast.error(message);
    },
  });

  const currentStep = statusData?.status ?? "pending";
  const workflowLogs = statusData?.logs ?? [];
  const workflowError = statusData?.error;

  useEffect(() => {
    if (currentStep === "completed") {
      setIsPolling(false);
      setModalStep("complete");
    } else if (currentStep === "error") {
      setIsPolling(false);
    }
  }, [currentStep]);

  const onSubmit = (data: KnowledgeWebsiteValues) => {
    const filteredUrls = (data.additionalUrls ?? []).filter(
      (url) => url.trim() !== ""
    );
    saveWebsite({
      ...data,
      additionalUrls: filteredUrls,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setModalStep("url");
    setIsPolling(false);
    reset();
    if (currentStep === "completed") {
      onSuccess?.();
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.KNOWLEDGE(workspaceId),
        });
      }
    }
  };

  const handleFinish = () => {
    handleClose();
    onSuccess?.();
    if (workspaceId) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.KNOWLEDGE(workspaceId),
      });
    }
  };

  const watchedUrl = watch("websiteUrl");

  return (
    <>
      <Button className="gap-2" onClick={() => setOpen(true)} type="button">
        <LinkSimpleIcon className="size-4" />
        Link website
      </Button>
      <Dialog onOpenChange={handleClose} open={open}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          {modalStep === "url" && (
            <>
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="text-center font-medium text-lg">
                  Link your website
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground">
                  We&apos;ll analyze your website to understand your brand.
                </DialogDescription>
              </DialogHeader>
              <form
                className="flex flex-col gap-6 px-6 pb-6"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="websiteUrl">Main website URL</Label>
                    <div className="relative">
                      {watchedUrl && (
                        <div className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3">
                          <WebsiteFavicon url={watchedUrl} />
                        </div>
                      )}
                      <Input
                        className={cn(watchedUrl && "pl-10")}
                        id="websiteUrl"
                        placeholder="https://your-website.com"
                        {...register("websiteUrl")}
                      />
                    </div>
                    {errors.websiteUrl && (
                      <p className="text-destructive text-sm">
                        {errors.websiteUrl.message}
                      </p>
                    )}
                  </div>

                  {fields.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <Label>Additional pages to crawl</Label>
                      {fields.map((field, index) => (
                        <div className="flex gap-2" key={field.id}>
                          <Input
                            placeholder="https://your-website.com/about"
                            {...register(`additionalUrls.${index}` as const)}
                          />
                          <Button
                            onClick={() => remove(index)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    className="w-full gap-2"
                    onClick={() => append("" as never)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <PlusIcon className="size-4" />
                    Add additional page
                  </Button>
                  <p className="text-center text-muted-foreground text-xs">
                    Add pages like /about, /pricing, or /team for better
                    analysis
                  </p>
                </div>

                <DialogFooter>
                  <AsyncButton
                    className="w-full gap-2"
                    isLoading={isPending}
                    type="submit"
                  >
                    Start analysis
                    <ArrowRightIcon className="size-4" />
                  </AsyncButton>
                </DialogFooter>
              </form>
            </>
          )}

          {modalStep === "progress" && (
            <div className="flex flex-col">
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="sr-only">
                  Analyzing your website
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Please wait while we analyze your website.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-8">
                <div className="mb-8 flex flex-col items-center gap-3">
                  <WebsiteFavicon
                    className="shadow-lg"
                    url={submittedUrl}
                  />
                  <div className="flex flex-col items-center gap-1">
                    <p className="font-medium">{getDomain(submittedUrl)}</p>
                    <p className="text-muted-foreground text-xs">
                      {currentStep === "error"
                        ? "Analysis failed"
                        : "Analyzing..."}
                    </p>
                  </div>
                </div>

                <HorizontalStepper
                  className="mb-6"
                  steps={getStepperItems(currentStep as WorkflowStep)}
                />

                {workflowError && (
                  <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                    <p className="text-destructive text-sm">{workflowError}</p>
                  </div>
                )}

                <DebugPanel logs={workflowLogs} />
              </div>

              {currentStep === "error" && (
                <div className="border-t bg-muted/30 px-6 py-4">
                  <Button
                    className="w-full"
                    onClick={() => setModalStep("url")}
                    type="button"
                    variant="outline"
                  >
                    Try again
                  </Button>
                </div>
              )}
            </div>
          )}

          {modalStep === "complete" && (
            <div className="flex flex-col">
              <DialogHeader className="sr-only">
                <DialogTitle>Analysis complete</DialogTitle>
                <DialogDescription>
                  Your knowledge has been saved.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-4 px-6 py-10">
                <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircleIcon
                    className="size-8 text-emerald-500"
                    weight="fill"
                  />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="font-medium text-lg">Analysis complete!</p>
                  <p className="max-w-xs text-muted-foreground text-sm">
                    We&apos;ve analyzed your website and saved the knowledge
                    to your workspace.
                  </p>
                </div>
              </div>

              <div className="border-t bg-muted/30 px-6 py-4">
                <Button className="w-full" onClick={handleFinish} type="button">
                  View results
                </Button>
              </div>
            </div>
          )}
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
    <div className="rounded-lg border border-dashed bg-muted/30">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
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
        <div className="max-h-48 overflow-y-auto border-t px-4 py-3">
          <div className="space-y-2 font-mono text-xs">
            {logs.map((log, index) => (
              <div
                className="flex items-start gap-2"
                key={`${log.timestamp}-${index}`}
              >
                <span className="shrink-0 text-muted-foreground">
                  {format(new Date(log.timestamp), "HH:mm:ss")}
                </span>
                <span
                  className={cn(
                    log.level === "error" && "text-destructive",
                    log.level === "warn" && "text-amber-500",
                    log.level === "info" && "text-foreground"
                  )}
                >
                  {log.level === "error" && (
                    <WarningCircleIcon className="mr-1 inline size-3" />
                  )}
                  {log.message}
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
    <div className="flex w-full max-w-lg flex-col gap-6">
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-8 flex items-center gap-4">
          <WebsiteFavicon className="shadow-md" size={48} url={websiteUrl} />
          <div className="flex flex-col gap-0.5">
            <p className="font-medium">{getDomain(websiteUrl)}</p>
            <p className="text-muted-foreground text-xs">
              {currentStep === "error" ? "Analysis failed" : "Analyzing..."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <HorizontalStepper className="mb-6" steps={steps} />
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
  website: KnowledgeWebsite;
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
      const res = await fetch("/api/ai/knowledge", {
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
          queryKey: QUERY_KEYS.KNOWLEDGE(workspaceId),
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
        <div className="flex items-center gap-3">
          <WebsiteFavicon size={32} url={website.url} />
          <div className="flex flex-col gap-0.5">
            <p className="font-medium text-sm">{getDomain(website.url)}</p>
            <p className="text-muted-foreground text-xs">Editing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onCancel} size="sm" type="button" variant="outline">
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

function CompletedKnowledge({ website }: { website: KnowledgeWebsite }) {
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
      const res = await fetch("/api/ai/knowledge", {
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
      toast.success("Refreshing knowledge...");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.KNOWLEDGE(workspaceId),
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
        <div className="flex items-center gap-3">
          <WebsiteFavicon size={32} url={website.url} />
          <div className="flex flex-col gap-0.5">
            <p className="font-medium text-sm">{getDomain(website.url)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
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
          <p className="mb-1 font-medium text-muted-foreground text-xs uppercase">
            Tone
          </p>
          <span className="inline-flex rounded-full border bg-muted px-3 py-1 font-medium text-xs">
            {description.tone}
          </span>
        </div>

        <div>
          <p className="mb-2 font-medium text-muted-foreground text-xs uppercase">
            Company Description
          </p>
          <p className="whitespace-pre-line text-muted-foreground text-sm">
            {description.summary}
          </p>
        </div>

        <div>
          <p className="mb-2 font-medium text-muted-foreground text-xs uppercase">
            Target Audience
          </p>
          <p className="whitespace-pre-line text-muted-foreground text-sm">
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
    website: KnowledgeWebsite | null;
    workflowState?: {
      currentStep: WorkflowStep;
      websiteUrl: string;
      logs?: WorkflowLogEntry[];
      error?: string;
    };
  }>({
    queryKey: QUERY_KEYS.KNOWLEDGE(workspaceId ?? ""),
    enabled: !!workspaceId,
    staleTime: 1000 * 60,
    refetchInterval: isPolling ? 2000 : false,
    queryFn: async () => {
      const res = await fetch("/api/ai/knowledge");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load knowledge");
      }
      return res.json();
    },
  });

  const { data: statusData } = useQuery<WorkflowStatusResponse>({
    queryKey: [...QUERY_KEYS.KNOWLEDGE(workspaceId ?? ""), "status"],
    enabled: !!workspaceId && isPolling,
    refetchInterval: isPolling ? 2000 : false,
    queryFn: async () => {
      const res = await fetch("/api/ai/knowledge/status");
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
    description?.status && !["completed", "error"].includes(description.status);

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
          <KnowledgeWebsiteModal onSuccess={() => refetch()} />
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
            Configure your knowledge settings to improve SEO and content
            quality.
          </p>
          <KnowledgeWebsiteModal onSuccess={() => refetch()} />
        </div>
      </div>
    </WorkspacePageWrapper>
  );
}

export default PageClient;

