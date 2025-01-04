"use client";

import { ErrorMessage } from "@/components/auth/error-message";
import { zodResolver } from "@hookform/resolvers/zod";
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

import { checkTagSlugAction, createTagAction } from "@/lib/actions/tag";
import { authClient } from "@/lib/auth/client";
import { type CreateTagValues, tagSchema } from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/generate-slug";

export const CreateTagModal = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
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

  const onSubmit = async (data: CreateTagValues) => {
    const wk = authClient.useActiveOrganization();
    const isTaken = await checkTagSlugAction(data.slug, wk.data.id);

    if (isTaken) {
      setError("slug", { message: "You already have a tag with that slug" });
    }

    try {
      const res = await createTagAction(data, wk.data.id);
      if (!res) {
        setOpen(false);
        toast.success("Tag created successfully");
      }
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
  tagData: { name: string; slug: string } | null;
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

  const onSubmit = async (data: CreateTagValues) => {
    const wk = authClient.useActiveOrganization();
    const isTaken = await checkTagSlugAction(data.slug, wk.data.id);

    if (isTaken) {
      setError("slug", { message: "You already have a tag with that slug" });
    }

    try {
      const res = await createTagAction(data, wk.data.id);
      if (!res) {
        setOpen(false);
        toast.success("Tag created successfully");
      }
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
            Update tag
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
