/** biome-ignore-all lint/style/useConsistentTypeDefinitions: <> */
import type { CommandProps, JSONContent } from "@tiptap/core";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import type { MediaUploadOptions } from "../../types";
import { MediaUploadView } from "./media-upload-view";

interface MediaUploadInput {
  file?: File;
  pos?: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audioUpload: {
      setAudioUpload: (options?: MediaUploadInput) => ReturnType;
    };
    videoUpload: {
      setVideoUpload: (options?: MediaUploadInput) => ReturnType;
    };
  }
}

function createMediaUpload(mediaType: "audio" | "video") {
  return Node.create<MediaUploadOptions, MediaUploadStorage>({
    name: `${mediaType}Upload`,
    isolating: true,
    defining: true,
    group: "block",
    draggable: true,
    selectable: true,
    inline: false,

    addOptions() {
      return {
        upload: undefined,
        accept: `${mediaType}/*`,
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
      const extensionStorage = this.storage;
      const setMediaUpload =
        (options?: MediaUploadInput) =>
        ({ commands }: CommandProps) => {
          const { file, pos } = options || {};
          const content: JSONContent = { type: this.name };

          if (file) {
            const fileId = `upload-${Date.now()}-${Math.random()}`;
            extensionStorage.pendingUploads.set(fileId, file);
            content.attrs = { fileId };
          }

          return pos === undefined
            ? commands.insertContent(content)
            : commands.insertContentAt(pos, content);
        };
      return mediaType === "audio"
        ? { setAudioUpload: setMediaUpload }
        : { setVideoUpload: setMediaUpload };
    },

    addNodeView() {
      return ReactNodeViewRenderer(MediaUploadView, {
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
      const storage = this.storage;
      storage.pendingUploads.clear();
    },
  });
}

export const AudioUpload = createMediaUpload("audio");
export const VideoUpload = createMediaUpload("video");

export interface MediaUploadStorage {
  pendingUploads: Map<string, File>;
  options: MediaUploadOptions;
}
