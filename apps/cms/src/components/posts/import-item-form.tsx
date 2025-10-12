"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import { Separator } from "@marble/ui/components/separator";
import { CheckIcon } from "@phosphor-icons/react";
import matter from "gray-matter";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
  file: File;
  name: string;
  ext: string;
  initialData: Partial<PostValues>;
  onUpload: (payload: PostImportValues) => Promise<unknown>;
  onStatusChange: (
    status: "ready" | "uploading" | "done" | "error",
    error?: string
  ) => void;
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
  file,
  name,
  initialData,
  onUpload,
  onStatusChange,
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
      authors: ["placeholder"],
      content: "placeholder",
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
      onStatusChange("uploading");
      const raw = await file.text();
      const parsed = matter(raw);
      const markdown = parsed.content || "";

      if (!markdown || markdown.trim().length === 0) {
        throw new Error("No content found to import");
      }

      const payload: PostImportValues = {
        title: values.title,
        slug: values.slug,
        description: values.description,
        status: values.status,
        publishedAt: values.publishedAt,
        category: values.category,
        content: markdown,
        coverImage: undefined,
        tags: [],
        attribution: undefined,
      };

      await onUpload(payload);
      onStatusChange("done");
      toast.success(`${name} imported`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to upload";
      onStatusChange("error", message);
      toast.error(message);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <Separator />
      <div className="grid gap-4">
        <StatusField control={control} />
        <div className="flex flex-col gap-1.5">
          <Label className="font-medium text-xs" htmlFor={`title-${name}`}>
            Title
          </Label>
          <Input
            id={`title-${name}`}
            {...register("title")}
            className="bg-background"
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

      <div className="flex justify-end gap-2">
        <AsyncButton
          disabled={isSubmitting || !isValid}
          isLoading={isSubmitting}
          loadingText="Importing..."
          size="sm"
          type="submit"
        >
          <CheckIcon className="mr-2 size-4" />
          Confirm Import
        </AsyncButton>
      </div>
    </form>
  );
}
