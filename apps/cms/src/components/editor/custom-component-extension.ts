import { isNodeSelection, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CustomComponentNodeView } from "./custom-component-node-view";

type Primitive = string | number | boolean | null | undefined;

export type CustomComponentOptions = {
  HTMLAttributes: Record<string, string>;
};

export type CustomComponentAttrs = {
  componentName: string;
  properties: Record<string, Primitive>;
};

declare module "@tiptap/core" {
  type Commands<ReturnType> = {
    customComponent: {
      setCustomComponent: (options: {
        name: string;
        attributes?: Record<string, Primitive>;
      }) => ReturnType;
    };
  };
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
          if (typeof element === "string") {
            return false;
          }
          const componentName = element.getAttribute("x-marble-component-name");
          if (!componentName) {
            return false;
          }
          return { componentName };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const { componentName, properties } = node.attrs as CustomComponentAttrs;

    const componentAttrs: Record<string, string> = {
      "x-marble-component-name": componentName,
      class: "marble-custom-component",
    };

    if (properties && typeof properties === "object") {
      for (const [key, value] of Object.entries(properties)) {
        const attrValue =
          value !== undefined && value !== null ? String(value) : "";
        // TODO: Add this stuff to the api later
        componentAttrs[`x-marble-${key}`] = attrValue;
      }
    }

    return ["div", componentAttrs];
  },

  addAttributes() {
    return {
      componentName: {
        default: null,
        parseHTML: (element) => element.getAttribute("x-marble-component-name"),
        renderHTML: (attributes) => {
          if (!attributes.componentName) {
            return {};
          }
          return { "x-marble-component-name": attributes.componentName };
        },
      },
      properties: {
        default: {},
        parseHTML: (element) => {
          if (typeof element === "string") {
            return {};
          }
          const properties: Record<string, string> = {};
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
        ({ state, commands }) => {
          const sel = state.selection;

          const nodeIsSelected =
            isNodeSelection(sel) &&
            state.doc.nodeAt(sel.from)?.type.name === this.name;

          const attrs = {
            componentName: options.name,
            properties: options.attributes ?? {},
          };

          if (nodeIsSelected) {
            return commands.updateAttributes(this.name, attrs);
          }

          return commands.insertContent({
            type: this.name,
            attrs,
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
