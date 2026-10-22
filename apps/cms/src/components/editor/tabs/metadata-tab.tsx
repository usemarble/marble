"use client";

import type { PostEditorValues } from "@marble/api/lib/post-validation";
import { Badge } from "@marble/ui/components/badge";
import { Separator } from "@marble/ui/components/separator";
import { useFormContext } from "react-hook-form";
import {
  formatScheduledDate,
  POST_STATUS_PRESENTATION,
} from "@/lib/post-status";
import { HiddenScrollbar } from "../../ui/hidden-scrollbar";
import { useEditorData } from "../editor-data-provider";
import { AuthorSelector } from "../fields/author-selector";
import { CategorySelector } from "../fields/category-selector";
import { CoverImageSelector } from "../fields/cover-image-selector";
import { CustomFieldsSection } from "../fields/custom-fields-section";
import { DescriptionField } from "../fields/description-field";
import { FeaturedField } from "../fields/featured-field";
import { PublishDateField } from "../fields/publish-date-field";
import { SlugField } from "../fields/slug-field";
import { StatusField } from "../fields/status-field";
import { TagSelector } from "../fields/tag-selector";

interface MetadataTabProps {
  initialAuthors?: string[];
  tags?: string[];
}

export function MetadataTab({ initialAuthors, tags }: MetadataTabProps) {
  "use no memo";
  const { control, getValues } = useFormContext<PostEditorValues>();
  const { isReadOnly } = useEditorData();
  return (
    <HiddenScrollbar className="h-full px-6">
      <fieldset
        className="grid min-w-0 gap-6 pt-4 pb-5"
        disabled={isReadOnly}
        key={String(isReadOnly)}
      >
        {isReadOnly ? (
          <Badge variant={POST_STATUS_PRESENTATION.scheduled.variant}>
            {POST_STATUS_PRESENTATION.scheduled.label}
          </Badge>
        ) : (
          <StatusField control={control} />
        )}

        <FeaturedField control={control} />

        <Separator className="flex" orientation="horizontal" />

        <CoverImageSelector control={control} disabled={isReadOnly} />

        <DescriptionField control={control} />

        <SlugField control={control} />

        <AuthorSelector
          control={control}
          defaultAuthors={initialAuthors || []}
          disabled={isReadOnly}
        />

        <TagSelector
          control={control}
          defaultTags={tags || []}
          disabled={isReadOnly}
        />

        <CategorySelector control={control} />

        {isReadOnly ? (
          <div className="grid gap-2 text-sm">
            <p>{POST_STATUS_PRESENTATION.scheduled.dateLabel}</p>
            <p>{formatScheduledDate(getValues("publishedAt"))}</p>
          </div>
        ) : (
          <PublishDateField control={control} />
        )}

        <CustomFieldsSection />
      </fieldset>
    </HiddenScrollbar>
  );
}
