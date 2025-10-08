"use client";

import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { UploadSimpleIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { Dropzone } from "@/components/shared/dropzone";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

export function PostsImportModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { mutate: importPosts, isPending } = useMutation({
    mutationFn: async (selected: File[]) => {
      const form = new FormData();
      for (const file of selected) {
        form.append("files", file);
      }
      const res = await fetch("/api/posts/import", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to import posts");
      }
      return (await res.json()) as { created: number };
    },
    onSuccess: async () => {
      toast.success("Import completed");
      if (workspaceId) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.POSTS(workspaceId),
        });
      }
      setOpen(false);
      setFiles([]);
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Markdown</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Dropzone
            accept={{
              "text/markdown": [".md", ".mdx"],
              "application/json": [".json"],
              "text/plain": [".md", ".mdx"],
            }}
            multiple
            onFilesAccepted={(accepted) => setFiles(accepted)}
            placeholder={{
              idle: "Drag & drop .md/.mdx/.json files, or click to select",
              active: "Drop the files here...",
              subtitle:
                "We will parse frontmatter, markdown content, or JSON post data",
            }}
          />
          <p className="text-muted-foreground text-xs">
            Frontmatter is optional; missing fields result in draft posts. JSON
            supports fields like title, slug, description,
            content/contentHtml/contentJson, tags, and category.
          </p>
        </div>
        <DialogFooter>
          <Button
            disabled={files.length === 0 || isPending}
            onClick={() => importPosts(files)}
          >
            <UploadSimpleIcon className="mr-2 size-4" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
