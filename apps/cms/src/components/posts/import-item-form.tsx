"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@marble/ui/components/button";
import { DialogClose } from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { toast } from "@marble/ui/hooks/use-toast";
import { CheckIcon } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { CategorySelector } from "@/components/editor/fields/category-selector";
import { DescriptionField } from "@/components/editor/fields/description-field";
import { PublishDateField } from "@/components/editor/fields/publish-date-field";
import { SlugField } from "@/components/editor/fields/slug-field";
import { StatusField } from "@/components/editor/fields/status-field";
import { AsyncButton } from "@/components/ui/async-button";
import {
  type PostImportValues,
  type PostValues,
  postSchema,
} from "@/lib/validations/post";

type ImportItemFormProps = {
  name: string;
  initialData: Partial<PostValues>;
  onImport: (payload: PostImportValues) => void;
  isImporting: boolean;
};

function isFormValid(values: Partial<PostValues>): boolean {
  return !!(
    values.title?.trim() &&
    values.slug?.trim() &&
    values.description?.trim() &&
    values.category?.trim() &&
    values.status &&
    values.publishedAt
  );
}

export function ImportItemForm({
  name,
  initialData,
  onImport,
  isImporting,
}: ImportItemFormProps) {
  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData.title || "",
      slug: initialData.slug || "",
      description: initialData.description || "",
      status: initialData.status || "draft",
      publishedAt: initialData.publishedAt || new Date(),
      category: initialData.category || "",
      // Provide placeholders to satisfy schema-only fields not shown in this import form
      authors: [],
      content: initialData.content || "",
      contentJson: "placeholder content json",
    },
    mode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const watchedValues = watch();
  const isValid = isFormValid(watchedValues);

  async function onSubmit(values: PostValues) {
    try {
      const markdown = values.content;

      if (!markdown || markdown.trim().length === 0) {
        throw new Error("No content found to import");
      }

      const payload: PostImportValues = {
        title: values.title,
        slug: values.slug,
        description: values.description,
        status: values.status,
        featured: values.featured || false,
        publishedAt: values.publishedAt,
        category: values.category,
        content: markdown,
        coverImage: undefined,
        tags: [],
        attribution: undefined,
      };

      onImport(payload);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to upload";
      toast.error(message);
    }
  }

  return (
    <form
      className="mx-auto flex w-full max-w-96 flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-4">
        <StatusField control={control} />
        <div className="flex flex-col gap-1.5">
          <Label className="font-medium text-xs" htmlFor={`title-${name}`}>
            Title
          </Label>
          <Input
            id={`title-${name}`}
            {...register("title")}
            className="bg-editor-field"
            placeholder="Title"
          />
          {errors.title && (
            <p className="font-medium text-destructive text-xs">
              {errors.title.message}
            </p>
          )}
        </div>

        <DescriptionField control={control} />
        <SlugField control={control} />
        <CategorySelector control={control} />
        <PublishDateField control={control} />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <DialogClose
          render={<Button className="shadow-none" variant="outline" />}
        >
          Cancel
        </DialogClose>
        <AsyncButton
          disabled={isSubmitting || isImporting || !isValid}
          isLoading={isSubmitting || isImporting}
          size="sm"
          type="submit"
        >
          <CheckIcon className="size-4" />
          Confirm
        </AsyncButton>
      </div>
    </form>
  );
}
