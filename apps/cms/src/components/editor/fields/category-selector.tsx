import { Label } from "@marble/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { PlusIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { type Control, useController } from "react-hook-form";
import { CategoryModal } from "@/components/categories/category-modals";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PostValues } from "@/lib/validations/post";
import { FieldInfo } from "./field-info";

interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
}

interface CategorySelectorProps {
  control: Control<PostValues>;
}

export function CategorySelector({ control }: CategorySelectorProps) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "category",
    control,
  });

  const [showCategoyModal, setShowCategoryModal] = useState(false);
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.CATEGORIES(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data: CategoryResponse[] = await res.json();
      return data;
    },
    enabled: !!workspaceId,
  });

  const handleCategoryCreated = (newCategory: CategoryResponse) => {
    if (!workspaceId) {
      return;
    }

    queryClient.setQueryData(
      QUERY_KEYS.CATEGORIES(workspaceId),
      (oldData: CategoryResponse[] | undefined) =>
        oldData ? [...oldData, newCategory] : [newCategory]
    );

    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.CATEGORIES(workspaceId),
    });

    onChange(newCategory.id);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <Label htmlFor="category">Category</Label>
          <FieldInfo text="Good for grouping posts together. You can have one category per post." />
        </div>
        <Select
          items={[
            { label: "Choose a category", value: null },
            ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
          ]}
          onValueChange={onChange}
          value={value || null}
        >
          <SelectTrigger className="w-full bg-editor-field shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="flex items-center justify-between gap-1 p-1 font-normal text-xs">
                <span className="text-muted-foreground text-xs">
                  {isLoadingCategories
                    ? "Loading categories..."
                    : categories.length === 0
                      ? "No categories"
                      : "Categories"}
                </span>
                <button
                  className="flex items-center gap-1 p-1 hover:bg-accent"
                  onClick={() => setShowCategoryModal(true)}
                  type="button"
                >
                  <PlusIcon className="size-4 text-muted-foreground" />
                  <span className="sr-only">Add New Category</span>
                </button>
              </SelectLabel>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {error && (
          <p className="px-1 font-medium text-destructive text-sm">
            {error.message}
          </p>
        )}
      </div>
      <CategoryModal
        mode="create"
        onCategoryCreated={handleCategoryCreated}
        open={showCategoyModal}
        setOpen={setShowCategoryModal}
      />
    </>
  );
}
