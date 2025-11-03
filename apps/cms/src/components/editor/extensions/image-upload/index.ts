import type { CommandProps } from "@tiptap/core";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageUploadView } from "./image-upload-view";

declare module "@tiptap/core" {
  // biome-ignore lint/style/useConsistentTypeDefinitions: Required for TypeScript module augmentation
  interface Commands<ReturnType> {
    imageUpload: {
      setImageUpload: (options?: { file?: File }) => ReturnType;
    };
  }
}

// Storage for pending file uploads
export const pendingUploads = new Map<string, File>();

export const ImageUpload = Node.create({
  name: "imageUpload",
  isolating: true,
  defining: true,
  group: "block",
  draggable: true,
  selectable: true,
  inline: false,

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
    return {
      setImageUpload:
        (options) =>
        ({ commands }: CommandProps) => {
          const { file } = options || {};

          if (file) {
            // Generate unique ID and store file
            const fileId = `upload-${Date.now()}-${Math.random()}`;
            pendingUploads.set(fileId, file);

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
      // Pass pendingUploads map through context
      as: "div",
    });
  },

  addStorage() {
    return {
      pendingUploads,
    };
  },
});
