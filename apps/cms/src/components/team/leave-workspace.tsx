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
import { AsyncButton } from "@/components/ui/async-button";
import { useWorkspace } from "@/providers/workspace";

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
  const { removeWorkspace } = useWorkspace();

  const handleLeaveWorkspace = async () => {
    setIsLeavingWorkspace(true);

    try {
      await removeWorkspace(id, "leave");
      toast.success("You have left the workspace.");
    } catch (error) {
      console.error("Failed to leave workspace:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to leave workspace."
      );
    } finally {
      setIsLeavingWorkspace(false);
    }
  };

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
              Leave {name}?
            </AlertDialogTitle>
          </div>
          <AlertDialogX />
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription className="text-balance">
            Once you leave the workspace, you will no longer have access to it
            until you are invited again.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-w-20" size="sm">
              Cancel
            </AlertDialogCancel>
            <AsyncButton
              className="min-w-20"
              isLoading={isLeavingWorkspace}
              onClick={handleLeaveWorkspace}
              size="sm"
              variant="destructive"
            >
              Leave
            </AsyncButton>
          </AlertDialogFooter>
        </AlertDialogBody>
      </AlertDialogContent>
    </AlertDialog>
  );
}
