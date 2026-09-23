import type { EditorView } from "@tiptap/pm/view";

/**
 * The editor column sits centred in a wider scroll area, like Notion. The
 * space on either side of it (the "gutter") belongs to whichever block is on
 * the same row, so hovering or dropping there should behave as if the pointer
 * were over that block. These helpers translate gutter coordinates into a
 * point inside the editor and replay events there.
 */

export interface EditorPoint {
  x: number;
  y: number;
}

/**
 * The point inside the editor on the same row as the pointer, or null when
 * the row is above or below the editor (the title, trailing padding, ...).
 * Pointers already over the editor keep their position.
 */
export function getEditorPointForRow(
  view: EditorView,
  clientX: number,
  clientY: number
): EditorPoint | null {
  const rect = view.dom.getBoundingClientRect();

  if (clientY < rect.top || clientY > rect.bottom) {
    return null;
  }

  if (clientX >= rect.left && clientX <= rect.right) {
    return { x: clientX, y: clientY };
  }

  // The horizontal centre hits full-width blocks and centred media alike.
  return { x: rect.left + rect.width / 2, y: clientY };
}

/**
 * Lets drags that pass through the gutter land in the editor: shows the drop
 * cursor for the block on the pointer's row and performs the drop there.
 * Without this, dragging a block straight down from its handle never reaches
 * the text column, so there is no drop cursor and releasing does nothing (or,
 * for files, the browser opens the file and navigates away).
 */
export function bindGutterDragAndDrop(
  view: EditorView,
  container: HTMLElement
) {
  const getGutterPoint = (event: DragEvent) => {
    if (event.defaultPrevented || isInsideEditor(view, event.target)) {
      return null;
    }

    return getEditorPointForRow(view, event.clientX, event.clientY);
  };

  const onDragOver = (event: DragEvent) => {
    const point = getGutterPoint(event);

    if (!point) {
      return;
    }

    // Accept the drop here, then let ProseMirror position the drop cursor
    event.preventDefault();
    dispatchEditorDragEvent(view, "dragover", event, point);
  };

  const onDrop = (event: DragEvent) => {
    const point = getGutterPoint(event);

    if (!point) {
      return;
    }

    event.preventDefault();
    dispatchEditorDragEvent(view, "drop", event, point);
  };

  // The drop cursor clears itself when a drag leaves the editor. Leaving for
  // the gutter on the same row is not really leaving, and hiding it for the
  // moment before the next dragover makes it flicker.
  const onEditorDragLeave = (event: DragEvent) => {
    const next = event.relatedTarget;

    if (
      next instanceof Node &&
      container.contains(next) &&
      !view.dom.contains(next) &&
      getEditorPointForRow(view, event.clientX, event.clientY)
    ) {
      event.stopImmediatePropagation();
    }
  };

  container.addEventListener("dragover", onDragOver);
  container.addEventListener("drop", onDrop);
  view.dom.addEventListener("dragleave", onEditorDragLeave, true);

  return () => {
    container.removeEventListener("dragover", onDragOver);
    container.removeEventListener("drop", onDrop);
    view.dom.removeEventListener("dragleave", onEditorDragLeave, true);
  };
}

export function isInsideEditor(view: EditorView, target: EventTarget | null) {
  return target instanceof Node && view.dom.contains(target);
}

/**
 * Replays a drag event on the editor at `point`, carrying over the original
 * data transfer and modifier keys so ProseMirror sees a normal drag. Must be
 * called synchronously from the original event's handler for `drop`, while
 * the data transfer is still readable.
 */
export function dispatchEditorDragEvent(
  view: EditorView,
  type: "dragover" | "drop",
  source: DragEvent | null,
  point: EditorPoint
) {
  const event = new DragEvent(type, {
    altKey: source?.altKey ?? false,
    bubbles: true,
    cancelable: true,
    clientX: point.x,
    clientY: point.y,
    ctrlKey: source?.ctrlKey ?? false,
    dataTransfer: source?.dataTransfer ?? null,
    metaKey: source?.metaKey ?? false,
    shiftKey: source?.shiftKey ?? false,
  });

  view.dom.dispatchEvent(event);
  return event;
}
