/** biome-ignore-all lint/correctness/useUniqueElementIds: IDs are unique within their respective modals */
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
import { AsyncButton } from "../ui/async-button";
import type { Category } from "./columns";

export const CategoryModal = ({
  open,
  setOpen,
  mode = "create",
  categoryData = { name: "", slug: "" },
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
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: categoryData.name || "",
      slug: categoryData.slug || "",
    },
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

    const isTaken =
      mode === "create"
        ? await checkCategorySlugAction(data.slug, workspaceId)
        : await checkCategorySlugForUpdateAction(
            data.slug,
            workspaceId,
            categoryData.id as string, // Safe to assert after guard check
          );

    if (isTaken) {
      setError("slug", {
        message: "You already have a category with that slug",
      });
      return;
    }

    if (mode === "create") {
      createCategory(data);
    } else {
      updateCategory(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="font-medium text-center">
            {mode === "create" ? "Create Category" : "Update Category"}
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
          <AsyncButton
            type="submit"
            isLoading={isSubmitting}
            className="flex w-full gap-2 mt-4"
          >
            {mode === "create" ? "Create Category" : "Update Category"}
          </AsyncButton>
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
    mutationFn: async () => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        throw new Error(
          `Failed to delete category: ${res.status} ${res.statusText} - ${errorText}`,
        );
      }

      return true;
    },
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
          <AsyncButton
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              deleteCategory();
            }}
            isLoading={isPending}
          >
            Delete
          </AsyncButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
