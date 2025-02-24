"use client";

import type { PostValues } from "@/lib/validations/post";
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
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { Check, ChevronsUpDown, InfoIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { type Control, useController } from "react-hook-form";
import { ErrorMessage } from "../auth/error-message";
import { CreateTagModal } from "../tags/tag-modals";

interface Option {
  id: string;
  name: string;
  slug: string;
}

interface MultiSelectPopoverProps {
  options: Option[];
  control: Control<PostValues>;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  defaultTags?: string[];
  onTagCreated?: (tag: Option) => void;
}

export const TagSelector = ({
  options,
  control,
  placeholder,
  isOpen,
  setIsOpen,
  defaultTags = [],
  onTagCreated,
}: MultiSelectPopoverProps) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "tags",
    control,
    defaultValue: defaultTags,
  });
  const [selected, setSelected] = useState<Option[]>([]);
  const [openTagModal, setOpenTagModal] = useState(false);

  // Update selected options when value or options change
  useEffect(() => {
    if (options.length > 0 && value?.length > 0) {
      const selectedTags = options.filter((opt) => value.includes(opt.id));
      setSelected(selectedTags);
    } else {
      setSelected([]);
    }
  }, [value, options]);

  const addTag = (tagToAdd: string) => {
    if (value?.includes(tagToAdd)) return;
    const newValue = [...(value || []), tagToAdd];
    onChange(newValue);
  };

  const handleRemoveTag = (tagToDelete: string) => {
    const newValue = (value || []).filter((tag: string) => tag !== tagToDelete);
    onChange(newValue);
  };

  const handleTagCreated = async (newTag: Option) => {
    // Update the local options list optimistically
    onTagCreated?.(newTag);

    // Automatically select the new tag
    const newValue = [...(value || []), newTag.id];
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <Label htmlFor="tags">Tags</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="size-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-muted-foreground text-xs max-w-64">
                Your articles can have multiple tags, we will use this to
                determine related articles.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm h-10">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="ml-1 h-auto p-0 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTag(item.id);
                        }}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </li>
                ))}
              </ul>
              <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
            </div>
          </div>
        </PopoverTrigger>
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <PopoverContent className="min-w-[364.67px] p-0" align="start">
          <Command className="w-full">
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <div className="font-normal px-2 text-xs flex items-center gap-1 justify-between bg-background pt-2 pb-1">
                <span className="text-muted-foreground text-xs">
                  {options.length === 0 ? "No tags" : "Tags"}
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
              {options.length > 0 && (
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      id={option.id}
                      onSelect={() => addTag(option.id)}
                    >
                      {option.name}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selected.some((item) => item.id === option.id)
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {options.length > 0 && <CommandSeparator />}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreateTagModal
        open={openTagModal}
        setOpen={setOpenTagModal}
        onTagCreated={handleTagCreated}
      />
    </div>
  );
};
