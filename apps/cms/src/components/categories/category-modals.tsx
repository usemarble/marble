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
  checkCategorySlugAction,
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  checkCategorySlugForUpdateAction,
} from "@/lib/actions/category";
import { useActiveOrganization } from "@/lib/auth/client";
import {
  type CreateCategoryValues,
  categorySchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/generate-slug";
import { useEffect, useState } from "react";
import type { Category } from "./columns";

export const CreateCategoryModal = ({
  open,
  setOpen,
  onCategoryCreated,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onCategoryCreated?: (category: {
    name: string;
    id: string;
    slug: string;
  }) => void;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  const { name } = watch();
  const { data: activeOrganization } = useActiveOrganization();

  useEffect(() => {
    setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateCategoryValues) => {
    const isTaken = await checkCategorySlugAction(
      data.slug,
      activeOrganization.id as string,
    );

    if (isTaken) {
      setError("slug", {
        message: "You already have a category with that slug",
      });
    }

    try {
      const res = await createCategoryAction(data, activeOrganization.id);
      if (res) {
        setOpen(false);
        toast.success("Category created successfully");
        if (onCategoryCreated) {
          onCategoryCreated(res);
        }
      }
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create category</DialogTitle>
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
            Create category
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const UpdateCategoryModal = ({
  open,
  setOpen,
  categoryData,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  categoryData: Category;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { ...categoryData },
  });

  const { name } = watch();

  const { data: activeWorkspace } = useActiveOrganization();

  useEffect(() => {
    setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateCategoryValues) => {
    const isTaken = await checkCategorySlugForUpdateAction(
      data.slug,
      activeWorkspace.id,
      categoryData.id,
    );

    if (isTaken) {
      setError("slug", {
        message: "You already have a category with that slug",
      });
      return;
    }

    try {
      const res = await updateCategoryAction(data, categoryData.id);
      if (!res) {
        setOpen(false);
        toast.success("Category updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update category</DialogTitle>
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
            Update category
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const DeleteCategoryModal = ({
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

  async function deleteCategory() {
    setLoading(true);
    try {
      await deleteCategoryAction(id);
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error("Failed to delete category.");
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
              onClick={deleteCategory}
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
