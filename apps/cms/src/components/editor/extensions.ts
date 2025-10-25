import type { Extension } from "@tiptap/core";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { NodeRange } from "@tiptap/extension-node-range";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Youtube } from "@tiptap/extension-youtube";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";
import { cx } from "class-variance-authority";
import { common, createLowlight } from "lowlight";
import { ImageUpload } from "./extensions/image-upload";
import { Column, Columns } from "./extensions/multi-column";
import { Table, TableCell, TableHeader, TableRow } from "./extensions/table";
import { YouTubeUpload } from "./extensions/youtube-upload";
import { SlashCommand } from "./slash-command";

// You can overwrite the placeholder with your own configuration
const placeholder = Placeholder.configure({
  placeholder: ({ editor }) => {
    // Check if currently in a table using isActive
    if (
      editor.isActive("table") ||
      editor.isActive("tableCell") ||
      editor.isActive("tableHeader")
    ) {
      return ""; // Hide placeholder inside tables
    }
    return "Press '/' for commands";
  },
  showOnlyWhenEditable: true,
  showOnlyCurrent: true,
});

const tiptapImage = Image.configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx("rounded-md border border-muted"),
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx("not-prose pl-2"),
  },
});
const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx("flex items-start my-4"),
  },
  nested: true,
});

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx("mt-4 mb-6 border-t border-muted-foreground"),
  },
});

const youtube = Youtube.configure({
  HTMLAttributes: {
    class: cx("w-full aspect-video"),
    controls: false,
    nocookie: true,
  },
});

const textAlign = TextAlign.configure({
  types: ["heading", "paragraph"],
});

const CodeBlockLowlightEx = CodeBlockLowlight.configure({
  lowlight: createLowlight(common),
});

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx("list-disc list-outside leading-3 -mt-2"),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx("list-decimal list-outside leading-3 -mt-2"),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx("leading-normal -mb-2"),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx("border-l-4 border-primary"),
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4,
  },
  gapcursor: false,
  codeBlock: false,
});

export const defaultExtensions: Extension[] = [
  starterKit,
  placeholder,
  textAlign,
  TextStyle as unknown as Extension,
  Color as unknown as Extension,
  Highlight.configure({ multicolor: true }) as unknown as Extension,
  Subscript as unknown as Extension,
  Superscript as unknown as Extension,
  CodeBlockLowlightEx as unknown as Extension,
  tiptapImage as unknown as Extension,
  ImageUpload as unknown as Extension,
  youtube as unknown as Extension,
  YouTubeUpload as unknown as Extension,
  taskList as unknown as Extension,
  taskItem as unknown as Extension,
  horizontalRule as unknown as Extension,
  Table as unknown as Extension,
  TableRow as unknown as Extension,
  TableCell as unknown as Extension,
  TableHeader as unknown as Extension,
  Columns as unknown as Extension,
  Column as unknown as Extension,
  CharacterCount as unknown as Extension,
  SlashCommand as unknown as Extension,
  // DragHandle as unknown as Extension,
  NodeRange as unknown as Extension,
];
