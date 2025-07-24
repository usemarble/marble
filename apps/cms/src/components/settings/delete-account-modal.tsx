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
import { useUser } from "@/providers/user";
import { ButtonLoader } from "../ui/loader";

export function DeleteAccountModal() {
  const router = useRouter();
  const { signOut } = useUser();

  const accountId = null;

  const { mutate: deleteAccount, isPending } = useMutation({
    mutationFn: () => {
      if (!accountId) {
        throw new Error("Account ID is missing");
      }
      return fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });
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
        {/* <form>
          todo: show confirmation inputs
       </form> */}
        <AlertDialogFooter>
          <AlertDialogCancel className="min-w-20" disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteAccount();
              }}
              className="min-w-20"
            >
              {isPending ? (
                <ButtonLoader
                  variant="destructive"
                  className="size-4 animate-spin"
                />
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
