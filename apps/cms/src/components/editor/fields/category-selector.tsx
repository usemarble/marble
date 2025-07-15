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
      },
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
              <p className="text-muted-foreground text-xs max-w-64">
                Good for grouping posts together. You can have one category per
                post.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="font-normal px-2 text-xs flex items-center gap-1 justify-between">
                <span className="text-muted-foreground text-xs">
                  {isLoadingCategories
                    ? "Loading categories..."
                    : categories.length === 0
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
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {error && (
          <p className="text-sm px-1 font-medium text-destructive">
            {error.message}
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
