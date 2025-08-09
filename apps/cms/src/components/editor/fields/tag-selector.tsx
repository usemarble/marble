"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { CaretUpDown, Check, Info, Plus, X } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { ErrorMessage } from "../../auth/error-message";
import { CreateTagModal } from "../../tags/tag-modals";

interface Option {
  id: string;
  name: string;
  slug: string;
}

interface TagResponse {
  id: string;
  name: string;
  slug: string;
}

interface MultiSelectPopoverProps {
  control: Control<PostValues>;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  defaultTags?: string[];
}

export const TagSelector = ({
  control,
  placeholder,
  isOpen,
  setIsOpen,
  defaultTags = [],
}: MultiSelectPopoverProps) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "tags",
    control,
    defaultValue: defaultTags,
  });
  const [openTagModal, setOpenTagModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ["tags"],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) {
        throw new Error("Failed to fetch tags");
      }
      const data: TagResponse[] = await res.json();
      return data;
    },
  });

  // Compute selected tags directly without useEffect
  const selected = useMemo(() => {
    if (tags.length > 0 && value?.length > 0) {
      return tags.filter((opt) => value.includes(opt.id));
    }
    return [];
  }, [tags, value]);

  const addTag = (tagToAdd: string) => {
    if (value?.includes(tagToAdd)) {
      return;
    }
    const newValue = [...(value || []), tagToAdd];
    onChange(newValue);
  };

  const handleRemoveTag = (tagToDelete: string) => {
    const newValue = (value || []).filter((tag: string) => tag !== tagToDelete);
    onChange(newValue);
  };

  const handleTagCreated = (newTag: Option) => {
    // Optimistically update React Query cache
    queryClient.setQueryData(["tags"], (oldData: TagResponse[] | undefined) => {
      return oldData ? [...oldData, newTag] : [newTag];
    });

    // Also invalidate to refetch from server
    queryClient.invalidateQueries({ queryKey: ["tags"] });

    const newValue = [...(value || []), newTag.id];
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Label htmlFor="tags">Tags</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-64 text-muted-foreground text-xs">
              Your articles can have multiple tags, we will use this to
              determine related articles.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverTrigger asChild>
          <div className="relative h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <ul className="flex flex-wrap gap-1">
                {selected.length === 0 && (
                  <li className="text-muted-foreground">
                    {placeholder || "Select some tags"}
                  </li>
                )}
                {selected.map((item) => (
                  <li key={item.id}>
                    <Badge className="font-normal" variant="outline">
                      {item.name}
                      <Button
                        className="ml-1 h-auto p-0 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(item.id);
                        }}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <X className="size-2.5" />
                      </Button>
                    </Badge>
                  </li>
                ))}
              </ul>
              <CaretUpDown className="size-4 shrink-0 opacity-50" />
            </div>
          </div>
        </PopoverTrigger>
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <PopoverContent align="start" className="min-w-[350.67px] p-0">
          <Command className="w-full">
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <div className="flex items-center justify-between gap-1 bg-background px-2 pt-2 pb-1 font-normal text-xs">
                <span className="text-muted-foreground text-xs">
                  {isLoadingTags && "Loading tags..."}
                  {!isLoadingTags && tags.length === 0 && "No tags"}
                  {!isLoadingTags && tags.length > 0 && "Tags"}
                </span>
                <button
                  className="flex items-center gap-1 p-1 hover:bg-accent"
                  onClick={() => setOpenTagModal(true)}
                  type="button"
                >
                  <Plus className="size-4 text-muted-foreground" />
                  <span className="sr-only">Add a new tag</span>
                </button>
              </div>
              {tags.length > 0 && (
                <CommandGroup>
                  {tags.map((option) => (
                    <CommandItem
                      id={option.id}
                      key={option.id}
                      onSelect={() => addTag(option.id)}
                    >
                      {option.name}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selected.some((item) => item.id === option.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {tags.length > 0 && <CommandSeparator />}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateTagModal
        onTagCreated={handleTagCreated}
        open={openTagModal}
        setOpen={setOpenTagModal}
      />
    </div>
  );
};
