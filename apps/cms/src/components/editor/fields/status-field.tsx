"use client";

import { Label } from "@marble/ui/components/label";
import { Switch } from "@marble/ui/components/switch";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { FieldInfo } from "./field-info";

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
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Label htmlFor="status">Published</Label>
        <FieldInfo text="Whether your post is published or saved as a draft." />
      </div>
      {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
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
