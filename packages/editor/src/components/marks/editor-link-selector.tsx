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
import {
  ArrowSquareOutIcon,
  ArrowsInSimpleIcon,
  ArrowsOutSimpleIcon,
  CheckIcon,
  LinkIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useCurrentEditor } from "@tiptap/react";
import type { FormEventHandler } from "react";
import { useEffect, useRef, useState } from "react";

export interface EditorLinkSelectorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Link Selector Component
 *
 * A popover component for adding, editing, or removing links from selected text.
 * Opens a popover with an input field to enter a URL. If text is already linked,
 * shows a delete button to remove the link.
 *
 * @example
 * ```tsx
 * <EditorLinkSelector />
 * <EditorLinkSelector open={isOpen} onOpenChange={setIsOpen} />
 * ```
 */
export const EditorLinkSelector = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditorLinkSelectorProps) => {
  const { editor } = useCurrentEditor();
  const [internalOpen, setInternalOpen] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const inputReference = useRef<HTMLInputElement>(null);

  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = controlledOnOpenChange ?? setInternalOpen;

  const isValidUrl = (text: string): boolean => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  const getUrlFromString = (text: string): string | null => {
    if (isValidUrl(text)) {
      return text;
    }
    try {
      if (text.includes(".") && !text.includes(" ")) {
        return new URL(`https://${text}`).toString();
      }

      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      const linkAttributes = editor?.getAttributes("link") ?? {};
      const href = linkAttributes.href ?? "";
      const target = linkAttributes.target ?? "_blank";
      setUrl(href);
      setOpenInNewTab(target === "_blank");
      setTimeout(() => inputReference.current?.focus(), 0);
    } else {
      setUrl("");
    }
  }, [isOpen, editor]);

  if (!editor) {
    return null;
  }

  const applyLink = () => {
    const href = getUrlFromString(url);

    if (href) {
      editor
        .chain()
        .focus()
        .setLink({
          href,
          target: openInNewTab ? "_blank" : "_self",
        })
        .run();
      setUrl("");
      setIsOpen(false);
    }
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    applyLink();
  };

  return (
    <Popover modal onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger
        render={
          <Button
            className={cn("gap-2 rounded-none border-none", {
              "text-primary": editor.isActive("link"),
            })}
            size="sm"
            variant="ghost"
          >
            <LinkIcon size={12} />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-fit p-0" sideOffset={10}>
        <form className="flex items-center gap-0.5 p-1" onSubmit={handleSubmit}>
          <input
            aria-label="Link URL"
            className="min-w-[200px] flex-1 bg-background px-2 py-1 text-sm outline-none"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Paste or type link"
            ref={inputReference}
            type="text"
            value={url}
          />
          <Button
            className="h-8"
            disabled={!url || !getUrlFromString(url)}
            onClick={applyLink}
            size="icon"
            type="button"
            variant="secondary"
          >
            <CheckIcon size={12} />
          </Button>
          <Separator
            className="mx-1 h-full min-h-[1.5rem] w-[1px]"
            orientation="vertical"
          />
          <Tooltip>
            <TooltipTrigger
              delay={400}
              render={
                <Button
                  className="h-8 rounded-sm"
                  onClick={() => setOpenInNewTab(!openInNewTab)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {openInNewTab ? (
                    <ArrowsOutSimpleIcon size={12} />
                  ) : (
                    <ArrowsInSimpleIcon size={12} />
                  )}
                </Button>
              }
            />
            <TooltipContent>
              <p>{openInNewTab ? "Opens in new tab" : "Opens in same tab"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              delay={400}
              render={
                <Button
                  className="h-8 rounded-sm"
                  disabled={!editor.getAttributes("link").href}
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setUrl("");
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <TrashIcon size={12} />
                </Button>
              }
            />
            <TooltipContent>
              <p>Remove link</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              delay={400}
              render={
                <Button
                  className="h-8 rounded-sm"
                  disabled={!url || !getUrlFromString(url)}
                  onClick={() => {
                    const href =
                      getUrlFromString(url) ||
                      editor.getAttributes("link").href;
                    if (href) {
                      window.open(href, "_blank", "noopener,noreferrer");
                    }
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ArrowSquareOutIcon size={12} />
                </Button>
              }
            />
            <TooltipContent>
              <p>Open link</p>
            </TooltipContent>
          </Tooltip>
        </form>
      </PopoverContent>
    </Popover>
  );
};
