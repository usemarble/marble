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
import { useState } from "react";
import { organization } from "@/lib/auth/client";
import { useWorkspace } from "@/providers/workspace";
import { AsyncButton } from "../ui/async-button";
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
          onSuccess: () => {
            toast.success("Member removed successfully");
            setOpen(false);
          },
        },
      });
    } catch (_error) {
      toast.error("Failed to remove member");
    } finally {
      setLoading(false);
    }
  }

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
              Remove {member.name || member.email}?
            </AlertDialogTitle>
          </div>
          <AlertDialogX />
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription className="text-balance">
            This action will revoke their access to the workspace permanently.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} size="sm">
              Cancel
            </AlertDialogCancel>
            <AsyncButton
              disabled={loading}
              isLoading={loading}
              onClick={removeMember}
              size="sm"
              variant="destructive"
            >
              Remove
            </AsyncButton>
          </AlertDialogFooter>
        </AlertDialogBody>
      </AlertDialogContent>
    </AlertDialog>
  );
}
