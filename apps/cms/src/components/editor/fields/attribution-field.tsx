"use client";

import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { Switch } from "@marble/ui/components/switch";
import { useState } from "react";
import { type Control, type FieldErrors, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { FieldInfo } from "./field-info";

interface AttributionFieldProps {
  control: Control<PostValues>;
  errors: FieldErrors<PostValues>;
}

export function AttributionField({ control, errors }: AttributionFieldProps) {
  const {
    field: { onChange, value },
  } = useController({
    name: "attribution",
    control,
  });

  const [showAttribution, setShowAttribution] = useState(!!value);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Label htmlFor="attribution">Add Attribution</Label>
          <FieldInfo
            text="Use this when republishing content from elsewhere to give credit to the original author."
            className="size-4"
          />
        </div>
        <Switch
          id="attribution"
          checked={showAttribution}
          onCheckedChange={(checked) => {
            setShowAttribution(checked);
            if (!checked) {
              onChange(null);
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
                onChange({
                  author: e.target.value,
                  url: value?.url || "",
                });
              }}
              value={value?.author || ""}
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
                onChange({
                  author: value?.author || "",
                  url: e.target.value,
                });
              }}
              value={value?.url || ""}
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
