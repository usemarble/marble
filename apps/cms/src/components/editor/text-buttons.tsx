import { Button } from "@marble/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Separator } from "@marble/ui/components/separator";
import { cn } from "@marble/ui/lib/utils";
import {
  TextBIcon as Bold,
  CodeIcon,
  FileCodeIcon,
  HighlighterIcon,
  type Icon,
  TextItalicIcon as Italic,
  PaletteIcon,
  TextStrikethroughIcon as StrikethroughIcon,
  TextAlignCenterIcon,
  TextAlignJustifyIcon,
  TextAlignLeftIcon,
  TextAlignRightIcon,
  TextSubscriptIcon,
  TextSuperscriptIcon,
  TextUnderlineIcon as UnderlineIcon,
} from "@phosphor-icons/react";
import type { Editor } from "@tiptap/core";
import { useCurrentEditor } from "@tiptap/react";
import { memo, useMemo } from "react";
import { ColorPicker } from "./color-picker";

export type SelectorItem = {
  name: string;
  icon: Icon;
  command: (editor: Editor) => void;
  isActive: (editor: Editor) => boolean;
};

// Define items array outside component to avoid recreation on every render
const FORMATTING_ITEMS: SelectorItem[] = [
  {
    name: "bold",
    isActive: (editor) => editor.isActive("bold"),
    command: (editor) => editor.chain().focus().toggleBold().run(),
    icon: Bold,
  },
  {
    name: "italic",
    isActive: (editor) => editor.isActive("italic"),
    command: (editor) => editor.chain().focus().toggleItalic().run(),
    icon: Italic,
  },
  {
    name: "underline",
    isActive: (editor) => editor.isActive("underline"),
    command: (editor) => editor.chain().focus().toggleUnderline().run(),
    icon: UnderlineIcon,
  },
  {
    name: "strike",
    isActive: (editor) => editor.isActive("strike"),
    command: (editor) => editor.chain().focus().toggleStrike().run(),
    icon: StrikethroughIcon,
  },
  {
    name: "code",
    isActive: (editor) => editor.isActive("code"),
    command: (editor) => editor.chain().focus().toggleCode().run(),
    icon: CodeIcon,
  },
  {
    name: "codeBlock",
    isActive: (editor) => editor.isActive("codeBlock"),
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    icon: FileCodeIcon,
  },
  {
    name: "subscript",
    isActive: (editor) => editor.isActive("subscript"),
    command: (editor) => editor.chain().focus().toggleSubscript().run(),
    icon: TextSubscriptIcon,
  },
  {
    name: "superscript",
    isActive: (editor) => editor.isActive("superscript"),
    command: (editor) => editor.chain().focus().toggleSuperscript().run(),
    icon: TextSuperscriptIcon,
  },
  {
    name: "alignLeft",
    isActive: (editor) => editor.isActive({ textAlign: "left" }),
    command: (editor) => editor.chain().focus().setTextAlign("left").run(),
    icon: TextAlignLeftIcon,
  },
  {
    name: "alignRight",
    isActive: (editor) => editor.isActive({ textAlign: "right" }),
    command: (editor) => editor.chain().focus().setTextAlign("right").run(),
    icon: TextAlignRightIcon,
  },
  {
    name: "alignCenter",
    isActive: (editor) => editor.isActive({ textAlign: "center" }),
    command: (editor) => editor.chain().focus().setTextAlign("center").run(),
    icon: TextAlignCenterIcon,
  },
  {
    name: "justify",
    isActive: (editor) => editor.isActive({ textAlign: "justify" }),
    command: (editor) => editor.chain().focus().setTextAlign("justify").run(),
    icon: TextAlignJustifyIcon,
  },
];

const TextButtonsComponent = () => {
  const { editor } = useCurrentEditor();
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {FORMATTING_ITEMS.slice(0, 6).map((item) => (
        <Button
          key={item.name}
          onClick={() => item.command(editor)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <item.icon
            className={cn("size-4", {
              "text-emerald-500": item.isActive(editor),
            })}
          />
        </Button>
      ))}

      <Separator className="mx-1 h-6" orientation="vertical" />

      {/* Text Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn({
              "text-emerald-500": editor.getAttributes("textStyle").color,
            })}
            size="icon"
            type="button"
            variant="ghost"
          >
            <PaletteIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <ColorPicker
            color={editor.getAttributes("textStyle").color}
            onChange={(color) => editor.chain().focus().setColor(color).run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
          />
        </PopoverContent>
      </Popover>

      {/* Highlight Color */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn({
              "text-emerald-500": editor.isActive("highlight"),
            })}
            size="icon"
            type="button"
            variant="ghost"
          >
            <HighlighterIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <ColorPicker
            color={editor.getAttributes("highlight").color}
            onChange={(color) =>
              editor.chain().focus().setHighlight({ color }).run()
            }
            onClear={() => editor.chain().focus().unsetHighlight().run()}
          />
        </PopoverContent>
      </Popover>

      <Separator className="mx-1 h-6" orientation="vertical" />

      {/* Subscript & Superscript */}
      {FORMATTING_ITEMS.slice(6, 8).map((item) => (
        <Button
          key={item.name}
          onClick={() => item.command(editor)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <item.icon
            className={cn("size-4", {
              "text-emerald-500": item.isActive(editor),
            })}
          />
        </Button>
      ))}

      <Separator className="mx-1 h-6" orientation="vertical" />

      {/* Alignment buttons */}
      {FORMATTING_ITEMS.slice(8).map((item) => (
        <Button
          key={item.name}
          onClick={() => item.command(editor)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <item.icon
            className={cn("size-4", {
              "text-emerald-500": item.isActive(editor),
            })}
          />
        </Button>
      ))}
    </div>
  );
};

// Memoize component to prevent unnecessary rerenders
export const TextButtons = memo(TextButtonsComponent);
