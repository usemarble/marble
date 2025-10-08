import { db } from "@marble/db";
import type { JSONContent } from "novel";
import sanitize, { defaults } from "sanitize-html";

export const sanitizeHtml = (content: string) => {
  const sanitizedContent = sanitize(content, {
    allowedTags: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "code",
      "pre",
      "p",
      "li",
      "ul",
      "ol",
      "blockquote",
      "td",
      "th",
      "table",
      "tr",
      "tbody",
      "thead",
      "tfoot",
      "small",
      "div",
      "iframe",
      "input",
      "label",
    ],
    allowedAttributes: {
      ...defaults.allowedAttributes,
      "*": ["style"],
      code: ["class"],
      a: ["href", "target"],
      iframe: ["src", "allowfullscreen", "style"],
      input: ["type", "checked"],
      div: ["data-component-name", "data-technical-name", "data-id"],
    },
    allowedSchemes: ["http", "https", "ftp", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      a: ["http", "https", "ftp", "mailto"],
      iframe: ["https"],
    },
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com"],
    exclusiveFilter: (frame) => {
      if (frame.tag === "script") {
        return true;
      }
      if (frame.attribs) {
        for (const attr in frame.attribs) {
          if (/^on/i.test(attr)) {
            return true;
          }
        }
      }
      return false;
    },
    transformTags: {
      div: (tagName, attribs) => {
        const allowedDivAttribs: Record<string, string> = {};
        for (const [key, value] of Object.entries(attribs)) {
          if (
            key === "data-component-name" ||
            key === "data-technical-name" ||
            key === "data-id" ||
            key === "class" ||
            key.startsWith("x-marble-")
          ) {
            allowedDivAttribs[key] = value;
          }
        }
        return {
          tagName,
          attribs: allowedDivAttribs,
        };
      },
    },
  });

  return sanitizedContent;
};

type CustomComponentNode = {
  type: "customComponent";
  attrs: {
    componentName: string;
    technicalName?: string;
    instanceId?: string | null;
    properties: Record<string, unknown>;
  };
};

/**
 * Process custom components in content JSON to create/update component instances
 * This should be called when saving a post
 */
export async function processCustomComponents(
  contentJson: JSONContent,
  postId: string,
  workspaceId: string
): Promise<JSONContent> {
  if (!contentJson || typeof contentJson !== "object") {
    return contentJson;
  }

  // Get all custom components from the workspace
  const customComponents = await db.customComponent.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      technicalName: true,
    },
  });

  // Recursive function to process nodes
  const processNode = async (node: JSONContent): Promise<JSONContent> => {
    if (node.type === "customComponent") {
      const componentNode = node as unknown as CustomComponentNode;
      const { componentName, instanceId, properties } = componentNode.attrs;

      // Find the component definition
      const componentDef = customComponents.find(
        (c) => c.name === componentName
      );

      if (!componentDef) {
        console.warn(`Component definition not found: ${componentName}`);
        return node;
      }

      // If no instance ID, create a new instance
      if (!instanceId) {
        try {
          const instance = await db.componentInstance.create({
            data: {
              postId,
              customComponentId: componentDef.id,
              data: properties as Record<string, never>,
            },
          });

          return {
            ...node,
            attrs: {
              ...componentNode.attrs,
              instanceId: instance.id,
            },
          };
        } catch (error) {
          console.error("Error creating component instance:", error);
        }
      }
    }

    // Process children recursively
    if (node.content && Array.isArray(node.content)) {
      const processedContent = await Promise.all(
        node.content.map((child) => processNode(child))
      );
      return {
        ...node,
        content: processedContent,
      };
    }

    return node;
  };

  return processNode(contentJson);
}
