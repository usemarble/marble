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
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { AsyncButton } from "../ui/async-button";

export const DeleteKeyModal = ({
  open,
  setOpen,
  id,
  name,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  id: string;
  name: string;
}) => {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: deleteKey, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.json().catch(() => "Unknown error");
        throw new Error(errorText.error || "Failed to delete key");
      }

      return true;
    },
    onSuccess: () => {
      toast.success("Key deleted successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.KEYS(workspaceId),
        });
      }
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogContent variant="card">
        <AlertDialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-destructive"
              icon={Alert02Icon}
              size={18}
              strokeWidth={2}
            />
            <AlertDialogTitle className="font-medium text-muted-foreground text-sm">
              Delete {name}?
            </AlertDialogTitle>
          </div>
          <AlertDialogX />
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription className="text-balance">
            This will permanently delete this key and any requests using it will
            fail.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} size="sm">
              Cancel
            </AlertDialogCancel>
            <AsyncButton
              isLoading={isPending}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                deleteKey();
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
};
