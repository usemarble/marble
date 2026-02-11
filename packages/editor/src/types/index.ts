/** biome-ignore-all lint/suspicious/noExplicitAny: <expanation> */
import type { Editor, Range } from "@tiptap/core";
import type { ComponentType, SVGProps } from "react";

/**
 * Icon type that accepts Lucide icons, custom SVG components, or render functions
 */
export type EditorIcon =
  | ComponentType<SVGProps<SVGSVGElement>>
  | ComponentType<Record<string, unknown>>
  | ((props: Record<string, unknown>) => React.ReactNode);

/**
 * Suggestion item for slash command menu
 */
export interface SuggestionItem {
  title: string;
  description: string;
  icon: EditorIcon;
  searchTerms: string[];
  command: (props: { editor: Editor; range: Range }) => void;
}

/**
 * Props for editor provider component
 */
export interface EditorProviderProps {
  className?: string;
  limit?: number;
  placeholder?: string;
  children?: React.ReactNode;
  content?: string;
  extensions?: any[];
  editorProps?: Record<string, unknown>;
  onUpdate?: (props: { editor: Editor }) => void;
}

/**
 * Props for editor button components
 */
export interface EditorButtonProps {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: EditorIcon;
  hideName?: boolean;
}

/**
 * Props for slash command menu component
 */
export interface EditorSlashMenuProps {
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
  editor: Editor;
  range: Range;
}

/**
 * Slash node attributes type
 */
export interface SlashNodeAttrs {
  id: string | null;
  label?: string | null;
}

/**
 * Media item type for image upload extension
 */
export interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: "image" | "video" | "file";
}

/**
 * Paginated media response
 */
export interface MediaPage {
  media: MediaItem[];
  nextCursor?: string;
}

/**
 * Image upload extension options
 */
export interface ImageUploadOptions {
  /** Upload handler function - required for upload functionality */
  upload?: (file: File) => Promise<string>;
  /** File accept types (default: 'image/*') */
  accept?: string;
  /** Max file size in bytes */
  maxSize?: number;
  /** Max number of files */
  limit?: number;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Pre-loaded media library items */
  media?: MediaItem[];
  /** Fetch media with pagination - takes optional cursor, returns page with media and next cursor */
  fetchMediaPage?: (cursor?: string) => Promise<MediaPage>;
}

/**
 * Video upload extension options
 */
export interface VideoUploadOptions {
  /** Upload handler function - required for upload functionality */
  upload?: (file: File) => Promise<string>;
  /** File accept types (default: 'video/*') */
  accept?: string;
  /** Max file size in bytes */
  maxSize?: number;
  /** Max number of files */
  limit?: number;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Pre-loaded media library items */
  media?: MediaItem[];
  /** Fetch media with pagination - takes optional cursor, returns page with media and next cursor */
  fetchMediaPage?: (cursor?: string) => Promise<MediaPage>;
}
