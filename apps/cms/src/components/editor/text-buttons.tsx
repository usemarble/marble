import { Button } from "@marble/ui/components/button";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BoldIcon,
  ItalicIcon,
  type LucideIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "@marble/ui/lib/icons";
import { cn } from "@marble/ui/lib/utils";
import { useEditor } from "novel";

export type SelectorItem = {
  name: string;
  icon: LucideIcon;
  command: (
    editor: NonNullable<ReturnType<typeof useEditor>["editor"]>,
  ) => void;
  isActive: (
    editor: NonNullable<ReturnType<typeof useEditor>["editor"]>,
  ) => boolean;
};

export const TextButtons = () => {
  const { editor } = useEditor();
  if (!editor) return null;

  const items: SelectorItem[] = [
    {
      name: "bold",
      isActive: (editor) => editor.isActive("bold"),
      command: (editor) => editor.chain().focus().toggleBold().run(),
      icon: BoldIcon,
    },
    {
      name: "italic",
      isActive: (editor) => editor.isActive("italic"),
      command: (editor) => editor.chain().focus().toggleItalic().run(),
      icon: ItalicIcon,
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
      name: "alignLeft",
      isActive: (editor) => editor.isActive({ textAlign: "left" }),
      command: (editor) => editor.chain().focus().setTextAlign("left").run(),
      icon: AlignLeft,
    },
    {
      name: "alignRight",
      isActive: (editor) => editor.isActive({ textAlign: "right" }),
      command: (editor) => editor.chain().focus().setTextAlign("right").run(),
      icon: AlignRight,
    },
    {
      name: "alignCenter",
      isActive: (editor) => editor.isActive({ textAlign: "center" }),
      command: (editor) => editor.chain().focus().setTextAlign("center").run(),
      icon: AlignCenter,
    },
    {
      name: "justify",
      isActive: (editor) => editor.isActive({ textAlign: "justify" }),
      command: (editor) => editor.chain().focus().setTextAlign("justify").run(),
      icon: AlignJustify,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row">
      {items.map((item) => (
        <Button
          key={item.name}
          type="button"
          size="icon"
          className="rounded-none"
          variant="ghost"
          onClick={() => item.command(editor)}
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
