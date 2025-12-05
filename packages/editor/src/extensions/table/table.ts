import { Table as TiptapTable } from "@tiptap/extension-table";
import "../../styles/table.css";

export const Table = TiptapTable.configure({
  resizable: true,
  lastColumnResizable: false,
});

export default Table;
