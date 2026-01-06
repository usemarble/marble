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
  AlertDialogTrigger,
  AlertDialogX,
} from "@marble/ui/components/alert-dialog";
import { Button } from "@marble/ui/components/button";
import { Card, CardDescription, CardTitle } from "@marble/ui/components/card";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { cn } from "@marble/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { organization } from "@/lib/auth/client";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { useWorkspace } from "@/providers/workspace";

export function Delete() {
  const { activeWorkspace, isOwner, workspaceList } = useWorkspace();
  const { updateActiveWorkspace } = useWorkspace();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmationText, setConfirmationText] = useState("");

  const CONFIRMATION_PHRASE = "delete my workspace";
  const isConfirmationValid = confirmationText === CONFIRMATION_PHRASE;

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
    <Card className="gap-0 rounded-[20px] border-none bg-surface p-2">
      <div className="flex flex-col gap-6 rounded-[12px] bg-background p-6 shadow-xs">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="font-medium text-lg">
            Delete workspace.
          </CardTitle>
          <CardDescription>
            Permanently delete your workspace and all associated data within.
            This action cannot be undone.
          </CardDescription>
        </div>
      </div>
      <div className="flex justify-end px-2 pt-2">
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button size="sm" variant="destructive">
                Delete Workspace
              </Button>
            }
          />
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
                  Delete workspace?
                </AlertDialogTitle>
              </div>
              <AlertDialogX />
            </AlertDialogHeader>
            <AlertDialogBody>
              <AlertDialogDescription className="text-balance">
                This action cannot be undone. This will permanently delete your
                workspace and all associated data within.
              </AlertDialogDescription>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label className="text-sm" htmlFor="confirmation-input">
                    To confirm, type{" "}
                    <span className="font-mono font-semibold">
                      "{CONFIRMATION_PHRASE}"
                    </span>{" "}
                    below
                  </Label>
                  <Input
                    className={cn(
                      !isConfirmationValid &&
                        "focus-visible:border-destructive focus-visible:ring-destructive/50"
                    )}
                    id="confirmation-input"
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={CONFIRMATION_PHRASE}
                    value={confirmationText}
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setConfirmationText("")}
                  size="sm"
                >
                  Cancel
                </AlertDialogCancel>
                <AsyncButton
                  disabled={!isConfirmationValid}
                  isLoading={isPending || !activeWorkspace?.id}
                  onClick={() => {
                    if (isConfirmationValid && activeWorkspace?.id) {
                      deleteWorkspace({ organizationId: activeWorkspace.id });
                    }
                  }}
                  size="sm"
                  variant="destructive"
                >
                  Delete Workspace
                </AsyncButton>
              </AlertDialogFooter>
            </AlertDialogBody>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
