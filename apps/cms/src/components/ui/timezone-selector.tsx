"use client";

import { Input } from "@marble/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { cn } from "@marble/ui/lib/utils";
import { forwardRef, useMemo, useState, useEffect, useRef } from "react";

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
  className?: string;
}

const TimezoneSelector = forwardRef<HTMLButtonElement, TimezoneSelectorProps>(
  (
    {
      value,
      onValueChange,
      disabled,
      placeholder = "Select timezone...",
      className,
    },
    ref,
  ) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [timeUpdate, setTimeUpdate] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Update times every minute
    useEffect(() => {
      const interval = setInterval(() => {
        setTimeUpdate(prev => prev + 1);
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }, []);

    // Generate all timezone options with current time
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
            } catch (error) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeUpdate]); // timeUpdate is used to trigger recalculation every minute

    // Filter options based on search term
    const filteredOptions = useMemo(() => {
      if (!searchTerm) {
        return timezoneOptions;
      }

      const search = searchTerm.toLowerCase();
      return timezoneOptions.filter(
        (option) =>
          option.label.toLowerCase().includes(search) ||
          option.value.toLowerCase().includes(search),
      );
    }, [timezoneOptions, searchTerm]);

    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger ref={ref} className={cn(className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[400px]">
          <div className="p-2 border-b">
            <Input
              ref={searchInputRef}
              placeholder="Search timezones..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // Keep focus on input after typing
                setTimeout(() => {
                  if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
                    searchInputRef.current.focus();
                  }
                }, 0);
              }}
              className="h-8"
              onKeyDown={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                // Completely prevent Select from handling any keys
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape' || e.key === 'Tab') {
                  e.preventDefault();
                }
              }}
              onKeyUp={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onKeyPress={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                searchInputRef.current?.focus();
              }}
              onFocus={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onBlur={(e) => {
                e.stopPropagation();
                // Don't let it lose focus unless user clicked outside
                if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
                  setTimeout(() => searchInputRef.current?.focus(), 0);
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              onInput={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }}
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className="max-h-[300px] overflow-auto">
            {filteredOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  <span className="text-muted-foreground text-sm ml-4">
                    {option.currentTime}
                  </span>
                </div>
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    );
  },
);

TimezoneSelector.displayName = "TimezoneSelector";

export { TimezoneSelector };
