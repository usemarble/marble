"use client";

import { Label } from "@marble/ui/components/label";
import { Textarea } from "@marble/ui/components/textarea";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { FieldInfo } from "./field-info";

type DescriptionFieldProps = {
  control: Control<PostValues>;
};

export function DescriptionField({ control }: DescriptionFieldProps) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name: "description",
    control,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="description">Description</Label>
        <FieldInfo text="A short description of your post recommended to be 155 characters or less" />
      </div>

      <Textarea
        id="description"
        {...field}
        placeholder="A short description of your post"
        className="col-span-3 bg-editor-field"
      />
      {error && (
        <p className="text-sm px-1 font-medium text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
