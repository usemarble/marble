import type { PostValues } from "@/lib/validations/post";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import { Label } from "@repo/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { Check, ChevronsUpDown, InfoIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { type Control, useController } from "react-hook-form";

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
}

export const TagSelector = ({
  options,
  control,
  placeholder,
  isOpen,
  setIsOpen,
}: MultiSelectPopoverProps) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "tags",
    control,
    defaultValue: [],
  });
  const [selected, setSelected] = useState<Option[]>([]);

  const handleSelect = (value: string) => {
    const option = options.find((opt) => opt.id === value);
    if (!option) return;

    const isSelected = selected.some((item) => item.id === value);
    if (isSelected) {
      onChange(selected.filter((item) => item.id !== value));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(selected.filter((item) => item.id !== valueToRemove));
  };

  const addTag = (tagToAdd: string) => {
    if (value.includes(tagToAdd)) return;
    onChange([...value, tagToAdd]);
    setSelected([
      ...selected,
      options.find((opt) => opt.id === tagToAdd) as Option,
    ]);
  };

  const handleRemoveTag = (tagToDelete: string) => {
    onChange(value.filter((tag: string) => tag !== tagToDelete));
    setSelected(selected.filter((item) => item.id !== tagToDelete));
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
                Your articles can have multiple tags
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm">
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
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="min-w-full p-0" align="start">
          <Command className="w-full">
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
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
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
