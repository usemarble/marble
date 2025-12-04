import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback } from "react";
import { ImageUploadComp } from "./image-upload-comp";
import { pendingUploads } from "./index";

export const ImageUploadView = ({
  getPos,
  editor,
  node,
  extension,
}: NodeViewProps) => {
  // Get fileId from node attributes
  const fileId = node.attrs.fileId as string | null;
  const initialFile = fileId ? pendingUploads.get(fileId) : undefined;

  // Get extension options from storage
  const options = extension.storage.options;

  const onUpload = useCallback(
    (url: string) => {
      if (url && typeof getPos === "function") {
        const pos = getPos();
        if (typeof pos === "number") {
          // Clean up pending upload if it exists
          if (fileId) {
            pendingUploads.delete(fileId);
          }

          // Replace the imageUpload node with a figure (image with caption support)
          editor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + 1 })
            .setFigure({ src: url, alt: "", caption: "" })
            .run();
        }
      }
    },
    [getPos, editor, fileId]
  );

  const onCancel = useCallback(() => {
    if (typeof getPos === "function") {
      const pos = getPos();
      if (typeof pos === "number") {
        // Clean up pending upload if it exists
        if (fileId) {
          pendingUploads.delete(fileId);
        }

        // Remove the placeholder node
        editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + 1 })
          .run();
      }
    }
  }, [getPos, editor, fileId]);

  // Only render if upload handler is configured
  if (!options.upload) {
    return (
      <NodeViewWrapper>
        <div className="flex items-center justify-center rounded-md border border-muted bg-muted/50 p-8">
          <p className="text-muted-foreground text-sm">
            Image upload is not configured. Please configure the ImageUpload
            extension with an upload handler.
          </p>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      {/* tho no drag handle for now */}
      <div className="m-0 p-0" data-drag-handle>
        <ImageUploadComp
          fetchMedia={options.fetchMedia}
          initialFile={initialFile}
          media={options.media}
          onCancel={onCancel}
          onError={options.onError}
          onUpload={onUpload}
          upload={options.upload}
        />
      </div>
    </NodeViewWrapper>
  );
};
