import type { NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper } from "@tiptap/react";
import { useCallback } from "react";
import { getPlaceholderRange, removePlaceholder } from "../../lib/placeholder";
import { TwitterComp } from "./twitter-comp";

export const TwitterUploadView = ({ getPos, editor, node }: NodeViewProps) => {
  const onSubmit = useCallback(
    (url: string) => {
      const range = getPlaceholderRange({ editor, getPos, node });

      if (!url || !range) {
        return;
      }

      // Select the placeholder so the embed replaces it in place rather than
      // landing wherever the caret happens to be, then let `setTweet` run its
      // own validation over the URL.
      editor
        .chain()
        .focus()
        .setNodeSelection(range.from)
        .setTweet({ src: url })
        .run();
    },
    [getPos, editor, node]
  );

  const onCancel = useCallback(() => {
    removePlaceholder({ editor, getPos, node });
  }, [getPos, editor, node]);

  return (
    <NodeViewWrapper className="my-5">
      <div className="m-0 p-0" data-drag-handle>
        <TwitterComp onCancel={onCancel} onSubmit={onSubmit} />
      </div>
    </NodeViewWrapper>
  );
};
