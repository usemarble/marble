"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert02Icon, Package01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogX,
} from "@marble/ui/components/alert-dialog";
import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogX,
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
import {
  type CreateCategoryValues,
  categorySchema,
} from "@/lib/validations/workspace";
import { generateSlug } from "@/utils/string";
import { AsyncButton } from "../ui/async-button";
import type { Category } from "./columns";

export const CategoryModal = ({
  open,
  setOpen,
  mode = "create",
  categoryData = { name: "", slug: "", description: "" },
  onCategoryCreated,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mode?: "create" | "update";
  categoryData?: Partial<Category>;
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: categoryData.name || "",
      slug: categoryData.slug || "",
      description: categoryData.description || "",
    },
  });

  const { name } = watch();
  const workspaceId = useWorkspaceId();

  const { mutate: createCategory, isPending: isCreating } = useMutation({
    mutationFn: async (data: CreateCategoryValues) => {
      try {
        const res = await fetch("/api/categories", {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create category");
        }

        const responseData = await res.json();
        return responseData;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to create category"
        );
      }
    },
    onSuccess: (data) => {
      setOpen(false);
      toast.success("Category created successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
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

  const { mutate: updateCategory, isPending: isUpdating } = useMutation({
    mutationFn: async (data: CreateCategoryValues) => {
      try {
        const res = await fetch(`/api/categories/${categoryData.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update category");
        }

        const responseData = await res.json();
        return responseData;
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to update category"
        );
      }
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Category updated successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CATEGORIES(workspaceId),
        });
      }
      reset();
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

  const onSubmit = async (data: CreateCategoryValues) => {
    if (!workspaceId) {
      toast.error("No active workspace");
      return;
    }

    // Guard against missing category ID in update mode
    if (mode === "update" && !categoryData.id) {
      toast.error("Category ID is missing - cannot update category");
      return;
    }

    if (mode === "create") {
      createCategory(data);
    } else {
      updateCategory(data);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="sm:max-w-md" variant="card">
        <DialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={Package01Icon}
              size={18}
              strokeWidth={2}
            />
            <DialogTitle className="font-medium text-muted-foreground text-sm">
              {mode === "create" ? "Create Category" : "Update Category"}
            </DialogTitle>
          </div>
          <DialogX />
        </DialogHeader>
        <DialogBody>
          <form
            className="flex flex-col gap-3"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid flex-1 gap-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                {...register("name")}
                placeholder="The name of the category"
              />
              {errors.name && (
                <ErrorMessage>{errors.name.message}</ErrorMessage>
              )}
            </div>
            <div className="grid flex-1 gap-2">
              <Label htmlFor="category-slug">Slug</Label>
              <Input
                id="category-slug"
                {...register("slug")}
                placeholder="unique-identifier"
              />
              {errors.slug && (
                <ErrorMessage>{errors.slug.message}</ErrorMessage>
              )}
            </div>
            <div className="grid flex-1 gap-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                {...register("description")}
                placeholder="An optional description of the category"
              />
            </div>
            <DialogFooter>
              <DialogClose
                render={
                  <Button size="sm" variant="outline">
                    Cancel
                  </Button>
                }
              />
              <AsyncButton
                className="gap-2"
                isLoading={isSubmitting || isCreating || isUpdating}
                size="sm"
                type="submit"
              >
                {mode === "create" ? "Create" : "Update"}
              </AsyncButton>
            </DialogFooter>
          </form>
        </DialogBody>
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
    mutationFn: async () => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.json().catch(() => "Unknown error");
        throw new Error(errorText.error || "Failed to delete category");
      }

      return true;
    },
    onSuccess: () => {
      toast.success("Category deleted successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CATEGORIES(workspaceId),
        });
      }
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogContent className="sm:max-w-md" variant="card">
        <AlertDialogHeader className="flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-1 items-center gap-2">
            <HugeiconsIcon
              className="text-destructive"
              icon={Alert02Icon}
              size={18}
              strokeWidth={2}
            />
            <AlertDialogTitle className="font-medium text-muted-foreground text-sm">
              Delete "{name}"?
            </AlertDialogTitle>
          </div>
          <AlertDialogX />
        </AlertDialogHeader>
        <AlertDialogBody>
          <AlertDialogDescription>
            This will permanently delete this category from your list and you
            can no longer use this in articles.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} size="sm">
              Cancel
            </AlertDialogCancel>
            <AsyncButton
              isLoading={isPending}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                deleteCategory();
              }}
              size="sm"
              variant="destructive"
            >
              Delete
            </AsyncButton>
          </AlertDialogFooter>
        </AlertDialogBody>
      </AlertDialogContent>
    </AlertDialog>
  );
};
