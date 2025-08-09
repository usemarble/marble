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
import { Button } from "@marble/ui/components/button";
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
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ErrorMessage } from "@/components/auth/error-message";
import {
  checkTagSlugAction,
  checkTagSlugForUpdateAction,
} from "@/lib/actions/checks";
import { useActiveOrganization } from "@/lib/auth/client";
import { type CreateTagValues, tagSchema } from "@/lib/validations/workspace";
import { useWorkspace } from "@/providers/workspace";
import { generateSlug } from "@/utils/string";
import { ButtonLoader } from "../ui/loader";
import type { Tag } from "./columns";

interface CreateTagModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onTagCreated?: (tag: { id: string; name: string; slug: string }) => void;
}

export function CreateTagModal({
  open,
  setOpen,
  onTagCreated,
}: CreateTagModalProps) {
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
    defaultValues: { name: "" },
  });

  const { name } = watch();
  const { data: activeOrganization } = useActiveOrganization();

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
      queryClient.invalidateQueries({
        queryKey: ["tags", activeOrganization?.id],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateTagValues) => {
    if (!activeOrganization?.id) {
      toast.error("No active organization");
      return;
    }

    const isTaken = await checkTagSlugAction(data.slug, activeOrganization.id);

    if (isTaken) {
      setError("slug", { message: "You already have a tag with that slug" });
      return;
    }

    createTag(data);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="max-w-sm p-8">
        <DialogHeader>
          <DialogTitle className="text-center font-medium">
            Create tag
          </DialogTitle>
        </DialogHeader>
        <form
          className="mt-2 flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid flex-1 gap-2">
            <Label className="sr-only" htmlFor="name">
              Name
            </Label>
            <Input id="name" {...register("name")} placeholder="Name" />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label className="sr-only" htmlFor="slug">
              Slug
            </Label>
            <Input
              id="slug"
              {...register("slug")}
              defaultValue={generateSlug(name)}
              placeholder="slug"
            />
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <Button
            className="mt-4 flex w-full gap-2"
            disabled={isSubmitting}
            size={"sm"}
            type="submit"
          >
            {isSubmitting ? <ButtonLoader /> : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const UpdateTagModal = ({
  open,
  setOpen,
  tagData,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tagData: Tag;
}) => {
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
    defaultValues: { ...tagData },
  });

  const { name } = watch();

  const { activeWorkspace } = useWorkspace();

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
      queryClient.invalidateQueries({
        queryKey: ["tags", activeWorkspace?.slug],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateTagValues) => {
    const isTaken = await checkTagSlugForUpdateAction(
      data.slug,
      activeWorkspace?.id as string,
      tagData.id
    );

    if (isTaken) {
      setError("slug", { message: "You already have a tag with that slug" });
      return;
    }

    updateTag(data);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="max-w-sm p-8">
        <DialogHeader>
          <DialogTitle className="text-center font-medium">
            Update tag
          </DialogTitle>
        </DialogHeader>
        <form
          className="mt-2 flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid flex-1 gap-2">
            <Label className="sr-only" htmlFor="name">
              Name
            </Label>
            <Input id="name" {...register("name")} placeholder="Name" />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label className="sr-only" htmlFor="slug">
              Slug
            </Label>
            <Input id="slug" {...register("slug")} placeholder="slug" />
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <Button
            className="mt-4 flex w-full gap-2"
            disabled={isSubmitting}
            size={"sm"}
            type="submit"
          >
            {isSubmitting ? <ButtonLoader /> : "Update tag"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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
  const { activeWorkspace } = useWorkspace();

  const { mutate: deleteTag, isPending } = useMutation({
    mutationFn: () =>
      fetch(`/api/tags/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Tag deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["tags", activeWorkspace?.id],
      });
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
          <AlertDialogAction asChild>
            <Button
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteTag();
              }}
              variant="destructive"
            >
              {isPending ? <ButtonLoader variant="destructive" /> : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
