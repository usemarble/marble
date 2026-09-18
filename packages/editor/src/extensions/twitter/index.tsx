/** biome-ignore-all lint/style/useConsistentTypeDefinitions: <> */
import { mergeAttributes, Node, nodePasteRule } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewRendererOptions,
} from "@tiptap/react";
import { Tweet } from "react-tweet";

/**
 * A link to a single tweet, with the status id as the first capture group.
 * Protocol, subdomain (`www.`, `mobile.`), a trailing slash, a query string
 * (`?s=20`, which is what X's share sheet hands out) and a hash are all
 * optional, and twitter.com is accepted alongside x.com.
 */
const TWEET_HOST = String.raw`\b(?:https?:\/\/)?(?:[\w-]+\.)*(?:twitter|x)\.com`;
const TWEET_PATH = String.raw`\/(?:#!\/)?[a-zA-Z0-9_]{1,15}\/status(?:es)?\/(\d+)(?:[/?#]\S*)?`;
const TWEET_URL_SOURCE = `${TWEET_HOST}${TWEET_PATH}`;

export const TWITTER_REGEX_GLOBAL = new RegExp(TWEET_URL_SOURCE, "gi");
export const TWITTER_REGEX = new RegExp(`^${TWEET_URL_SOURCE}$`, "i");

/**
 * Reads the status id out of a tweet link. Everything after the id is
 * ignored, so trailing slashes and tracking params don't produce an empty id
 * the way splitting on "/" did.
 */
export const getTweetId = (url?: string | null): string | null =>
  url?.match(TWITTER_REGEX)?.[1] ?? null;

export const isValidTwitterUrl = (url: string) => getTweetId(url) !== null;

const TweetComponent = ({
  node,
}: {
  node: Partial<ReactNodeViewRendererOptions>;
}) => {
  const tweetId = getTweetId((node?.attrs as Record<string, string>)?.src);

  if (!tweetId) {
    return null;
  }

  return (
    <NodeViewWrapper className="my-5">
      <div data-twitter="">
        <Tweet id={tweetId} />
      </div>
    </NodeViewWrapper>
  );
};

export interface TwitterOptions {
  /**
   * Controls if the paste handler for tweets should be added.
   * @default true
   * @example false
   */
  addPasteHandler: boolean;

  // biome-ignore lint/suspicious/noExplicitAny: <>
  HTMLAttributes: Record<string, any>;

  /**
   * Controls if the twitter node should be inline or not.
   * @default false
   * @example true
   */
  inline: boolean;

  /**
   * The origin of the tweet.
   * @default ''
   * @example 'https://tiptap.dev'
   */
  origin: string;
}

/**
 * The options for setting a tweet.
 */
type SetTweetOptions = { src: string };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    twitter: {
      /**
       * Insert a tweet
       * @param options The tweet attributes
       * @example editor.commands.setTweet({ src: 'https://x.com/seanpk/status/1800145949580517852' })
       */
      setTweet: (options: SetTweetOptions) => ReturnType;
    };
  }
}

/**
 * This extension adds support for tweets.
 */
export const Twitter = Node.create<TwitterOptions>({
  name: "twitter",

  addOptions() {
    return {
      addPasteHandler: true,
      HTMLAttributes: {},
      inline: false,
      origin: "",
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(TweetComponent, {
      attrs: this.options.HTMLAttributes,
    });
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? "inline" : "block";
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-src"),
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {};
          }
          return {
            "data-src": attributes.src,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-twitter]",
      },
    ];
  },

  addCommands() {
    return {
      setTweet:
        (options: SetTweetOptions) =>
        ({ commands }) => {
          if (!isValidTwitterUrl(options.src)) {
            return false;
          }

          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addPasteRules() {
    if (!this.options.addPasteHandler) {
      return [];
    }

    return [
      nodePasteRule({
        find: TWITTER_REGEX_GLOBAL,
        type: this.type,
        // match[0] is the tweet link itself; match.input is the whole pasted
        // text, which would drag surrounding prose into the src attribute.
        getAttributes: (match) => ({ src: match[0] }),
      }),
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-twitter": "" }, HTMLAttributes)];
  },
});
