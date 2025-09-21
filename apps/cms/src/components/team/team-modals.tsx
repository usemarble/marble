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
import { useState } from "react";
import { organization } from "@/lib/auth/client";
import { useWorkspace } from "@/providers/workspace";
import { AsyncButton } from "../ui/async-button";
import type { TeamMemberRow } from "./columns";

type RemoveMemberModalProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  member: TeamMemberRow;
};

export function RemoveMemberModal({
  open,
  setOpen,
  member,
}: RemoveMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const { activeWorkspace } = useWorkspace();
  async function removeMember() {
    // Guard against missing workspace before setting loading state
    if (!activeWorkspace?.id) {
      toast.error("No active workspace found");
      return;
    }

    setLoading(true);
    try {
      await organization.removeMember({
        memberIdOrEmail: member.id,
        organizationId: activeWorkspace.id,
        fetchOptions: {
          onRequest: () => {
            toast.loading("Removing member...", {
              id: "remove-member",
            });
          },
          onSuccess: () => {
            toast.success("Member removed successfully", {
              id: "remove-member",
            });
            setOpen(false);
          },
        },
      });
    } catch (_error) {
      toast.error("Failed to remove member", {
        id: "remove-member",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remove {member.name || member.email}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action will revoke their access to the workspace permanently.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AsyncButton
            disabled={loading}
            isLoading={loading}
            onClick={removeMember}
            variant="destructive"
          >
            Remove
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
