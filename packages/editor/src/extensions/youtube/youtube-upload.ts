import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { YouTubeUploadView } from "./youtube-view";

/**
 * YouTube Upload Node Extension
 * Creates a placeholder node that renders the YouTube upload component
 * When a URL is submitted, it replaces itself with an actual YouTube embed
 */
export const YouTubeUpload = Node.create({
  name: "youtubeUpload",

  group: "block",

  atom: true,

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeUploadView);
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="youtube-upload"]',
      },
    ];
  },

  renderHTML() {
    return ["div", { "data-type": "youtube-upload" }];
  },
});
