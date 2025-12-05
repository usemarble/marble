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
import { useCurrentEditor } from "@tiptap/react";
import {
  CheckIcon,
  ExternalLinkIcon,
  Link,
  Maximize2,
  TrashIcon,
} from "lucide-react";
import type { FormEventHandler } from "react";
import { useEffect, useRef, useState } from "react";

export type EditorLinkSelectorProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

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
  open,
  onOpenChange,
}: EditorLinkSelectorProps) => {
  const { editor } = useCurrentEditor();
  const [url, setUrl] = useState<string>("");
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const inputReference = useRef<HTMLInputElement>(null);

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
    if (open) {
      // Reset URL to current link href when popover opens
      const linkAttributes = editor?.getAttributes("link") ?? {};
      const href = linkAttributes.href ?? "";
      const target = linkAttributes.target ?? "_blank";
      setUrl(href);
      setOpenInNewTab(target === "_blank");
      inputReference.current?.focus();
    }
  }, [open, editor]);

  if (!editor) {
    return null;
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

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
      onOpenChange?.(false);
    }
  };

  return (
    <Popover modal onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="gap-2 rounded-none border-none"
          size="sm"
          variant="ghost"
        >
          <Link size={12} />
          <p
            className={cn(
              "text-xs underline decoration-text-muted underline-offset-4",
              {
                "text-primary": editor.isActive("link"),
              }
            )}
          >
            Link
          </p>
        </Button>
      </PopoverTrigger>
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
          {editor.getAttributes("link").href ? (
            <>
              <Button
                className="h-8"
                onClick={() => {
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
                    onOpenChange?.(false);
                  }
                }}
                size="icon"
                type="button"
                variant="secondary"
              >
                <CheckIcon size={12} />
              </Button>
              <Button
                className="flex h-8 items-center rounded-sm p-1 text-destructive transition-all hover:bg-destructive-foreground dark:hover:bg-destructive"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  onOpenChange?.(false);
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <TrashIcon size={12} />
              </Button>
            </>
          ) : (
            <Button
              className="h-8"
              onClick={() => {
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
                  onOpenChange?.(false);
                }
              }}
              size="icon"
              type="button"
              variant="secondary"
            >
              <CheckIcon size={12} />
            </Button>
          )}
          <Separator
            className="mx-1 h-full min-h-[1.5rem] w-[1px]"
            orientation="vertical"
          />
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  "h-8 rounded-sm",
                  openInNewTab &&
                    "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary"
                )}
                onClick={() => setOpenInNewTab(!openInNewTab)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Maximize2 size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{openInNewTab ? "Opens in new tab" : "Opens in same tab"}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                className="h-8 rounded-sm"
                disabled={!url || !getUrlFromString(url)}
                onClick={() => {
                  const href =
                    getUrlFromString(url) || editor.getAttributes("link").href;
                  if (href) {
                    window.open(href, "_blank", "noopener,noreferrer");
                  }
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ExternalLinkIcon size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open link</p>
            </TooltipContent>
          </Tooltip>
        </form>
      </PopoverContent>
    </Popover>
  );
};
