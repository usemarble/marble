import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback } from "react";
import { ImageUploader } from "./image-uploader";
import { pendingUploads } from "./index";

export const ImageUploadView = ({ getPos, editor, node }: NodeViewProps) => {
  // Get fileId from node attributes
  const fileId = node.attrs.fileId as string | null;
  const initialFile = fileId ? pendingUploads.get(fileId) : undefined;

  const onUpload = useCallback(
    (url: string) => {
      if (url && typeof getPos === "function") {
        const pos = getPos();
        if (typeof pos === "number") {
          // Clean up pending upload if it exists
          if (fileId) {
            pendingUploads.delete(fileId);
          }

          // Replace the imageUpload node with an actual image
          editor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + 1 })
            .setImage({ src: url })
            .run();
        }
      }
    },
    [getPos, editor, fileId]
  );

  return (
    <NodeViewWrapper>
      <div className="m-0 p-0" data-drag-handle>
        <ImageUploader initialFile={initialFile} onUpload={onUpload} />
      </div>
    </NodeViewWrapper>
  );
};
