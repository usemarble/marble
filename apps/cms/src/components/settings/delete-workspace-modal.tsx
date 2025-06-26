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

export function DeleteWorkspaceModal({ id }: { id: string }) {
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const { updateActiveWorkspace } = useWorkspace();
  const { data: organizations } = useListOrganizations();
  const router = useRouter();

  const handleDeleteWorkspace = async () => {
    setIsDeletingWorkspace(true);

    try {
      await organization.delete({
        organizationId: id,
      });

      toast.success("Workspace deleted.");

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
      setIsDeletingWorkspace(false);
    }
  };

  return (
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
          <AlertDialogCancel className="min-w-20">Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isDeletingWorkspace}
            onClick={handleDeleteWorkspace}
            className="min-w-20"
          >
            {isDeletingWorkspace ? (
              <ButtonLoader variant="destructive" />
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
