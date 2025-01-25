"use client";

import { ErrorMessage } from "@/components/auth/error-message";
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
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { Loader } from "@repo/ui/lib/icons";
import { useForm } from "react-hook-form";

import {
  checkTagSlugAction,
  checkTagSlugForUpdateAction,
  createTagAction,
  deleteTagAction,
  updateTagAction,
} from "@/lib/actions/tag";
import { useActiveOrganization } from "@/lib/auth/client";
import { type CreateTagValues, tagSchema } from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/generate-slug";
import { useEffect, useState } from "react";
import type { Tag } from "./columns";

export const CreateTagModal = ({
  open,
  setOpen,
  onTagCreated,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onTagCreated?: (tag: { name: string; id: string; slug: string }) => void;
}) => {
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

  useEffect(() => {
    setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateTagValues) => {
    const isTaken = await checkTagSlugAction(
      data.slug,
      activeOrganization.id as string,
    );

    if (isTaken) {
      setError("slug", { message: "You already have a tag with that slug" });
    }

    try {
      const res = await createTagAction(data, activeOrganization.id);
      setOpen(false);
      toast.success("Tag created successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invite",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register("slug")}
              defaultValue={generateSlug(name)}
            />
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full gap-2 mt-2"
            size={"sm"}
          >
            {isSubmitting && <Loader className="size-4 animate-spin" />}
            Create tag
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const UpdateTagModal = ({
  open,
  setOpen,
  tagData,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tagData: Tag;
}) => {
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

  const { data: activeWorkspace } = useActiveOrganization();

  useEffect(() => {
    setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateTagValues) => {
    const isTaken = await checkTagSlugForUpdateAction(
      data.slug,
      activeWorkspace.id,
      tagData.id,
    );

    if (isTaken) {
      setError("slug", { message: "You already have a tag with that slug" });
      return;
    }

    try {
      const res = await updateTagAction(data, tagData.id);
      if (!res) {
        setOpen(false);
        toast.success("Tag updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update tag");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register("slug")} />
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full gap-2 mt-2"
            size={"sm"}
          >
            {isSubmitting && <Loader className="size-4 animate-spin" />}
            Update tag
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
  const [loading, setLoading] = useState(false);

  async function deleteTag() {
    setLoading(true);
    try {
      await deleteTagAction(id);
      toast.success("Tag deleted successfully");
    } catch (error) {
      toast.error("Failed to delete tag.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this tag from your list and you can no
            longer use this in articles.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={deleteTag}
              disabled={loading}
              variant="destructive"
            >
              {loading ? <Loader className="size-4 animate-spin" /> : "Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
