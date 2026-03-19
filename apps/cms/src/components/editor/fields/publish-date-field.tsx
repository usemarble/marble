"use client";

import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import { CalendarDotsIcon } from "@phosphor-icons/react";
import { format } from "date-fns";
import { type Control, useController } from "react-hook-form";
import { ErrorMessage } from "@/components/ui/error-message";
import type { PostValues } from "@/lib/validations/post";
import { FieldInfo } from "./field-info";

interface PublishDateFieldProps {
  control: Control<PostValues>;
}

function toUTCMidnight(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

function utcToLocalDate(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function PublishDateField({ control }: PublishDateFieldProps) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "publishedAt",
    control,
  });

  const displayDate = value ? utcToLocalDate(value) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="publishedAt">Published On</Label>
        <FieldInfo text="The date your post was published. This is set by default but you can change it to any date." />
      </div>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              className={cn(
                "justify-between bg-editor-field text-left font-normal shadow-none active:scale-100",
                !value && "text-muted-foreground"
              )}
              variant="outline"
            >
              {displayDate ? (
                format(displayDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarDotsIcon className="text-muted-foreground" />
            </Button>
          }
        />
        <PopoverContent className="w-auto overflow-hidden p-0">
          <Calendar
            autoFocus
            captionLayout="dropdown"
            mode="single"
            onSelect={(date: Date | undefined) => {
              if (date) {
                onChange(toUTCMidnight(date));
              }
            }}
            selected={displayDate}
          />
        </PopoverContent>
      </Popover>
      {error && (
        <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
      )}
    </div>
  );
}
