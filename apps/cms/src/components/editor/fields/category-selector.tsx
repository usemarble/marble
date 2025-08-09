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
import { type Control, useController } from "react-hook-form";
import { CreateCategoryModal } from "@/components/categories/category-modals";
import type { PostValues } from "@/lib/validations/post";

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
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data: CategoryResponse[] = await res.json();
      return data;
    },
  });

  const handleCategoryCreated = (newCategory: CategoryResponse) => {
    queryClient.setQueryData(
      ["categories"],
      (oldData: CategoryResponse[] | undefined) => {
        return oldData ? [...oldData, newCategory] : [newCategory];
      }
    );

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
              <p className="max-w-64 text-muted-foreground text-xs">
                Good for grouping posts together. You can have one category per
                post.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select onValueChange={onChange} value={value}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="flex items-center justify-between gap-1 px-2 font-normal text-xs">
                <span className="text-muted-foreground text-xs">
                  {isLoadingCategories && "Loading categories..."}
                  {!isLoadingCategories &&
                    categories.length === 0 &&
                    "No categories"}
                  {!isLoadingCategories &&
                    categories.length > 0 &&
                    "Categories"}
                </span>
                <button
                  className="flex items-center gap-1 p-1 hover:bg-accent"
                  onClick={() => setShowCategoryModal(true)}
                  type="button"
                >
                  <Plus className="size-4 text-muted-foreground" />
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
      <CreateCategoryModal
        onCategoryCreated={handleCategoryCreated}
        open={showCategoyModal}
        setOpen={setShowCategoryModal}
      />
    </>
  );
}
