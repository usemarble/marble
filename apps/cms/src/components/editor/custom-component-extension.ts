import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CustomComponentNodeView } from "./custom-component-node-view";

export interface CustomComponentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customComponent: {
      setCustomComponent: (options: {
        name: string;
        attributes?: Record<string, any>;
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
        getAttrs: (node) => {
          if (typeof node === "string") return false;
          const element = node as HTMLElement;

          const componentName = element.getAttribute("x-marble-component-name");
          if (!componentName) return false;

          const attributes: Record<string, any> = { componentName };

          for (const attr of element.attributes) {
            if (
              attr.name.startsWith("x-marble-") &&
              attr.name !== "x-marble-component-name"
            ) {
              const propName = attr.name.replace("x-marble-", "");
              attributes[propName] = attr.value;
            }
          }

          return attributes;
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { componentName, ...props } = node.attrs;

    const componentAttrs: Record<string, any> = {
      "x-marble-component-name": componentName,
      class: "marble-custom-component",
    };

    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        componentAttrs[`x-marble-${key}`] = value;
      }
    });

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
              ...options.attributes,
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
