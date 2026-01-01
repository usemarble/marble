"use client";

import { Label } from "@marble/ui/components/label";
import { Switch } from "@marble/ui/components/switch";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { FieldInfo } from "./field-info";

interface FeaturedFieldProps {
  control: Control<PostValues>;
}

export function FeaturedField({ control }: FeaturedFieldProps) {
  const {
    field: { onChange, value },
  } = useController({
    name: "featured",
    control,
  });

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Label htmlFor="featured">Featured</Label>
        <FieldInfo text="Whether your post is featured or not." />
      </div>

      <Switch
        checked={value === true}
        id="featured"
        onCheckedChange={() => onChange(!value)}
      />
    </div>
  );
}
