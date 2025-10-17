import {
  CheckSquareIcon,
  CodeIcon,
  ImageIcon,
  ListIcon,
  ListNumbersIcon,
  QuotesIcon,
  TextAlignLeftIcon,
  TextHFourIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";
import type { SlashCommandItem } from "./menu";

export const slashCommandItems: SlashCommandItem[] = [
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
    searchTerms: ["subtitle", "medium", "h2"],
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
    searchTerms: ["subtitle", "small", "h3"],
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
    description: "Tiny section heading.",
    searchTerms: ["subtitle", "tiny", "h4"],
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
    searchTerms: ["unordered", "point", "ul"],
    icon: <ListIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering.",
    searchTerms: ["ordered", "ol"],
    icon: <ListNumbersIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote.",
    searchTerms: ["blockquote", "citation"],
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
    searchTerms: ["code", "block", "pre"],
    icon: <CodeIcon size={16} />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
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
    searchTerms: ["photo", "picture", "media", "img"],
    icon: <ImageIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setImageUpload().run();
    },
  },
  {
    title: "YouTube",
    description: "Embed a YouTube video",
    searchTerms: ["video", "embed", "yt"],
    icon: <YoutubeLogoIcon size={16} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setYoutubeUpload().run();
    },
  },
];

// Filter items based on query
export function filterItems(items: SlashCommandItem[], query: string) {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(normalizedQuery);
    const descriptionMatch = item.description
      ?.toLowerCase()
      .includes(normalizedQuery);
    const searchTermsMatch = item.searchTerms?.some((term) =>
      term.toLowerCase().includes(normalizedQuery)
    );

    return titleMatch || descriptionMatch || searchTermsMatch;
  });
}
