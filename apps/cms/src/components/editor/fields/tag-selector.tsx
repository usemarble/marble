"use client";

import { Badge } from "@marble/ui/components/badge";
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
  XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { type Control, useController } from "react-hook-form";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PostValues } from "@/lib/validations/post";
import { ErrorMessage } from "../../auth/error-message";
import { TagModal } from "../../tags/tag-modals";
import { FieldInfo } from "./field-info";

type Option = {
  id: string;
  name: string;
  slug: string;
};

type TagResponse = {
  id: string;
  name: string;
  slug: string;
};

type MultiSelectPopoverProps = {
  control: Control<PostValues>;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  defaultTags?: string[];
};

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
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.TAGS(workspaceId!),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) {
        throw new Error("Failed to fetch tags");
      }
      const data: TagResponse[] = await res.json();
      return data;
    },
    enabled: !!workspaceId,
  });

  // Compute selected tags directly without useEffect
  const selected = useMemo(() => {
    if (tags.length > 0 && value && value?.length > 0) {
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

  const handleTagCreated = async (newTag: Option) => {
    if (!workspaceId) {
      return;
    }

    // Optimistically update React Query cache
    queryClient.setQueryData(
      QUERY_KEYS.TAGS(workspaceId),
      (oldData: TagResponse[] | undefined) => {
        return oldData ? [...oldData, newTag] : [newTag];
      }
    );

    // Also invalidate to refetch from server
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TAGS(workspaceId) });

    const newValue = [...(value || []), newTag.id];
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Label htmlFor="tags">Tags</Label>
        <FieldInfo text="Your articles can have multiple tags, we will use this to determine related articles." />
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full cursor-pointer rounded-md border px-3 py-2 text-sm min-h-9 h-auto bg-editor-field">
            <div className="flex items-center justify-between gap-2">
              <ul className="flex flex-wrap gap-1">
                {selected.length === 0 && (
                  <li className="text-muted-foreground">
                    {placeholder || "Select some tags"}
                  </li>
                )}
                {selected.map((item) => (
                  <li key={item.id}>
                    <Badge variant="outline" className="font-normal">
                      {item.name}
                      <button
                        type="button"
                        className="ml-1 h-auto p-0 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(item.id);
                        }}
                      >
                        <XIcon className="size-2.5 p-0" />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
              <CaretUpDownIcon className="size-4 shrink-0 opacity-50" />
            </div>
          </div>
        </PopoverTrigger>
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <PopoverContent className="min-w-[350.67px] p-0" align="start">
          <Command className="w-full">
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <div className="font-normal px-2 text-xs flex items-center gap-1 justify-between bg-background pt-2 pb-1">
                <span className="text-muted-foreground text-xs">
                  {isLoadingTags
                    ? "Loading tags..."
                    : tags.length === 0
                      ? "No tags"
                      : "Tags"}
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 p-1 hover:bg-accent"
                  onClick={() => setOpenTagModal(true)}
                >
                  <PlusIcon className="size-4 text-muted-foreground" />
                  <span className="sr-only">Add a new tag</span>
                </button>
              </div>
              {tags.length > 0 && (
                <CommandGroup>
                  {tags.map((option) => (
                    <CommandItem
                      key={option.id}
                      id={option.id}
                      onSelect={() => addTag(option.id)}
                    >
                      {option.name}
                      <CheckIcon
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

      <TagModal
        open={openTagModal}
        setOpen={setOpenTagModal}
        mode="create"
        onTagCreated={handleTagCreated}
      />
    </div>
  );
};
