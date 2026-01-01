"use client";

import { Separator } from "@marble/ui/components/separator";
import type { Control, FieldErrors } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { HiddenScrollbar } from "../../ui/hidden-scrollbar";
import { AttributionField } from "../fields/attribution-field";
import { AuthorSelector } from "../fields/author-selector";
import { CategorySelector } from "../fields/category-selector";
import { CoverImageSelector } from "../fields/cover-image-selector";
import { DescriptionField } from "../fields/description-field";
import { FeaturedField } from "../fields/featured-field";
import { PublishDateField } from "../fields/publish-date-field";
import { SlugField } from "../fields/slug-field";
import { StatusField } from "../fields/status-field";
import { TagSelector } from "../fields/tag-selector";

interface MetadataTabProps {
  control: Control<PostValues>;
  errors: FieldErrors<PostValues>;
  initialAuthors?: string[];
  tags?: string[];
}

export function MetadataTab({
  control,
  errors,
  initialAuthors,
  tags,
}: MetadataTabProps) {
  "use no memo";
  return (
    <HiddenScrollbar className="h-full px-6">
      <section className="grid gap-6 pt-4 pb-5">
        <StatusField control={control} />

        <FeaturedField control={control} />

        <Separator className="flex" orientation="horizontal" />

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

        <Separator className="mt-4 flex" orientation="horizontal" />

        <AttributionField control={control} errors={errors} />
      </section>
    </HiddenScrollbar>
  );
}
