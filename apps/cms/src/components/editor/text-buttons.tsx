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
import { ArrowUpIcon } from "@phosphor-icons/react";
import type { Editor } from "@tiptap/core";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
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
import { KeyboardKey } from "./keyboard-key";
import { getModifierKey } from "./utils/platform";

export type SelectorItem = {
  name: string;
  icon: typeof Bold;
  command: (editor: Editor) => void;
  isActive: (editor: Editor) => boolean;
  tooltip: string;
  shortcut?: string[];
};

// Define items array outside component to avoid recreation on every render
const BASIC_FORMATTING: SelectorItem[] = [
  {
    name: "bold",
    isActive: (editor) => editor.isActive("bold"),
    command: (editor) => editor.chain().focus().toggleBold().run(),
    icon: Bold,
    tooltip: "Bold",
    shortcut: ["Mod", "B"],
  },
  {
    name: "italic",
    isActive: (editor) => editor.isActive("italic"),
    command: (editor) => editor.chain().focus().toggleItalic().run(),
    icon: Italic,
    tooltip: "Italic",
    shortcut: ["Mod", "I"],
  },
  {
    name: "underline",
    isActive: (editor) => editor.isActive("underline"),
    command: (editor) => editor.chain().focus().toggleUnderline().run(),
    icon: Underline,
    tooltip: "Underline",
    shortcut: ["Mod", "U"],
  },
  {
    name: "strike",
    isActive: (editor) => editor.isActive("strike"),
    command: (editor) => editor.chain().focus().toggleStrike().run(),
    icon: Strikethrough,
    tooltip: "Strikethrough",
    shortcut: ["Mod", "Shift", "X"],
  },
  {
    name: "code",
    isActive: (editor) => editor.isActive("code"),
    command: (editor) => editor.chain().focus().toggleCode().run(),
    icon: Code,
    tooltip: "Code",
    shortcut: ["Mod", "E"],
  },
  {
    name: "codeBlock",
    isActive: (editor) => editor.isActive("codeBlock"),
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    icon: FileCode,
    tooltip: "Code block",
    shortcut: ["Mod", "Alt", "C"],
  },
];

const SUBSCRIPT_SUPERSCRIPT: SelectorItem[] = [
  {
    name: "subscript",
    isActive: (editor) => editor.isActive("subscript"),
    command: (editor) => editor.chain().focus().toggleSubscript().run(),
    icon: Subscript,
    tooltip: "Subscript",
    shortcut: ["Mod", ","],
  },
  {
    name: "superscript",
    isActive: (editor) => editor.isActive("superscript"),
    command: (editor) => editor.chain().focus().toggleSuperscript().run(),
    icon: Superscript,
    tooltip: "Superscript",
    shortcut: ["Mod", "."],
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

// Helper function to render keyboard shortcuts
function renderShortcut(shortcut: string[]) {
  return shortcut.map((key) => {
    let displayKey = key;

    // Replace "Mod" with platform-specific modifier
    if (key === "Mod") {
      displayKey = getModifierKey();
    }

    // Render Shift as icon, others as text
    if (key === "Shift") {
      return <KeyboardKey icon={ArrowUpIcon} key={key} />;
    }

    return <KeyboardKey key={key}>{displayKey}</KeyboardKey>;
  });
}

function TextButtonsComponent() {
  const { editor } = useCurrentEditor();
  const portalContainer = useFloatingPortalContainer();

  // Track all active states reactively for proper re-rendering
  const activeStates = useEditorState({
    editor: editor as Editor,
    selector: (ctx) => ({
      bold: ctx.editor.isActive("bold"),
      italic: ctx.editor.isActive("italic"),
      underline: ctx.editor.isActive("underline"),
      strike: ctx.editor.isActive("strike"),
      code: ctx.editor.isActive("code"),
      codeBlock: ctx.editor.isActive("codeBlock"),
      highlight: ctx.editor.isActive("highlight"),
      textColor: !!ctx.editor.getAttributes("textStyle").color,
      subscript: ctx.editor.isActive("subscript"),
      superscript: ctx.editor.isActive("superscript"),
      alignLeft: ctx.editor.isActive({ textAlign: "left" }),
      alignCenter: ctx.editor.isActive({ textAlign: "center" }),
      alignRight: ctx.editor.isActive({ textAlign: "right" }),
      justify: ctx.editor.isActive({ textAlign: "justify" }),
    }),
  });

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
              className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
              data-active={activeStates[item.name as keyof typeof activeStates]}
              onClick={() => item.command(editor)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <item.icon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex items-center gap-1.5">
              <span>{item.tooltip}</span>
              {item.shortcut && (
                <span className="flex items-center gap-0.5">
                  {renderShortcut(item.shortcut)}
                </span>
              )}
            </div>
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
                className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                data-active={activeStates.highlight}
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
                className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                data-active={activeStates.textColor}
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
            onChange={(color) => editor.chain().setColor(color).run()}
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
                  className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                  data-active={
                    activeStates[item.name as keyof typeof activeStates]
                  }
                  onClick={() => item.command(editor)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <item.icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-1.5">
                  <span>{item.tooltip}</span>
                  {item.shortcut && (
                    <span className="flex items-center gap-0.5">
                      {renderShortcut(item.shortcut)}
                    </span>
                  )}
                </div>
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
                  className="!rounded-sm data-[active=true]:bg-primary/20 data-[active=true]:text-primary"
                  data-active={
                    activeStates[item.name as keyof typeof activeStates]
                  }
                  onClick={() => item.command(editor)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <item.icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-1.5">
                  <span>{item.tooltip}</span>
                  {item.shortcut && (
                    <span className="flex items-center gap-0.5">
                      {renderShortcut(item.shortcut)}
                    </span>
                  )}
                </div>
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
