"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
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
  SheetTrigger,
} from "@marble/ui/components/sheet";
import { toast } from "@marble/ui/components/sonner";
import { Textarea } from "@marble/ui/components/textarea";
import { PlusIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { FieldOptionsInput } from "@/components/fields/field-options-input";
import { AsyncButton } from "@/components/ui/async-button";
import { ErrorMessage } from "@/components/ui/error-message";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import {
  type CustomFieldFormValues,
  customFieldSchema,
} from "@/lib/validations/fields";

const typeOptions = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Date", value: "date" },
  { label: "Rich Text", value: "richtext" },
  { label: "Select", value: "select" },
  { label: "Multi Select", value: "multiselect" },
];

function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

interface CreateCustomFieldSheetProps {
  children?: React.ReactNode;
}

function CreateCustomFieldSheet({ children }: CreateCustomFieldSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CustomFieldFormValues>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      name: "",
      description: "",
      key: "",
      type: "text",
      options: [],
    },
  });

  const watchedType = useWatch({ control, name: "type" });
  const showsOptions =
    watchedType === "select" || watchedType === "multiselect";
  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  });

  const router = useRouter();

  const { mutate: createField, isPending: isCreating } = useMutation({
    mutationFn: (data: CustomFieldFormValues) =>
      fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create field");
        }
        return res.json();
      }),
    onSuccess: () => {
      toast.success("Custom field created");
      reset();
      setKeyManuallyEdited(false);
      setIsOpen(false);
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_FIELDS(workspaceId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["editor-bootstrap"],
      });
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create field");
    },
  });

  const onSubmit = (data: CustomFieldFormValues) => {
    createField(data);
  };

  return (
    <Sheet
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          reset();
          setKeyManuallyEdited(false);
        }
      }}
      open={isOpen}
    >
      <SheetTrigger
        render={
          (children as React.ReactElement) || (
            <Button>
              <PlusIcon className="mr-2 size-4" />
              New Field
            </Button>
          )
        }
      />
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="p-6">
          <SheetTitle className="font-medium text-xl">
            New Custom Field
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            Custom fields extend the default post schema. They will be available
            on every post in your workspace.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex h-full flex-col justify-between"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="mb-5 grid flex-1 auto-rows-min gap-6 px-6">
            <div className="grid gap-3">
              <Label htmlFor="cf-name">Name</Label>
              <Input
                id="cf-name"
                placeholder="Release Date"
                {...register("name", {
                  onChange: (e) => {
                    if (!keyManuallyEdited) {
                      setValue("key", toSnakeCase(e.target.value));
                    }
                  },
                })}
              />
              {errors.name && (
                <ErrorMessage className="text-sm">
                  {errors.name.message}
                </ErrorMessage>
              )}
            </div>

            <div className="grid gap-3">
              <Label htmlFor="cf-key">Key</Label>
              <Input
                id="cf-key"
                placeholder="release_date"
                {...register("key", {
                  onChange: () => {
                    setKeyManuallyEdited(true);
                  },
                })}
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
              <Label htmlFor="cf-description">Description</Label>
              <Textarea
                id="cf-description"
                placeholder="Date of release of the post"
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
              <Label htmlFor="cf-type">Type</Label>
              <Select
                items={typeOptions}
                onValueChange={(value) => {
                  if (value) {
                    setValue("type", value);
                    const isOptionType =
                      value === "select" || value === "multiselect";

                    if (isOptionType && fields.length === 0) {
                      append({ value: "", label: "" });
                      return;
                    }

                    if (!isOptionType) {
                      setValue("options", [], { shouldDirty: true });
                    }
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

            {showsOptions ? (
              <FieldOptionsInput
                append={append}
                errors={errors}
                fields={fields}
                register={register}
                remove={remove}
              />
            ) : null}
          </div>

          <SheetFooter className="p-6">
            <AsyncButton
              className="w-full"
              isLoading={isCreating}
              type="submit"
            >
              Create field
            </AsyncButton>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default CreateCustomFieldSheet;
