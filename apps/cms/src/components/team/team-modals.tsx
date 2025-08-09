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
import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { useState } from "react";
import { organization } from "@/lib/auth/client";
import { useWorkspace } from "@/providers/workspace";
import { ButtonLoader } from "../ui/loader";
import type { TeamMemberRow } from "./columns";

interface RemoveMemberModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  member: TeamMemberRow;
}

export function RemoveMemberModal({
  open,
  setOpen,
  member,
}: RemoveMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const { activeWorkspace } = useWorkspace();
  async function removeMember() {
    setLoading(true);
    if (!activeWorkspace?.id) {
      return;
    }
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
          <Button
            disabled={loading}
            onClick={removeMember}
            variant="destructive"
          >
            {loading ? <ButtonLoader /> : "Remove"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
