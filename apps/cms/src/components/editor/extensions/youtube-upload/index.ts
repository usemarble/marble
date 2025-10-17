import type { CommandProps } from "@tiptap/core";
import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { YouTubeUploadView } from "./youtube-upload-view";

declare module "@tiptap/core" {
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: Required for TypeScript module augmentation
  interface Commands<ReturnType> {
    youtubeUpload: {
      setYoutubeUpload: () => ReturnType;
    };
  }
}

export const YouTubeUpload = Node.create({
  name: "youtubeUpload",
  isolating: true,
  defining: true,
  group: "block",
  draggable: true,
  selectable: true,
  inline: false,

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML() {
    return ["div", { "data-type": this.name }];
  },

  addCommands() {
    return {
      setYoutubeUpload:
        () =>
        ({ commands }: CommandProps) =>
          commands.insertContent(`<div data-type="${this.name}"></div>`),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeUploadView);
  },
});
