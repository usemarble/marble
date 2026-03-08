"use client";

import { ErrorMessage } from "@/components/ui/error-message";
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
            className="size-4"
            text="Use this when republishing content from elsewhere to give credit to the original author."
          />
        </div>
        <Switch
          checked={showAttribution}
          id="attribution"
          onCheckedChange={(checked) => {
            setShowAttribution(checked);
            if (!checked) {
              onChange(null);
            }
          }}
        />
      </div>

      {showAttribution && (
        <div className="mt-2 space-y-4">
          <div className="space-y-2">
            <Input
              className="col-span-3 bg-editor-field"
              onChange={(e) => {
                onChange({
                  author: e.target.value,
                  url: value?.url || "",
                });
              }}
              placeholder="Original author's name"
              value={value?.author || ""}
            />
            {errors.attribution?.author && (
              <ErrorMessage className="text-sm">{errors.attribution.author.message}</ErrorMessage>
            )}
          </div>

          <div className="space-y-2">
            <Input
              className="col-span-3 bg-editor-field"
              onChange={(e) => {
                onChange({
                  author: value?.author || "",
                  url: e.target.value,
                });
              }}
              placeholder="Link to original post"
              value={value?.url || ""}
            />
            {errors.attribution?.url && (
              <ErrorMessage className="text-sm">{errors.attribution.url.message}</ErrorMessage>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
