import type { Extension } from "@tiptap/core";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import TextAlign from "@tiptap/extension-text-align";
import { Youtube } from "@tiptap/extension-youtube";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";
import { cx } from "class-variance-authority";
import { common, createLowlight } from "lowlight";

// You can overwrite the placeholder with your own configuration
const placeholder = Placeholder;

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
  CodeBlockLowlightEx as unknown as Extension,
  tiptapImage as unknown as Extension,
  youtube as unknown as Extension,
  taskList as unknown as Extension,
  taskItem as unknown as Extension,
  horizontalRule as unknown as Extension,
  CharacterCount as unknown as Extension,
];
