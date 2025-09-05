"use client";

import { Separator } from "@marble/ui/components/separator";
import type { Control, FieldErrors } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { AttributionField } from "../fields/attribution-field";
import { AuthorSelector } from "../fields/author-selector";
import { CategorySelector } from "../fields/category-selector";
import { CoverImageSelector } from "../fields/cover-image-selector";
import { DescriptionField } from "../fields/description-field";
import { PublishDateField } from "../fields/publish-date-field";
import { SlugField } from "../fields/slug-field";
import { StatusField } from "../fields/status-field";
import { TagSelector } from "../fields/tag-selector";
import { HiddenScrollbar } from "../hidden-scrollbar";

interface MetadataTabProps {
  control: Control<PostValues>;
  errors: FieldErrors<PostValues>;
  initialAuthors?: PostValues["authors"];
  tags?: PostValues["tags"];
}

export function MetadataTab({
  control,
  errors,
  initialAuthors,
  tags,
}: MetadataTabProps) {
  return (
    <HiddenScrollbar className="h-full px-6">
      <section className="grid gap-6 pb-5 pt-4">
        <StatusField control={control} />

        <Separator orientation="horizontal" className="flex" />

        <CoverImageSelector control={control} />

        <DescriptionField control={control} />

        <SlugField control={control} />

        <AuthorSelector
          control={control}
          defaultAuthors={initialAuthors || []}
        />

        <TagSelector control={control} defaultTags={tags || []} />

        <CategorySelector control={control} />

        <PublishDateField control={control} />

        <Separator orientation="horizontal" className="mt-4 flex" />

        <AttributionField control={control} errors={errors} />
      </section>
    </HiddenScrollbar>
  );
}
