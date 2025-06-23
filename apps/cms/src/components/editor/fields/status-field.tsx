"use client";

import { Label } from "@marble/ui/components/label";
import { Switch } from "@marble/ui/components/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { InfoIcon } from "@marble/ui/lib/icons";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";

interface StatusFieldProps {
  watch: UseFormWatch<PostValues>;
  setValue: UseFormSetValue<PostValues>;
}

export function StatusField({ watch, setValue }: StatusFieldProps) {
  const status = watch("status");

  return (
    <div className="flex items-center gap-2 justify-between">
      <div className="flex items-center gap-1">
        <Label htmlFor="status">Published</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="size-4 text-gray-400" />
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
        checked={status === "published"}
        onCheckedChange={() =>
          setValue(
            "status",
            status === "published" ? "unpublished" : "published",
          )
        }
      />
    </div>
  );
}

export default StatusField;
