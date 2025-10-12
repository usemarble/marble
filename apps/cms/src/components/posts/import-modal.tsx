"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { useQueryClient } from "@tanstack/react-query";
import matter from "gray-matter";
import { type Dispatch, type SetStateAction, useState } from "react";
import { z } from "zod";
import { Dropzone } from "@/components/shared/dropzone";
import { LoadingSpinner } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { checkPostSlugAvailable } from "@/lib/actions/checks";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PostImportValues } from "@/lib/validations/post";
import { ImportItemForm } from "./import-item-form";

const parseSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["published", "draft"]).optional(),
  publishedAt: z.union([z.string(), z.number(), z.date()]).optional(),
  category: z.string().optional(),
});

type ImportState = {
  file: File | null;
  status: "idle" | "parsing" | "ready" | "uploading" | "done" | "error";
  error?: string;
  parsedData?: Partial<PostImportValues>;
};

export function PostsImportModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [importState, setImportState] = useState<ImportState>({
    file: null,
    status: "idle",
  });
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  async function uploadSingleFile(payload: PostImportValues) {
    const isSlugAvailable = await checkPostSlugAvailable(
      payload.slug,
      workspaceId
    );
    if (!isSlugAvailable) {
      console.log("Slug is already taken");
      updateImportState({ status: "error", error: "Slug is already taken" });
      return;
    }
    const res = await fetch("/api/posts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to import post");
    }
    return await res.json();
  }

  function updateImportState(patch: Partial<ImportState>) {
    setImportState((prev) => ({ ...prev, ...patch }));
  }

  async function parseFile(file: File) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    try {
      updateImportState({ status: "parsing" });

      const raw = await file.text();
      let parsedData: Partial<PostImportValues> = {
        status: "draft",
        publishedAt: new Date(),
      };

      if (ext === "json") {
        const parsed = JSON.parse(raw);
        const obj = Array.isArray(parsed) ? parsed[0] : parsed;

        const validated = parseSchema.safeParse(obj);
        if (!validated.success) {
          updateImportState({
            status: "error",
            error: `Invalid JSON structure: ${validated.error.errors[0]?.message}`,
          });
          return;
        }

        const data = validated.data;
        parsedData = {
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          status: data.status || "draft",
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt)
            : new Date(),
          category: data.category || "",
        };
      } else if (ext === "md" || ext === "mdx") {
        const parsed = matter(raw);
        const fm = parsed.data ?? {};

        const validated = parseSchema.safeParse(fm);
        if (!validated.success) {
          updateImportState({
            status: "error",
            error: `Invalid frontmatter: ${validated.error.errors[0]?.message}`,
          });
          return;
        }

        const data = validated.data;
        parsedData = {
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          status: data.status || "draft",
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt)
            : new Date(),
          category: data.category || "",
        };
      } else {
        updateImportState({ status: "error", error: "Unsupported file type" });
        return;
      }

      updateImportState({ status: "ready", parsedData });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to process file";
      updateImportState({ status: "error", error: message });
    }
  }

  async function handleImportSuccess() {
    if (workspaceId) {
      await queryClient
        .invalidateQueries({ queryKey: QUERY_KEYS.POSTS(workspaceId) })
        .then(() => {
          setOpen(false);
          setImportState({ file: null, status: "idle" });
        })
        .catch(() => {
          setOpen(false);
          setImportState({ file: null, status: "idle" });
        });
      await queryClient.refetchQueries({
        queryKey: QUERY_KEYS.POSTS(workspaceId),
      });
    } else {
      setOpen(false);
      setImportState({ file: null, status: "idle" });
    }
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Import Content</DialogTitle>
        </DialogHeader>
        <div className="scrollbar-custom flex min-h-0 flex-col gap-4 overflow-y-auto">
          {importState.status === "idle" && (
            <Dropzone
              accept={{
                "text/markdown": [".md", ".mdx"],
                "application/json": [".json"],
              }}
              onFilesAccepted={(accepted) => {
                if (accepted.length > 0) {
                  const file = accepted[0];
                  if (file) {
                    updateImportState({ file, status: "parsing" });
                    parseFile(file);
                  }
                }
              }}
              placeholder={{
                idle: "Drag & drop a .md/.mdx/.json file, or click to select",
                active: "Drop the file here...",
                subtitle: "We will parse frontmatter and content",
              }}
            />
          )}

          {importState.status === "parsing" && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-sm">
                Parsing file...
              </div>
            </div>
          )}

          {importState.status === "uploading" && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <LoadingSpinner />
                <span>Importing...</span>
              </div>
            </div>
          )}

          {importState.status === "error" && (
            <div className="flex items-center justify-center py-8">
              <div className="text-destructive text-sm">
                {importState.error ?? "Error processing file"}
              </div>
            </div>
          )}

          {importState.status === "ready" &&
            importState.parsedData &&
            importState.file && (
              <ImportItemForm
                ext={(
                  importState.file.name.split(".").pop() || ""
                ).toLowerCase()}
                file={importState.file}
                initialData={importState.parsedData}
                name={importState.file.name}
                onStatusChange={(status, error) => {
                  updateImportState({ status, error });
                  if (status === "done") {
                    handleImportSuccess();
                  }
                }}
                onUpload={uploadSingleFile}
              />
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
