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
import { useCurrentEditor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  EllipsisVertical,
  FileCode,
  Highlighter,
  Italic,
  Palette,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from "lucide-react";
import { memo } from "react";
import { useFloatingPortalContainer } from "@/components/editor/floating-portal-context";
import { ColorPicker } from "./color-picker";
import { ContentTypePicker } from "./content-type-picker";

export type SelectorItem = {
  name: string;
  icon: typeof Bold;
  command: (editor: Editor) => void;
  isActive: (editor: Editor) => boolean;
  tooltip: string;
};

// Define items array outside component to avoid recreation on every render
const BASIC_FORMATTING: SelectorItem[] = [
  {
    name: "bold",
    isActive: (editor) => editor.isActive("bold"),
    command: (editor) => editor.chain().focus().toggleBold().run(),
    icon: Bold,
    tooltip: "Bold",
  },
  {
    name: "italic",
    isActive: (editor) => editor.isActive("italic"),
    command: (editor) => editor.chain().focus().toggleItalic().run(),
    icon: Italic,
    tooltip: "Italic",
  },
  {
    name: "underline",
    isActive: (editor) => editor.isActive("underline"),
    command: (editor) => editor.chain().focus().toggleUnderline().run(),
    icon: Underline,
    tooltip: "Underline",
  },
  {
    name: "strike",
    isActive: (editor) => editor.isActive("strike"),
    command: (editor) => editor.chain().focus().toggleStrike().run(),
    icon: Strikethrough,
    tooltip: "Strikethrough",
  },
  {
    name: "code",
    isActive: (editor) => editor.isActive("code"),
    command: (editor) => editor.chain().focus().toggleCode().run(),
    icon: Code,
    tooltip: "Code",
  },
  {
    name: "codeBlock",
    isActive: (editor) => editor.isActive("codeBlock"),
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    icon: FileCode,
    tooltip: "Code block",
  },
];

const SUBSCRIPT_SUPERSCRIPT: SelectorItem[] = [
  {
    name: "subscript",
    isActive: (editor) => editor.isActive("subscript"),
    command: (editor) => editor.chain().focus().toggleSubscript().run(),
    icon: Subscript,
    tooltip: "Subscript",
  },
  {
    name: "superscript",
    isActive: (editor) => editor.isActive("superscript"),
    command: (editor) => editor.chain().focus().toggleSuperscript().run(),
    icon: Superscript,
    tooltip: "Superscript",
  },
];

const ALIGNMENT: SelectorItem[] = [
  {
    name: "alignLeft",
    isActive: (editor) => editor.isActive({ textAlign: "left" }),
    command: (editor) => editor.chain().focus().setTextAlign("left").run(),
    icon: AlignLeft,
    tooltip: "Align left",
  },
  {
    name: "alignCenter",
    isActive: (editor) => editor.isActive({ textAlign: "center" }),
    command: (editor) => editor.chain().focus().setTextAlign("center").run(),
    icon: AlignCenter,
    tooltip: "Align center",
  },
  {
    name: "alignRight",
    isActive: (editor) => editor.isActive({ textAlign: "right" }),
    command: (editor) => editor.chain().focus().setTextAlign("right").run(),
    icon: AlignRight,
    tooltip: "Align right",
  },
  {
    name: "justify",
    isActive: (editor) => editor.isActive({ textAlign: "justify" }),
    command: (editor) => editor.chain().focus().setTextAlign("justify").run(),
    icon: AlignJustify,
    tooltip: "Justify",
  },
];

function TextButtonsComponent() {
  const { editor } = useCurrentEditor();
  const portalContainer = useFloatingPortalContainer();
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5">
      {/* Content Type Picker */}
      <ContentTypePicker />

      <Separator
        className="mx-1 h-full min-h-[1.5rem] w-[1px]"
        orientation="vertical"
      />

      {/* Basic formatting buttons */}
      {BASIC_FORMATTING.map((item) => (
        <Tooltip delayDuration={400} key={item.name}>
          <TooltipTrigger asChild>
            <Button
              className={cn(
                "!rounded-sm",
                item.isActive(editor) && "!bg-primary !text-primary-foreground"
              )}
              onClick={() => item.command(editor)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <item.icon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{item.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      <Separator
        className="mx-1 h-full min-h-[1.5rem] w-[1px]"
        orientation="vertical"
      />

      {/* Highlight Color */}
      <Popover>
        <Tooltip delayDuration={400}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  "!rounded-sm",
                  editor.isActive("highlight") &&
                    "bg-primary text-primary-foreground"
                )}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Highlighter className="size-4" />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>
            <p>Highlight text</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          align="start"
          className="w-64 p-0"
          container={portalContainer}
        >
          <ColorPicker
            color={editor.getAttributes("highlight").color}
            onChange={(color) =>
              editor.chain().focus().setHighlight({ color }).run()
            }
            onClear={() => editor.chain().focus().unsetHighlight().run()}
          />
        </PopoverContent>
      </Popover>

      {/* Text Color */}
      <Popover>
        <Tooltip delayDuration={400}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  "!rounded-sm",
                  editor.getAttributes("textStyle").color &&
                    "bg-primary text-primary-foreground"
                )}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Palette className="size-4" />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>
            <p>Text color</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          align="start"
          className="w-64 p-0"
          container={portalContainer}
        >
          <ColorPicker
            color={editor.getAttributes("textStyle").color}
            onChange={(color) => editor.chain().focus().setColor(color).run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
          />
        </PopoverContent>
      </Popover>

      <Separator
        className="mx-1 h-full min-h-[1.5rem] w-[1px]"
        orientation="vertical"
      />

      {/* More Options */}
      <Popover modal={false}>
        <Tooltip delayDuration={400}>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                className="!rounded-sm"
                size="icon"
                type="button"
                variant="ghost"
              >
                <EllipsisVertical className="size-4" />
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent>
            <p>More options</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          className="!rounded-sm inline-flex w-fit items-center gap-0.5 border bg-background p-1 shadow-sm"
          container={portalContainer}
          side="top"
        >
          {/* Subscript & Superscript */}
          {SUBSCRIPT_SUPERSCRIPT.map((item) => (
            <Tooltip delayDuration={400} key={item.name}>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    "!rounded-sm",
                    item.isActive(editor) &&
                      "bg-primary text-primary-foreground"
                  )}
                  onClick={() => item.command(editor)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <item.icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          <Separator
            className="mx-1 h-full min-h-[1.5rem] w-[1px]"
            orientation="vertical"
          />

          {/* Alignment buttons */}
          {ALIGNMENT.map((item) => (
            <Tooltip delayDuration={400} key={item.name}>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    "!rounded-sm",
                    item.isActive(editor) &&
                      "bg-primary text-primary-foreground"
                  )}
                  onClick={() => item.command(editor)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <item.icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{item.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Memoize component to prevent unnecessary rerenders
export const TextButtons = memo(TextButtonsComponent);
