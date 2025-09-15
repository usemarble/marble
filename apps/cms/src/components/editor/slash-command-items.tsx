import {
  CheckSquareIcon,
  CodeIcon,
  ImageIcon,
  ListIcon,
  ListNumbersIcon,
  PuzzlePieceIcon,
  QuotesIcon,
  TextAlignLeftIcon,
  TextHFourIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";
import { Command, createSuggestionItems, renderItems } from "novel/extensions";

export const suggestionItems = createSuggestionItems([
  {
    title: "Text",
    description: "Just start typing with plain text.",
    searchTerms: ["p", "paragraph"],
    icon: <TextAlignLeftIcon size={16} />,
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
    icon: <TextHTwoIcon size={16} />,
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
    icon: <TextHThreeIcon size={16} />,
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
    icon: <TextHFourIcon size={16} />,
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
    icon: <ListIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering.",
    searchTerms: ["ordered"],
    icon: <ListNumbersIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote.",
    searchTerms: ["blockquote"],
    icon: <QuotesIcon size={16} />,
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
    icon: <CodeIcon size={16} />,
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
    icon: <CheckSquareIcon size={16} />,
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
    icon: <YoutubeLogoIcon className="size-4" />,
  },
  {
    title: "Component",
    description: "Insert a custom component",
    searchTerms: ["custom", "component", "widget"],
    icon: <PuzzlePieceIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Dispatch custom event to open component selector modal
      window.dispatchEvent(new CustomEvent("openComponentSelector"));
    },
  },
]);

export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});
