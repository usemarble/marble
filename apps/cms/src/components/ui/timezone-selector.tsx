"use client";

import { Button } from "@marble/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@marble/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import { CaretUpDown, Check } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";

interface TimezoneOption {
  value: string;
  label: string;
  currentTime: string;
}

interface TimezoneSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TimezoneSelector({
  value,
  onValueChange,
  disabled,
  placeholder = "Select timezone...",
}: TimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeUpdate, setTimeUpdate] = useState(0);

  // Update times every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUpdate((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Generate all timezone options with current time
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  const timezoneOptions = useMemo<TimezoneOption[]>(() => {
    try {
      const supportedTimezones = Intl.supportedValuesOf("timeZone");
      const now = new Date();

      return supportedTimezones
        .map((timezone) => {
          try {
            const formatter = new Intl.DateTimeFormat("en-US", {
              timeZone: timezone,
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            const currentTime = formatter.format(now);

            return {
              value: timezone,
              label: timezone.replace(/_/g, " "),
              currentTime,
            };
          } catch (_error) {
            return {
              value: timezone,
              label: timezone.replace(/_/g, " "),
              currentTime: "N/A",
            };
          }
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      console.error("Error generating timezone options:", error);
      return [];
    }
  }, [timeUpdate]);

  const selectedTimezone = timezoneOptions.find(
    (option) => option.value === value,
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full items-center justify-between gap-2"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={cn(!selectedTimezone && "text-muted-foreground")}>
            {selectedTimezone ? selectedTimezone.label : placeholder}
          </span>
          <CaretUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[500px] p-0" align="center">
        <Command>
          <CommandInput placeholder="Search timezones..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {timezoneOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    onValueChange?.(option.value);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        {option.currentTime}
                      </span>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
