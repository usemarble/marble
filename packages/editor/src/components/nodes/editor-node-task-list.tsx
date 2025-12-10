import { useCurrentEditor } from "@tiptap/react";
import { CheckSquareIcon } from "lucide-react";
import type { EditorButtonProps } from "../../types";
import { BubbleMenuButton } from "../ui/editor-button";

export type EditorNodeTaskListProps = Pick<EditorButtonProps, "hideName">;

/**
 * Task List Node Button
 *
 * Button to toggle the current selection to a task list (to-do list with checkboxes).
 * Active when the selection is within a task list item.
 *
 * @example
 * ```tsx
 * <EditorNodeTaskList />
 * <EditorNodeTaskList hideName />
 * ```
 */
export const EditorNodeTaskList = ({
  hideName = false,
}: EditorNodeTaskListProps) => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenuButton
      command={() =>
        editor.chain().focus().toggleList("taskList", "taskItem").run()
      }
      hideName={hideName}
      icon={CheckSquareIcon}
      isActive={() => editor.isActive("taskItem") ?? false}
      name="To-do List"
    />
  );
};
