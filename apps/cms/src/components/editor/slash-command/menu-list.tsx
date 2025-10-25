import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { DropdownButton } from "./dropdown-button";
import { Surface } from "./surface";
import type { MenuListProps } from "./types";

export const MenuList = forwardRef<
  { onKeyDown: (props: { event: React.KeyboardEvent }) => boolean },
  MenuListProps
>((props, ref) => {
  const scrollContainer = useRef<HTMLDivElement>(null);
  const activeItem = useRef<HTMLButtonElement>(null);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Reset selection whenever menu items change
  // biome-ignore lint/correctness/useExhaustiveDependencies: props is stable reference
  useEffect(() => {
    setSelectedGroupIndex(0);
    setSelectedCommandIndex(0);
  }, [props.items]);

  const selectItem = useCallback(
    (groupIndex: number, commandIndex: number) => {
      const group = props.items[groupIndex];
      if (!group) {
        return;
      }

      const command = group.commands[commandIndex];
      if (!command) {
        return;
      }

      props.command(command);
    },
    [props]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
      if (event.key === "ArrowDown") {
        if (!props.items.length) {
          return false;
        }

        const currentGroup = props.items[selectedGroupIndex];
        if (!currentGroup) {
          return false;
        }

        const commands = currentGroup.commands;
        let newCommandIndex = selectedCommandIndex + 1;
        let newGroupIndex = selectedGroupIndex;

        if (newCommandIndex >= commands.length) {
          newCommandIndex = 0;
          newGroupIndex = (selectedGroupIndex + 1) % props.items.length;
        }

        setSelectedCommandIndex(newCommandIndex);
        setSelectedGroupIndex(newGroupIndex);
        return true;
      }

      if (event.key === "ArrowUp") {
        if (!props.items.length) {
          return false;
        }

        let newCommandIndex = selectedCommandIndex - 1;
        let newGroupIndex = selectedGroupIndex;

        if (newCommandIndex < 0) {
          newGroupIndex =
            selectedGroupIndex - 1 < 0
              ? props.items.length - 1
              : selectedGroupIndex - 1;
          const newGroup = props.items[newGroupIndex];
          if (!newGroup) {
            return false;
          }
          newCommandIndex = newGroup.commands.length - 1;
        }

        setSelectedCommandIndex(newCommandIndex);
        setSelectedGroupIndex(newGroupIndex);
        return true;
      }

      if (event.key === "Enter") {
        if (!props.items.length) {
          return false;
        }
        selectItem(selectedGroupIndex, selectedCommandIndex);
        return true;
      }

      return false;
    },
  }));

  // biome-ignore lint/correctness/useExhaustiveDependencies: selectItem is stable
  useEffect(() => {
    if (activeItem.current && scrollContainer.current) {
      const offsetTop = activeItem.current.offsetTop;
      const offsetHeight = activeItem.current.offsetHeight;
      scrollContainer.current.scrollTop = offsetTop - offsetHeight;
    }
  }, [selectedCommandIndex, selectedGroupIndex]);

  const createCommandClickHandler = useCallback(
    (groupIndex: number, commandIndex: number) => () =>
      selectItem(groupIndex, commandIndex),
    [selectItem]
  );

  return (
    <Surface
      className="slash-command-scrollbar z-50 h-auto max-h-80 w-60 overflow-y-auto px-1 py-2 transition-all"
      ref={scrollContainer}
      style={{
        scrollbarWidth: "thin",
      }}
    >
      {props.items.length ? (
        <div className="space-y-1">
          {props.items.map((group, groupIndex) => (
            <div className="mb-4 last:mb-0" key={`${group.title}-wrapper`}>
              <div
                className="mx-2 mt-4 select-none font-semibold text-[0.65rem] text-muted-foreground uppercase tracking-wider first:mt-0.5"
                key={group.title}
              >
                {group.title}
              </div>
              <div className="space-y-1">
                {group.commands.map((command, commandIndex) => {
                  const Icon = command.icon;
                  const isActive =
                    selectedGroupIndex === groupIndex &&
                    selectedCommandIndex === commandIndex;

                  return (
                    <DropdownButton
                      isActive={isActive}
                      key={command.label}
                      onClick={createCommandClickHandler(
                        groupIndex,
                        commandIndex
                      )}
                      ref={isActive ? activeItem : null}
                    >
                      <Icon className="mr-1 h-4 w-4" />
                      {command.label}
                    </DropdownButton>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-2 py-1 text-center text-muted-foreground text-sm">
          No results
        </div>
      )}
    </Surface>
  );
});

MenuList.displayName = "MenuList";

export default MenuList;
