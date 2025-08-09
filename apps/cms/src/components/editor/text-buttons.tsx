import { Button } from "@marble/ui/components/button";
import { cn } from "@marble/ui/lib/utils";
import {
  TextB as Bold,
  type Icon,
  TextItalic as Italic,
  TextStrikethrough as Strikethrough,
  TextAlignCenter,
  TextAlignJustify,
  TextAlignLeft,
  TextAlignRight,
  TextUnderline as Underline,
} from "@phosphor-icons/react";
import { useEditor } from "novel";

export type SelectorItem = {
  name: string;
  icon: Icon;
  command: (
    textEditor: NonNullable<ReturnType<typeof useEditor>["editor"]>
  ) => void;
  isActive: (
    textEditor: NonNullable<ReturnType<typeof useEditor>["editor"]>
  ) => boolean;
};

export const TextButtons = () => {
  const { editor } = useEditor();
  if (!editor) {
    return null;
  }

  const items: SelectorItem[] = [
    {
      name: "bold",
      isActive: (textEditor) => textEditor.isActive("bold"),
      command: (textEditor) => textEditor.chain().focus().toggleBold().run(),
      icon: Bold,
    },
    {
      name: "italic",
      isActive: (textEditor) => textEditor.isActive("italic"),
      command: (textEditor) => textEditor.chain().focus().toggleItalic().run(),
      icon: Italic,
    },
    {
      name: "underline",
      isActive: (textEditor) => textEditor.isActive("underline"),
      command: (textEditor) =>
        textEditor.chain().focus().toggleUnderline().run(),
      icon: Underline,
    },
    {
      name: "strike",
      isActive: (textEditor) => textEditor.isActive("strike"),
      command: (textEditor) => textEditor.chain().focus().toggleStrike().run(),
      icon: Strikethrough,
    },
    {
      name: "alignLeft",
      isActive: (textEditor) => textEditor.isActive({ textAlign: "left" }),
      command: (textEditor) =>
        textEditor.chain().focus().setTextAlign("left").run(),
      icon: TextAlignLeft,
    },
    {
      name: "alignRight",
      isActive: (textEditor) => textEditor.isActive({ textAlign: "right" }),
      command: (textEditor) =>
        textEditor.chain().focus().setTextAlign("right").run(),
      icon: TextAlignRight,
    },
    {
      name: "alignCenter",
      isActive: (textEditor) => textEditor.isActive({ textAlign: "center" }),
      command: (textEditor) =>
        textEditor.chain().focus().setTextAlign("center").run(),
      icon: TextAlignCenter,
    },
    {
      name: "justify",
      isActive: (textEditor) => textEditor.isActive({ textAlign: "justify" }),
      command: (textEditor) =>
        textEditor.chain().focus().setTextAlign("justify").run(),
      icon: TextAlignJustify,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row">
      {items.map((item) => (
        <Button
          className="rounded-none"
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
