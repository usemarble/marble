import { toast } from "@marble/ui/components/sonner";
import type { UseFormTrigger } from "react-hook-form";
import { AsyncButton } from "@/components/ui/async-button";
import type { PostValues } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";

const fieldLabels: Record<string, string> = {
  title: "Title",
  description: "Description",
  slug: "Slug",
  category: "Category",
  content: "Content",
  contentJson: "Content",
  publishedAt: "Publish date",
  coverImage: "Cover image",
  attribution: "Attribution",
};

interface MetadataFooterProps {
  mode: "create" | "update";
  isSubmitting: boolean;
  trigger: UseFormTrigger<PostValues>;
  formRef: React.RefObject<HTMLFormElement | null>;
}

export function MetadataFooter({
  mode,
  isSubmitting,
  trigger,
  formRef,
}: MetadataFooterProps) {
  const { hasUnsavedChanges } = useUnsavedChanges();

  const triggerSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) {
      const fieldsToCheck = Object.keys(fieldLabels) as (keyof PostValues)[];
      const invalid: string[] = [];
      for (const field of fieldsToCheck) {
        const valid = await trigger(field);
        if (!valid) {
          const label = fieldLabels[field];
          if (label && !invalid.includes(label)) {
            invalid.push(label);
          }
        }
      }
      const message =
        invalid.length > 0
          ? `Missing required fields: ${invalid.join(", ")}`
          : "Please fill in all required fields";
      toast.error(message);
      return;
    }
    if (formRef.current) {
      formRef.current.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <AsyncButton
      className="w-full"
      disabled={!hasUnsavedChanges}
      isLoading={isSubmitting}
      onClick={triggerSubmit}
      type="button"
    >
      {mode === "create" ? "Save" : "Update"}
    </AsyncButton>
  );
}
