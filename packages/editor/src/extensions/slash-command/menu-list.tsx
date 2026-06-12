import { cn } from "@marble/ui/lib/utils";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { EditorSlashMenuProps } from "../../types";

/**
 * Imperative handle exposed to the suggestion plugin so keyboard events
 * are forwarded directly instead of re-dispatching synthetic DOM events.
 */
export interface EditorSlashMenuHandle {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

/**
 * Menu list component for slash commands
 * Displays available commands in a Notion-style dropdown menu.
 * Keyboard navigation (ArrowUp, ArrowDown, Enter) is handled via the
 * imperative handle; hover and click work like a regular menu.
 */
export const EditorSlashMenu = forwardRef<
  EditorSlashMenuHandle,
  EditorSlashMenuProps
>(({ items, editor, range }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  // Tracks whether the last selection change came from the keyboard so we
  // only auto-scroll the list for keyboard navigation, not hover.
  const navigatedByKeyboard = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset highlight when the result set changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    if (!navigatedByKeyboard.current) {
      return;
    }
    const selectedElement = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selectedElement?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const selectItem = (index: number) => {
    const item = items.at(index);
    if (item) {
      item.command({ editor, range });
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) {
        return false;
      }

      if (event.key === "ArrowDown") {
        navigatedByKeyboard.current = true;
        setSelectedIndex((index) => (index + 1) % items.length);
        return true;
      }

      if (event.key === "ArrowUp") {
        navigatedByKeyboard.current = true;
        setSelectedIndex((index) => (index - 1 + items.length) % items.length);
        return true;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: mousedown is prevented so the editor keeps focus
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: mousedown is prevented so the editor keeps focus
    <div
      className="w-72 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg"
      id="slash-command"
      onMouseDown={(event) => {
        // Keep focus inside the editor so the suggestion stays active
        // while interacting with the menu.
        event.preventDefault();
      }}
    >
      {items.length === 0 ? (
        <p className="px-3 py-6 text-center text-muted-foreground text-sm">
          No results
        </p>
      ) : (
        <div
          className="max-h-[330px] overflow-y-auto p-1"
          ref={listRef}
          role="listbox"
        >
          {items.map((item, index) => (
            <button
              aria-selected={index === selectedIndex}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left",
                index === selectedIndex && "bg-accent text-accent-foreground"
              )}
              data-index={index}
              key={item.title}
              onClick={() => selectItem(index)}
              onPointerMove={() => {
                if (index !== selectedIndex) {
                  navigatedByKeyboard.current = false;
                  setSelectedIndex(index);
                }
              }}
              role="option"
              type="button"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
                <item.icon className="text-muted-foreground" size={16} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium text-sm">{item.title}</span>
                <span className="truncate text-muted-foreground text-xs">
                  {item.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

EditorSlashMenu.displayName = "EditorSlashMenu";
