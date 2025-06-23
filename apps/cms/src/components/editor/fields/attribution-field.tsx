"use client";

import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { Switch } from "@marble/ui/components/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { InfoIcon } from "@marble/ui/lib/icons";
import { useState } from "react";
import type {
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";

interface AttributionFieldProps {
  watch: UseFormWatch<PostValues>;
  setValue: UseFormSetValue<PostValues>;
  errors: FieldErrors<PostValues>;
}

export function AttributionField({
  watch,
  setValue,
  errors,
}: AttributionFieldProps) {
  const attribution = watch("attribution");
  const [showAttribution, setShowAttribution] = useState(!!attribution);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label htmlFor="attribution">Add Attribution</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="size-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-muted-foreground text-xs max-w-64">
                Use this when republishing content from elsewhere to give credit
                to the original author.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Switch
          id="attribution"
          checked={showAttribution}
          onCheckedChange={(checked) => {
            setShowAttribution(checked);
            if (!checked) {
              setValue("attribution", null);
            }
          }}
        />
      </div>

      {showAttribution && (
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Input
              placeholder="Original author's name"
              onChange={(e) => {
                setValue("attribution", {
                  author: e.target.value,
                  url: attribution?.url || "",
                });
              }}
              value={attribution?.author || ""}
            />
            {errors.attribution?.author && (
              <p className="text-sm text-destructive px-1">
                {errors.attribution.author.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Link to original post"
              onChange={(e) => {
                setValue("attribution", {
                  author: attribution?.author || "",
                  url: e.target.value,
                });
              }}
              value={attribution?.url || ""}
            />
            {errors.attribution?.url && (
              <p className="text-sm text-destructive px-1">
                {errors.attribution.url.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
