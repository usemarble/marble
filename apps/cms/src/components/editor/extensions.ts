import type { Extension } from "@tiptap/core";
import TextAlign from "@tiptap/extension-text-align";
import { cx } from "class-variance-authority";
import { common, createLowlight } from "lowlight";
import {
  CodeBlockLowlight,
  HorizontalRule,
  Placeholder,
  StarterKit,
  TaskItem,
  TaskList,
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  Youtube,
} from "novel/extensions";
import { UploadImagesPlugin } from "novel/plugins";

// You can overwrite the placeholder with your own configuration
const placeholder = Placeholder;

const tiptapImage = TiptapImage.extend({
  addProseMirrorPlugins() {
    return [
      UploadImagesPlugin({
        imageClass: cx("opacity-40 rounded-lg border border-stone-200"),
      }),
    ];
  },
}).configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx("rounded-md border border-muted"),
  },
});
const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: cx(
      "text-muted-foreground underline underline-offset-[3px] hover:text-primary transition-colors cursor-pointer"
    ),
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

const underline = TiptapUnderline.configure({
  HTMLAttributes: {
    class: cx("underline"),
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
  // UpdatedImage as unknown as Extension,
  youtube as unknown as Extension,
  tiptapLink as unknown as Extension,
  taskList as unknown as Extension,
  taskItem as unknown as Extension,
  horizontalRule as unknown as Extension,
  underline as unknown as Extension,
  tiptapImage as unknown as Extension,
];
