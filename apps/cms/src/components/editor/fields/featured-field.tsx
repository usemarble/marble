"use client";

import { Label } from "@marble/ui/components/label";
import { Switch } from "@marble/ui/components/switch";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import { FieldInfo } from "./field-info";

interface FeaturedFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
}

export function FeaturedField<TFieldValues extends FieldValues>({
  control,
}: FeaturedFieldProps<TFieldValues>) {
  const {
    field: { onChange, value },
  } = useController({
    name: "featured" as Path<TFieldValues>,
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
