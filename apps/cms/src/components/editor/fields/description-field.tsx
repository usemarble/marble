"use client";

import { Label } from "@marble/ui/components/label";
import { Textarea } from "@marble/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { InfoIcon } from "@marble/ui/lib/icons";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";

interface DescriptionFieldProps {
  register: UseFormRegister<PostValues>;
  errors: FieldErrors<PostValues>;
}

export function DescriptionField({ register, errors }: DescriptionFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="description">Description</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-muted-foreground text-xs max-w-64">
              A short description of your post recommended to be 155 characters
              or less
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Textarea
        id="description"
        {...register("description")}
        placeholder="A short description of your post"
        className="col-span-3"
      />
      {errors.description && (
        <p className="text-sm px-1 font-medium text-destructive">
          {errors.description.message}
        </p>
      )}
    </div>
  );
}
