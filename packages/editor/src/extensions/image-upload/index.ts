/** biome-ignore-all lint/style/useConsistentTypeDefinitions: <> */
import type { CommandProps } from "@tiptap/core";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { ImageUploadOptions } from "../../types";
import { ImageUploadView } from "./image-upload-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageUpload: {
      setImageUpload: (options?: { file?: File }) => ReturnType;
    };
  }
}

export const ImageUpload = Node.create<ImageUploadOptions>({
  name: "imageUpload",
  isolating: true,
  defining: true,
  group: "block",
  draggable: true,
  selectable: true,
  inline: false,

  addOptions() {
    return {
      upload: undefined,
      accept: "image/*",
      maxSize: undefined,
      limit: undefined,
      onError: undefined,
      media: undefined,
      fetchMediaPage: undefined,
    };
  },

  addAttributes() {
    return {
      fileId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-file-id"),
        renderHTML: (attributes) => {
          if (!attributes.fileId) {
            return {};
          }
          return {
            "data-file-id": attributes.fileId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { "data-type": this.name, ...HTMLAttributes }];
  },

  addCommands() {
    const extensionStorage = this.storage as ImageUploadStorage;
    return {
      setImageUpload:
        (options) =>
        ({ commands }: CommandProps) => {
          const { file } = options || {};

          if (file) {
            const fileId = `upload-${Date.now()}-${Math.random()}`;
            extensionStorage.pendingUploads.set(fileId, file);

            return commands.insertContent({
              type: this.name,
              attrs: { fileId },
            });
          }

          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadView, {
      as: "div",
    });
  },

  addStorage() {
    return {
      pendingUploads: new Map<string, File>(),
      options: this.options,
    };
  },

  onDestroy() {
    const storage = this.storage as ImageUploadStorage;
    storage.pendingUploads.clear();
  },
});

export interface ImageUploadStorage {
  pendingUploads: Map<string, File>;
  options: ImageUploadOptions;
}
