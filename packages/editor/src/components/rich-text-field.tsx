"use client";

import { Button } from "@marble/ui/components/button";
import { cn } from "@marble/ui/lib/utils";
import {
  ListBulletsIcon,
  ListNumbersIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@phosphor-icons/react";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export interface FieldRichTextEditorProps {
  disabled?: boolean;
  id?: string;
  labelId?: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

function ToolbarButton({
  active,
  disabled,
  icon: Icon,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <Button
      className={cn(
        "h-8 w-8 p-0 text-muted-foreground shadow-none",
        active && "bg-muted text-foreground"
      )}
      disabled={disabled}
      onClick={onClick}
      size="icon"
      type="button"
      variant="ghost"
    >
      <Icon className="size-4" />
    </Button>
  );
}

export function FieldRichTextEditor({
  disabled,
  id,
  labelId,
  onBlur,
  onChange,
  placeholder = "Write something...",
  value,
}: FieldRichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    content: value || "<p></p>",
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
        dropcursor: false,
        gapcursor: false,
        heading: false,
        horizontalRule: false,
      }),
      TextStyleKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (
            node.type.name === "bulletList" ||
            node.type.name === "orderedList" ||
            node.type.name === "listItem"
          ) {
            return "";
          }

          return placeholder;
        },
        emptyEditorClass:
          "field-rich-text-placeholder before:content-[attr(data-placeholder)]",
        emptyNodeClass:
          "field-rich-text-placeholder before:content-[attr(data-placeholder)]",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] px-3 py-3 text-sm leading-6 text-foreground caret-foreground focus:outline-hidden [&_.field-rich-text-placeholder::before]:pointer-events-none [&_.field-rich-text-placeholder::before]:float-left [&_.field-rich-text-placeholder::before]:h-0 [&_.field-rich-text-placeholder::before]:text-muted-foreground [&_.field-rich-text-placeholder::before]:leading-6 [&_li_.field-rich-text-placeholder::before]:content-none [&_ol]:my-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:m-0 [&_strong]:text-foreground [&_u]:text-foreground [&_ul]:my-0 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_li_p]:m-0",
        ...(id ? { id } : {}),
        ...(labelId ? { "aria-labelledby": labelId } : {}),
      },
    },
    onBlur: () => {
      onBlur?.();
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextValue = value || "<p></p>";
    if (editor.getHTML() === nextValue) {
      return;
    }

    editor.commands.setContent(nextValue, {
      emitUpdate: false,
    });
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-md border bg-editor-field">
      <div className="flex items-center gap-1 border-b px-2 py-1">
        <ToolbarButton
          active={editor.isActive("bold")}
          disabled={disabled}
          icon={TextBIcon}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          active={editor.isActive("italic")}
          disabled={disabled}
          icon={TextItalicIcon}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          active={editor.isActive("underline")}
          disabled={disabled}
          icon={TextUnderlineIcon}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <div className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          disabled={disabled}
          icon={ListBulletsIcon}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          active={editor.isActive("orderedList")}
          disabled={disabled}
          icon={ListNumbersIcon}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
      </div>
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
