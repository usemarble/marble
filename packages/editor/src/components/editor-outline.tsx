"use client";

import { cn } from "@marble/ui/lib/utils";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { useCurrentEditor } from "@tiptap/react";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMountedEditorView } from "../lib/use-editor-view";
import { getEditorScrollContainer } from "./editor-scroll-area";

interface OutlineItem {
  level: number;
  text: string;
}

interface HoveredItem {
  index: number;
  /** Centre of the item's line, relative to the rail. */
  y: number;
  preview: string;
}

export interface EditorOutlineProps {
  className?: string;
  /** Which edge of the editor pane the rail sits on. */
  side?: "left" | "right";
}

/** Deepest heading level shown; the editor only offers H1–H3. */
const MAX_LEVEL = 3;
/** Resting line length per heading level, in px. */
const LINE_WIDTHS: Record<number, number> = { 1: 16, 2: 12, 3: 8 };
/** How much a line grows when the pointer is on it, in px. */
const LINE_GROWTH = 12;
const MAX_LINE_WIDTH = 16 + LINE_GROWTH;
/** Lines within this distance of the pointer grow, nearest the most. */
const PROXIMITY_RADIUS = 40;
/** Space left above a heading after jumping to it, in px. */
const SCROLL_MARGIN = 24;
const PREVIEW_LENGTH = 160;
const LINE_SPRING = { damping: 34, mass: 0.7, stiffness: 320 };
const CARD_SPRING = { damping: 36, stiffness: 420, type: "spring" } as const;

/**
 * The top-level headings, as display data plus their document positions.
 * Positions change with almost every keystroke above a heading, so they are
 * kept apart from the display data, which only changes when a heading does.
 */
function readOutline(doc: ProseMirrorNode) {
  const items: OutlineItem[] = [];
  const positions: number[] = [];

  doc.forEach((node, offset) => {
    const text = node.textContent.trim();

    if (
      node.type.name === "heading" &&
      node.attrs.level <= MAX_LEVEL &&
      text.length > 0
    ) {
      items.push({ level: node.attrs.level, text });
      positions.push(offset);
    }
  });

  return { items, positions };
}

function isSameOutline(a: OutlineItem[], b: OutlineItem[]) {
  return (
    a.length === b.length &&
    a.every(
      (item, index) =>
        item.level === b[index]?.level && item.text === b[index]?.text
    )
  );
}

/** The opening text of the section under the heading at `headingPos`. */
function readSectionPreview(doc: ProseMirrorNode, headingPos: number) {
  let preview = "";

  for (
    let index = doc.resolve(headingPos).index(0) + 1;
    index < doc.childCount && preview.length < PREVIEW_LENGTH;
    index++
  ) {
    const node = doc.child(index);

    if (node.type.name === "heading") {
      break;
    }

    const text = node.textContent.trim();

    if (text) {
      preview = preview ? `${preview} ${text}` : text;
    }
  }

  return preview.length > PREVIEW_LENGTH
    ? `${preview.slice(0, PREVIEW_LENGTH).trimEnd()}…`
    : preview;
}

function getHeadingTop(view: EditorView, pos: number) {
  const dom = view.nodeDOM(pos);
  return dom instanceof HTMLElement ? dom.getBoundingClientRect().top : null;
}

interface OutlineLineProps {
  active: boolean;
  highlighted: boolean;
  index: number;
  item: OutlineItem;
  mouseY: MotionValue<number>;
  onHover: (index: number, button: HTMLButtonElement) => void;
  onSelect: (index: number) => void;
  reduceMotion: boolean;
  side: "left" | "right";
}

function OutlineLine({
  active,
  highlighted,
  index,
  item,
  mouseY,
  onHover,
  onSelect,
  reduceMotion,
  side,
}: OutlineLineProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const baseWidth = LINE_WIDTHS[item.level] ?? LINE_WIDTHS[MAX_LEVEL] ?? 8;

  // Grow with pointer proximity: full growth on the line, none past the radius
  const targetScale = useTransform(mouseY, (y) => {
    const rect = ref.current?.getBoundingClientRect();
    const distance = rect
      ? Math.abs(y - (rect.top + rect.height / 2))
      : Number.POSITIVE_INFINITY;
    const closeness = Math.max(0, 1 - distance / PROXIMITY_RADIUS);

    return (baseWidth + LINE_GROWTH * closeness) / MAX_LINE_WIDTH;
  });
  const springScale = useSpring(targetScale, LINE_SPRING);

  return (
    <button
      aria-current={active ? "location" : undefined}
      aria-label={item.text}
      className={cn(
        "group flex h-2.5 min-h-1 w-full shrink items-center outline-none",
        side === "right" ? "justify-end" : "justify-start"
      )}
      onClick={() => onSelect(index)}
      onFocus={(event) => onHover(index, event.currentTarget)}
      onPointerEnter={(event) => onHover(index, event.currentTarget)}
      ref={ref}
      type="button"
    >
      <motion.span
        className={cn(
          "block h-0.5 rounded-full transition-colors duration-150 group-focus-visible:ring-2 group-focus-visible:ring-ring",
          active || highlighted ? "bg-foreground" : "bg-muted-foreground/40"
        )}
        style={{
          scaleX: reduceMotion ? targetScale : springScale,
          transformOrigin: side === "right" ? "right center" : "left center",
          width: MAX_LINE_WIDTH,
        }}
      />
    </button>
  );
}

