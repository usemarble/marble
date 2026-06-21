"use client";

import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { DownloadSimpleIcon, FileArchiveIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SettingsSection } from "@/components/settings/section";
import { AsyncButton } from "@/components/ui/async-button";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";
import { formatBytes } from "@/utils/string";

interface ExportJob {
  id: string;
  status: "queued" | "processing" | "ready" | "failed" | "expired";
  format: string;
  fileSize: number | null;
  expiresAt: string | null;
  createdAt: string;
  completedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
}

interface ExportListResponse {
  jobs: ExportJob[];
}

interface ExportCreateResponse {
  job: ExportJob;
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(job: ExportJob) {
  if (job.status === "ready") {
    const size = job.fileSize != null ? formatBytes(job.fileSize) : null;
    return size ? `Ready · ${size}` : "Ready";
  }

  if (job.status === "failed") {
    return job.errorMessage || "Failed";
  }

  if (job.status === "expired") {
    return "Expired";
  }

  return job.status === "queued" ? "Queued" : "Processing";
}

export function Export() {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const workspaceId = activeWorkspace?.id;

  const { data } = useQuery({
    enabled: !!workspaceId,
    queryKey: workspaceId ? QUERY_KEYS.EXPORTS(workspaceId) : ["exports"],
    queryFn: async () => {
      const response = await fetch("/api/exports");
      if (!response.ok) {
        throw new Error("Failed to load exports");
      }
      return (await response.json()) as ExportListResponse;
    },
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs ?? [];
      return jobs.some(
        (job) => job.status === "queued" || job.status === "processing"
      )
        ? 1000
        : false;
    },
  });

  const { mutate: startExport, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/exports", { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to start export");
      }
      return (await response.json()) as ExportCreateResponse;
    },
    onSuccess: async () => {
      toast.success("Export started");
      if (workspaceId) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.EXPORTS(workspaceId),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const latestJobs = data?.jobs ?? [];

  return (
    <SettingsSection
      description="Download posts, authors, categories, tags, custom fields, and media metadata as JSON."
      title="Export Workspace Data"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-col gap-3 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileArchiveIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">Create export</p>
              <p className="text-[13px] text-muted-foreground">
                Exports are available for 24 hours.
              </p>
            </div>
          </div>
          <AsyncButton
            className="w-26"
            isLoading={isPending}
            onClick={() => startExport()}
            size="sm"
          >
            Start Export
          </AsyncButton>
        </div>

        {latestJobs.slice(0, 3).map((job) => {
          const createdAt = formatDate(job.createdAt);
          return (
            <div
              className="flex flex-col gap-3 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              key={job.id}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm">{getStatusLabel(job)}</p>
                <p className="text-[13px] text-muted-foreground">
                  {createdAt ? `Created ${createdAt}` : "Created recently"}
                </p>
              </div>
              {job.status === "ready" && (
                <Button
                  nativeButton={false}
                  render={
                    <a href={`/api/exports/${job.id}/download`}>
                      <DownloadSimpleIcon className="size-4" />
                      Download
                    </a>
                  }
                  size="sm"
                  variant="secondary"
                />
              )}
            </div>
          );
        })}
      </div>
    </SettingsSection>
  );
}
