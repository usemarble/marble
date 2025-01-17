import { Button } from "@repo/ui/components/button";
import {
  BoldIcon,
  ItalicIcon,
  type LucideIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "@repo/ui/lib/icons";
import { cn } from "@repo/ui/lib/utils";
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
