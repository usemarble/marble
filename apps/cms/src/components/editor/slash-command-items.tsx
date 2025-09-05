import {
  CheckSquare,
  Code,
  Image as ImageIcon,
  List,
  ListNumbers,
  Quotes,
  TextAlignLeft,
  TextHFour,
  TextHThree,
  TextHTwo,
  YoutubeLogo,
  PuzzlePieceIcon,
} from "@phosphor-icons/react";
import { Command, createSuggestionItems, renderItems } from "novel/extensions";

export const suggestionItems = createSuggestionItems([
  {
    title: "Text",
    description: "Just start typing with plain text.",
    searchTerms: ["p", "paragraph"],
    icon: <TextAlignLeft size={16} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode("paragraph", "paragraph")
        .run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading.",
    searchTerms: ["subtitle", "medium"],
    icon: <TextHTwo size={16} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading.",
    searchTerms: ["subtitle", "small"],
    icon: <TextHThree size={16} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run();
    },
  },
  {
    title: "Heading 4",
    description: "Small section heading.",
    searchTerms: ["subtitle", "small"],
    icon: <TextHFour size={16} />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 4 })
        .run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list.",
    searchTerms: ["unordered", "point"],
    icon: <List size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering.",
    searchTerms: ["ordered"],
    icon: <ListNumbers size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote.",
    searchTerms: ["blockquote"],
    icon: <Quotes size={16} />,
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode("paragraph", "paragraph")
        .toggleBlockquote()
        .run(),
  },
  {
    title: "Code Block",
    description: "Capture code snippets.",
    searchTerms: ["code", "block"],
    icon: <Code size={16} />,
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode("codeBlock", "codeBlock")
        .run(),
  },
  {
    title: "To-do List",
    description: "Track tasks with a to-do list.",
    searchTerms: ["todo", "task", "list", "check", "checkbox"],
    icon: <CheckSquare size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Image",
    description: "Upload an image from your device.",
    searchTerms: ["photo", "picture", "media"],
    icon: <ImageIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // upload image
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0];
          const pos = editor.view.state.selection.from;
          // if (file) uploadFile(file, editor.view, pos);
        }
      };
      input.click();
    },
  },
  {
    title: "YouTube",
    description: "Embed a YouTube video",
    icon: <YoutubeLogo className="size-4" />,
  },
  {
    title: "Component",
    description: "Insert a custom component",
    searchTerms: ["custom", "component", "widget"],
    icon: <PuzzlePieceIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
    },
  },
]);

export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});
