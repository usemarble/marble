import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@marble/ui/components/alert-dialog";
import { toast } from "@marble/ui/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AsyncButton } from "@/components/ui/async-button";
import { organization, useListOrganizations } from "@/lib/auth/client";
import { useWorkspace } from "@/providers/workspace";

type ListOrganizationResponse = {
  // biome-ignore lint/suspicious/noExplicitAny: <>
  metadata?: any;
  name: string;
  slug: string;
  logo?: string | null | undefined | undefined;
  createdAt: Date;
  id: string;
};

type LeaveWorkspaceModalProps = {
  id: string;
  name: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

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
        (org: ListOrganizationResponse) => org.id !== id
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
    <AlertDialog onOpenChange={setOpen} open={open}>
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
          <AsyncButton
            className="min-w-20"
            isLoading={isLeavingWorkspace}
            onClick={handleLeaveWorkspace}
            variant="destructive"
          >
            Leave
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
