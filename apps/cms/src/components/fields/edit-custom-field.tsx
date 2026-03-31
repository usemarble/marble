"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@marble/ui/components/sheet";
import { toast } from "@marble/ui/components/sonner";
import { Textarea } from "@marble/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { AsyncButton } from "@/components/ui/async-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type CustomFieldFormValues,
  customFieldSchema,
} from "@/lib/validations/fields";
import type { CustomField } from "@/types/fields";

const typeOptions = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Date", value: "date" },
  { label: "Rich Text", value: "richtext" },
];

interface EditCustomFieldSheetProps {
  field: CustomField;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCustomFieldSheet({
  field,
  open,
  onOpenChange,
}: EditCustomFieldSheetProps) {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      name: field.name,
      description: field.description ?? "",
      key: field.key,
      type: field.type,
    },
  });

  const watchedType = useWatch({ control, name: "type" });

  const { mutate: updateField, isPending } = useMutation({
    mutationFn: async (data: CustomFieldFormValues) => {
      const res = await fetch(`/api/fields/${field.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update field");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success("Custom field updated");
      onOpenChange(false);
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_FIELDS(workspaceId),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update field");
    },
  });

  const onSubmit = (data: CustomFieldFormValues) => {
    updateField(data);
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="p-6">
          <SheetTitle className="font-medium text-xl">
            Edit Custom Field
          </SheetTitle>
          <SheetDescription className="sr-only">
            Update the custom field properties.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex h-full flex-col justify-between"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-5 grid flex-1 auto-rows-min gap-6 px-6">
            <div className="grid gap-3">
              <Label htmlFor="edit-cf-name">Name</Label>
              <Input
                id="edit-cf-name"
                placeholder="Release Date"
                {...register("name")}
              />
              {errors.name && (
                <ErrorMessage className="text-sm">
                  {errors.name.message}
                </ErrorMessage>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="edit-cf-key">Key</Label>
              <Input
                id="edit-cf-key"
                placeholder="release_date"
                {...register("key")}
              />
              <p className="text-muted-foreground text-xs">
                Used as the identifier when storing the value. Must be unique
                per workspace. Only lowercase letters, numbers, and underscores.
              </p>
              {errors.key && (
                <ErrorMessage className="text-sm">
                  {errors.key.message}
                </ErrorMessage>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="edit-cf-description">Description</Label>
              <Textarea
                id="edit-cf-description"
                placeholder="Optional helper text shown to editors"
                {...register("description")}
              />
              <p className="text-muted-foreground text-xs">
                Optional guidance for editors. Useful for tooltips or helper
                text in the sidebar.
              </p>
              {errors.description && (
                <ErrorMessage className="text-sm">
                  {errors.description.message}
                </ErrorMessage>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="edit-cf-type">Type</Label>
              <Select
                items={typeOptions}
                onValueChange={(value) => {
                  if (value) {
                    setValue("type", value);
                  }
                }}
                value={watchedType}
              >
                <SelectTrigger className="w-full shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <ErrorMessage className="text-sm">
                  {errors.type.message}
                </ErrorMessage>
              )}
            </div>
          </div>

          <SheetFooter className="p-6">
            <AsyncButton className="w-full" isLoading={isPending} type="submit">
              Save changes
            </AsyncButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
