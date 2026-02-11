/** biome-ignore-all lint/style/useConsistentTypeDefinitions: <> */
import type { CommandProps } from "@tiptap/core";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { VideoUploadOptions } from "../../types";
import { VideoUploadView } from "./video-upload-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoUpload: {
      setVideoUpload: (options?: { file?: File }) => ReturnType;
    };
  }
}

// Storage for pending file uploads
export const pendingVideoUploads = new Map<string, File>();

export const VideoUpload = Node.create<VideoUploadOptions>({
  name: "videoUpload",
  isolating: true,
  defining: true,
  group: "block",
  draggable: true,
  selectable: true,
  inline: false,

  addOptions() {
    return {
      upload: undefined,
      accept: "video/*",
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
    return {
      setVideoUpload:
        (options) =>
        ({ commands }: CommandProps) => {
          const { file } = options || {};

          if (file) {
            // Generate unique ID and store file
            const fileId = `upload-${Date.now()}-${Math.random()}`;
            pendingVideoUploads.set(fileId, file);

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
    return ReactNodeViewRenderer(VideoUploadView, {
      as: "div",
    });
  },

  addStorage() {
    return {
      pendingUploads: pendingVideoUploads,
      options: this.options,
    };
  },
});
