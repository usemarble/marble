import { mergeAttributes, Node } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { getCellsInColumn, isRowSelected, selectRow } from "./utils";

export type TableCellOptions = {
  HTMLAttributes: Record<string, unknown>;
};

export const TableCell = Node.create<TableCellOptions>({
  name: "tableCell",

  content: "block+",

  tableRole: "cell",

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "td",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addAttributes() {
    return {
      colspan: {
        default: 1,
        parseHTML: (element) => {
          const colspan = element.getAttribute("colspan");
          const value = colspan ? Number.parseInt(colspan, 10) : 1;

          return value;
        },
      },
      rowspan: {
        default: 1,
        parseHTML: (element) => {
          const rowspan = element.getAttribute("rowspan");
          const value = rowspan ? Number.parseInt(rowspan, 10) : 1;

          return value;
        },
      },
      colwidth: {
        default: null,
        parseHTML: (element) => {
          const colwidth = element.getAttribute("colwidth");
          const value = colwidth ? [Number.parseInt(colwidth, 10)] : null;

          return value;
        },
      },
      style: {
        default: null,
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            const { isEditable } = this.editor;

            if (!isEditable) {
              return DecorationSet.empty;
            }

            const { doc, selection } = state;
            const decorations: Decoration[] = [];
            const cells = getCellsInColumn(0)(selection);

            if (cells) {
              let index = 0;
              for (const { pos } of cells) {
                const currentIndex = index;
                decorations.push(
                  Decoration.widget(pos + 1, () => {
                    const rowSelected = isRowSelected(currentIndex)(selection);
                    let className = "grip-row";

                    if (rowSelected) {
                      className += " selected";
                    }

                    if (currentIndex === 0) {
                      className += " first";
                    }

                    if (currentIndex === cells.length - 1) {
                      className += " last";
                    }

                    const grip = document.createElement("a");

                    grip.className = className;
                    grip.addEventListener("mousedown", (event) => {
                      event.preventDefault();
                      event.stopImmediatePropagation();

                      this.editor.view.dispatch(
                        selectRow(currentIndex)(this.editor.state.tr)
                      );
                    });

                    return grip;
                  })
                );
                index++;
              }
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
