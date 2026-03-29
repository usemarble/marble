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
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import { ErrorMessage } from "@/components/ui/error-message";
import { FieldInfo } from "./field-info";

interface PublishDateFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
}

function toUTCMidnight(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

function utcToLocalDate(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function PublishDateField<TFieldValues extends FieldValues>({
  control,
}: PublishDateFieldProps<TFieldValues>) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "publishedAt" as Path<TFieldValues>,
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
