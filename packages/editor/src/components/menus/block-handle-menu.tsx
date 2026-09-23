"use client";

import {
  type ComputePositionConfig,
  computePosition,
  limitShift,
  offset,
  shift,
} from "@floating-ui/dom";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@marble/ui/components/button";
import {
  createDropdownMenuHandle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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
  ArrowDownIcon,
  ArrowUpIcon,
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
import type { EditorView } from "@tiptap/pm/view";
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
import { getEditorPointForRow, isInsideEditor } from "../../lib/editor-gutter";
import { useMountedEditorView } from "../../lib/use-editor-view";
import { useEditorScrollContainer } from "../editor-scroll-area";

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

// Must be referentially stable: DragHandle re-registers its ProseMirror
// plugin when this prop changes, and `editor.unregisterPlugin` destroys and
// recreates every plugin view (closing the slash command menu, among others).
//
// `shift` keeps the handle inside the visible part of the scroll area, sliding
// down a tall block (an image, a long paragraph) whose top is scrolled out of
// view; `limitShift` stops it from leaving the block.
const HANDLE_POSITION_CONFIG: ComputePositionConfig = {
  middleware: [offset(12), shift({ limiter: limitShift(), padding: 8 })],
  placement: "left-start",
  strategy: "absolute",
};

const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().includes("MAC");
const MOVE_UP_SHORTCUT = isMac ? "⌘⇧↑" : "Ctrl+Shift+↑";
const MOVE_DOWN_SHORTCUT = isMac ? "⌘⇧↓" : "Ctrl+Shift+↓";

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

function getTopLevelDom(view: EditorView, pos: number) {
  let dom = view.nodeDOM(pos) as HTMLElement | null;

  while (dom && dom.parentElement !== view.dom) {
    dom = dom.parentElement;
  }

  return dom;
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
  const view = useMountedEditorView(editor);
  const scrollContainer = useEditorScrollContainer();
  const [menuOpen, setMenuOpen] = useState(false);
  const [target, setTarget] = useState<TargetBlock | null>(null);
  const menuHandle = useMemo(() => createDropdownMenuHandle(), []);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const handleContentRef = useRef<HTMLDivElement | null>(null);
  // Read by the DragHandle callbacks and the DOM listeners below so their
  // identities stay stable; see HANDLE_POSITION_CONFIG for why that matters.
  const menuOpenRef = useRef(menuOpen);
  const targetRef = useRef<TargetBlock | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const transaction = editor.state.tr.setMeta("lockDragHandle", menuOpen);
    editor.view.dispatch(transaction);
  }, [editor, menuOpen]);

  const updateTarget = useCallback((next: TargetBlock | null) => {
    targetRef.current = next;
    setTarget(next);
  }, []);

  // Notion-style hover: the whole row belongs to its block, so the handle
  // stays up while the pointer travels across the gutter to reach it, and
  // follows the content when it scrolls.
  useEffect(() => {
    if (!view) {
      return;
    }

    const container = scrollContainer ?? view.dom.parentElement;

    if (!container) {
      return;
    }

    let pointer: { x: number; y: number } | null = null;
    // The plugin hides the handle while typing; don't bring it back on the
    // scrolls that typing causes, only once the mouse moves again.
    let isTyping = false;
    let frame = 0;

    const getHandleElement = () => handleContentRef.current?.parentElement;

    const hideHandle = () => {
      if (menuOpenRef.current || isDraggingRef.current || !targetRef.current) {
        return;
      }

      view.dispatch(view.state.tr.setMeta("hideDragHandle", true));
    };

    // The plugin only tracks the pointer over the editor itself, so replay
    // gutter movement as if it happened on the same row of the editor.
    const hoverRow = (clientX: number, clientY: number) => {
      const point = getEditorPointForRow(view, clientX, clientY);

      if (!point) {
        hideHandle();
        return;
      }

      view.dom.dispatchEvent(
        new MouseEvent("mousemove", {
          bubbles: true,
          clientX: point.x,
          clientY: point.y,
        })
      );
    };

    const repositionHandle = () => {
      const current = targetRef.current;
      const element = getHandleElement();

      if (!(current && element) || element.style.visibility === "hidden") {
        return;
      }

      const dom = getTopLevelDom(view, current.pos);

      if (!dom) {
        return;
      }

      computePosition(dom, element, HANDLE_POSITION_CONFIG).then(
        ({ x, y, strategy }) => {
          Object.assign(element.style, {
            left: `${x}px`,
            position: strategy,
            top: `${y}px`,
          });
        }
      );
    };

    const onMouseMove = (event: MouseEvent) => {
      // Skip the events replayed by hoverRow
      if (!event.isTrusted) {
        return;
      }

      pointer = { x: event.clientX, y: event.clientY };
      isTyping = false;

      const eventTarget = event.target as Node | null;

      if (
        isInsideEditor(view, eventTarget) ||
        getHandleElement()?.contains(eventTarget)
      ) {
        return;
      }

      const rect = view.dom.getBoundingClientRect();
      const isOverEditorBox =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      // Over floating UI laid on top of the text (bubble or table menus)
      if (isOverEditorBox) {
        return;
      }

      hoverRow(event.clientX, event.clientY);
    };

    const onMouseLeave = () => {
      pointer = null;
      hideHandle();
    };

    // The plugin hides the handle as soon as the pointer leaves the editor.
    // Leaving for the gutter is handled by onMouseMove instead.
    const onEditorMouseLeave = (event: MouseEvent) => {
      const next = event.relatedTarget;

      if (
        next instanceof Node &&
        container.contains(next) &&
        !view.dom.contains(next)
      ) {
        event.stopImmediatePropagation();
      }
    };

    const onKeyDown = () => {
      isTyping = true;
    };

    const onScrollOrResize = () => {
      if (frame) {
        return;
      }

      frame = requestAnimationFrame(() => {
        frame = 0;

        if (isDraggingRef.current) {
          return;
        }

        // The block under a resting pointer changes as the content scrolls
        if (pointer && !isTyping && !menuOpenRef.current) {
          hoverRow(pointer.x, pointer.y);
        }

        repositionHandle();
      });
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    // Capture, so it runs before ProseMirror's own listener on the same node
    view.dom.addEventListener("mouseleave", onEditorMouseLeave, true);
    view.dom.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      view.dom.removeEventListener("mouseleave", onEditorMouseLeave, true);
      view.dom.removeEventListener("keydown", onKeyDown);
    };
  }, [scrollContainer, view]);

  const handleNodeChange = useCallback(
    ({ node, pos }: { node: ProseMirrorNode | null; pos: number }) => {
      if (!editor || !editor.isEditable || !isSupportedNode(node)) {
        if (!menuOpenRef.current) {
          updateTarget(null);
        }
        return;
      }

      // Avoid re-render churn while the pointer moves within the same block
      const previous = targetRef.current;

      if (previous && previous.node === node && previous.pos === pos) {
        return;
      }

      updateTarget({ node, pos });
    },
    [editor, updateTarget]
  );

  const handleElementDragStart = useCallback(() => {
    isDraggingRef.current = true;
    setMenuOpen(false);
  }, []);

  const handleElementDragEnd = useCallback(() => {
    isDraggingRef.current = false;

    if (!editor) {
      return;
    }

    // Forget the dragged block. Otherwise the plugin thinks it is still
    // hovered after the drop and won't show the handle for it again until the
    // pointer visits another block first.
    editor.view.dispatch(editor.state.tr.setMeta("hideDragHandle", true));
  }, [editor]);

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

  const handleMove = useCallback(
    (direction: "up" | "down") => {
      if (!editor || !target) {
        return;
      }

      const chain = editor.chain().focus();

      if (direction === "up") {
        chain.moveBlockUp(target.pos);
      } else {
        chain.moveBlockDown(target.pos);
      }

      chain.run();

      // The handle would stay beside whichever block took this one's place;
      // the moved block is selected instead, so Mod-Shift-Arrow keeps going.
      updateTarget(null);
      editor.view.dispatch(editor.state.tr.setMeta("hideDragHandle", true));
    },
    [editor, target, updateTarget]
  );

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
  // Only evaluated while the menu is open, which is when it is shown
  const canMoveUp =
    menuOpen && !!target && editor.can().moveBlockUp(target.pos);
  const canMoveDown =
    menuOpen && !!target && editor.can().moveBlockDown(target.pos);

  return (
    <DragHandle
      className={cn("z-40", className)}
      computePositionConfig={HANDLE_POSITION_CONFIG}
      editor={editor}
      onElementDragEnd={handleElementDragEnd}
      onElementDragStart={handleElementDragStart}
      onNodeChange={handleNodeChange}
      pluginKey={HANDLE_PLUGIN_KEY}
    >
      <div
        aria-hidden={!canShowMenu}
        className={cn(
          "flex items-center gap-1 text-muted-foreground transition-opacity",
          canShowMenu
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        ref={handleContentRef}
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

            <DropdownMenuItem
              disabled={!canMoveUp}
              onClick={() => handleMove("up")}
            >
              <ArrowUpIcon className="size-4" />
              <span>Move up</span>
              <DropdownMenuShortcut>{MOVE_UP_SHORTCUT}</DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={!canMoveDown}
              onClick={() => handleMove("down")}
            >
              <ArrowDownIcon className="size-4" />
              <span>Move down</span>
              <DropdownMenuShortcut>{MOVE_DOWN_SHORTCUT}</DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

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
