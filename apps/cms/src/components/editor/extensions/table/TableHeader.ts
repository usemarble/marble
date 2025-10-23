import { TableHeader as TiptapTableHeader } from "@tiptap/extension-table";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { getCellsInRow, isColumnSelected, selectColumn } from "./utils";

export const TableHeader = TiptapTableHeader.extend({
  addAttributes() {
    return {
      colspan: {
        default: 1,
      },
      rowspan: {
        default: 1,
      },
      colwidth: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const colwidth = element.getAttribute("colwidth");
          const value = colwidth
            ? colwidth.split(",").map((item: string) => Number.parseInt(item, 10))
            : null;

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
            const cells = getCellsInRow(0)(selection);

            if (cells) {
              for (const { pos } of cells) {
                decorations.push(
                  Decoration.widget(pos + 1, () => {
                    const colSelected = isColumnSelected(
                      cells.indexOf({ pos } as never)
                    )(selection);
                    let className = "grip-column";

                    if (colSelected) {
                      className += " selected";
                    }

                    if (cells.indexOf({ pos } as never) === 0) {
                      className += " first";
                    }

                    if (cells.indexOf({ pos } as never) === cells.length - 1) {
                      className += " last";
                    }

                    const grip = document.createElement("a");

                    grip.className = className;
                    grip.addEventListener("mousedown", (event) => {
                      event.preventDefault();
                      event.stopImmediatePropagation();

                      this.editor.view.dispatch(
                        selectColumn(cells.indexOf({ pos } as never))(
                          this.editor.state.tr
                        )
                      );
                    });

                    return grip;
                  })
                );
              }
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});

export default TableHeader;
