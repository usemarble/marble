"use client";

import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import type { ChangeEvent } from "react";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import { ErrorMessage } from "@/components/ui/error-message";
import { generateSlug } from "@/utils/string";
import { FieldInfo } from "./field-info";

interface SlugFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
}

export function SlugField<TFieldValues extends FieldValues>({
  control,
}: SlugFieldProps<TFieldValues>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name: "slug" as Path<TFieldValues>,
    control,
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    field.onChange(generateSlug(event.target.value, { trimEdges: false }));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="slug">Slug</Label>
        <FieldInfo text="A url friendly string that can be used to access your post." />
      </div>
      <Input
        id="slug"
        {...field}
        className="col-span-3 bg-editor-field"
        onChange={handleChange}
        placeholder="my-awesome-post"
      />
      {error && (
        <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
      )}
    </div>
  );
}
