"use client";

import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { Info } from "@phosphor-icons/react";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";

interface SlugFieldProps {
  control: Control<PostValues>;
}

export function SlugField({ control }: SlugFieldProps) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name: "slug",
    control,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="slug">Slug</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-64 text-muted-foreground text-xs">
              A url friendly string that can be used to access your post,
              recommended to be all lowercase and no special characters.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Input
        id="slug"
        {...field}
        className="col-span-3"
        placeholder="my-awesome-post"
      />
      {error && (
        <p className="px-1 font-medium text-destructive text-sm">
          {error.message}
        </p>
      )}
    </div>
  );
}
