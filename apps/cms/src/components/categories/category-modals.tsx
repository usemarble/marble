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
  checkCategorySlugAction,
  checkCategorySlugForUpdateAction,
} from "@/lib/actions/checks";
import {
  type CreateCategoryValues,
  categorySchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/string";
import { useWorkspace } from "../../providers/workspace";
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
  const { activeWorkspace } = useWorkspace();

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
      queryClient.invalidateQueries({
        queryKey: ["categories", activeWorkspace?.slug],
      });
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
    const isTaken = await checkCategorySlugAction(
      data.slug,
      activeWorkspace?.id as string
    );

    if (isTaken) {
      setError("slug", {
        message: "You already have a category with that slug",
      });
      return;
    }

    createCategory(data);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="max-w-sm p-8">
        <DialogHeader>
          <DialogTitle className="text-center font-medium">
            Create category
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
            {isSubmitting ? <ButtonLoader /> : "Create category"}
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

  const { activeWorkspace } = useWorkspace();

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
      queryClient.invalidateQueries({
        queryKey: ["categories", activeWorkspace?.slug],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    setValue("slug", generateSlug(name));
  }, [name, setValue]);

  const onSubmit = async (data: CreateCategoryValues) => {
    const isTaken = await checkCategorySlugForUpdateAction(
      data.slug,
      activeWorkspace?.id as string,
      categoryData.id
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
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="max-w-sm p-8">
        <DialogHeader>
          <DialogTitle className="text-center font-medium">
            Update category
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
  const { activeWorkspace } = useWorkspace();

  const { mutate: deleteCategory, isPending } = useMutation({
    mutationFn: () =>
      fetch(`/api/categories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["categories", activeWorkspace?.id],
      });
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete category.");
    },
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
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
              disabled={isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteCategory();
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
