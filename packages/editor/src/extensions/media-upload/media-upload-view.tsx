import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback, useEffect, useRef } from "react";
import { removePlaceholder, replacePlaceholder } from "../../lib/placeholder";
import type { MediaUploadStorage } from "./index";
import { MediaUploadComp } from "./media-upload-comp";

export const MediaUploadView = ({
  getPos,
  editor,
  node,
  extension,
}: NodeViewProps) => {
  const storage = extension.storage as MediaUploadStorage;
  const pendingUploads = storage.pendingUploads;

  // Get fileId from node attributes
  const fileId =
    typeof node.attrs.fileId === "string" ? node.attrs.fileId : null;
  const mediaType = extension.name === "audioUpload" ? "audio" : "video";
  const initialFile = fileId ? pendingUploads.get(fileId) : undefined;

  // Get extension options from storage
  const { options } = storage;

  // Track whether the upload was consumed (success or cancel) so the
  // unmount cleanup knows whether it still needs to release the entry.
  const consumedRef = useRef(false);

  // Clean up the pending upload entry when this view unmounts (e.g. the
  // node is deleted while an upload is still in progress).
  useEffect(() => {
    return () => {
      if (fileId && !consumedRef.current) {
        pendingUploads.delete(fileId);
      }
    };
  }, [fileId, pendingUploads]);

  const onUpload = useCallback(
    (url: string) => {
      if (!url) {
        return;
      }

      consumedRef.current = true;
      if (fileId) {
        pendingUploads.delete(fileId);
      }

      // The media takes over the placeholder's range, so it lands where the
      // file was dropped or pasted even if the caret has moved on since.
      replacePlaceholder(
        { editor, getPos, node },
        { type: mediaType, attrs: { src: url } }
      );
    },
    [getPos, editor, node, fileId, pendingUploads, mediaType]
  );

  const onCancel = useCallback(() => {
    consumedRef.current = true;
    if (fileId) {
      pendingUploads.delete(fileId);
    }

    removePlaceholder({ editor, getPos, node });
  }, [getPos, editor, node, fileId, pendingUploads]);

  // Only render if upload handler is configured
  if (!options.upload) {
    return (
      <NodeViewWrapper className="my-5">
        <div className="flex items-center justify-center rounded-md border border-muted bg-muted/50 p-8">
          <p className="text-muted-foreground text-sm">
            Media upload is unavailable.
          </p>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-5">
      <div className="m-0 p-0" data-drag-handle>
        <MediaUploadComp
          accept={options.accept}
          fetchMediaPage={options.fetchMediaPage}
          initialFile={initialFile}
          maxSize={options.maxSize}
          media={options.media}
          mediaType={mediaType}
          onCancel={onCancel}
          onError={options.onError}
          onUpload={onUpload}
          upload={options.upload}
        />
      </div>
    </NodeViewWrapper>
  );
};
