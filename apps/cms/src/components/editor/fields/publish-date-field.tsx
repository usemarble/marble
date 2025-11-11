"use client";

import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Separator } from "@marble/ui/components/separator";
import { cn } from "@marble/ui/lib/utils";
import { CalendarDotsIcon, ClockIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useState } from "react";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { FieldInfo } from "./field-info";

type PublishDateFieldProps = {
  control: Control<PostValues>;
};

export function PublishDateField({ control }: PublishDateFieldProps) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "publishedAt",
    control,
  });

  const [open, setOpen] = useState(false);
  const [timeValue, setTimeValue] = useState(() => {
    if (value) {
      const date = new Date(value);
      return format(date, "HH:mm");
    }
    return "12:00";
  });

  // Get client timezone
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezoneAbbr = new Date()
    .toLocaleTimeString("en-US", {
      timeZoneName: "short",
    })
    .split(" ")
    .pop();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Parse the time from timeValue
      const [hours, minutes] = timeValue.split(":").map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      onChange(newDate);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);

    if (value) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours, minutes, 0, 0);
      onChange(newDate);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="publishedAt">Published On</Label>
        <FieldInfo text="The date and time your post will be published. Set a future date to schedule the post." />
      </div>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "justify-between bg-editor-field text-left font-normal shadow-none active:scale-100",
              !value && "text-muted-foreground"
            )}
            variant="outline"
          >
            {value ? (
              <span className="flex items-center gap-2">
                <span>{format(value, "PPP")}</span>
                <span className="text-muted-foreground">at</span>
                <span>{format(value, "HH:mm")}</span>
              </span>
            ) : (
              <span>Pick a date and time</span>
            )}
            <CalendarDotsIcon className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <div className="flex flex-col">
            <Calendar
              autoFocus
              captionLayout="dropdown"
              mode="single"
              onSelect={handleDateSelect}
              selected={value}
            />
            <Separator />
            <div className="flex flex-col gap-3 p-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="text-muted-foreground" size={16} />
                <Input
                  className="h-8 bg-editor-field"
                  onChange={handleTimeChange}
                  type="time"
                  value={timeValue}
                />
              </div>
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Timezone: {clientTimezone}</span>
                {timezoneAbbr && <span>{timezoneAbbr}</span>}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="px-1 font-medium text-destructive text-sm">
          {error.message}
        </p>
      )}
    </div>
  );
}
