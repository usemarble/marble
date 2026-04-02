"use client";

import { FieldRichTextEditor } from "@marble/editor";
import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@marble/ui/components/command";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { Switch } from "@marble/ui/components/switch";
import { Textarea } from "@marble/ui/components/textarea";
import { cn } from "@marble/ui/lib/utils";
import {
  CalendarDotsIcon,
  CaretUpDownIcon,
  CheckIcon,
  XIcon,
} from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
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

function parseMultiselectValue(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function getCustomFieldControlId(fieldId: string) {
  return `cf-${fieldId}`;
}

function getCustomFieldLabelId(fieldId: string) {
  return `cf-label-${fieldId}`;
}

function FieldLabel({
  field,
  targetId,
}: {
  field: CustomField;
  targetId?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Label
        htmlFor={targetId ?? getCustomFieldControlId(field.id)}
        id={getCustomFieldLabelId(field.id)}
      >
        {field.name}
      </Label>
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
            id={getCustomFieldControlId(field.id)}
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
            id={getCustomFieldControlId(field.id)}
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
              id={getCustomFieldControlId(field.id)}
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
                  aria-labelledby={getCustomFieldLabelId(field.id)}
                  className={cn(
                    "justify-between bg-editor-field text-left font-normal shadow-none active:scale-100",
                    !isValidDate && "text-muted-foreground"
                  )}
                  id={getCustomFieldControlId(field.id)}
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
            id={getCustomFieldControlId(field.id)}
            labelId={getCustomFieldLabelId(field.id)}
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

    case "select":
      return (
        <div className="grid gap-2">
          <FieldLabel field={field} />
          <Select
            items={[
              { label: `Select ${field.name.toLowerCase()}`, value: null },
              ...field.options.map((option) => ({
                label: option.label,
                value: option.value,
              })),
            ]}
            onValueChange={(value) => formField.onChange(value ?? "")}
            value={formField.value || null}
          >
            <SelectTrigger
              aria-labelledby={getCustomFieldLabelId(field.id)}
              className="w-full bg-editor-field shadow-none"
              id={getCustomFieldControlId(field.id)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value={null}>
                {`Select ${field.name.toLowerCase()}`}
              </SelectItem> */}
              {field.options.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error ? (
            <ErrorMessage className="text-sm">{error.message}</ErrorMessage>
          ) : null}
        </div>
      );

    case "multiselect":
      return (
        <MultiselectField
          error={error?.message}
          field={field}
          onBlur={formField.onBlur}
          onChange={formField.onChange}
          value={formField.value ?? ""}
        />
      );

    default:
      return null;
  }
}

function MultiselectField({
  error,
  field,
  onBlur,
  onChange,
  value,
}: {
  error?: string;
  field: CustomField;
  onBlur: () => void;
  onChange: (value: string) => void;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedValues = useMemo(() => parseMultiselectValue(value), [value]);
  const selectedOptions = useMemo(
    () =>
      field.options.filter((option) => selectedValues.includes(option.value)),
    [field.options, selectedValues]
  );

  const toggleValue = (optionValue: string) => {
    const nextValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((value) => value !== optionValue)
      : [...selectedValues, optionValue];

    onChange(JSON.stringify(nextValues));
  };

  const removeValue = (optionValue: string) => {
    onChange(
      JSON.stringify(selectedValues.filter((value) => value !== optionValue))
    );
  };

  return (
    <div className="grid gap-2">
      <FieldLabel field={field} />
      <Popover
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            onBlur();
          }
        }}
        open={open}
      >
        <PopoverTrigger
          nativeButton={false}
          render={
            // biome-ignore lint/a11y/useAriaPropsSupportedByRole: <>
            <div
              aria-haspopup="dialog"
              aria-labelledby={getCustomFieldLabelId(field.id)}
              className="relative h-auto min-h-9 w-full cursor-pointer rounded-md border bg-editor-field px-3 py-2 text-sm"
              id={getCustomFieldControlId(field.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <ul className="flex flex-wrap gap-1">
                  {selectedOptions.length === 0 ? (
                    <li className="text-muted-foreground">
                      {`Select ${field.name.toLowerCase()}`}
                    </li>
                  ) : (
                    selectedOptions.map((option) => (
                      <li key={option.id}>
                        <Badge
                          className="bg-background font-normal"
                          variant="outline"
                        >
                          {option.label}
                          <button
                            className="ml-1 h-auto p-0 hover:bg-transparent"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeValue(option.value);
                            }}
                            type="button"
                          >
                            <XIcon className="size-2.5 p-0" />
                          </button>
                        </Badge>
                      </li>
                    ))
                  )}
                </ul>
                <CaretUpDownIcon className="size-4 shrink-0 opacity-50" />
              </div>
            </div>
          }
          tabIndex={0}
        />
        <PopoverContent align="start" className="min-w-[350px] p-0">
          <Command className="w-full">
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {field.options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);

                  return (
                    <CommandItem
                      id={option.id}
                      key={option.id}
                      onSelect={() => toggleValue(option.value)}
                    >
                      {option.label}
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error ? <ErrorMessage className="text-sm">{error}</ErrorMessage> : null}
    </div>
  );
}
