"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import {
  checkTagSlugAction,
  checkTagSlugForUpdateAction,
} from "@/lib/actions/checks";
import { QUERY_KEYS } from "@/lib/queries/keys";
import { type CreateTagValues, tagSchema } from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/string";
import { AsyncButton } from "../ui/async-button";
import type { Tag } from "./columns";

export function TagModal({
  open,
  setOpen,
  mode = "create",
  tagData = { name: "", slug: "" },
  onTagCreated,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode?: "create" | "update";
  tagData?: Partial<Tag>;
  onTagCreated?: (tag: { id: string; name: string; slug: string }) => void;
}) {
  const nameId = useId();
  const slugId = useId();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTagValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: tagData.name || "", slug: tagData.slug || "" },
  });

  const { name } = watch();
  const workspaceId = useWorkspaceId();

  const { mutate: createTag } = useMutation({
    mutationFn: (data: CreateTagValues) =>
      fetch("/api/tags", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to create tag");
        }
        return res.json();
      }),
    onSuccess: (data) => {
      onTagCreated?.(data);
      setOpen(false);
      toast.success("Tag created successfully");
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

  const { mutate: updateTag } = useMutation({
    mutationFn: (data: CreateTagValues) =>
      fetch(`/api/tags/${tagData.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update tag");
        }
        return res.json();
      }),
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

    const isTaken =
      mode === "create"
        ? await checkTagSlugAction(data.slug, workspaceId)
        : await checkTagSlugForUpdateAction(
            data.slug,
            workspaceId,
            tagData.id as string
          );

    if (isTaken) {
      setError("slug", { message: "You already have a tag with that slug" });
      return;
    }

    if (mode === "create") {
      createTag(data);
    } else {
      updateTag(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-center">
            {mode === "create" ? "Create Tag" : "Update Tag"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 mt-2"
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor={nameId} className="sr-only">
              Name
            </Label>
            <Input id={nameId} {...register("name")} placeholder="Name" />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor={slugId} className="sr-only">
              Slug
            </Label>
            <Input id={slugId} {...register("slug")} placeholder="slug" />
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <AsyncButton
            type="submit"
            isLoading={isSubmitting}
            className="flex w-full gap-2 mt-4"
          >
            {mode === "create" ? "Create Tag" : "Update Tag"}
          </AsyncButton>
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
    <AlertDialog open={open} onOpenChange={setOpen}>
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
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <AsyncButton
              onClick={(e) => {
                e.preventDefault();
                deleteTag();
              }}
              isLoading={isPending}
              variant="destructive"
            >
              Delete
            </AsyncButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
