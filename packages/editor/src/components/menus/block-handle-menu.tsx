"use client";

import { offset } from "@floating-ui/dom";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import {
  createDropdownMenuHandle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import {
  CheckSquareIcon,
  CodeIcon,
  CopyIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  QuotesIcon,
  TextAlignLeftIcon,
  TextHOneIcon,
  TextHThreeIcon,
  TextHTwoIcon,
  TextTSlashIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import DragHandle from "@tiptap/extension-drag-handle-react";
import {
  DOMSerializer,
  Fragment,
  type Node as ProseMirrorNode,
} from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
import { useCurrentEditor } from "@tiptap/react";
import {
  type ComponentType,
  type SVGProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface TargetBlock {
  node: ProseMirrorNode;
  pos: number;
}

interface TransformOption {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive: (node: ProseMirrorNode) => boolean;
  label: string;
  run: (focusPos: number) => void;
}

export interface EditorBlockHandleMenuProps {
  className?: string;
}

const HANDLE_PLUGIN_KEY = "marble-block-handle";

const SUPPORTED_NODE_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "bulletList",
  "orderedList",
  "taskList",
  "figure",
  "image",
  "imageUpload",
  "video",
  "videoUpload",
  "twitter",
  "twitterUpload",
  "youtube",
  "youtubeUpload",
  "horizontalRule",
]);

const TURN_INTO_SOURCE_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
]);

const CLEAR_FORMATTING_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
]);

const HANDLE_CONTROL_CLASSNAME =
  "flex size-6.5 items-center justify-center rounded-md bg-transparent text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground";

function getFocusPos(target: TargetBlock) {
  return target.node.isTextblock ? target.pos + 1 : target.pos;
}

function isSupportedNode(
  node: ProseMirrorNode | null
): node is ProseMirrorNode {
  return node !== null && SUPPORTED_NODE_TYPES.has(node.type.name);
}

function canTurnInto(node: ProseMirrorNode) {
  return TURN_INTO_SOURCE_TYPES.has(node.type.name);
}

function canClearFormatting(node: ProseMirrorNode) {
  return CLEAR_FORMATTING_TYPES.has(node.type.name);
}

