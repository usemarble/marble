"use client";

import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { FieldInfo } from "./field-info";

interface SlugFieldProps {
  control: Control<PostValues>;
}

export function SlugField({ control }: SlugFieldProps) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name: "slug",
    control,
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="slug">Slug</Label>
        <FieldInfo text="A url friendly string that can be used to access your post." />
      </div>
      <Input
        id="slug"
        {...field}
        placeholder="my-awesome-post"
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
