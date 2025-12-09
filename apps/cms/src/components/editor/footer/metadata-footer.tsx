import { toast } from "@marble/ui/hooks/use-toast";
import type { FieldErrors } from "react-hook-form";
import { AsyncButton } from "@/components/ui/async-button";
import type { PostValues } from "@/lib/validations/post";
import { useUnsavedChanges } from "@/providers/unsaved-changes";

type MetadataFooterProps = {
  mode: "create" | "update";
  isSubmitting: boolean;
  errors: FieldErrors<PostValues>;
  formRef: React.RefObject<HTMLFormElement | null>;
};

export function MetadataFooter({
  mode,
  isSubmitting,
  errors,
  formRef,
}: MetadataFooterProps) {
  "use no memo"; // TODO: React Compiler issue - hasErrors becomes stale during validation
  const { hasUnsavedChanges } = useUnsavedChanges();

  const triggerSubmit = async () => {
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      return toast.error("Please fill in all required fields", {
        position: "top-right",
      });
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
