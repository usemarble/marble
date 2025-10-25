"use client";

import type { Node } from "@tiptap/pm/model";
import type { NodeSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { useCallback } from "react";

export function useDragActions(
  editor: Editor,
  currentNode: Node | null,
  currentNodePos: number
) {
  const resetTextFormatting = useCallback(() => {
    const chain = editor.chain();

    chain.setNodeSelection(currentNodePos).unsetAllMarks();

    if (currentNode?.type.name !== "paragraph") {
      chain.setParagraph();
    }

    chain.run();
  }, [editor, currentNodePos, currentNode?.type.name]);

  const duplicateNode = useCallback(() => {
    editor.commands.setNodeSelection(currentNodePos);

    const { $anchor } = editor.state.selection;
    const selectedNode =
      $anchor.node(1) || (editor.state.selection as NodeSelection).node;

    editor
      .chain()
      .insertContentAt(
        currentNodePos + (currentNode?.nodeSize || 0),
        selectedNode.toJSON()
      )
      .run();
  }, [editor, currentNodePos, currentNode?.nodeSize]);

  const copyNodeToClipboard = useCallback(() => {
    editor.chain().setNodeSelection(currentNodePos).run();

    document.execCommand("copy");
  }, [editor, currentNodePos]);

  const deleteNode = useCallback(() => {
    editor.chain().setNodeSelection(currentNodePos).deleteSelection().run();
  }, [editor, currentNodePos]);

  const handleAdd = useCallback(() => {
    if (currentNodePos !== -1) {
      const currentNodeSize = currentNode?.nodeSize || 0;
      const insertPos = currentNodePos + currentNodeSize;
      const currentNodeIsEmptyParagraph =
        currentNode?.type.name === "paragraph" &&
        currentNode?.content?.size === 0;
      const focusPos = currentNodeIsEmptyParagraph
        ? currentNodePos + 2
        : insertPos + 2;

      editor
        .chain()
        .command(({ dispatch, tr, state }) => {
          if (dispatch) {
            if (currentNodeIsEmptyParagraph) {
              tr.insertText("/", currentNodePos, currentNodePos + 1);
            } else {
              const paragraphNode = state.schema.nodes.paragraph;
              if (paragraphNode) {
                tr.insert(
                  insertPos,
                  paragraphNode.create(null, [state.schema.text("/")])
                );
              }
            }

            return dispatch(tr);
          }

          return true;
        })
        .focus(focusPos)
        .run();
    }
  }, [currentNode, currentNodePos, editor]);

  return {
    resetTextFormatting,
    duplicateNode,
    copyNodeToClipboard,
    deleteNode,
    handleAdd,
  };
}
