"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { toast } from "@marble/ui/components/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { Media } from "@/types/media";

interface MediaEditModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  media: Media;
}

export function MediaEditModal({ isOpen, setIsOpen, media }: MediaEditModalProps) {
  const [alt, setAlt] = useState<string>(media.alt ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: media.id, alt }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save");
      }
      const updated: Media = await res.json();
      if (workspaceId) {
        queryClient.setQueryData(
          QUERY_KEYS.MEDIA(workspaceId),
          (oldData: Media[] | undefined) =>
            oldData ? oldData.map((m) => (m.id === updated.id ? { ...m, alt: updated.alt } : m)) : [updated],
        );
      }
      toast.success("Saved");
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogHeader>
        <DialogTitle>Edit media details</DialogTitle>
      </DialogHeader>
      <DialogContent className="max-w-md">
        <div className="flex flex-col gap-4">
          {/* biome-ignore lint/performance/noImgElement: <> */}
          <img src={media.url} alt={media.alt || media.name} className="w-full max-h-48 object-contain rounded" />
          <div className="space-y-2">
            <label className="text-sm font-medium">Alt text</label>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image for accessibility" />
          </div>
          <div className="flex justify-end">
            <AsyncButton onClick={handleSave} isLoading={isSaving}>Save</AsyncButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


