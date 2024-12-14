"use client";

import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  type JSONContent,
} from "novel";
import { handleCommandNavigation } from "novel/extensions";
import BubbleMenu from "./bubble-menu";
import { defaultExtensions } from "./extensions";
import { slashCommand, suggestionItems } from "./slash-command";

export const extensions = [...defaultExtensions, slashCommand];

interface EditorProps {
  value?: JSONContent;
  onChange: (html: string, json: JSONContent) => void;
  ref?: React.RefObject<HTMLDivElement>;
}

const Editor = ({ value, onChange }: EditorProps) => {
  return (
    <EditorRoot>
      <EditorContent
        initialContent={value}
        immediatelyRender={false}
        extensions={extensions}
        onUpdate={({ editor }) => {
          const html = editor.getHTML();
          const json = editor.getJSON();
          onChange(html, json);
        }}
        editorProps={{
          handleDOMEvents: {
            keydown: (_view, event) => handleCommandNavigation(event),
          },
          attributes: {
            class:
              "prose lg:prose-lg dark:prose-invert min-h-96 sm:px-4 focus:outline-none max-w-full",
          },
        }}
      >
        <BubbleMenu />
        <EditorCommand className="z-50 h-auto max-h-80 w-60 overflow-y-auto rounded-md border bg-background px-1 py-2 shadow-md transition-all">
          <EditorCommandEmpty className="px-2 text-muted-foreground">
            No results
          </EditorCommandEmpty>
          <EditorCommandList>
            {suggestionItems.map((item) => (
              <EditorCommandItem
                value={item.title}
                onCommand={(val) => item.command?.(val)}
                key={item.title}
                className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
              >
                <div className="flex p-1 items-center justify-center border border-muted">
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                </div>
              </EditorCommandItem>
            ))}
          </EditorCommandList>
        </EditorCommand>
      </EditorContent>
    </EditorRoot>
  );
};
export default Editor;
