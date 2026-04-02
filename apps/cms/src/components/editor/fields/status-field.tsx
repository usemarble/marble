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

interface StatusFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
}

export function StatusField<TFieldValues extends FieldValues>({
  control,
}: StatusFieldProps<TFieldValues>) {
  const {
    field: { onChange, value },
  } = useController({
    name: "status" as Path<TFieldValues>,
    control,
  });

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Label htmlFor="status">Published</Label>
        <FieldInfo text="Whether your post is published or saved as a draft." />
      </div>

      <Switch
        checked={value === "published"}
        id="status"
        onCheckedChange={() =>
          onChange(value === "published" ? "draft" : "published")
        }
      />
    </div>
  );
}
