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
import { getTimeZones } from "@vvo/tzdb";
import { Cron } from "croner";
import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    const cronJob = new Cron("* * * * *", () => {
      setTimeUpdate((prev) => prev + 1);
    });

    return () => cronJob.stop();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We use the state to retrigger the effect
  const timezoneOptions = useMemo<TimezoneOption[]>(() => {
    try {
      const now = new Date();
      const tzdbData = getTimeZones();

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
              <>
                <span>{selectedTimezone.label}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedTimezone.countryName}
                </span>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <CaretUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[600px] p-0" align="center">
        <Command>
          <CommandInput placeholder="Search timezones..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {timezoneOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value} ${option.countryName}`}
                  onSelect={() => {
                    onValueChange?.(option.value);
                    setIsOpen(false);
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
