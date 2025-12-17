"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { Textarea } from "@marble/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type CreateTagValues, tagSchema } from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/string";
import { AsyncButton } from "../ui/async-button";
import type { Tag } from "./columns";

export function TagModal({
  open,
  setOpen,
  mode = "create",
  tagData = { name: "", slug: "", description: "" },
  onTagCreated,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode?: "create" | "update";
  tagData?: Partial<Tag>;
  onTagCreated?: (tag: { id: string; name: string; slug: string }) => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTagValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: tagData.name || "", slug: tagData.slug || "", description: tagData.description || "" },
  });

  const { name } = watch();
  const workspaceId = useWorkspaceId();

  const { mutate: createTag, isPending: isCreating } = useMutation({
    mutationFn: async (data: CreateTagValues) => {
      try {
        const res = await fetch("/api/tags", {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create tag");
        }

        const responseData = await res.json();
        return responseData;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to create tag"
        );
      }
    },
    onSuccess: (data) => {
      onTagCreated?.(data);
      setOpen(false);
      toast.success("Tag created successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TAGS(workspaceId),
        });
      }
      reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: updateTag, isPending: isUpdating } = useMutation({
    mutationFn: async (data: CreateTagValues) => {
      try {
        const res = await fetch(`/api/tags/${tagData.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update tag");
        }

        const responseData = await res.json();
        return responseData;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to update tag"
        );
      }
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Tag updated successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TAGS(workspaceId),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (mode === "create") {
      setValue("slug", generateSlug(name));
    }
  }, [mode, name, setValue]);

  const onSubmit = async (data: CreateTagValues) => {
    if (!workspaceId) {
      toast.error("No active workspace");
      return;
    }

    if (mode === "update" && !tagData.id) {
      toast.error("Tag ID is missing - cannot update tag");
      return;
    }

    if (mode === "create") {
      createTag(data);
    } else {
      updateTag(data);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="p-8 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-medium">
            {mode === "create" ? "Create Tag" : "Update Tag"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="mt-2 flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="The name of the tag"
            />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="unique-identifier"
            />
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="A short description of the tag"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <AsyncButton
              className="gap-2"
              isLoading={isSubmitting || isCreating || isUpdating}
              type="submit"
            >
              {mode === "create" ? "Create" : "Update"}
            </AsyncButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const DeleteTagModal = ({
  open,
  setOpen,
  id,
  name,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  id: string;
  name: string;
}) => {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: deleteTag, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(
          `Failed to delete tag: ${res.status} ${res.statusText} - ${errorText}`
        );
      }

      return true;
    },
    onSuccess: () => {
      toast.success("Tag deleted successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TAGS(workspaceId),
        });
      }
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete tag.");
    },
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this tag from your list and you can no
            longer use this in articles.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </AlertDialogCancel>
          <AsyncButton
            isLoading={isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteTag();
            }}
            variant="destructive"
          >
            Delete
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
