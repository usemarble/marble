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
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import {
  checkCategorySlugAction,
  checkCategorySlugForUpdateAction,
} from "@/lib/actions/checks";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type CreateCategoryValues,
  categorySchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/string";
import { ButtonLoader } from "../ui/loader";
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
  const queryClient = useQueryClient();
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
  const workspaceId = useWorkspaceId();

  const { mutate: createCategory } = useMutation({
    mutationFn: (data: CreateCategoryValues) =>
      fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to create category");
        }
        return res.json();
      }),
    onSuccess: (data) => {
      setOpen(false);
      toast.success("Category created successfully");
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CATEGORIES(workspaceId),
        });
      }
      if (onCategoryCreated) {
        onCategoryCreated(data);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateCategoryValues) => {
    if (!workspaceId) {
      toast.error("No active workspace");
      return;
    }

    const isTaken = await checkCategorySlugAction(data.slug, workspaceId);

    if (isTaken) {
      setError("slug", {
        message: "You already have a category with that slug",
      });
      return;
    }

    createCategory(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm p-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-center">
            Create Category
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 mt-2"
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name" className="sr-only">
              Name
            </Label>
            <Input id="name" {...register("name")} placeholder="Name" />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug" className="sr-only">
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
            type="submit"
            disabled={isSubmitting}
            className="flex w-full gap-2 mt-4"
            size={"sm"}
          >
            {isSubmitting ? <ButtonLoader /> : "Create Category"}
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
  const queryClient = useQueryClient();
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
  const workspaceId = useWorkspaceId();

  const { mutate: updateCategory } = useMutation({
    mutationFn: (data: CreateCategoryValues) =>
      fetch(`/api/categories/${categoryData.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Failed to update category");
        }
        return res.json();
      }),
    onSuccess: () => {
      setOpen(false);
      toast.success("Category updated successfully");
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CATEGORIES(workspaceId),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateCategoryValues) => {
    if (!workspaceId) {
      toast.error("No active workspace");
      return;
    }

    const isTaken = await checkCategorySlugForUpdateAction(
      data.slug,
      workspaceId,
      categoryData.id,
    );

    if (isTaken) {
      setError("slug", {
        message: "You already have a category with that slug",
      });
      return;
    }

    updateCategory(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm p-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-center">
            Update category
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 mt-2"
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor="name" className="sr-only">
              Name
            </Label>
            <Input id="name" {...register("name")} placeholder="Name" />
            {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="slug" className="sr-only">
              Slug
            </Label>
            <Input id="slug" {...register("slug")} placeholder="slug" />
            {errors.slug && <ErrorMessage>{errors.slug.message}</ErrorMessage>}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full gap-2 mt-4"
            size={"sm"}
          >
            {isSubmitting ? <ButtonLoader /> : "Update category"}
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
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: deleteCategory, isPending } = useMutation({
    mutationFn: () =>
      fetch(`/api/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      if (workspaceId) {
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CATEGORIES(workspaceId),
        });
      }
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete category.");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this category from your list and you
            can no longer use this in articles.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={(e) => {
                e.preventDefault();
                deleteCategory();
              }}
              disabled={isPending}
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
