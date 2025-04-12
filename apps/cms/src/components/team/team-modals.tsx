"use client";

import { organization } from "@/lib/auth/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@marble/ui/components/alert-dialog";
import { Button } from "@marble/ui/components/button";
import { toast } from "@marble/ui/components/sonner";
import { Loader } from "@marble/ui/lib/icons";
import { useState } from "react";
import type { TeamMember } from "./columns";

interface RemoveMemberModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  member: TeamMember;
}

export function RemoveMemberModal({
  open,
  setOpen,
  member,
}: RemoveMemberModalProps) {
  const [loading, setLoading] = useState(false);

  async function removeMember() {
    setLoading(true);
    try {
      await organization.removeMember({
        memberIdOrEmail: member.id,
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
    } catch (error) {
      toast.error("Failed to remove member", {
        id: "remove-member",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remove {member.name || member.email}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will remove them from the team. They will no longer have access
            to the workspace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={removeMember}
              disabled={loading}
              variant="destructive"
            >
              {loading ? <Loader className="size-4 animate-spin" /> : "Remove"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
