"use client";

import { Label } from "@marble/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { isFuture } from "date-fns";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { FieldInfo } from "./field-info";

type StatusFieldProps = {
  control: Control<PostValues>;
};

export function StatusField({ control }: StatusFieldProps) {
  const {
    field: { onChange, value },
  } = useController({
    name: "status",
    control,
  });

  const publishedAtController = useController({
    name: "publishedAt",
    control,
  });

  const publishedAt = publishedAtController.field.value;
  const isScheduled = publishedAt && isFuture(new Date(publishedAt));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="status">Status</Label>
        <FieldInfo text="Choose whether to publish now, schedule for later, or save as a draft. Scheduled posts will be marked as draft until the publish date." />
      </div>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="status"
          className="bg-editor-field shadow-none active:scale-100"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="published">
            <div className="flex flex-col items-start">
              <span className="font-medium">Published</span>
              <span className="text-muted-foreground text-xs">
                Make post live immediately
              </span>
            </div>
          </SelectItem>
          <SelectItem value="draft">
            <div className="flex flex-col items-start">
              <span className="font-medium">Draft</span>
              <span className="text-muted-foreground text-xs">
                Save without publishing
              </span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {isScheduled && value === "draft" && (
        <div className="rounded-md bg-blue-500/10 px-3 py-2 text-blue-600 text-xs dark:text-blue-400">
          This post is scheduled to publish automatically on{" "}
          {new Date(publishedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          . It will remain as a draft until then.
        </div>
      )}
    </div>
  );
}
