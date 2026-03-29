"use client";

import { Label } from "@marble/ui/components/label";
import { Textarea } from "@marble/ui/components/textarea";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";
import { ErrorMessage } from "@/components/ui/error-message";
import { FieldInfo } from "./field-info";

interface DescriptionFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
}

export function DescriptionField<TFieldValues extends FieldValues>({
  control,
}: DescriptionFieldProps<TFieldValues>) {
  const {
    field,
    fieldState: { error },
  } = useController({
    name: "description" as Path<TFieldValues>,
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
        className="col-span-3 bg-editor-field"
        placeholder="A short description of your post"
      />
      {error && (
        <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
      )}
    </div>
  );
}
