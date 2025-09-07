import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CustomComponentNodeView } from "./custom-component-node-view";

type Primitive = string | number | boolean | null | undefined;

export interface CustomComponentOptions {
  HTMLAttributes: Record<string, string>;
}

export interface CustomComponentAttrs {
  componentName: string;
  properties: Record<string, Primitive>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customComponent: {
      setCustomComponent: (options: {
        name: string;
        attributes?: Record<string, Primitive>;
      }) => ReturnType;
    };
  }
}

export const CustomComponent = Node.create<CustomComponentOptions>({
  name: "customComponent",

  priority: 1000,

  group: "block",

  defining: true,

  selectable: true,

  draggable: true,

  isolating: true,

  atom: true,

  parseHTML() {
    return [
      {
        tag: "div[x-marble-component-name]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;

          const componentName = element.getAttribute("x-marble-component-name");
          if (!componentName) return false;

          return {
            componentName,
            // properties will be parsed by the properties attribute definition
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const { componentName, properties } = node.attrs;

    const componentAttrs: Record<string, string> = {
      "x-marble-component-name": componentName,
      class: "marble-custom-component",
    };

    // Render all properties as x-marble- prefixed attributes
    if (properties && typeof properties === "object") {
      Object.entries(properties).forEach(([key, value]) => {
        const attrValue =
          value !== undefined && value !== null ? String(value) : "";
        componentAttrs[`x-marble-${key}`] = attrValue;
      });
    }

    return ["div", componentAttrs];
  },

  addAttributes() {
    return {
      componentName: {
        default: null,
        parseHTML: (element) => element.getAttribute("x-marble-component-name"),
        renderHTML: (attributes) => {
          if (!attributes.componentName) return {};
          return { "x-marble-component-name": attributes.componentName };
        },
      },
      properties: {
        default: {},
        parseHTML: (element) => {
          if (typeof element === "string") return {};

          const properties: Record<string, string> = {};

          // Parse all x-marble- prefixed attributes except component-name
          for (const attr of element.attributes) {
            if (
              attr.name.startsWith("x-marble-") &&
              attr.name !== "x-marble-component-name"
            ) {
              const propName = attr.name.replace("x-marble-", "");
              properties[propName] = attr.value || "";
            }
          }

          return properties;
        },
        renderHTML: () => {
          // Properties are handled in renderHTML method above
          return {};
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomComponentNodeView);
  },

  addCommands() {
    return {
      setCustomComponent:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              componentName: options.name,
              properties: options.attributes || {},
            },
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-c": () => {
        return true;
      },
    };
  },
});
