import { Button } from "@marble/ui/components/button";
import {
  CaretDownIcon,
  CaretRightIcon,
  PencilIcon,
  PuzzlePieceIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import { ComponentEditorModal } from "./component-selector-modal";

type CustomComponentAttrs = {
  componentName: string;
  properties?: Record<string, unknown>;
};

export function CustomComponentNodeView({
  node,
  getPos,
  editor,
}: NodeViewProps) {
  const { componentName, properties = {} } = node.attrs as CustomComponentAttrs;
  const props = properties as Record<string, unknown>;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const selectThisNode = () => {
    if (getPos) editor.chain().focus().setNodeSelection(getPos()).run();
  };

  const handleClick = () => {
    if (getPos) {
      editor.chain().focus().setTextSelection(getPos()).run();
    }
  };

  const handleEdit: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (getPos) {
      editor.chain().focus().setNodeSelection(getPos()).run();
    }
    setIsModalOpen(true);
  };

  const handleRemove: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectThisNode();
    const ok = window.confirm(`Remove "${componentName}" component?`);
    if (!ok) return;

    editor.chain().focus().deleteSelection().run();
  };

  const handleToggleExpand: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((x) => !x);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <NodeViewWrapper className="marble-custom-component">
        {/** biome-ignore lint/a11y/useSemanticElements: <> */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-label={`Select ${componentName} component`}
          aria-expanded={Object.keys(props).length > 0 ? isExpanded : undefined}
          className="group relative border border-border rounded-lg p-4 my-3 bg-card hover:shadow-sm transition-all duration-200 cursor-pointer w-full text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                <PuzzlePieceIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">
                {componentName}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive/10"
                aria-label="Remove component"
                title="Remove"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>

              {Object.keys(props).length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleExpand}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  aria-label={
                    isExpanded ? "Collapse properties" : "Expand properties"
                  }
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <CaretDownIcon className="h-3.5 w-3.5" />
                  ) : (
                    <CaretRightIcon className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {Object.keys(props).length > 0 && isExpanded && (
            <div className="mb-3 animate-in slide-in-from-top-1 duration-200">
              <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Properties
              </div>
              <div className="space-y-2">
                {Object.entries(props).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {key}
                    </span>
                    <span className="text-sm text-foreground bg-muted/50 px-2 py-0.5 rounded">
                      {String(value ?? "—")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
        </div>
      </NodeViewWrapper>

      <ComponentEditorModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        editor={editor}
        existingComponent={node}
        getPos={getPos}
      />
    </>
  );
}
