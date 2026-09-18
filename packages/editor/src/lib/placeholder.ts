import type { Content, NodeViewProps } from "@tiptap/core";

/**
 * The parts of a node view needed to locate a placeholder node in the
 * document. Upload and embed placeholders (`imageUpload`, `videoUpload`,
 * `twitterUpload`, `youtubeUpload`) all hold a spot in the document until
 * their real content is ready.
 */
export type PlaceholderNodeView = Pick<
  NodeViewProps,
  "editor" | "getPos" | "node"
>;

/**
 * The range the placeholder currently occupies, or null once it has been
 * removed from the document (the reader can delete it mid-upload).
 */
export const getPlaceholderRange = ({ getPos, node }: PlaceholderNodeView) => {
  if (typeof getPos !== "function") {
    return null;
  }

  const pos = getPos();

  return typeof pos === "number"
    ? { from: pos, to: pos + node.nodeSize }
    : null;
};

/**
 * Swaps a placeholder for the content it was holding a spot for.
 *
 * The content is written to the placeholder's own range rather than inserted
 * at the selection: uploads finish asynchronously, so by the time one lands
 * the caret may have moved on and the media would follow it there.
 * `updateSelection` is off for the same reason — an upload completing in the
 * background must not yank the caret out from under someone who is typing.
 * `focus()` only hands focus back to the editor (the upload card that had it
 * is about to unmount); with no position it leaves the selection alone.
 */
export const replacePlaceholder = (
  view: PlaceholderNodeView,
  content: Content
): boolean => {
  const range = getPlaceholderRange(view);

  if (!range) {
    return false;
  }

  return view.editor
    .chain()
    .focus()
    .insertContentAt(range, content, { updateSelection: false })
    .run();
};

/**
 * Removes a placeholder, leaving the caret where it was.
 */
export const removePlaceholder = (view: PlaceholderNodeView): boolean => {
  const range = getPlaceholderRange(view);

  if (!range) {
    return false;
  }

  return view.editor.chain().focus().deleteRange(range).run();
};
