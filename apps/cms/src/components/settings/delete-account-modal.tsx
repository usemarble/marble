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
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { useUser } from "@/providers/user";
import { AsyncButton } from "../ui/async-button";

export function DeleteAccountModal() {
  const router = useRouter();
  const { signOut } = useUser();

  const { mutate: deleteAccount, isPending } = useMutation({
    mutationFn: async () => {
      await authClient.deleteUser();
    },
    onSuccess: async () => {
      toast.success("Account deleted successfully.");
      signOut();
      router.push("/");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete account.");
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account, your workspaces and all associated data within.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <AsyncButton
              isLoading={isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteAccount();
              }}
              variant="destructive"
            >
              Delete
            </AsyncButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
