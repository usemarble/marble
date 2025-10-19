"use client";

import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { cn } from "@marble/ui/lib/utils";
import type { Editor } from "@tiptap/core";
import { useCurrentEditor, useEditorState } from "@tiptap/react";
import {
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Pilcrow,
} from "lucide-react";
import type { FC } from "react";
import { useFloatingPortalContainer } from "./floating-portal-context";

type ContentTypeOption = {
  label: string;
  id: string;
  type: "option";
  disabled: (editor: Editor) => boolean;
  isActive: (editor: Editor) => boolean;
  onClick: (editor: Editor) => void;
  icon: typeof Pilcrow;
};

type ContentTypeCategory = {
  label: string;
  id: string;
  type: "category";
};

type ContentPickerOption = ContentTypeOption | ContentTypeCategory;

const CONTENT_TYPES: ContentPickerOption[] = [
  {
    type: "category",
    label: "Hierarchy",
    id: "hierarchy",
  },
  {
    icon: Pilcrow,
    onClick: (editor) =>
      editor
        .chain()
        .focus()
        .lift("taskItem")
        .liftListItem("listItem")
        .setParagraph()
        .run(),
    id: "paragraph",
    disabled: (editor) => !editor.can().setParagraph(),
    isActive: (editor) =>
      editor.isActive("paragraph") &&
      !editor.isActive("orderedList") &&
      !editor.isActive("bulletList") &&
      !editor.isActive("taskList"),
    label: "Paragraph",
    type: "option",
  },
  {
    icon: Heading1,
    onClick: (editor) =>
      editor
        .chain()
        .focus()
        .lift("taskItem")
        .liftListItem("listItem")
        .setHeading({ level: 1 })
        .run(),
    id: "heading1",
    disabled: (editor) => !editor.can().setHeading({ level: 1 }),
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    label: "Heading 1",
    type: "option",
  },
  {
    icon: Heading2,
    onClick: (editor) =>
      editor
        .chain()
        .focus()
        .lift("taskItem")
        .liftListItem("listItem")
        .setHeading({ level: 2 })
        .run(),
    id: "heading2",
    disabled: (editor) => !editor.can().setHeading({ level: 2 }),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    label: "Heading 2",
    type: "option",
  },
  {
    icon: Heading3,
    onClick: (editor) =>
      editor
        .chain()
        .focus()
        .lift("taskItem")
        .liftListItem("listItem")
        .setHeading({ level: 3 })
        .run(),
    id: "heading3",
    disabled: (editor) => !editor.can().setHeading({ level: 3 }),
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    label: "Heading 3",
    type: "option",
  },
  {
    type: "category",
    label: "Lists",
    id: "lists",
  },
  {
    icon: List,
    onClick: (editor) => editor.chain().focus().toggleBulletList().run(),
    id: "bulletList",
    disabled: (editor) => !editor.can().toggleBulletList(),
    isActive: (editor) => editor.isActive("bulletList"),
    label: "Bullet list",
    type: "option",
  },
  {
    icon: ListOrdered,
    onClick: (editor) => editor.chain().focus().toggleOrderedList().run(),
    id: "orderedList",
    disabled: (editor) => !editor.can().toggleOrderedList(),
    isActive: (editor) => editor.isActive("orderedList"),
    label: "Numbered list",
    type: "option",
  },
  {
    icon: ListTodo,
    onClick: (editor) => editor.chain().focus().toggleTaskList().run(),
    id: "todoList",
    disabled: (editor) => !editor.can().toggleTaskList(),
    isActive: (editor) => editor.isActive("taskList"),
    label: "Todo list",
    type: "option",
  },
];

function ContentTypePickerComponent() {
  const { editor } = useCurrentEditor();
  const portalContainer = useFloatingPortalContainer();

  const activeItem = useEditorState({
    editor: editor as Editor,
    selector: (ctx) => {
      return CONTENT_TYPES.find(
        (option) => option.type === "option" && option.isActive(ctx.editor)
      ) as ContentTypeOption | undefined;
    },
  });

  if (!editor) {
    return null;
  }

  const ActiveIcon = activeItem?.icon || Pilcrow;
  const isActive = activeItem?.id !== "paragraph" && !!activeItem;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            "gap-1",
            isActive && "bg-emerald-500/10 text-emerald-500"
          )}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ActiveIcon className="size-4" />
          <ChevronDown className="size-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48"
        container={portalContainer}
      >
        {CONTENT_TYPES.map((option) => {
          if (option.type === "category") {
            return (
              <div key={option.id}>
                {option.id !== "hierarchy" && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="font-semibold text-muted-foreground text-xs uppercase">
                  {option.label}
                </DropdownMenuLabel>
              </div>
            );
          }

          const isOptionActive = option.isActive(editor);
          const isDisabled = option.disabled(editor);
          const Icon = option.icon;

          return (
            <DropdownMenuItem
              className={cn(
                "flex cursor-pointer items-center gap-2",
                isOptionActive && "bg-emerald-500/10 text-emerald-500"
              )}
              disabled={isDisabled}
              key={option.id}
              onClick={() => option.onClick(editor)}
            >
              <Icon className="size-4" />
              <span>{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const ContentTypePicker: FC = ContentTypePickerComponent;
