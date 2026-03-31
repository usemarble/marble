"use client";

import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import type {
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
} from "react-hook-form";
import { ErrorMessage } from "@/components/ui/error-message";
import type { CustomFieldFormValues } from "@/lib/validations/fields";

interface FieldOptionsInputProps {
  append: UseFieldArrayAppend<CustomFieldFormValues, "options">;
  errors: FieldErrors<CustomFieldFormValues>;
  fields: FieldArrayWithId<CustomFieldFormValues, "options", "id">[];
  register: UseFormRegister<CustomFieldFormValues>;
  remove: UseFieldArrayRemove;
}

export function FieldOptionsInput({
  append,
  errors,
  fields,
  register,
  remove,
}: FieldOptionsInputProps) {
  return (
    <div className="grid gap-3">
      <Label>Options</Label>
      <div className="grid gap-2">
        {fields.map((field, index) => (
          <div className="grid gap-1" key={field.id}>
            <div className="flex items-start gap-2">
              <Input
                placeholder="value"
                {...register(`options.${index}.value`)}
              />
              <Input
                placeholder="Label"
                {...register(`options.${index}.label`)}
              />
              <Button
                aria-label="Remove option"
                className="size-9 shrink-0 shadow-none"
                onClick={() => remove(index)}
                type="button"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
            {errors.options?.[index]?.value ? (
              <ErrorMessage className="text-sm">
                {errors.options[index]?.value?.message}
              </ErrorMessage>
            ) : null}
            {errors.options?.[index]?.label ? (
              <ErrorMessage className="text-sm">
                {errors.options[index]?.label?.message}
              </ErrorMessage>
            ) : null}
          </div>
        ))}
      </div>
      <Button
        className="w-fit shadow-none"
        onClick={() => append({ value: "", label: "" })}
        size="sm"
        type="button"
        variant="outline"
      >
        <PlusIcon className="size-4" />
        Add option
      </Button>
      {errors.options?.message ? (
        <ErrorMessage className="text-sm">
          {errors.options.message}
        </ErrorMessage>
      ) : null}
    </div>
  );
}
