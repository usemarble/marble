"use client";

import type { PostValues } from "@/lib/validations/post";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { InfoIcon } from "@marble/ui/lib/icons";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

interface SlugFieldProps {
  register: UseFormRegister<PostValues>;
  errors: FieldErrors<PostValues>;
}

export function SlugField({ register, errors }: SlugFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="slug">Slug</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-muted-foreground text-xs max-w-64">
              A url friendly string that can be used to access your post,
              recommended to be all lowercase and no special characters.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Input
        id="slug"
        {...register("slug")}
        placeholder="my-awesome-post"
        className="col-span-3"
      />
      {errors.slug && (
        <p className="text-sm px-1 font-medium text-destructive">
          {errors.slug.message}
        </p>
      )}
    </div>
  );
}
