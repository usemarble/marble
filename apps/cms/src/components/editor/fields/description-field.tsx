"use client";

import { Label } from "@marble/ui/components/label";
import { Textarea } from "@marble/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { Info } from "@phosphor-icons/react";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";

interface DescriptionFieldProps {
  control: Control<PostValues>;
}

export function DescriptionField({ control }: DescriptionFieldProps) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name: "description",
    control,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="description">Description</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-64 text-muted-foreground text-xs">
              A short description of your post recommended to be 155 characters
              or less
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Textarea
        id="description"
        {...field}
        className="col-span-3"
        placeholder="A short description of your post"
      />
      {error && (
        <p className="px-1 font-medium text-destructive text-sm">
          {error.message}
        </p>
      )}
    </div>
  );
}
