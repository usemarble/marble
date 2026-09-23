"use client";

import { cn } from "@marble/ui/lib/utils";
import type { EditorView } from "@tiptap/pm/view";
import { useCurrentEditor } from "@tiptap/react";
import {
  type ComponentProps,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { bindDragAutoScroll } from "../lib/drag-auto-scroll";
import {
  bindGutterDragAndDrop,
  dispatchEditorDragEvent,
  getEditorPointForRow,
} from "../lib/editor-gutter";
import { useMountedEditorView } from "../lib/use-editor-view";

const EditorScrollContext = createContext<HTMLElement | null>(null);

/**
 * The element the editor scrolls in, when it is rendered inside an
 * `EditorScrollArea`. Editor chrome (the block handle, table menus) uses it to
 * follow the content and to treat the whole area as part of the editor.
 */
export function useEditorScrollContainer() {
  return useContext(EditorScrollContext);
}

/**
 * The `EditorScrollArea` an editor is rendered in, found from the editor
 * itself. For chrome that sits outside the scroll area (and so outside its
 * context), such as a rail overlaid on the pane.
 */
export function getEditorScrollContainer(view: EditorView) {
  return view.dom.closest<HTMLElement>("[data-editor-scroll-area]");
}

/** How often the drop cursor is refreshed while auto-scrolling, in ms. */
const DROP_CURSOR_REFRESH_INTERVAL = 60;

export type EditorScrollAreaProps = Omit<ComponentProps<"div">, "ref">;

/**
 * Scroll container for the editor. Make it span the whole editor pane and
 * centre the content column inside it: the space either side then scrolls
 * the page, shows the block handle for the row it is on, and accepts drops,
 * the way Notion's margins do. Dragging near its top or bottom edge
 * auto-scrolls.
 *
 * Content positioned relative to the column (give the column `relative`)
 * scrolls with it, so the block handle and menus stay attached while
 * scrolling.
 *
 * @example
 * ```tsx
 * <EditorScrollArea className="min-h-0 flex-1">
 *   <div className="relative mx-auto max-w-3xl">
 *     <EditorContent />
 *     <EditorBlockHandleMenu />
 *   </div>
 * </EditorScrollArea>
 * ```
 */
export function EditorScrollArea({
  children,
  className,
  ...props
}: EditorScrollAreaProps) {
  const { editor } = useCurrentEditor();
  const view = useMountedEditorView(editor);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!(container && view)) {
      return;
    }

    let lastRefresh = 0;

    const unbindGutter = bindGutterDragAndDrop(view, container);
    const unbindAutoScroll = bindDragAutoScroll(container, {
      onScroll: (pointer, event) => {
        const now = performance.now();

        if (now - lastRefresh < DROP_CURSOR_REFRESH_INTERVAL) {
          return;
        }

        lastRefresh = now;

        const rect = container.getBoundingClientRect();

        if (pointer.y < rect.top || pointer.y > rect.bottom) {
          return;
        }

        const point = getEditorPointForRow(view, pointer.x, pointer.y);

        if (point) {
          dispatchEditorDragEvent(view, "dragover", event, point);
        }
      },
    });

    return () => {
      unbindGutter();
      unbindAutoScroll();
    };
  }, [container, view]);

  return (
    <EditorScrollContext.Provider value={container}>
      <div
        className={cn("overflow-y-auto", className)}
        data-editor-scroll-area=""
        ref={setContainer}
        {...props}
      >
        {children}
      </div>
    </EditorScrollContext.Provider>
  );
}
