"use client";

import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { DownloadSimpleIcon, FileArchiveIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SettingsSection } from "@/components/settings/section";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
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
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { data } = useQuery({
    ...orpc.data.exports.list.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
    }),
    enabled: !!workspaceId,
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
    ...orpc.data.exports.create.mutationOptions(),
    onSuccess: async () => {
      toast.success("Export started");
      if (workspaceId) {
        await queryClient.invalidateQueries({
          queryKey: orpc.data.exports.list.key({ input: { workspaceId } }),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  const { mutate: downloadExport } = useMutation({
    ...orpc.data.exports.download.mutationOptions(),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
    onError: (error) => toast.error(error.message),
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
            onClick={() => workspaceId && startExport({ workspaceId })}
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
                  onClick={() =>
                    workspaceId && downloadExport({ workspaceId, id: job.id })
                  }
                  size="sm"
                  variant="secondary"
                >
                  <DownloadSimpleIcon className="size-4" />
                  Download
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </SettingsSection>
  );
}
