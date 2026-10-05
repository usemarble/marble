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
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import { CategoryModal } from "@/components/categories/category-modals";
import { ErrorMessage } from "@/components/ui/error-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { orpc } from "@/lib/orpc";
import { FieldInfo } from "./field-info";

interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
}

interface CategorySelectorProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
}

export function CategorySelector<TFieldValues extends FieldValues>({
  control,
}: CategorySelectorProps<TFieldValues>) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "category" as Path<TFieldValues>,
    control,
  });

  const [showCategoyModal, setShowCategoryModal] = useState(false);
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery(
    orpc.categories.list.queryOptions({
      input: { workspaceId: workspaceId ?? "" },
      staleTime: 1000 * 60 * 60,
      enabled: Boolean(workspaceId),
    })
  );

  const handleCategoryCreated = (newCategory: CategoryResponse) => {
    if (!workspaceId) {
      return;
    }

    queryClient.invalidateQueries({
      queryKey: orpc.categories.key({ input: { workspaceId } }),
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
          <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
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
