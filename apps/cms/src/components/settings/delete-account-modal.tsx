import { deleteAccountAction } from "@/lib/actions/account";
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
import { ButtonLoader } from "../ui/loader";

export function DeleteAccountModal({ id }: { id: string }) {
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const router = useRouter();

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    // try {
    //   await deleteAccountAction(id);

    //   // ideally on delete of a user sessions and related table should cascade
    //   // im not sure however i will have to test later for now lets assume it is
    //   // await authClient.signOut();
    //   router.push("/");
    // } catch (error) {
    //   console.error("Failed to delete account:", error);
    //   toast.error("Failed to delete account.");
    // } finally {
    //   setIsDeletingAccount(false);
    // }
  };

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
          <AlertDialogCancel className="min-w-20">Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isDeletingAccount}
            onClick={handleDeleteAccount}
            className="min-w-20"
          >
            {isDeletingAccount ? (
              <ButtonLoader
                variant="destructive"
                className="size-4 animate-spin"
              />
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
