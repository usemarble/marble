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
import type { Editor } from "@tiptap/core";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
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
  const [internalOpen, setInternalOpen] = useState(false);
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const portalContainer = useFloatingPortalContainer();

  // Use internal state if no props provided
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  // Track link active state reactively for proper re-rendering
  const isLinkActive = useEditorState({
    editor: editor as Editor,
    selector: (ctx) => ctx.editor.isActive("link"),
  });

  // Sync input value when popover opens
  useEffect(() => {
    if (isOpen) {
      const currentLink = editor?.getAttributes("link").href || "";
      setInputValue(currentLink);
      inputRef.current?.focus();
    }
  }, [isOpen, editor]);

  if (!editor) {
    return null;
  }

  return (
    <Popover modal={true} onOpenChange={setIsOpen} open={isOpen}>
      <Tooltip delayDuration={400}>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              className="!rounded-sm gap-2 border-none data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
              data-active={isLinkActive}
              size="icon"
              variant="ghost"
            >
              <LinkIcon className="size-4" />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>
          <p>Set link</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        className="p-0 pt-1"
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
              if (url) {
                editor
                  .chain()
                  .focus()
                  .setLink({
                    href: url,
                    target: openInNewTab ? "_blank" : "_self",
                  })
                  .run();
                setInputValue("");
                setIsOpen(false);
              }
            }
          }}
        >
          <div className="mb-3 flex">
            <input
              className="flex-1 bg-background p-1 text-sm outline-hidden"
              onChange={({ target }) => setInputValue(target.value)}
              placeholder="Paste or type link"
              ref={inputRef}
              type="text"
              value={inputValue}
            />
            {editor.getAttributes("link").href ? (
              <Button
                className="flex items-center rounded-sm text-destructive transition-all hover:bg-destructive hover:text-white"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setInputValue("");
                  setIsOpen(false);
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <Trash2 className="size-4" />
              </Button>
            ) : (
              <Button
                className="!rounded-sm"
                onClick={() => {
                  const url = getUrlFromString(inputValue);
                  if (url) {
                    editor
                      .chain()
                      .focus()
                      .setLink({
                        href: url,
                        target: openInNewTab ? "_blank" : "_self",
                      })
                      .run();
                    setInputValue("");
                    setIsOpen(false);
                  }
                }}
                size="sm"
                type="button"
                variant="default"
              >
                {/* <Check className="size-4" /> */}
                Set Link
              </Button>
            )}
          </div>
          <Separator className="mb-3" />
          <div className="flex items-center space-x-2 p-2">
            <Label className="text-muted-foreground text-xs" htmlFor="new-tab">
              Open in new tab
            </Label>
            <Switch
              aria-labelledby="new-tab"
              checked={openInNewTab}
              id="new-tab"
              onCheckedChange={setOpenInNewTab}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
