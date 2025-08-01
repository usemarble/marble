import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@marble/ui/components/alert-dialog";
import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { organization, useListOrganizations } from "@/lib/auth/client";
import { useWorkspace } from "../../providers/workspace";
import { ButtonLoader } from "../ui/loader";

interface ListOrganizationResponse {
  // biome-ignore lint/suspicious/noExplicitAny: <>
  metadata?: any;
  name: string;
  slug: string;
  logo?: string | null | undefined | undefined;
  createdAt: Date;
  id: string;
}

interface LeaveWorkspaceModalProps {
  id: string;
  name: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

/**
 * Displays a modal dialog allowing the user to leave a workspace.
 *
 * When confirmed, removes the user from the specified workspace, updates the active workspace if others remain, and navigates accordingly. If no other workspaces are available, redirects the user to create a new workspace.
 *
 * @param id - The ID of the workspace to leave
 * @param name - The name of the workspace to display in the modal
 * @param open - Whether the modal is visible
 * @param setOpen - Function to control the modal's visibility
 */
export function LeaveWorkspaceModal({
  id,
  name,
  open,
  setOpen,
}: LeaveWorkspaceModalProps) {
  const [isLeavingWorkspace, setIsLeavingWorkspace] = useState(false);
  const { updateActiveWorkspace } = useWorkspace();
  const { data: organizations } = useListOrganizations();
  const router = useRouter();

  const handleLeaveWorkspace = async () => {
    setIsLeavingWorkspace(true);

    try {
      await organization.leave({
        organizationId: id,
      });

      toast.success("You have left the workspace.");

      // Find the next available workspace or redirect to new
      const remainingWorkspaces = organizations?.filter(
        (org: ListOrganizationResponse) => org.id !== id,
      );

      if (!remainingWorkspaces || remainingWorkspaces.length === 0) {
        router.push("/new");
        return;
      }

      // Set the first remaining workspace as active and redirect
      const nextWorkspace = remainingWorkspaces[0];
      if (!nextWorkspace) {
        router.push("/new");
        return;
      }

      await updateActiveWorkspace(nextWorkspace);
      router.push(`/${nextWorkspace.slug}`);
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      toast.error("Failed to delete workspace.");
    } finally {
      setIsLeavingWorkspace(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Once you leave the workspace, you will no longer have access to it.
            until you are invited again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-w-20">Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isLeavingWorkspace}
            onClick={handleLeaveWorkspace}
            className="min-w-20"
          >
            {isLeavingWorkspace ? (
              <ButtonLoader variant="destructive" />
            ) : (
              "Leave"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
