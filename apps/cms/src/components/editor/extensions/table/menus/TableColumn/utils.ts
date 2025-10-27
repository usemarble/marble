import type { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import { Table } from "../..";
import { isTableSelected } from "../../utils";

export const isColumnGripSelected = ({
  editor,
  view,
  state,
  from,
}: {
  editor: Editor;
  view: EditorView;
  state: EditorState;
  from: number;
}) => {
  const domAtPos = view.domAtPos(from).node as HTMLElement;
  const nodeDOM = view.nodeDOM(from) as HTMLElement;
  const node = nodeDOM || domAtPos;

  if (
    !editor.isActive(Table.name) ||
    !node ||
    isTableSelected(state.selection)
  ) {
    return false;
  }

  // Find the owning table cell (TD/TH)  
  let element: Element | null =  
  node.nodeType === Node.ELEMENT_NODE ? (node as Element) : (node.parentElement);  
  const cell = element?.closest?.("td, th") ?? null;  

  const gripColumn = cell?.querySelector?.("a.grip-column.selected");  

  return !!gripColumn;
};

export default isColumnGripSelected;
