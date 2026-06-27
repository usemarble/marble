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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@marble/ui/components/tabs";
import { Textarea } from "@marble/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";
import { Dropzone } from "@/components/shared/dropzone";
import { AsyncButton } from "@/components/ui/async-button";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { MAX_IMPORT_SIZE } from "@/lib/validations/import";
import { useWorkspace } from "@/providers/workspace";
import { formatBytes } from "@/utils/string";

// Worker parses these; the client just hands the file off.
const IMPORT_DROPZONE_ACCEPT = {
  "text/markdown": [".md", ".mdx"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
};
type ImportSource = { file: File } | { url: string };

export function PostsImportModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();

  const { mutate: startImport, isPending } = useMutation({
    mutationFn: async (source: ImportSource) => {
      const init: RequestInit =
        "file" in source
          ? (() => {
              const body = new FormData();
              body.append("file", source.file);
              return { method: "POST", body };
            })()
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: source.url }),
            };

      const res = await fetch("/api/data/import", init);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start import");
      }

      return (await res.json()) as { id: string };
    },
    onSuccess: async () => {
      toast.success("Import started");
      setOpen(false);
      setFile(null);
      if (activeWorkspace?.id) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.IMPORTS(activeWorkspace.id),
        });
      }
      if (activeWorkspace?.slug) {
        router.push(`/${activeWorkspace.slug}/settings/data`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setFile(null);
        }
      }}
      open={open}
    >
      <DialogContent variant="card">
        <DialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={FileImportIcon}
              size={18}
              strokeWidth={2}
            />
            <DialogTitle className="font-medium text-muted-foreground text-sm">
              Import content
            </DialogTitle>
          </div>
          <DialogX className="text-muted-foreground" />
        </DialogHeader>
        <DialogDescription className="sr-only">
          Import posts into your workspace from a file or another site. Imported
          posts are created as drafts.
        </DialogDescription>

        <DialogBody>
          <Tabs defaultValue="upload">
            <TabsList className="w-full">
              <TabsTrigger className="flex-1" value="upload">
                Upload
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="url">
                From URL
              </TabsTrigger>
            </TabsList>

            <TabsContent className="pt-4" value="upload">
              {file ? (
                <div className="flex items-center justify-between rounded-md border bg-editor-field px-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{file.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <button
                    className="text-muted-foreground text-xs hover:text-foreground"
                    onClick={() => setFile(null)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <Dropzone
                  accept={IMPORT_DROPZONE_ACCEPT}
                  className="flex h-40 w-full cursor-pointer items-center justify-center rounded-md border border-dashed bg-editor-field transition-colors hover:bg-editor-field/70"
                  maxSize={MAX_IMPORT_SIZE}
                  onFilesAccepted={(accepted) => {
                    const next = accepted[0];
                    if (next) {
                      setFile(next);
                    }
                  }}
                  onFilesRejected={(rejections) => {
                    const code = rejections[0]?.errors[0]?.code;
                    if (code === "file-too-large") {
                      toast.error(
                        `File is too large. Maximum size is ${formatBytes(MAX_IMPORT_SIZE)}.`
                      );
                    } else if (code === "file-invalid-type") {
                      toast.error(
                        "Unsupported file type. Upload a .md, .mdx, or .zip file."
                      );
                    } else {
                      toast.error("That file couldn't be added.");
                    }
                  }}
                  placeholder={{
                    idle: "Drag & drop a file, or click to select",
                    active: "Drop the file here...",
                    subtitle: "Supports .md, .mdx, or a .zip of them",
                  }}
                />
              )}
            </TabsContent>

            <TabsContent className="pt-4" value="url">
              <Textarea
                className="h-40 resize-none"
                disabled
                placeholder="Importing from a URL isn't available yet."
              />
            </TabsContent>
          </Tabs>

          <AsyncButton
            className="w-full"
            disabled={!file}
            isLoading={isPending}
            onClick={() => file && startImport({ file })}
          >
            Import
          </AsyncButton>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
