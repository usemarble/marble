/** biome-ignore-all lint/correctness/useUniqueElementIds: IDs are unique within their respective modals */
"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@marble/ui/components/alert-dialog";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { AsyncButton } from "../ui/async-button";

export const DeleteAuthorModal = ({
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

  const { mutate: deleteAuthor, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/authors/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.json().catch(() => "Unknown error");
        throw new Error(errorText.error || "Failed to delete author");
      }

      return true;
    },
    onSuccess: () => {
      toast.success("Author deleted successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.AUTHORS(workspaceId),
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this author from your workspace. Any
            posts associated with this author will need to be reassigned.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AsyncButton
            isLoading={isPending}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              deleteAuthor();
            }}
            variant="destructive"
          >
            Delete
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
