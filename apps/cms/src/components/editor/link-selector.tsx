"use client";

import { Button } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Separator } from "@marble/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import type { Editor } from "@tiptap/core";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { Check, ExternalLink, Link, Maximize2, Trash2 } from "lucide-react";
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
              <Link className="size-4" />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>
          <p>Set link</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        className="w-fit p-0 pt-1"
        container={portalContainer}
        sideOffset={10}
      >
        {/** biome-ignore lint: Handles Enter key for setting link */}
        <div
          className="flex items-center gap-0.5 p-1"
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
          <input
            className="flex-1 bg-background px-2 py-1 text-sm outline-hidden"
            onChange={({ target }) => setInputValue(target.value)}
            placeholder="Paste or type link"
            ref={inputRef}
            type="text"
            value={inputValue}
          />
          {editor.getAttributes("link").href ? (
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <Button
                  className="!rounded-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setInputValue("");
                    setIsOpen(false);
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove link</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip delayDuration={400}>
              <TooltipTrigger asChild>
                <Button
                  className="!rounded-sm text-green-600 hover:bg-green-500/10 hover:text-green-600"
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
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Check className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set link</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Separator
            className="mx-1 h-full min-h-[1.5rem] w-[1px]"
            orientation="vertical"
          />
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  "!rounded-sm",
                  openInNewTab && "bg-primary/20 text-primary"
                )}
                onClick={() => setOpenInNewTab(!openInNewTab)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Maximize2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{openInNewTab ? "Opens in new tab" : "Opens in same tab"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                className="!rounded-sm"
                disabled={!inputValue || !getUrlFromString(inputValue)}
                onClick={() => {
                  const url = getUrlFromString(inputValue);
                  if (url) {
                    window.open(url, "_blank");
                  }
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ExternalLink className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open link</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </PopoverContent>
    </Popover>
  );
};
