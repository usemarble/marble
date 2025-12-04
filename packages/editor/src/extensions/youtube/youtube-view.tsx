import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback } from "react";
import { YouTubeComp } from "./youtube-comp";

export const YouTubeUploadView = ({ getPos, editor }: NodeViewProps) => {
  const onSubmit = useCallback(
    (url: string) => {
      if (url && typeof getPos === "function") {
        const pos = getPos();
        if (typeof pos === "number") {
          // Replace the youtubeUpload node with an actual YouTube embed
          editor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + 1 })
            .setYoutubeVideo({ src: url })
            .run();
        }
      }
    },
    [getPos, editor]
  );

  const onCancel = useCallback(() => {
    if (typeof getPos === "function") {
      const pos = getPos();
      if (typeof pos === "number") {
        // Remove the placeholder node
        editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + 1 })
          .run();
      }
    }
  }, [getPos, editor]);

  return (
    <NodeViewWrapper>
      <div className="m-0 p-0" data-drag-handle>
        <YouTubeComp onCancel={onCancel} onSubmit={onSubmit} />
      </div>
    </NodeViewWrapper>
  );
};
