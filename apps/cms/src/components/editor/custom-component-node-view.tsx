import { Button } from "@marble/ui/components/button";
import {
  CaretDownIcon,
  CaretRightIcon,
  PencilIcon,
  PuzzlePieceIcon,
} from "@phosphor-icons/react";
import { NodeViewWrapper } from "@tiptap/react";
import type React from "react";
import { useState } from "react";
import { ComponentSelectorModal } from "./component-selector-modal";

export function CustomComponentNodeView({ node, getPos, editor }: any) {
  const { componentName, ...props } = node.attrs;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (getPos) {
      editor.chain().focus().setTextSelection(getPos()).run();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <NodeViewWrapper className="marble-custom-component">
        <button
          type="button"
          className="group relative border border-border rounded-lg p-4 my-3 bg-card hover:shadow-sm transition-all duration-200 cursor-pointer w-full text-left"
          onClick={handleClick}
          aria-label={`Select ${componentName} component`}
        >
          {/* Header with component info and controls */}
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
              {Object.keys(props).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleExpand}
                  className="h-8 w-8 p-0 hover:bg-muted"
                >
                  {isExpanded ? (
                    <CaretDownIcon className="h-3.5 w-3.5" />
                  ) : (
                    <CaretRightIcon className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </Button>
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
                      {String(value) || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
        </button>
      </NodeViewWrapper>

      <ComponentSelectorModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        editor={editor}
        existingComponent={node}
      />
    </>
  );
}
