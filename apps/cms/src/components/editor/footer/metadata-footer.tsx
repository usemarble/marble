import { useEditorData } from "@/components/editor/editor-data-provider";
import { AsyncButton } from "@/components/ui/async-button";

interface MetadataFooterProps {
  isSubmitting: boolean;
}

export function MetadataFooter({ isSubmitting }: MetadataFooterProps) {
  const { hasUnsavedChanges, mode, submit } = useEditorData();

  return (
    <AsyncButton
      className="w-full"
      disabled={!hasUnsavedChanges}
      isLoading={isSubmitting}
      onClick={submit}
      type="button"
    >
      {mode === "create" ? "Save" : "Update"}
    </AsyncButton>
  );
}
