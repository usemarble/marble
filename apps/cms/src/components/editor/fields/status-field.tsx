"use client";

import { Label } from "@marble/ui/components/label";
import { Switch } from "@marble/ui/components/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { Info } from "@phosphor-icons/react";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";

interface StatusFieldProps {
  control: Control<PostValues>;
}

export function StatusField({ control }: StatusFieldProps) {
  const {
    field: { onChange, value },
  } = useController({
    name: "status",
    control,
  });

  return (
    <div className="flex items-center gap-2 justify-between">
      <div className="flex items-center gap-1">
        <Label htmlFor="status">Published</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-muted-foreground text-xs max-w-64">
              Whether your post is published or saved as a draft.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Switch
        id="status"
        checked={value === "published"}
        onCheckedChange={() =>
          onChange(value === "published" ? "draft" : "published")
        }
      />
    </div>
  );
}
