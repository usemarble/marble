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
} from "@marble/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getTimeZones } from "@vvo/tzdb";
import { Cron } from "croner";
import { useEffect, useMemo, useRef, useState } from "react";

interface TimezoneOption {
  value: string;
  label: string;
  currentTime: string;
  countryName: string;
  countryCode: string;
}

interface TimezoneSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  timezones: string[];
}

export function TimezoneSelector({
  value,
  onValueChange,
  disabled,
  placeholder = "Select timezone...",
  timezones,
}: TimezoneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeUpdate, setTimeUpdate] = useState(0);
  const [query, setQuery] = useState("");
  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cronJob = new Cron("* * * * *", () => {
      setTimeUpdate((prev) => prev + 1);
    });

    return () => cronJob.stop();
  }, []);

  const tzdbData = useMemo(() => {
    try {
      return getTimeZones();
    } catch (err) {
      console.error("Could not load tzdb data:", err);
      return [];
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We use the state to retrigger the effect
  const timezoneOptions = useMemo<TimezoneOption[]>(() => {
    try {
      const now = new Date();

      return timezones
        .map((timezone) => {
          try {
            const formatter = new Intl.DateTimeFormat("en-US", {
              timeZone: timezone,
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });

            const currentTime = formatter.format(now);

            // Find country information from tzdb
            const tzInfo = tzdbData.find(
              (tz) => tz.name === timezone || tz.group.includes(timezone)
            );

            return {
              value: timezone,
              label: timezone.replace(/_/g, " "),
              currentTime,
              countryName: tzInfo?.countryName || "Unknown",
              countryCode: tzInfo?.countryCode || "XX",
            };
          } catch (_error) {
            return {
              value: timezone,
              label: timezone.replace(/_/g, " "),
              currentTime: "N/A",
              countryName: "Unknown",
              countryCode: "XX",
            };
          }
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    } catch (error) {
      console.error("Error generating timezone options:", error);
      return [];
    }
  }, [timezones, timeUpdate]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return timezoneOptions;
    }
    return timezoneOptions.filter((opt) =>
      `${opt.label} ${opt.value} ${opt.countryName}`.toLowerCase().includes(q)
    );
  }, [timezoneOptions, query]);

  const virtual = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  // Triggers a re-render when the popover opens, this ensures that the virtualizer has a valid ref to the scroll element
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const id = requestAnimationFrame(() => virtual.measure());
    return () => cancelAnimationFrame(id);
  }, [isOpen, virtual]);

  const selectedTimezone = timezoneOptions.find(
    (option) => option.value === value
  );

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          className="w-full items-center justify-between gap-2 shadow-none active:scale-100"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          type="button"
          variant="outline"
        >
          <div
            className={cn(
              "flex flex-col items-start",
              !selectedTimezone && "text-muted-foreground"
            )}
          >
            {selectedTimezone ? (
              <div className="flex gap-2">
                <span>{selectedTimezone.label}</span>
                <Badge className="bg-muted font-light" variant="outline">
                  {selectedTimezone.currentTime}
                </Badge>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <CaretUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-[370px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={(v) => setQuery(v)}
            placeholder="Search timezones..."
            value={query}
          />
          <CommandList ref={parentRef}>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup
              className="relative"
              style={{ height: `${virtual.getTotalSize()}px` }}
            >
              {virtual.getVirtualItems().map((row) => {
                // biome-ignore lint/style/noNonNullAssertion: known not null
                const option = filteredOptions[row.index]!;

                return (
                  <CommandItem
                    className="absolute top-0 left-0 w-full"
                    key={option.value}
                    onSelect={() => {
                      onValueChange?.(option.value);
                      setIsOpen(false);
                    }}
                    style={{
                      height: `${row.size}px`,
                      transform: `translateY(${row.start}px)`,
                    }}
                    value={`${option.label} ${option.value} ${option.countryName}`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-muted-foreground text-xs">
                          {option.countryName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                          {option.currentTime}
                        </span>
                        <CheckIcon
                          className={cn(
                            "h-4 w-4",
                            value === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
