"use client";

import { FileImportIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PostsImportModal } from "@/components/posts/import-modal";
import { SettingsSection } from "@/components/settings/section";
import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

interface ImportJob {
  id: string;
  source: "file" | "url";
  status:
    | "queued"
    | "discovering"
    | "processing"
    | "review"
    | "importing"
    | "completed"
    | "failed";
  format: string | null;
  sourceUrl: string | null;
  totalItems: number;
  readyItems: number;
  errorItems: number;
  importedItems: number;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface ImportListResponse {
  jobs: ImportJob[];
}

interface Category {
  id: string;
  slug: string;
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

function getImportStatusLabel(job: ImportJob) {
  if (job.status === "completed") {
    const count = job.importedItems || job.totalItems;
    return count === 1 ? "Imported 1 draft" : `Imported ${count} drafts`;
  }

  if (job.status === "failed") {
    return job.errorMessage || "Import failed";
  }

  if (job.status === "review") {
    return "Ready to review";
  }

  if (job.status === "importing") {
    return "Importing";
  }

  return job.status === "queued" ? "Queued" : "Processing";
}

function isActiveImportStatus(status: ImportJob["status"]) {
  return (
    status === "queued" ||
    status === "discovering" ||
    status === "processing" ||
    status === "importing"
  );
}

function getImportedPostsHref(workspaceSlug: string, categoryId?: string) {
  const params = new URLSearchParams({ status: "draft" });

  if (categoryId) {
    params.set("category", categoryId);
  }

  return `/${workspaceSlug}/posts?${params.toString()}`;
}

export function Import() {
  const [open, setOpen] = useState(false);
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id;
  const workspaceSlug = activeWorkspace?.slug;

  const { data, isError } = useQuery({
    enabled: !!workspaceId,
    queryKey: workspaceId ? QUERY_KEYS.IMPORTS(workspaceId) : ["imports"],
    queryFn: async () => {
      const response = await fetch("/api/data/import");
      if (!response.ok) {
        throw new Error("Failed to load imports");
      }
      return (await response.json()) as ImportListResponse;
    },
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs ?? [];
      return jobs.some((job) => isActiveImportStatus(job.status))
        ? 1000
        : false;
    },
  });

  const { data: categories = [] } = useQuery({
    enabled: !!workspaceId,
    queryKey: workspaceId
      ? QUERY_KEYS.CATEGORIES(workspaceId)
      : ["categories", "imports"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to load categories");
      }
      return (await response.json()) as Category[];
    },
  });

  const latestJobs = data?.jobs ?? [];
  const uncategorizedCategoryId = categories.find(
    (category) => category.slug === "uncategorized"
  )?.id;

  return (
    <>
      <SettingsSection
        description="Bring existing content into Marble as draft posts."
        title="Import Content"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-3 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <HugeiconsIcon
                  icon={FileImportIcon}
                  size={16}
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Import posts</p>
                <p className="text-[13px] text-muted-foreground">
                  Upload Markdown files now. URL imports are coming later.
                </p>
              </div>
            </div>
            <Button onClick={() => setOpen(true)} size="sm">
              Import
            </Button>
          </div>

          {latestJobs.slice(0, 3).map((job) => {
            const createdAt = formatDate(job.createdAt);
            const isActive = isActiveImportStatus(job.status);

            return (
              <div
                className="flex flex-col gap-3 rounded-[14px] bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                key={job.id}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-sm">
                      {getImportStatusLabel(job)}
                    </p>
                    {isActive && (
                      <ActivityIndicator className="size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {createdAt ? `Created ${createdAt}` : "Created recently"}
                  </p>
                </div>

                {job.status === "completed" && workspaceSlug && (
                  <Button
                    nativeButton={false}
                    render={
                      <Link
                        href={getImportedPostsHref(
                          workspaceSlug,
                          uncategorizedCategoryId
                        )}
                      >
                        View posts
                      </Link>
                    }
                    size="sm"
                    variant="secondary"
                  />
                )}
              </div>
            );
          })}

          {isError && (
            <div className="rounded-[14px] bg-background px-4 py-3.5">
              <p className="text-[13px] text-destructive">
                Failed to load imports.
              </p>
            </div>
          )}

          {latestJobs.length === 0 && !isError && (
            <div className="rounded-[14px] bg-background px-4 py-3.5">
              <p className="text-[13px] text-muted-foreground">
                Imports will appear here once started.
              </p>
            </div>
          )}
        </div>
      </SettingsSection>
      <PostsImportModal open={open} setOpen={setOpen} />
    </>
  );
}
