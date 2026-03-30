"use client";

import { FieldRichTextEditor } from "@marble/editor";
import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Switch } from "@marble/ui/components/switch";
import { Textarea } from "@marble/ui/components/textarea";
import { cn } from "@marble/ui/lib/utils";
import { CalendarDotsIcon } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useEditorData } from "@/components/editor/editor-data-provider";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  SUPPORTED_CUSTOM_FIELD_TYPES,
  validateCustomFieldValue,
} from "@/lib/custom-fields";
import type { PostEditorValues } from "@/lib/validations/post";
import type { CustomField } from "@/types/fields";
import { FieldInfo } from "./field-info";

export function CustomFieldsSection() {
  const { fieldDefinitions } = useEditorData();

  const supportedFields = useMemo(
    () =>
      fieldDefinitions.filter((field) =>
        SUPPORTED_CUSTOM_FIELD_TYPES.has(field.type)
      ),
    [fieldDefinitions]
  );

  if (supportedFields.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6">
      {supportedFields.map((field) => (
        <FieldInput field={field} key={field.id} />
      ))}
    </div>
  );
}

function FieldLabel({ field }: { field: CustomField }) {
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={`cf-${field.id}`}>{field.name}</Label>
      {field.description ? <FieldInfo text={field.description} /> : null}
    </div>
  );
}

function FieldInput({ field }: { field: CustomField }) {
  const { control } = useFormContext<PostEditorValues>();
  const {
    field: formField,
    fieldState: { error },
  } = useController({
    name: `customFields.${field.id}`,
    control,
    defaultValue: "",
    rules: {
      validate: (value) => {
        const validation = validateCustomFieldValue(field, value);
        return validation.success ? true : validation.message;
      },
    },
  });

  switch (field.type) {
    case "text":
      return (
        <div className="grid gap-2">
          <FieldLabel field={field} />
          <Textarea
            className="min-h-[60px] resize-y bg-editor-field"
            id={`cf-${field.id}`}
            onBlur={formField.onBlur}
            onChange={formField.onChange}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            ref={formField.ref}
            value={formField.value ?? ""}
          />
          {error ? (
            <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
          ) : null}
        </div>
      );

    case "number":
      return (
        <div className="grid gap-2">
          <FieldLabel field={field} />
          <Input
            className="bg-editor-field"
            id={`cf-${field.id}`}
            onBlur={formField.onBlur}
            onChange={formField.onChange}
            placeholder="0"
            ref={formField.ref}
            type="number"
            value={formField.value ?? ""}
          />
          {error ? (
            <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
          ) : null}
        </div>
      );

    case "boolean":
      return (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <FieldLabel field={field} />
            <Switch
              checked={formField.value === "true"}
              id={`cf-${field.id}`}
              onCheckedChange={(checked) =>
                formField.onChange(checked ? "true" : "false")
              }
            />
          </div>
          {error ? (
            <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
          ) : null}
        </div>
      );

    case "date": {
      const value = formField.value ?? "";
      const dateValue = value ? parseISO(value) : undefined;
      const isValidDate = dateValue && !Number.isNaN(dateValue.getTime());

      return (
        <div className="grid gap-2">
          <FieldLabel field={field} />
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  className={cn(
                    "justify-between bg-editor-field text-left font-normal shadow-none active:scale-100",
                    !isValidDate && "text-muted-foreground"
                  )}
                  variant="outline"
                >
                  {isValidDate ? (
                    format(dateValue, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarDotsIcon className="text-muted-foreground" />
                </Button>
              }
            />
            <PopoverContent className="w-auto overflow-hidden p-0">
              <Calendar
                autoFocus
                captionLayout="dropdown"
                mode="single"
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    formField.onChange(format(date, "yyyy-MM-dd"));
                    return;
                  }

                  formField.onChange("");
                }}
                selected={isValidDate ? dateValue : undefined}
              />
            </PopoverContent>
          </Popover>
          {error ? (
            <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
          ) : null}
        </div>
      );
    }

    case "richtext":
      return (
        <div className="grid gap-2">
          <FieldLabel field={field} />
          <FieldRichTextEditor
            onBlur={formField.onBlur}
            onChange={formField.onChange}
            placeholder={`Write ${field.name.toLowerCase()}`}
            value={formField.value ?? ""}
          />
          {error ? (
            <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
          ) : null}
        </div>
      );

    default:
      return null;
  }
}
