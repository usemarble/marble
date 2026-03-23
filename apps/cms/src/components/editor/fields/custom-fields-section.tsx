"use client";

import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Skeleton } from "@marble/ui/components/skeleton";
import { Switch } from "@marble/ui/components/switch";
import { Textarea } from "@marble/ui/components/textarea";
import { cn } from "@marble/ui/lib/utils";
import { CalendarDotsIcon } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import type { CustomField } from "@/types/fields";
import { FieldInfo } from "./field-info";

interface CustomFieldsSectionProps {
  postId?: string;
  mode: "create" | "update";
}

export function CustomFieldsSection({ postId }: CustomFieldsSectionProps) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const prevPostIdRef = useRef(postId);
  const pendingValuesRef = useRef<Record<string, string>>({});

  // Fetch field definitions (always) + values (only if postId exists)
  const { data, isLoading } = useQuery({
    queryKey: postId
      ? ["post-fields", postId]
      : ["workspace-fields", workspaceId],
    queryFn: async () => {
      if (postId) {
        const res = await fetch(`/api/posts/${postId}/fields`);
        if (!res.ok) {
          throw new Error("Failed to fetch fields");
        }
        return res.json() as Promise<{
          fields: CustomField[];
          values: Record<string, string>;
        }>;
      }

      const res = await fetch("/api/fields");
      if (!res.ok) {
        throw new Error("Failed to fetch fields");
      }
      const fields: CustomField[] = await res.json();
      return { fields, values: {} as Record<string, string> };
    },
    staleTime: 1000 * 60 * 5,
  });

  // Initialize local values once data loads
  useEffect(() => {
    if (data?.values && !initialized) {
      setLocalValues(data.values);
      setInitialized(true);
    }
  }, [data, initialized]);

  const debouncedValues = useDebounce(localValues, 800);

  const { mutate: saveValues } = useMutation({
    mutationFn: async (values: Record<string, string | null>) => {
      if (!postId) {
        return;
      }
      const res = await fetch(`/api/posts/${postId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        throw new Error("Failed to save fields");
      }
      return res.json();
    },
    onSuccess: () => {
      if (postId) {
        queryClient.invalidateQueries({
          queryKey: ["post-fields", postId],
        });
      }
    },
  });

  // When postId becomes available (new post saved), persist any pending values
  useEffect(() => {
    if (postId && !prevPostIdRef.current && data?.fields?.length) {
      // Transitioned from new post → saved post
      const payload: Record<string, string | null> = {};
      let hasValues = false;
      for (const field of data.fields) {
        const value = pendingValuesRef.current[field.id];
        if (value && value.trim() !== "") {
          payload[field.id] = value;
          hasValues = true;
        } else {
          payload[field.id] = null;
        }
      }
      if (hasValues) {
        saveValues(payload);
      }
      setInitialized(false);
    }
    prevPostIdRef.current = postId;
  }, [postId, data?.fields, saveValues]);

  // Auto-save on debounced value change (only for existing posts)
  useEffect(() => {
    if (!postId || !initialized || !data?.fields?.length) {
      return;
    }

    const payload: Record<string, string | null> = {};
    for (const field of data.fields) {
      const value = debouncedValues[field.id];
      payload[field.id] = value && value.trim() !== "" ? value : null;
    }

    saveValues(payload);
  }, [debouncedValues, initialized, data?.fields, saveValues, postId]);

  const handleChange = useCallback(
    (fieldId: string, value: string) => {
      setLocalValues((prev) => ({ ...prev, [fieldId]: value }));
      // Keep a ref copy for persistence on post creation
      pendingValuesRef.current[fieldId] = value;
    },
    []
  );

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-[60px] w-full rounded-md" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!data?.fields?.length) {
    return null;
  }

  return (
    <div className="grid gap-6">
      {data.fields.map((field) => (
        <FieldInput
          field={field}
          key={field.id}
          onChange={handleChange}
          value={localValues[field.id] ?? ""}
        />
      ))}
    </div>
  );
}

interface FieldInputProps {
  field: CustomField;
  value: string;
  onChange: (fieldId: string, value: string) => void;
}

function FieldLabel({ field }: { field: CustomField }) {
  return (
    <div className="flex items-center gap-1">
      <Label htmlFor={`cf-${field.id}`}>{field.name}</Label>
      {field.description ? <FieldInfo text={field.description} /> : null}
    </div>
  );
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  switch (field.type) {
    case "text":
      return (
        <div className="grid gap-2">
          <FieldLabel field={field} />
          <Textarea
            className="min-h-[60px] resize-none"
            id={`cf-${field.id}`}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            value={value}
          />
        </div>
      );

    case "number":
      return (
        <div className="grid gap-2">
          <FieldLabel field={field} />
          <Input
            id={`cf-${field.id}`}
            onChange={(e) => onChange(field.id, e.target.value)}
            placeholder="0"
            type="number"
            value={value}
          />
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <FieldLabel field={field} />
          <Switch
            checked={value === "true"}
            id={`cf-${field.id}`}
            onCheckedChange={(checked) =>
              onChange(field.id, checked ? "true" : "false")
            }
          />
        </div>
      );

    case "date": {
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
                    const isoDate = format(date, "yyyy-MM-dd");
                    onChange(field.id, isoDate);
                  }
                }}
                selected={isValidDate ? dateValue : undefined}
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    }

    default:
      return null;
  }
}
