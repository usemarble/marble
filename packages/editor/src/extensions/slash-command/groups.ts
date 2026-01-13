import {
  CheckSquare,
  Code,
  Image,
  ListBullets,
  ListNumbers,
  Quotes,
  Table,
  TextAlignLeft,
  TextHOne,
  TextHThree,
  TextHTwo,
} from "@phosphor-icons/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { Twitter } from "../../components/icons/twitter";
import { YouTubeIcon } from "../../components/icons/youtube";
import type { SuggestionItem } from "../../types";

/**
 * Default slash command suggestions
 * These are the commands that appear when typing "/" in the editor
 */
export const defaultSlashSuggestions: SuggestionOptions<SuggestionItem>["items"] =
  () => [
    {
      title: "Text",
      description: "Just start typing with plain text.",
      searchTerms: ["p", "paragraph"],
      icon: TextAlignLeft,
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
      title: "To-do List",
      description: "Track tasks with a to-do list.",
      searchTerms: ["todo", "task", "list", "check", "checkbox"],
      icon: CheckSquare,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleList("taskList", "taskItem")
          .run();
      },
    },
    {
      title: "Heading 1",
      description: "Use for main page title.",
      searchTerms: ["title", "big", "large"],
      icon: TextHOne,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Heading 2",
      description: "Use for section headings.",
      searchTerms: ["subtitle", "medium"],
      icon: TextHTwo,
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
      description: "Use for sub-section headings.",
      searchTerms: ["subtitle", "small"],
      icon: TextHThree,
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
      title: "Bullet List",
      description: "Create a simple bullet list.",
      searchTerms: ["unordered", "point"],
      icon: ListBullets,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered List",
      description: "Create a list with numbering.",
      searchTerms: ["ordered"],
      icon: ListNumbers,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Quote",
      description: "Capture a quote.",
      searchTerms: ["blockquote"],
      icon: Quotes,
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
      title: "Code",
      description: "Capture a code snippet.",
      searchTerms: ["codeblock"],
      icon: Code,
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: "Table",
      description: "Add a table view to organize data.",
      searchTerms: ["table"],
      icon: Table,
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      title: "YouTube",
      description: "Embed a YouTube video.",
      searchTerms: ["youtube", "video", "embed"],
      icon: YouTubeIcon,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "youtubeUpload",
          })
          .run();
      },
    },
    {
      title: "Twitter",
      description: "Embed a Tweet.",
      searchTerms: ["twitter", "tweet", "x"],
      icon: Twitter,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "twitterUpload",
          })
          .run();
      },
    },
    {
      title: "Image",
      description: "Upload or embed an image.",
      searchTerms: ["image", "picture", "photo", "img"],
      icon: Image,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "imageUpload",
          })
          .run();
      },
    },
  ];
