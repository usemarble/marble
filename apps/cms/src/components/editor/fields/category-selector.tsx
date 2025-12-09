"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@marble/ui/components/command";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import {
  CaretUpDownIcon,
  CheckIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { type Control, useController } from "react-hook-form";
import { CategoryModal } from "@/components/categories/category-modals";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PostValues } from "@/lib/validations/post";
import { ErrorMessage } from "../../auth/error-message";
import { FieldInfo } from "./field-info";

type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
};

type CategorySelectorProps = {
  control: Control<PostValues>;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
};

export function CategorySelector({
  control,
  placeholder,
  isOpen,
  setIsOpen,
}: CategorySelectorProps) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "category",
    control,
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
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

  const selected = useMemo(() => {
    if (categories.length > 0 && value) {
      return categories.find((cat) => cat.id === value);
    }
    return undefined;
  }, [categories, value]);

  const handleSelect = (categoryId: string) => {
    if (value === categoryId) {
      onChange(undefined);
    } else {
      onChange(categoryId);
    }
    setIsOpen?.(false);
  };

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
    setIsOpen?.(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Label htmlFor="category">Category</Label>
        <FieldInfo text="Good for grouping posts together. You can have one category per post." />
      </div>
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverTrigger
          render={
            <div
              id="category"
              className="relative h-auto min-h-9 w-full cursor-pointer rounded-md border bg-editor-field px-3 py-2 text-sm text-left"
            />
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span className={cn(!selected && "text-muted-foreground")}>
              {selected?.name || placeholder || "Choose a category"}
            </span>
            <CaretUpDownIcon className="size-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <PopoverContent align="start" className="min-w-[350.67px] p-0">
          <Command className="w-full">
            <CommandInput placeholder="Search categories..." />
            <div className="flex items-center justify-between gap-1 bg-background px-2 pt-2 pb-1 font-normal text-xs">
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
                <span className="sr-only">Add a new category</span>
              </button>
            </div>
            <CommandList>
              {categories.length > 0 && <CommandEmpty>No results found.</CommandEmpty>}
              {categories.length > 0 && (
                <CommandGroup>
                  {categories.map((category) => (
                    <CommandItem
                      id={category.id}
                      key={category.id}
                      onSelect={() => handleSelect(category.id)}
                    >
                      {category.name}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          selected?.id === category.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {categories.length > 0 && <CommandSeparator />}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CategoryModal
        mode="create"
        onCategoryCreated={handleCategoryCreated}
        open={showCategoryModal}
        setOpen={setShowCategoryModal}
      />
    </div>
  );
}
