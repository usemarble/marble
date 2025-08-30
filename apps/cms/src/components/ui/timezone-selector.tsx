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
import { useVirtualizer } from "@tanstack/react-virtual";
import { getTimeZones } from "@vvo/tzdb";
import { Cron } from "croner";
import { Check, ChevronsUpDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const parentRef = useRef(null);

  // Forces a re-render when the popover opens, this ensures that the virtualizer has a valid ref to the scroll element since the ref updates
  //  after the first render. WIthout this the popover would open empty.
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>();
  const ensureRefreshRefCallback = useCallback(
    (element: HTMLDivElement | null) => {
      if (popoverElement !== element) {
        setPopoverElement(element);
      }
    },
    [popoverElement],
  );

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
              (tz) => tz.name === timezone || tz.group.includes(timezone),
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
    if (!q) return timezoneOptions;
    return timezoneOptions.filter((opt) =>
      `${opt.label} ${opt.value} ${opt.countryName}`.toLowerCase().includes(q),
    );
  }, [timezoneOptions, query]);

  const virtual = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

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
          <div
            className={cn(
              "flex flex-col items-start",
              !selectedTimezone && "text-muted-foreground",
            )}
          >
            {selectedTimezone ? (
              <div className="flex gap-2">
                <span>{selectedTimezone.label}</span>
                <Badge variant="outline" className="font-light bg-muted">
                  {selectedTimezone.currentTime}
                </Badge>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[370px] p-0"
        align="center"
        ref={ensureRefreshRefCallback}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search timezones..."
            value={query}
            onValueChange={(v) => setQuery(v)}
          />
          <CommandList ref={parentRef}>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup
              style={{ height: `${virtual.getTotalSize()}px` }}
              className="relative"
            >
              {virtual.getVirtualItems().map((virtual) => {
                // biome-ignore lint/style/noNonNullAssertion: known not null
                const option = filteredOptions[virtual.index]!;

                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value} ${option.countryName}`}
                    onSelect={() => {
                      onValueChange?.(option.value);
                      setIsOpen(false);
                    }}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      height: `${virtual.size}px`,
                      transform: `translateY(${virtual.start}px)`,
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
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
                        <Check
                          className={cn(
                            "h-4 w-4",
                            value === option.value
                              ? "opacity-100"
                              : "opacity-0",
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
