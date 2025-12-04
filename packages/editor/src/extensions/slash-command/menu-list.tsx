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
 */
export const EditorSlashMenu = ({
  items,
  editor,
  range,
}: EditorSlashMenuProps) => (
  <Command
    className="border shadow"
    id="slash-command"
    onKeyDown={(e) => {
      e.stopPropagation();
    }}
  >
    <CommandEmpty className="flex w-full items-center justify-center p-4 text-muted-foreground text-sm">
      <p>No results</p>
    </CommandEmpty>
    <CommandList>
      {items.map((item) => (
        <CommandItem
          className="flex items-center gap-3 pr-3"
          key={item.title}
          onSelect={() => item.command({ editor, range })}
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

/**
 * Handle keyboard navigation for slash command menu
 */
export const handleCommandNavigation = (event: KeyboardEvent) => {
  if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
    const slashCommand = document.querySelector("#slash-command");

    if (slashCommand) {
      event.preventDefault();

      slashCommand.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: event.key,
          cancelable: true,
          bubbles: true,
        })
      );

      return true;
    }
  }
};
