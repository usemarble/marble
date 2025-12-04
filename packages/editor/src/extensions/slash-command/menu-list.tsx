import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@marble/ui/components/command";
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
  const selectItem = (index: number) => {
    const item = items.at(index);
    if (item) {
      item.command({ editor, range });
    }
  };

  return (
    <Command className="border shadow" id="slash-command" shouldFilter={false}>
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
      const keyboardEvent = new KeyboardEvent("keydown", {
        key: event.key,
        cancelable: true,
        bubbles: true,
      });

      slashCommand.dispatchEvent(keyboardEvent);

      return true;
    }
  }

  return false;
};
