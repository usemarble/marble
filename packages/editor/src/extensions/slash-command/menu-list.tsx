import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@marble/ui/components/command";
import { useEffect, useRef } from "react";
import type { EditorSlashMenuProps } from "../../types";

/**
 * Menu list component for slash commands
 * Displays available commands in a dropdown menu
 * Uses cmdk's built-in keyboard navigation (ArrowUp, ArrowDown, Enter)
 */
export const EditorSlashMenu = ({
  items,
  editor,
  range,
}: EditorSlashMenuProps) => {
  const commandRef = useRef<HTMLDivElement>(null);

  const selectItem = (index: number) => {
    const item = items.at(index);
    if (item) {
      item.command({ editor, range });
    }
  };

  // Auto-select the first item when items change
  useEffect(() => {
    if (items.length > 0 && commandRef.current) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        const commandElement = commandRef.current;
        if (commandElement) {
          // Simulate ArrowDown keypress to properly select first item via cmdk's internal logic
          const arrowDownEvent = new KeyboardEvent("keydown", {
            key: "ArrowDown",
            code: "ArrowDown",
            keyCode: 40,
            which: 40,
            bubbles: true,
            cancelable: true,
          });

          commandElement.dispatchEvent(arrowDownEvent);
        }
      }, 10);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [items]);

  return (
    <Command
      className="border shadow"
      id="slash-command"
      ref={commandRef}
      shouldFilter={false}
    >
      <CommandEmpty className="flex w-full items-center justify-center p-4 text-muted-foreground text-sm">
        <p>No results</p>
      </CommandEmpty>
      <CommandList>
        {items.map((item, index) => (
          <CommandItem
            className="flex items-center gap-3 pr-3"
            key={item.title}
            onSelect={() => selectItem(index)}
            value={item.title}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded border bg-secondary">
              <item.icon className="text-muted-foreground" size={16} />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">{item.title}</span>
              <span className="text-muted-foreground text-xs">
                {item.description}
              </span>
            </div>
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
};

/**
 * Handle keyboard navigation for slash command menu
 */
export const handleCommandNavigation = (event: KeyboardEvent) => {
  if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
    const slashCommand = document.querySelector<HTMLElement>("#slash-command");

    if (slashCommand) {
      // For Enter key, find and trigger the selected item directly
      if (event.key === "Enter") {
        const selectedItem = slashCommand.querySelector<HTMLElement>(
          '[data-selected="true"], [cmdk-item][aria-selected="true"], [cmdk-item][data-state="selected"]'
        );

        if (selectedItem) {
          event.preventDefault();
          event.stopPropagation();
          selectedItem.click();
          return true;
        }

        // If no item is selected, select the first item
        const firstItem =
          slashCommand.querySelector<HTMLElement>("[cmdk-item]");
        if (firstItem) {
          event.preventDefault();
          event.stopPropagation();
          firstItem.click();
          return true;
        }
      }

      // For ArrowUp/ArrowDown, dispatch the event to cmdk
      const keyboardEvent = new KeyboardEvent("keydown", {
        key: event.key,
        cancelable: true,
        bubbles: true,
      });

      slashCommand.dispatchEvent(keyboardEvent);
      event.preventDefault();
      event.stopPropagation();

      return true;
    }
  }

  return false;
};
