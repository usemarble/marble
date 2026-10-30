"use client";

import type { PostEditorValues } from "@marble/api/lib/post-validation";
import { Separator } from "@marble/ui/components/separator";
import { useFormContext } from "react-hook-form";
import { HiddenScrollbar } from "../../ui/hidden-scrollbar";
import { AuthorSelector } from "../fields/author-selector";
import { CategorySelector } from "../fields/category-selector";
import { CoverImageSelector } from "../fields/cover-image-selector";
import { CustomFieldsSection } from "../fields/custom-fields-section";
import { DescriptionField } from "../fields/description-field";
import { FeaturedField } from "../fields/featured-field";
import { SlugField } from "../fields/slug-field";
import { TagSelector } from "../fields/tag-selector";

interface MetadataTabProps {
  initialAuthors?: string[];
  tags?: string[];
}

export function MetadataTab({ initialAuthors, tags }: MetadataTabProps) {
  "use no memo";
  const { control } = useFormContext<PostEditorValues>();
  return (
    <HiddenScrollbar className="h-full px-6">
      <section className="grid gap-6 pt-4 pb-5">
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

        <CustomFieldsSection />
      </section>
    </HiddenScrollbar>
  );
}
