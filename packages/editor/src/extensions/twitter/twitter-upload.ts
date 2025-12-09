import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TwitterUploadView } from "./twitter-view";

/**
 * Twitter Upload Node Extension
 * Creates a placeholder node that renders the Twitter upload component
 * When a URL is submitted, it replaces itself with an actual Twitter embed
 */
export const TwitterUpload = Node.create({
  name: "twitterUpload",

  group: "block",

  atom: true,

  addNodeView() {
    return ReactNodeViewRenderer(TwitterUploadView);
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="twitter-upload"]',
      },
    ];
  },

  renderHTML() {
    return ["div", { "data-type": "twitter-upload" }];
  },
});
