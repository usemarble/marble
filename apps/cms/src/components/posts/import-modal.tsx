"use client";

import { FileImportIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogX,
} from "@marble/ui/components/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import matter from "gray-matter";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Dropzone } from "@/components/shared/dropzone";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PostImportValues } from "@/lib/validations/post";
import { ImportItemForm } from "./import-item-form";

const parseSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  status: z.preprocess(
    (val) => (val === "published" ? "published" : "draft"),
    z.enum(["published", "draft"])
  ),
  publishedAt: z.union([z.string(), z.number(), z.date()]).optional(),
  category: z.string().optional(),
});

interface ImportState {
  file: File | null;
  status: "idle" | "parsing" | "ready" | "error";
  error?: string;
  parsedData?: Partial<PostImportValues>;
}

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

  const { mutate: importPost, isPending: isImporting } = useMutation({
    mutationFn: async (payload: PostImportValues) => {
      try {
        const res = await fetch("/api/posts/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to import post");
        }

        const responseData = await res.json();
        return responseData;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to import post"
        );
      }
    },
    onSuccess: async () => {
      toast.success("Post created");
      if (workspaceId) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.POSTS(workspaceId),
        });
      }
      setOpen(false);
      setImportState({ file: null, status: "idle" });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      updateImportState({ status: "error", error: error.message });
    },
  });

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

      if (ext === "md" || ext === "mdx") {
        const parsed = matter(raw);
        const fm = parsed.data ?? {};

        const validated = parseSchema.safeParse(fm);
        if (!validated.success) {
          updateImportState({
            status: "error",
            error: `Invalid frontmatter: ${validated.error.issues[0]?.message}`,
          });
          return;
        }

        const data = validated.data;
        parsedData = {
          title: data.title || "",
          slug: data.slug || "",
          description: data.description || "",
          content: parsed.content || "",
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

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent
        className="grid grid-rows-[auto_1fr] sm:h-[580px] sm:max-w-4xl"
        variant="card"
      >
        <DialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={FileImportIcon}
              size={18}
              strokeWidth={2}
            />
            <DialogTitle className="font-medium text-muted-foreground text-sm">
              {importState.status === "ready"
                ? "Review Metadata"
                : "Import Content"}
            </DialogTitle>
          </div>
          <DialogX />
        </DialogHeader>
        <DialogDescription
          className={
            importState.status === "ready" ? "hidden text-center" : "sr-only"
          }
        >
          {importState.status === "ready" && importState.file
            ? `We've parsed metadata from your file. Please review and complete the details.`
            : "Import content into your workspace. You can import a .md/.mdx file."}
        </DialogDescription>
        <DialogBody className="overflow-hidden">
          {importState.status === "idle" && (
            <Dropzone
              accept={{
                "text/markdown": [".md", ".mdx"],
              }}
              className="flex h-full w-full flex-1 cursor-pointer items-center justify-center rounded-md border border-dashed bg-editor-field"
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
                idle: "Drag & drop a .md/.mdx file, or click to select",
                active: "Drop the file here...",
                subtitle: "We will parse frontmatter and content",
              }}
            />
          )}
          {importState.status !== "idle" && (
            <div className="scrollbar-custom flex flex-col gap-4 overflow-y-auto pt-4">
              {importState.status === "parsing" && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground text-sm">
                    Parsing file...
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
                    initialData={importState.parsedData}
                    isImporting={isImporting}
                    name={importState.file.name}
                    onImport={importPost}
                  />
                )}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
