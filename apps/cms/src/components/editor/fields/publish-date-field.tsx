"use client";

import type { PostValues } from "@/lib/validations/post";
import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@marble/ui/components/tooltip";
import { CalendarDays, InfoIcon } from "@marble/ui/lib/icons";
import { cn } from "@marble/ui/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";

interface PublishDateFieldProps {
  watch: UseFormWatch<PostValues>;
  setValue: UseFormSetValue<PostValues>;
}

export function PublishDateField({ watch, setValue }: PublishDateFieldProps) {
  const [date, setDate] = useState<Date | undefined>(
    watch("publishedAt") ? new Date(watch("publishedAt")) : new Date(),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="publishedAt">Published On</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-muted-foreground text-xs max-w-64">
              The date your post was published. This is set by default but you
              can change it to any date.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "justify-between text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            {date ? format(date, "PPP") : <span>Pick a date</span>}
            <CalendarDays className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              if (date) {
                setDate(date);
                setValue("publishedAt", date);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
