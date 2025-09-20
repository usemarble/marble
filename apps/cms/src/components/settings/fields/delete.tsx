"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@marble/ui/components/alert-dialog";
import { Button } from "@marble/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AsyncButton } from "@/components/ui/async-button";
import { organization } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

export function Delete() {
  const { activeWorkspace, isOwner, workspaceList } = useWorkspace();
  const { updateActiveWorkspace } = useWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate: deleteWorkspace, isPending } = useMutation({
    mutationFn: async ({ organizationId }: { organizationId: string }) => {
      await organization.delete({
        organizationId,
      });
    },
    onSuccess: async () => {
      const remainingWorkspaces = workspaceList?.filter(
        (org) => org.id !== activeWorkspace?.id
      );

      if (!remainingWorkspaces || remainingWorkspaces.length === 0) {
        router.push("/new");
        return;
      }

      // Invalidate the workspace list query since we lost one
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.WORKSPACE_LIST,
      });

      // Get the first remaining workspace
      const nextWorkspace = remainingWorkspaces[0];

      // If there are no remaining workspaces, redirect to the new workspace page
      if (!nextWorkspace) {
        router.push("/new");
        return;
      }

      // Set the first remaining workspace as active and redirect
      await updateActiveWorkspace(nextWorkspace);
      router.push(`/${nextWorkspace.slug}`);
    },
    onError: () => {
      toast.error("Failed to delete workspace.");
    },
  });

  if (!isOwner) {
    return null;
  }

  return (
    <Card className="pb-4">
      <CardHeader>
        <CardTitle className="font-medium text-lg">Delete workspace.</CardTitle>
        <CardDescription>
          Permanently delete your workspace and all associated data within. This
          action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardFooter className="justify-end border-t pt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Workspace</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                workspace and all associated data within.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AsyncButton
                variant="destructive"
                isLoading={isPending || !activeWorkspace?.id}
                onClick={() =>
                  activeWorkspace?.id &&
                  deleteWorkspace({ organizationId: activeWorkspace.id })
                }
              >
                Delete
              </AsyncButton>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
