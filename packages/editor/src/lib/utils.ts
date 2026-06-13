import type { Editor } from "@tiptap/core";
import { isTextSelection } from "@tiptap/core";

export function isFigureTextSelection(editor: Editor | null): boolean {
  if (!editor || !isTextSelection(editor.state.selection)) {
    return false;
  }

  const { $from, $to } = editor.state.selection;

  if ($from.parent !== $to.parent || $from.parent.type.name !== "paragraph") {
    return false;
  }

  for (let depth = $from.depth - 1; depth > 0; depth--) {
    const fromNode = $from.node(depth);
    const toNode = $to.node(depth);

    if (fromNode.type.name === "figure" && fromNode === toNode) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a table grip is selected
 */
function isTableGripSelected(node: HTMLElement): boolean {
  let container: HTMLElement | null = node;

  while (container && !["TD", "TH"].includes(container.tagName)) {
    container = container.parentElement;
  }

  if (!container) {
    return false;
  }

  const gripColumn = container.querySelector?.("a.grip-column.selected");
  const gripRow = container.querySelector?.("a.grip-row.selected");

  return !!(gripColumn || gripRow);
}

/**
 * Check if a custom node is currently selected
 * Custom nodes are block-level nodes that shouldn't show the bubble menu
 * (e.g., YouTube embeds, code blocks, horizontal rules, etc.)
 */
export function isCustomNodeSelected(
  editor: Editor | null,
  node: HTMLElement | null
): boolean {
  if (!editor || !node) {
    return false;
  }

  const customNodes = [
    "youtube",
    "youtubeUpload",
    "twitter",
    "twitterUpload",
    "codeBlock",
    "horizontalRule",
    "imageUpload",
    "figure",
    "image",
    "video",
    "videoUpload",
  ];

  if (isFigureTextSelection(editor)) {
    return isTableGripSelected(node);
  }

  const { from, to } = editor.state.selection;
  let selectionContainsCustomNode = false;

  editor.state.doc.nodesBetween(from, to, (currentNode) => {
    if (customNodes.includes(currentNode.type.name)) {
      selectionContainsCustomNode = true;
      return false;
    }

    return !selectionContainsCustomNode;
  });

  if (selectionContainsCustomNode) {
    return true;
  }

  const isCustomNodeActive = customNodes.some((type) => editor.isActive(type));

  return isCustomNodeActive || isTableGripSelected(node);
}

/**
 * Check if text is currently selected in the editor
 * Returns false if selection is empty or if the editor is not editable
 */
export function isTextSelected({ editor }: { editor: Editor | null }): boolean {
  if (!editor) {
    return false;
  }

  const {
    state: {
      doc,
      selection,
      selection: { empty, from, to },
    },
  } = editor;

  // Sometimes check for `empty` is not enough.
  // Double-click an empty paragraph returns a node size of 2.
  // So we check also for an empty text size.
  const isEmptyTextBlock =
    !doc.textBetween(from, to).length && isTextSelection(selection);

  if (empty || isEmptyTextBlock || !editor.isEditable) {
    return false;
  }

  return true;
}
