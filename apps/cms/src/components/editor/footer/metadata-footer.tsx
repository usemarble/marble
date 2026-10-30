import { useEditorData } from "@/components/editor/editor-data-provider";
import { AsyncButton } from "@/components/ui/async-button";

interface MetadataFooterProps {
  isSubmitting: boolean;
}

export function MetadataFooter({ isSubmitting }: MetadataFooterProps) {
  const { hasUnsavedChanges, publication, submit } = useEditorData();

  return (
    <AsyncButton
      className="w-full"
      disabled={!hasUnsavedChanges}
      isLoading={isSubmitting}
      onClick={submit}
      type="button"
    >
      {publication.status === "published" ? "Update" : "Save"}
    </AsyncButton>
  );
}
