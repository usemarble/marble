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

  // Cache timezone database data - only computed once
  const timezoneData = useMemo(() => {
    try {
      return getTimeZones();
    } catch (err) {
      console.error("Could not load tzdb data:", err);
      return [];
    }
  }, []);

  // Cache timezone options with current times - recomputes when time updates
  const timezoneOptions = useMemo<TimezoneOption[]>(() => {
    if (!timezones.length) return [];
    
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
          const tzInfo = timezoneData.find(
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
  }, [timezones, timezoneData, timeUpdate]);

  // Cache filtered search results
  const filteredTimezones = useMemo(() => {
    if (!query.trim()) return timezoneOptions;
    const searchQuery = query.trim().toLowerCase();
    return timezoneOptions.filter((option) =>
      `${option.label} ${option.value} ${option.countryName}`
        .toLowerCase()
        .includes(searchQuery),
    );
  }, [timezoneOptions, query]);

  const virtual = useVirtualizer({
    count: filteredTimezones.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
  });

  // Triggers a re-render when the popover opens, this ensures that the virtualizer has a valid ref to the scroll element
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => virtual.measure());
    return () => cancelAnimationFrame(id);
  }, [isOpen, virtual]);

  const selectedTimezone = timezoneOptions.find(
    (option) => option.value === value,
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full items-center shadow-none justify-between gap-2"
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
          <CaretUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[370px] p-0" align="center">
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
              {virtual.getVirtualItems().map((row) => {
                // biome-ignore lint/style/noNonNullAssertion: known not null
                const option = filteredTimezones[row.index]!;

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
                      height: `${row.size}px`,
                      transform: `translateY(${row.start}px)`,
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
                        <CheckIcon
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
