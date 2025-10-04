"use client";

import { Button } from "@marble/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
} from "@marble/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { forwardRef, useRef, useState } from "react";

export type SelectOption = {
  label: string;
  value: string;
};

type VirtualizedSelectProps = {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export const VirtualizedSelect = forwardRef<
  HTMLButtonElement,
  VirtualizedSelectProps
>(
  (
    { options, value, onValueChange, placeholder, disabled, className },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const parentRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const virtualizer = useVirtualizer({
      count: filteredOptions.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 32,
      overscan: 5,
    });

    const selectedOption = options.find((option) => option.value === value);

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            className={cn(
              "justify-between bg-editor-field shadow-none",
              !value && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            ref={ref}
            role="combobox"
            variant="outline"
          >
            {selectedOption ? selectedOption.label : placeholder}
            <CaretUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[200px] p-0">
          <Command>
            <CommandInput
              onValueChange={setSearchQuery}
              placeholder="Search options..."
              value={searchQuery}
            />
            <CommandEmpty>No options found.</CommandEmpty>
            <div
              className="max-h-[200px] overflow-auto"
              ref={parentRef}
              style={{
                height: `${Math.min(filteredOptions.length * 32, 200)}px`,
              }}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const option = filteredOptions[virtualItem.index];
                  const isSelected = option.value === value;

                  return (
                    <CommandItem
                      className="flex cursor-pointer items-center justify-between"
                      key={option.value}
                      onSelect={(currentValue) => {
                        onValueChange?.(
                          currentValue === value ? "" : currentValue
                        );
                        setOpen(false);
                        setSearchQuery("");
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      value={option.value}
                    >
                      <span className="truncate">{option.label}</span>
                      <CheckIcon
                        className={cn(
                          "ml-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </div>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

VirtualizedSelect.displayName = "VirtualizedSelect";
