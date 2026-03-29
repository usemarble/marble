"use client";

import { Label } from "@marble/ui/components/label";
import { Switch } from "@marble/ui/components/switch";
import { type Control, useController } from "react-hook-form";
import { FieldInfo } from "./field-info";

interface StatusFieldProps {
  control: Control<any>;
}

export function StatusField({ control }: StatusFieldProps) {
  const {
    field: { onChange, value },
  } = useController({
    name: "status",
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
