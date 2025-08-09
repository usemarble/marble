import { Button } from "@marble/ui/components/button";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Switch } from "@marble/ui/components/switch";
import { cn } from "@marble/ui/lib/utils";
import { Check, LinkSimple, Trash } from "@phosphor-icons/react";
import { useEditor } from "novel";
import { useEffect, useRef, useState } from "react";

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch (_e) {
    return false;
  }
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) {
    return str;
  }
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch (_e) {
    return null;
  }
}

interface LinkSelectorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { editor } = useEditor();
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  if (!editor) {
    return null;
  }

  return (
    <Popover modal={true} onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          className={cn("gap-2 rounded-none border-none", {
            "text-emerald-500": editor.isActive("link"),
          })}
          variant="ghost"
        >
          <LinkSimple className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-0" sideOffset={10}>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: <> */}
        {/** biome-ignore lint/nursery/noNoninteractiveElementInteractions: <> */}
        <div
          className="flex flex-col divide-y p-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const url = getUrlFromString(inputValue);
              url &&
                editor
                  .chain()
                  .focus()
                  .setLink({
                    href: url,
                    target: openInNewTab ? "_blank" : "_self",
                  })
                  .run();
            }
          }}
        >
          <div className="mb-1 flex">
            <input
              className="flex-1 bg-background p-1 text-sm outline-none"
              defaultValue={editor.getAttributes("link").href || ""}
              onChange={({ target }) => setInputValue(target.value)}
              placeholder="Paste or type link"
              ref={inputRef}
              type="text"
            />
            {editor.getAttributes("link").href ? (
              <Button
                className="flex size-8 items-center rounded-sm text-destructive transition-all hover:bg-destructive hover:text-white"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <Trash className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="size-8 shrink-0"
                onClick={() => {
                  const url = getUrlFromString(inputRef.current?.value || "");
                  if (url) {
                    editor
                      .chain()
                      .focus()
                      .setLink({
                        href: url,
                        target: openInNewTab ? "_blank" : "_self",
                      })
                      .run();
                  }
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <Check className="size-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2 p-2">
            <Switch
              checked={openInNewTab}
              id="new-tab"
              onCheckedChange={setOpenInNewTab}
            />
            <Label className="text-muted-foreground text-xs" htmlFor="new-tab">
              Open in new tab
            </Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
