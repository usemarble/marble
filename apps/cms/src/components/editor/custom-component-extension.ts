import type { CommandProps } from "@tiptap/core";
import { isNodeSelection, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CustomComponentNodeView } from "./custom-component-node-view";

type Primitive = string | number | boolean | null | undefined;

export type CustomComponentOptions = {
  HTMLAttributes: Record<string, string>;
};

export type CustomComponentAttrs = {
  componentName: string;
  technicalName?: string;
  instanceId?: string;
  properties: Record<string, Primitive>;
};

declare module "@tiptap/core" {
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: Module augmentation requires interface
  interface Commands<ReturnType> {
    customComponent: {
      setCustomComponent: (options: {
        name: string;
        technicalName?: string;
        instanceId?: string;
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
        tag: "div[data-component-name]",
        getAttrs: (element) => {
          if (typeof element === "string") {
            return false;
          }
          const componentName = element.getAttribute("data-component-name");
          const technicalName = element.getAttribute("data-technical-name");
          const instanceId = element.getAttribute("data-id");
          if (!componentName) {
            return false;
          }
          return { componentName, technicalName, instanceId };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const { componentName, technicalName, instanceId, properties } =
      node.attrs as CustomComponentAttrs;

    const componentAttrs: Record<string, string> = {
      "data-component-name": componentName,
      class: "marble-custom-component",
    };

    if (technicalName) {
      componentAttrs["data-technical-name"] = technicalName;
    }

    if (instanceId) {
      componentAttrs["data-id"] = instanceId;
    }

    if (properties && typeof properties === "object") {
      for (const [key, value] of Object.entries(properties)) {
        const attrValue =
          value !== undefined && value !== null ? String(value) : "";
        componentAttrs[`x-marble-${key}`] = attrValue;
      }
    }

    return ["div", componentAttrs];
  },

  addAttributes() {
    return {
      componentName: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-component-name"),
        renderHTML: (attributes) => {
          if (!attributes.componentName) {
            return {};
          }
          return { "data-component-name": attributes.componentName };
        },
      },
      technicalName: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-technical-name"),
        renderHTML: (attributes) => {
          if (!attributes.technicalName) {
            return {};
          }
          return { "data-technical-name": attributes.technicalName };
        },
      },
      instanceId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.instanceId) {
            return {};
          }
          return { "data-id": attributes.instanceId };
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
        (options: {
          name: string;
          technicalName?: string;
          instanceId?: string;
          attributes?: Record<string, Primitive>;
        }) =>
        ({ state, commands }: CommandProps) => {
          const sel = state.selection;

          const nodeIsSelected =
            isNodeSelection(sel) &&
            state.doc.nodeAt(sel.from)?.type.name === this.name;

          const attrs = {
            componentName: options.name,
            technicalName: options.technicalName,
            instanceId: options.instanceId,
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
