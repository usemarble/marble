"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogX,
} from "@marble/ui/components/alert-dialog";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

interface DeleteCustomFieldModalProps {
  fieldId: string;
  fieldName: string;
  onDelete: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DeleteCustomFieldModal({
  fieldId,
  fieldName,
  onDelete,
  isOpen,
  onOpenChange,
}: DeleteCustomFieldModalProps) {
  const params = useParams<{ workspace: string }>();
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { mutate: deleteField, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/fields/${fieldId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete field");
      }

      return true;
    },
    onSuccess: () => {
      toast.success("Custom field deleted");
      onDelete();
      onOpenChange(false);
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_FIELDS(workspaceId),
        });
      }
      if (params.workspace) {
        queryClient.invalidateQueries({
          queryKey: ["editor-bootstrap", params.workspace],
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <AlertDialog onOpenChange={onOpenChange} open={isOpen}>
      <AlertDialogContent className="sm:max-w-md" variant="card">
        <AlertDialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-destructive"
              icon={Alert02Icon}
              size={18}
              strokeWidth={2}
            />
            <AlertDialogTitle className="font-medium text-muted-foreground text-sm">
              Delete "{fieldName}"?
            </AlertDialogTitle>
          </div>
          <AlertDialogX />
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription>
            This will permanently delete this field and all values stored for it
            across every post. This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} size="sm">
              Cancel
            </AlertDialogCancel>
            <AsyncButton
              isLoading={isPending}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                deleteField();
              }}
              size="sm"
              variant="destructive"
            >
              Delete
            </AsyncButton>
          </AlertDialogFooter>
        </AlertDialogBody>
      </AlertDialogContent>
    </AlertDialog>
  );
}
