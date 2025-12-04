import { cn } from "@marble/ui/lib/utils";
import { Color } from "@tiptap/extension-color";
import { FileHandler } from "@tiptap/extension-file-handler";
import { Highlight } from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import { Youtube } from "@tiptap/extension-youtube";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { CodeBlock } from "./code-block";
import { Figure } from "./figure";
import { ImageUpload } from "./image-upload";
import { MarkdownInput } from "./markdown-input";
import { configureSlashCommand } from "./slash-command";
import { Table, TableCell, TableHeader, TableRow } from "./table";
import { Twitter } from "./twitter/index";
import { TwitterUpload } from "./twitter/twitter-upload";
import { YouTubeUpload } from "./youtube/youtube-upload";
import "../styles/task-list.css";

/**
 * Extension kit configuration options
 */
export type ExtensionKitOptions = {
  /** Character limit for the editor */
  limit?: number;
  /** Placeholder text for empty editor */
  placeholder?: string;
};

/**
 * Extension Kit
 * Bundles all editor extensions with default configurations
 */
export const ExtensionKit = ({
  limit,
  placeholder,
}: ExtensionKitOptions = {}) => [
  // Markdown extension for parsing and serializing markdown
  Markdown,

  // StarterKit with customizations
  StarterKit.configure({
    codeBlock: false, // Using custom CodeBlock with syntax highlighting
    bulletList: {
      HTMLAttributes: {
        class: cn("list-outside list-disc pl-4"),
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: cn("list-outside list-decimal pl-4"),
      },
    },
    listItem: {
      HTMLAttributes: {
        class: cn("leading-normal"),
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: cn("border-l border-l-2 pl-2"),
      },
    },
    code: {
      HTMLAttributes: {
        class: cn("rounded-md bg-muted px-1.5 py-1 font-medium font-mono"),
        spellcheck: "false",
      },
    },
    horizontalRule: {
      HTMLAttributes: {
        class: cn("mt-4 mb-6 border-muted-foreground border-t"),
      },
    },
    dropcursor: {
      color: "var(--border)",
      width: 4,
    },
  }),

  // Typography for smart quotes, dashes, etc.
  Typography,

  // Placeholder
  Placeholder.configure({
    placeholder: ({ editor }) => {
      if (!editor) {
        return placeholder ?? "";
      }

      // Hide placeholder inside tables, blockquotes, code blocks, and lists
      if (
        editor.isActive("table") ||
        editor.isActive("tableCell") ||
        editor.isActive("tableHeader") ||
        editor.isActive("blockquote") ||
        editor.isActive("codeBlock") ||
        editor.isActive("bulletList") ||
        editor.isActive("orderedList") ||
        editor.isActive("taskList") ||
        editor.isActive("listItem") ||
        editor.isActive("taskItem")
      ) {
        return "";
      }

      return placeholder ?? "";
    },
    emptyEditorClass:
      "before:text-muted-foreground before:content-[attr(data-placeholder)] before:float-left before:h-0 before:pointer-events-none",
  }),

  // Character count
  CharacterCount.configure({
    limit,
  }),

  // Code block with syntax highlighting
  CodeBlock,

  // Subscript and superscript
  Superscript,
  Subscript,

  // Slash command
  configureSlashCommand(),

  // Table extensions
  Table,
  TableRow,
  TableCell,
  TableHeader,

  // YouTube
  Youtube.configure({
    controls: true,
    nocookie: false,
  }),

  // YouTube Upload (placeholder node for YouTube upload component)
  YouTubeUpload,

  // Twitter
  Twitter.configure({
    addPasteHandler: true,
    inline: false,
  }),

  // Twitter Upload (placeholder node for Twitter upload component)
  TwitterUpload,

  // Figure (image with caption support)
  Figure,

  // Image Upload (placeholder node for image upload component)
  // Note: Will be unconfigured by default, CMS app should pass configured version
  ImageUpload,

  // File Handler for drag-and-drop and paste image uploads
  FileHandler.configure({
    allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
    onDrop: (currentEditor, files, _pos) => {
      for (const file of files) {
        // Insert imageUpload node at drop position with the file
        currentEditor.chain().focus().setImageUpload({ file }).run();
      }
    },
    onPaste: (currentEditor, files) => {
      for (const file of files) {
        // Insert imageUpload node at cursor with the file
        currentEditor.chain().focus().setImageUpload({ file }).run();
      }
    },
  }),

  // Task list
  TaskList.configure({
    HTMLAttributes: {
      class: "list-none p-0",
    },
  }),
  TaskItem.configure({
    nested: true,
    HTMLAttributes: {
      class: "flex",
    },
  }),

  // Text styling kit (Tiptap v3)
  TextStyleKit,

  // Color extension for text color
  Color,

  // Highlight extension for text highlighting
  Highlight.configure({ multicolor: true }),

  // Markdown input handling (paste and file drop)
  MarkdownInput,
];

export default ExtensionKit;