function getScrollParent(node: HTMLElement | null) {
  if (!node) {
    return null;
  }

  let current: HTMLElement | null = node.parentElement;

  while (current) {
    const { overflowY } = window.getComputedStyle(current);

    if (overflowY === "auto" || overflowY === "scroll") {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function serializeNodeToClipboardData(
  node: ProseMirrorNode,
  schema: Parameters<typeof DOMSerializer.fromSchema>[0],
  ownerDocument: Document
) {
  const serializer = DOMSerializer.fromSchema(schema);
  const fragment = serializer.serializeFragment(Fragment.from(node), {
    document: ownerDocument,
  });
  const container = ownerDocument.createElement("div");

  container.appendChild(fragment);

  return {
    html: container.innerHTML,
    text: node.textContent || container.textContent || "",
  };
}

export function EditorBlockHandleMenu({
  className,
}: EditorBlockHandleMenuProps = {}) {
  const { editor } = useCurrentEditor();
  const [menuOpen, setMenuOpen] = useState(false);
  const [target, setTarget] = useState<TargetBlock | null>(null);
  const menuHandle = useMemo(() => createDropdownMenuHandle(), []);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const transaction = editor.state.tr.setMeta("lockDragHandle", menuOpen);
    editor.view.dispatch(transaction);
  }, [editor, menuOpen]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const hideHandle = () => {
      setMenuOpen(false);
      setTarget(null);
      editor.view.dispatch(editor.state.tr.setMeta("hideDragHandle", true));
    };

    const scrollParent = getScrollParent(editor.view.dom as HTMLElement);

    scrollParent?.addEventListener("scroll", hideHandle, { passive: true });
    window.addEventListener("scroll", hideHandle, { passive: true });

    return () => {
      scrollParent?.removeEventListener("scroll", hideHandle);
      window.removeEventListener("scroll", hideHandle);
    };
  }, [editor]);

  const handleNodeChange = useCallback(
    ({ node, pos }: { node: ProseMirrorNode | null; pos: number }) => {
      if (!editor || !editor.isEditable || !isSupportedNode(node)) {
        if (!menuOpen) {
          setTarget(null);
        }
        return;
      }

      setTarget({ node, pos });
    },
    [editor, menuOpen]
  );

  const selectTargetNode = useCallback(() => {
    if (!editor || !target) {
      return null;
    }

    const nextSelection = NodeSelection.create(editor.state.doc, target.pos);
    editor.view.dispatch(editor.state.tr.setSelection(nextSelection));

    return editor.state.doc.nodeAt(target.pos);
  }, [editor, target]);

  const handleAdd = useCallback(() => {
    if (!editor || !target) {
      return;
    }

    const currentNode = editor.state.doc.nodeAt(target.pos);

    if (!currentNode) {
      return;
    }

    const currentNodeIsEmptyParagraph =
      currentNode.type.name === "paragraph" && currentNode.content.size === 0;
    const insertPos = target.pos + currentNode.nodeSize;
    const focusPos = currentNodeIsEmptyParagraph
      ? target.pos + 2
      : insertPos + 2;

    editor
      .chain()
      .command(({ dispatch, state, tr }) => {
        if (!dispatch) {
          return true;
        }

        if (currentNodeIsEmptyParagraph) {
          tr.insertText("/", target.pos + 1);
          dispatch(tr);
          return true;
        }

        const paragraphNodeType = state.schema.nodes.paragraph;

        if (!paragraphNodeType) {
          return false;
        }

        const slashParagraph = paragraphNodeType.create(
          null,
          state.schema.text("/")
        );

        tr.insert(insertPos, slashParagraph);
        dispatch(tr);
        return true;
      })
      .focus(focusPos)
      .run();
  }, [editor, target]);

  const handleDuplicate = useCallback(() => {
    if (!editor || !target) {
      return;
    }

    const currentNode = editor.state.doc.nodeAt(target.pos);

    if (!currentNode) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContentAt(target.pos + currentNode.nodeSize, currentNode.toJSON())
      .run();
  }, [editor, target]);

  const handleDelete = useCallback(() => {
    if (!editor || !target) {
      return;
    }

    editor.chain().focus().setNodeSelection(target.pos).deleteSelection().run();
  }, [editor, target]);

  const handleCopy = useCallback(async () => {
    if (!editor || !target) {
      return;
    }

    const currentNode =
      editor.state.doc.nodeAt(target.pos) ?? selectTargetNode();

    if (!currentNode) {
      return;
    }

    const ownerDocument = editor.view.dom.ownerDocument;
    const { html, text } = serializeNodeToClipboardData(
      currentNode,
      editor.schema,
      ownerDocument
    );

    try {
      if (
        typeof window !== "undefined" &&
        "ClipboardItem" in window &&
        html.trim().length > 0
      ) {
        const clipboardItem = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text || html], { type: "text/plain" }),
        });

        await navigator.clipboard.write([clipboardItem]);
        return;
      }

      await navigator.clipboard.writeText(text || html);
    } catch (error) {
      console.error("Failed to copy block content:", error);
    }
  }, [editor, selectTargetNode, target]);

  const handleClearFormatting = useCallback(() => {
    if (!editor || !target || !canClearFormatting(target.node)) {
      return;
    }

    const focusPos = getFocusPos(target);
    const chain = editor.chain().focus(focusPos).unsetAllMarks();

    if (target.node.type.name !== "paragraph") {
      chain.clearNodes();
    }

    chain.run();
  }, [editor, target]);

  const transformOptions = useMemo<TransformOption[]>(() => {
    if (!editor) {
      return [];
    }

    return [
      {
        icon: TextAlignLeftIcon,
        isActive: (node) => node.type.name === "paragraph",
        label: "Text",
        run: (focusPos) => {
          editor.chain().focus(focusPos).clearNodes().run();
        },
      },
      {
        icon: TextHOneIcon,
        isActive: (node) =>
          node.type.name === "heading" && node.attrs.level === 1,
        label: "Heading 1",
        run: (focusPos) => {
          editor
            .chain()
            .focus(focusPos)
            .clearNodes()
            .setNode("heading", { level: 1 })
            .run();
        },
      },
      {
        icon: TextHTwoIcon,
        isActive: (node) =>
          node.type.name === "heading" && node.attrs.level === 2,
        label: "Heading 2",
        run: (focusPos) => {
          editor
            .chain()
            .focus(focusPos)
            .clearNodes()
            .setNode("heading", { level: 2 })
            .run();
        },
      },
      {
        icon: TextHThreeIcon,
        isActive: (node) =>
          node.type.name === "heading" && node.attrs.level === 3,
        label: "Heading 3",
        run: (focusPos) => {
          editor
            .chain()
            .focus(focusPos)
            .clearNodes()
            .setNode("heading", { level: 3 })
            .run();
        },
      },
      {
        icon: ListBulletsIcon,
        isActive: (node) => node.type.name === "bulletList",
        label: "Bullet List",
        run: (focusPos) => {
          editor.chain().focus(focusPos).clearNodes().toggleBulletList().run();
        },
      },
      {
        icon: ListNumbersIcon,
        isActive: (node) => node.type.name === "orderedList",
        label: "Numbered List",
        run: (focusPos) => {
          editor.chain().focus(focusPos).clearNodes().toggleOrderedList().run();
        },
      },
      {
        icon: CheckSquareIcon,
        isActive: (node) => node.type.name === "taskList",
        label: "Task List",
        run: (focusPos) => {
          editor
            .chain()
            .focus(focusPos)
            .clearNodes()
            .toggleList("taskList", "taskItem")
            .run();
        },
      },
      {
        icon: QuotesIcon,
        isActive: (node) => node.type.name === "blockquote",
        label: "Quote",
        run: (focusPos) => {
          editor.chain().focus(focusPos).clearNodes().toggleBlockquote().run();
        },
      },
      {
        icon: CodeIcon,
        isActive: (node) => node.type.name === "codeBlock",
        label: "Code",
        run: (focusPos) => {
          editor.chain().focus(focusPos).clearNodes().toggleCodeBlock().run();
        },
      },
    ];
  }, [editor]);

  if (!editor) {
    return null;
  }

  const canShowMenu = !!target && editor.isEditable;
  const canTransformTarget = !!target && canTurnInto(target.node);
  const canClearTarget = !!target && canClearFormatting(target.node);

  return (
    <DragHandle
      className={cn("z-40", className)}
      computePositionConfig={{
        middleware: [offset(12)],
        placement: "left-start",
      }}
      editor={editor}
      onElementDragStart={() => {
        setMenuOpen(false);
      }}
      onNodeChange={handleNodeChange}
      pluginKey={HANDLE_PLUGIN_KEY}
    >
      <div
        aria-hidden={!canShowMenu}
        className={cn(
          "flex w-[4.5rem] items-center gap-1 text-muted-foreground transition-opacity",
          canShowMenu
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      >
        <Tooltip>
          <TooltipTrigger
            delay={300}
            render={
              <Button
                className="size-6.5 rounded-md bg-transparent p-0 text-muted-foreground shadow-none hover:bg-accent/60 hover:text-foreground"
                onClick={handleAdd}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <HugeiconsIcon
                  className="size-4"
                  icon={PlusSignIcon}
                  strokeWidth={2}
                />
                <span className="sr-only">Insert block below</span>
              </Button>
            }
          />
          <TooltipContent side="top">
            <p>Click to insert block below</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenu
          handle={menuHandle}
          onOpenChange={setMenuOpen}
          open={menuOpen}
        >
          <div className="relative size-6.5">
            <Tooltip>
              <TooltipTrigger
                delay={300}
                render={
                  <button
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label="Open block actions"
                    className={cn(
                      HANDLE_CONTROL_CLASSNAME,
                      "cursor-grab active:cursor-grabbing"
                    )}
                    onClick={() => {
                      if (menuOpen) {
                        menuHandle.close();
                        return;
                      }

                      menuTriggerRef.current?.click();
                    }}
                    type="button"
                  >
                    <svg
                      className="size-4"
                      fill="currentColor"
                      height="24"
                      viewBox="0 0 24 24"
                      width="24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>Open block actions</title>
                      <path
                        d="M9 3C7.89543 3 7 3.89543 7 5C7 6.10457 7.89543 7 9 7C10.1046 7 11 6.10457 11 5C11 3.89543 10.1046 3 9 3Z"
                        fill="currentColor"
                      />
                      <path
                        d="M9 10C7.89543 10 7 10.8954 7 12C7 13.1046 7.89543 14 9 14C10.1046 14 11 13.1046 11 12C11 10.8954 10.1046 10 9 10Z"
                        fill="currentColor"
                      />
                      <path
                        d="M7 19C7 17.8954 7.89543 17 9 17C10.1046 17 11 17.8954 11 19C11 20.1046 10.1046 21 9 21C7.89543 21 7 20.1046 7 19Z"
                        fill="currentColor"
                      />
                      <path
                        d="M15 10C13.8954 10 13 10.8954 13 12C13 13.1046 13.8954 14 15 14C16.1046 14 17 13.1046 17 12C17 10.8954 16.1046 10 15 10Z"
                        fill="currentColor"
                      />
                      <path
                        d="M13 5C13 3.89543 13.8954 3 15 3C16.1046 3 17 3.89543 17 5C17 6.10457 16.1046 7 15 7C13.8954 7 13 6.10457 13 5Z"
                        fill="currentColor"
                      />
                      <path
                        d="M15 17C13.8954 17 13 17.8954 13 19C13 20.1046 13.8954 21 15 21C16.1046 21 17 20.1046 17 19C17 17.8954 16.1046 17 15 17Z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="sr-only">Open block actions</span>
                  </button>
                }
              />
              <TooltipContent side="top">
                <p>Drag to move, click to open menu</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenuTrigger
              handle={menuHandle}
              render={
                <button
                  aria-hidden="true"
                  className={cn(
                    HANDLE_CONTROL_CLASSNAME,
                    "pointer-events-none invisible absolute inset-0"
                  )}
                  ref={menuTriggerRef}
                  tabIndex={-1}
                  type="button"
                />
              }
            />
          </div>

          <DropdownMenuContent align="start" className="w-56" sideOffset={8}>
            {canTransformTarget ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <TextAlignLeftIcon className="size-4" />
                  <span>Turn into</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-52">
                  {transformOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = target
                      ? option.isActive(target.node)
                      : false;

                    return (
                      <DropdownMenuItem
                        disabled={isActive}
                        key={option.label}
                        onClick={() => {
                          if (!target) {
                            return;
                          }

                          option.run(getFocusPos(target));
                        }}
                      >
                        <Icon className="size-4" />
                        <span>{option.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : null}

            {canTransformTarget && canClearTarget ? (
              <DropdownMenuSeparator />
            ) : null}

            {canClearTarget ? (
              <DropdownMenuItem onClick={handleClearFormatting}>
                <TextTSlashIcon className="size-4" />
                <span>Clear formatting</span>
              </DropdownMenuItem>
            ) : null}

            {canTransformTarget || canClearTarget ? (
              <DropdownMenuSeparator />
            ) : null}

            <DropdownMenuItem onClick={handleDuplicate}>
              <CopyIcon className="size-4" />
              <span>Duplicate</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleCopy}>
              <CopyIcon className="size-4" />
              <span>Copy</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleDelete} variant="destructive">
              <TrashIcon className="size-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </DragHandle>
  );
}
