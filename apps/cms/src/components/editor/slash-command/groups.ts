import {
  BookOpen,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Table,
  Type,
  Youtube,
} from "lucide-react";
import type { Group } from "./types";

export const GROUPS: Group[] = [
  {
    name: "format",
    title: "Format",
    commands: [
      {
        name: "text",
        label: "Text",
        description: "Just start typing with plain text.",
        aliases: ["p", "paragraph"],
        icon: Type,
        action: (editor) => {
          editor.chain().focus().toggleNode("paragraph", "paragraph").run();
        },
      },
      {
        name: "heading1",
        label: "Heading 1",
        description: "High priority section title",
        aliases: ["h1"],
        icon: Heading1,
        action: (editor) => {
          editor.chain().focus().setNode("heading", { level: 1 }).run();
        },
      },
      {
        name: "heading2",
        label: "Heading 2",
        description: "Medium priority section title",
        aliases: ["h2"],
        icon: Heading2,
        action: (editor) => {
          editor.chain().focus().setNode("heading", { level: 2 }).run();
        },
      },
      {
        name: "heading3",
        label: "Heading 3",
        description: "Low priority section title",
        aliases: ["h3"],
        icon: Heading3,
        action: (editor) => {
          editor.chain().focus().setNode("heading", { level: 3 }).run();
        },
      },
      {
        name: "bulletList",
        label: "Bullet List",
        description: "Unordered list of items",
        aliases: ["ul"],
        icon: List,
        action: (editor) => {
          editor.chain().focus().toggleBulletList().run();
        },
      },
      {
        name: "numberedList",
        label: "Numbered List",
        description: "Ordered list of items",
        aliases: ["ol"],
        icon: ListOrdered,
        action: (editor) => {
          editor.chain().focus().toggleOrderedList().run();
        },
      },
      {
        name: "taskList",
        label: "Task List",
        description: "Task list with todo items",
        aliases: ["todo", "checklist"],
        icon: ListTodo,
        action: (editor) => {
          editor.chain().focus().toggleTaskList().run();
        },
      },
      {
        name: "blockquote",
        label: "Blockquote",
        description: "Element for quoting",
        aliases: ["quote"],
        icon: Quote,
        action: (editor) => {
          editor.chain().focus().toggleBlockquote().run();
        },
      },
      {
        name: "codeBlock",
        label: "Code Block",
        description: "Code block with syntax highlighting",
        aliases: ["code"],
        icon: Code,
        action: (editor) => {
          editor.chain().focus().toggleCodeBlock().run();
        },
      },
    ],
  },
  {
    name: "insert",
    title: "Insert",
    commands: [
      // Table extension not yet configured
      // {
      //   name: "table",
      //   label: "Table",
      //   description: "Insert a table",
      //   icon: Table,
      //   action: (editor) => {
      //     editor
      //       .chain()
      //       .focus()
      //       .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
      //       .run();
      //   },
      // },
      {
        name: "image",
        label: "Image",
        description: "Upload an image from your device",
        aliases: ["img", "photo", "picture", "media"],
        icon: Image,
        action: (editor) => {
          editor.chain().focus().setImageUpload().run();
        },
      },
      {
        name: "youtube",
        label: "YouTube",
        description: "Embed a YouTube video",
        aliases: ["video", "yt"],
        icon: Youtube,
        action: (editor) => {
          editor.chain().focus().setYoutubeUpload().run();
        },
      },
      {
        name: "horizontalRule",
        label: "Horizontal Rule",
        description: "Insert a horizontal divider",
        aliases: ["hr", "divider"],
        icon: Minus,
        action: (editor) => {
          editor.chain().focus().setHorizontalRule().run();
        },
      },
    ],
  },
];

export default GROUPS;