/**
 * A rail of short lines, one per heading, that jumps to a section when
 * clicked. The line for the section in view is highlighted; hovering the
 * rail grows the lines near the pointer and shows the heading with the
 * start of its section beside it, while the lines stay in place.
 *
 * Headings are read from the document rather than via Tiptap's
 * TableOfContents extension, which writes an id attribute into every heading
 * and so would change the stored content of every post opened.
 *
 * Place it over the editor pane, outside the `EditorScrollArea`, e.g.
 * `className="absolute inset-y-0 right-0"`. It hides itself when there are
 * fewer than two headings.
 */
export function EditorOutline({
  className,
  side = "right",
}: EditorOutlineProps) {
  const { editor } = useCurrentEditor();
  const view = useMountedEditorView(editor);
  const reduceMotion = useReducedMotion() ?? false;
  const mouseY = useMotionValue(Number.POSITIVE_INFINITY);
  const [items, setItems] = useState<OutlineItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovered, setHovered] = useState<HoveredItem | null>(null);
  const positionsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const sync = () => {
      const outline = readOutline(editor.state.doc);
      positionsRef.current = outline.positions;
      setItems((previous) =>
        isSameOutline(previous, outline.items) ? previous : outline.items
      );
    };

    sync();
    editor.on("update", sync);

    return () => {
      editor.off("update", sync);
    };
  }, [editor]);

  // The active section is the last one whose heading has scrolled past a
  // line near the top of the pane, or the last one in view at the very end.
  useEffect(() => {
    const container = view ? getEditorScrollContainer(view) : null;

    if (!(editor && view && container) || items.length === 0) {
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;

      const rect = container.getBoundingClientRect();
      const anchor = rect.top + Math.min(rect.height * 0.3, 160);
      const atEnd =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 2;
      let next = 0;

      for (const [index, pos] of positionsRef.current.entries()) {
        const top = getHeadingTop(view, pos);

        if (top !== null && (top <= anchor || (atEnd && top < rect.bottom))) {
          next = index;
        }
      }

      setActiveIndex(next);
    };

    const scheduleUpdate = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    update();
    container.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    editor.on("update", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      editor.off("update", scheduleUpdate);
    };
  }, [editor, items.length, view]);

  const handleHover = useCallback(
    (index: number, button: HTMLButtonElement) => {
      const pos = positionsRef.current[index];

      if (!editor || pos === undefined) {
        return;
      }

      const y = button.offsetTop + button.offsetHeight / 2;
      // Keyboard focus has no pointer, so put the proximity bump on the line
      const rect = button.getBoundingClientRect();
      mouseY.set(rect.top + rect.height / 2);
      setHovered({
        index,
        preview: readSectionPreview(editor.state.doc, pos),
        y,
      });
    },
    [editor, mouseY]
  );

  const handleSelect = useCallback(
    (index: number) => {
      const pos = positionsRef.current[index];
      const container = view ? getEditorScrollContainer(view) : null;

      if (!(view && container) || pos === undefined) {
        return;
      }

      const top = getHeadingTop(view, pos);

      if (top === null) {
        return;
      }

      container.scrollTo({
        behavior: reduceMotion ? "auto" : "smooth",
        top:
          top -
          container.getBoundingClientRect().top +
          container.scrollTop -
          SCROLL_MARGIN,
      });
    },
    [reduceMotion, view]
  );

  const handlePointerMove = (event: ReactPointerEvent) => {
    mouseY.set(event.clientY);
  };

  const handleLeave = () => {
    mouseY.set(Number.POSITIVE_INFINITY);
    setHovered(null);
  };

  if (items.length < 2) {
    return null;
  }

  const hoveredItem = hovered ? items[hovered.index] : undefined;

  return (
    <div
      className={cn(
        "pointer-events-none flex items-center",
        side === "right" ? "justify-end" : "justify-start",
        className
      )}
    >
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: pointer tracking for the hover effect and wheel pass-through; the lines are the controls */}
      <nav
        aria-label="Sections"
        className={cn(
          "pointer-events-auto relative flex max-h-[calc(100%-2rem)] w-14 flex-col py-2",
          side === "right" ? "items-end pr-4" : "items-start pl-4"
        )}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            handleLeave();
          }
        }}
        onPointerLeave={handleLeave}
        onPointerMove={handlePointerMove}
        onWheel={(event) => {
          // The rail sits over the scroll area; keep the wheel scrolling it
          const container = view ? getEditorScrollContainer(view) : null;
          container?.scrollBy({ top: event.deltaY });
        }}
      >
        {items.map((item, index) => (
          <OutlineLine
            active={index === activeIndex}
            highlighted={index === hovered?.index}
            index={index}
            item={item}
            // biome-ignore lint/suspicious/noArrayIndexKey: headings have no stable id; a line is its position in the list
            key={index}
            mouseY={mouseY}
            onHover={handleHover}
            onSelect={handleSelect}
            reduceMotion={reduceMotion}
            side={side}
          />
        ))}

        <AnimatePresence>
          {hovered && hoveredItem ? (
            <motion.div
              animate={{ opacity: 1, x: 0, y: hovered.y }}
              className={cn(
                "pointer-events-none absolute top-0 w-72",
                side === "right" ? "right-full mr-1" : "left-full ml-1"
              )}
              exit={{ opacity: 0, x: side === "right" ? 6 : -6 }}
              initial={{
                opacity: 0,
                x: side === "right" ? 6 : -6,
                y: hovered.y,
              }}
              key="preview"
              transition={reduceMotion ? { duration: 0 } : CARD_SPRING}
            >
              <div className="-translate-y-1/2 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg">
                <p className="truncate font-medium text-sm">
                  {hoveredItem.text}
                </p>
                {hovered.preview ? (
                  <p className="mt-1 line-clamp-3 text-muted-foreground text-xs leading-relaxed">
                    {hovered.preview}
                  </p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>
    </div>
  );
}
