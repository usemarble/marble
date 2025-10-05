import { AsyncButton } from "@/components/ui/async-button";
import { useUnsavedChanges } from "@/providers/unsaved-changes";

type MetadataFooterProps = {
  mode: "create" | "update";
  isSubmitting: boolean;
  triggerSubmit: () => void;
};

export function MetadataFooter({
  mode,
  isSubmitting,
  triggerSubmit,
}: MetadataFooterProps) {
  const { hasUnsavedChanges } = useUnsavedChanges();

  return mode === "create" ? (
    <AsyncButton
      className="w-full"
      disabled={!hasUnsavedChanges}
      isLoading={isSubmitting}
      onClick={triggerSubmit}
      type="button"
    >
      Save
    </AsyncButton>
  ) : (
    <AsyncButton
      className="w-full"
      disabled={!hasUnsavedChanges}
      isLoading={isSubmitting}
      onClick={triggerSubmit}
      type="button"
    >
      Update
    </AsyncButton>
  );
}
