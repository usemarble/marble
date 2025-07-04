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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { Info, Plus } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type {
  Control,
  FieldErrors,
  UseFormClearErrors,
  UseFormSetValue,
} from "react-hook-form";
import { CreateCategoryModal } from "@/components/categories/category-modals";
import type { PostValues } from "@/lib/validations/post";

interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
}

interface CategorySelectorProps {
  control: Control<PostValues>;
  errors: FieldErrors<PostValues>;
  setValue: UseFormSetValue<PostValues>;
  clearErrors: UseFormClearErrors<PostValues>;
}

export function CategorySelector({
  control,
  errors,
  setValue,
  clearErrors,
}: CategorySelectorProps) {
  const [showCategoyModal, setShowCategoryModal] = useState(false);
  const categoryValue = control ? control._getWatch("category") : "";
  const [optimisticCategories, setOptimisticCategories] = useState<
    CategoryResponse[]
  >([]);
  const queryClient = useQueryClient();

  const { isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      try {
        const res = await fetch("/api/categories");
        const categories: CategoryResponse[] = await res.json();
        setOptimisticCategories(categories);
        return categories;
      } catch (error) {
        setOptimisticCategories([]);
        console.error(error);
      }
    },
  });

  const handleCategoryCreated = (newCategory: CategoryResponse) => {
    setOptimisticCategories((prevCategories) => [
      ...prevCategories,
      newCategory,
    ]);
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <Label htmlFor="category">Category</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-muted-foreground text-xs max-w-64">
                Good for grouping posts together. You can have one category per
                post.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select
          value={categoryValue}
          onValueChange={(value) => {
            setValue("category", value);
            clearErrors("category");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="font-normal px-2 text-xs flex items-center gap-1 justify-between">
                <span className="text-muted-foreground text-xs">
                  {isLoadingCategories
                    ? "Loading categories..."
                    : optimisticCategories.length === 0
                      ? "No categories"
                      : "Categories"}
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 p-1 hover:bg-accent"
                  onClick={() => setShowCategoryModal(true)}
                >
                  <Plus className="size-4 text-muted-foreground" />
                  <span className="sr-only">Add New Category</span>
                </button>
              </SelectLabel>
              {optimisticCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm px-1 font-medium text-destructive">
            {errors.category.message}
          </p>
        )}
      </div>
      <CreateCategoryModal
        open={showCategoyModal}
        setOpen={setShowCategoryModal}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}
