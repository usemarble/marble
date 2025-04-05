import { deleteMediaAction } from "@/lib/actions/media";
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
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

interface DeleteMediaModalProps {
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  mediaToDelete: string;
  onDelete: (id: string) => void;
}

export function DeleteMediaModal({
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  onDelete,
  mediaToDelete,
}: DeleteMediaModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const result = await deleteMediaAction(mediaToDelete);
      onDelete(result.id);
      if (result.success) {
        toast.success("Image deleted.");
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this image?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this image will break posts where it is being used.
              Please make sure to update all posts using this image.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* <AlertDialogAction asChild> */}
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
            {/* </AlertDialogAction> */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
