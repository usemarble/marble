import { organization, useListOrganizations } from "@/lib/auth/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@marble/ui/components/alert-dialog";
import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useWorkspace } from "../../context/workspace";

interface ListOrganizationResponse {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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

      await updateActiveWorkspace(nextWorkspace.slug, nextWorkspace);
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
              <Loader className="size-4 animate-spin" />
            ) : (
              "Leave"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
