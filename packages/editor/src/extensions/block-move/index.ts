import { type CommandProps, Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";
import { NodeSelection, Selection, type Transaction } from "@tiptap/pm/state";
import { StepMap } from "@tiptap/pm/transform";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockMove: {
      /**
       * Swap a block with the one above it. Moves the block at `pos` when
       * given, otherwise the block(s) the selection is in.
       */
      moveBlockUp: (pos?: number) => ReturnType;
      /**
       * Swap a block with the one below it. Moves the block at `pos` when
       * given, otherwise the block(s) the selection is in.
       */
      moveBlockDown: (pos?: number) => ReturnType;
    };
  }
}

type Direction = "up" | "down";

interface BlockRange {
  from: number;
  to: number;
}

const LIST_TYPES = new Set(["bulletList", "orderedList", "taskList"]);
const LIST_ITEM_TYPES = new Set(["listItem", "taskItem"]);

function isSiblingContainer($pos: ResolvedPos) {
  return $pos.depth === 0 || LIST_TYPES.has($pos.parent.type.name);
}

/**
 * The run of sibling blocks a selection covers: whole nodes for node and
 * node-range selections, the list items for a text selection inside a list,
 * and the top-level blocks otherwise.
 */
function getSelectionRange(selection: Selection): BlockRange | null {
  const { $from, $to, from, to } = selection;

  if (
    from < to &&
    $from.sameParent($to) &&
    isSiblingContainer($from) &&
    !$from.parent.inlineContent
  ) {
    return { from, to };
  }

  for (let depth = Math.min($from.depth, $to.depth); depth > 0; depth--) {
    if (
      LIST_ITEM_TYPES.has($from.node(depth).type.name) &&
      LIST_ITEM_TYPES.has($to.node(depth).type.name) &&
      $from.node(depth - 1) === $to.node(depth - 1)
    ) {
      return { from: $from.before(depth), to: $to.after(depth) };
    }
  }

  const rangeFrom = $from.depth > 0 ? $from.before(1) : from;
  const rangeTo = $to.depth > 0 ? $to.after(1) : to;

  return rangeFrom < rangeTo ? { from: rangeFrom, to: rangeTo } : null;
}

function getNodeRange(doc: ProseMirrorNode, pos: number): BlockRange | null {
  const node = doc.nodeAt(pos);

  if (!node || node.isInline) {
    return null;
  }

  return { from: pos, to: pos + node.nodeSize };
}

/**
 * Where the moved block should sit once it has been reinserted: map the
 * selection along with it when it was inside, otherwise select the block
 * itself so the next Mod-Shift-Arrow keeps moving the same block.
 */
function getSelectionAfterMove(
  tr: Transaction,
  selection: Selection,
  range: BlockRange,
  shift: number
) {
  if (selection.from >= range.from && selection.to <= range.to) {
    return selection.map(tr.doc, StepMap.offset(shift));
  }

  const movedFrom = range.from + shift;
  const movedNode = tr.doc.nodeAt(movedFrom);

  if (
    movedNode &&
    !movedNode.isTextblock &&
    (movedNode.isAtom || movedNode.type.spec.draggable) &&
    NodeSelection.isSelectable(movedNode)
  ) {
    return NodeSelection.create(tr.doc, movedFrom);
  }

  const movedTo = range.to + shift;
  return Selection.near(tr.doc.resolve(movedTo), -1);
}

function moveBlock(tr: Transaction, direction: Direction, pos?: number) {
  const { doc, selection } = tr;
  const range =
    typeof pos === "number"
      ? getNodeRange(doc, pos)
      : getSelectionRange(selection);

  if (!range) {
    return null;
  }

  const $from = doc.resolve(range.from);
  const $to = doc.resolve(range.to);

  if (!$from.sameParent($to)) {
    return null;
  }

  const parent = $from.parent;
  const startIndex = $from.index();
  const endIndex = $to.index();

  let shift: number;

  if (direction === "up") {
    if (startIndex === 0) {
      return null;
    }
    shift = -parent.child(startIndex - 1).nodeSize;
  } else {
    if (endIndex >= parent.childCount) {
      return null;
    }
    shift = parent.child(endIndex).nodeSize;
  }

  return { range, shift, selection };
}

function runMove(direction: Direction, pos?: number) {
  return ({ tr, dispatch }: CommandProps) => {
    const move = moveBlock(tr, direction, pos);

    if (!move) {
      return false;
    }

    if (!dispatch) {
      return true;
    }

    const { range, shift, selection } = move;
    const content = tr.doc.slice(range.from, range.to).content;

    tr.delete(range.from, range.to);
    // After the delete the neighbouring block starts at `range.from`, so the
    // moved content lands on the far side of it either way.
    tr.insert(range.from + shift, content);
    tr.setSelection(getSelectionAfterMove(tr, selection, range, shift));
    tr.scrollIntoView();

    return true;
  };
}

/**
 * Move blocks up and down with Mod-Shift-ArrowUp/ArrowDown, like Notion.
 * List items move within their list; everything else moves between the
 * top-level blocks.
 */
export const BlockMove = Extension.create({
  name: "blockMove",

  addCommands() {
    return {
      moveBlockUp: (pos) => runMove("up", pos),
      moveBlockDown: (pos) => runMove("down", pos),
    };
  },

  addKeyboardShortcuts() {
    // Swallow the shortcut even at the first/last block so the browser does
    // not fall back to "extend selection to document start/end".
    return {
      "Mod-Shift-ArrowUp": () => {
        this.editor.commands.moveBlockUp();
        return true;
      },
      "Mod-Shift-ArrowDown": () => {
        this.editor.commands.moveBlockDown();
        return true;
      },
    };
  },
});
