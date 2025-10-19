"use client";

import { Button } from "@marble/ui/components/button";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Separator } from "@marble/ui/components/separator";
import { Switch } from "@marble/ui/components/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { useCurrentEditor } from "@tiptap/react";
import { Check, Link as LinkIcon, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFloatingPortalContainer } from "@/components/editor/floating-portal-context";

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

type LinkSelectorProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const LinkSelector = ({ open, onOpenChange }: LinkSelectorProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { editor } = useCurrentEditor();
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const portalContainer = useFloatingPortalContainer();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  if (!editor) {
    return null;
  }

  return (
    <Popover modal={true} onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Tooltip delayDuration={400}>
          <TooltipTrigger asChild>
            <Button
              className={cn(
                "gap-2 border-none",
                editor.isActive("link") && "bg-emerald-500/10 text-emerald-500"
              )}
              size="icon"
              variant="ghost"
            >
              <LinkIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Set link</p>
          </TooltipContent>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-60 p-0"
        container={portalContainer}
        sideOffset={10}
      >
        {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: It's acting as a button */}
        {/** biome-ignore lint/a11y/noStaticElementInteractions: It's acting as a button */}
        <div
          className="flex flex-col p-1"
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
          <div className="mb-3 flex">
            <input
              className="flex-1 bg-background p-1 text-sm outline-hidden"
              defaultValue={editor.getAttributes("link").href || ""}
              onChange={({ target }) => setInputValue(target.value)}
              placeholder="Paste or type link"
              ref={inputRef}
              type="text"
            />
            {editor.getAttributes("link").href ? (
              <Button
                className="flex items-center rounded-sm text-destructive transition-all hover:bg-destructive hover:text-white"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <Trash2 className="size-4" />
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
          <Separator className="mb-3" />
          <div className="flex items-center space-x-2 p-2">
            <Switch
              aria-labelledby="new-tab"
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
